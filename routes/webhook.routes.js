// routes/webhook.routes.js
const express = require("express");
const crypto = require("crypto");
//const webhookQueue = require("../queues/webhookQueue");
const webhookQueue = {
  add: async () => {
    console.log("⚠️ Redis queue is disabled. Webhook event skipped.");
  }
};
const Order = require("../models/order.model");

const router = express.Router();

// In-memory retry queue (for production use a job queue e.g. Bull, Redis, RabbitMQ)
let retryQueue = [];

function enqueueRetry(payload, retries = 3) {
  retryQueue.push({ payload, retries });
}

// Worker to process retryQueue
setInterval(async () => {
  if (retryQueue.length === 0) return;

  const item = retryQueue.shift();
  const { payload, retries } = item;

  try {
    const reference = payload.data?.reference;
    if (!reference) throw new Error("No reference in retry payload");

    const order = await Order.findOne({ reference });
    if (!order) throw new Error("Order not found");

    order.isPaid = true;
    order.paymentResult = {
      id: payload.data.id,
      status: payload.data.status,
      reference: payload.data.reference,
      paidAt: payload.data.paidAt || new Date(),
    };
    await order.save();

    console.log(`[Webhook Retry] ✅ Success for order ${order._id}`);
  } catch (err) {
    console.error(`[Webhook Retry] ❌ Failed: ${err.message}`);

    if (retries > 0) {
      console.log(`[Webhook Retry] Re-enqueue with ${retries - 1} retries left`);
      enqueueRetry(payload, retries - 1);
    }
  }
}, 10000); // every 10s

// Verify Paystack signature
function verifySignature(req) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const hash = crypto
    .createHmac("sha512", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");
  return hash === req.headers["x-paystack-signature"];
}

router.post("/paystack", async (req, res) => {
  try {
    console.log(`[Webhook] 🔔 Event received: ${req.body.event}`);

    if (!verifySignature(req)) {
      console.warn("[Webhook] ❌ Invalid signature");
      return res.status(400).send("Invalid signature");
    }

    const event = req.body;

    if (event.event === "charge.success") {
      const reference = event.data.reference;
      console.log(`[Webhook] Payment success for reference: ${reference}`);

      try {
        const order = await Order.findOne({ reference });
        if (!order) throw new Error("Order not found");

        order.isPaid = true;
        order.paymentResult = {
          id: event.data.id,
          status: event.data.status,
          reference: event.data.reference,
          paidAt: event.data.paidAt || new Date(),
        };
        await order.save();

        console.log(`[Webhook] ✅ Order ${order._id} marked as paid`);
      } catch (err) {
        console.error(`[Webhook] ❌ Failed to update order: ${err.message}`);
        enqueueRetry(event); // add to retry queue
      }
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error(`[Webhook] ❌ Exception: ${err.message}`);
    enqueueRetry(req.body); // still enqueue for retry
    res.status(500).send("Webhook error");
  }
});

module.exports = router;
