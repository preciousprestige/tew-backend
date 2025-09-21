// routes/paystack.routes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  initPaystackPayment,
  paystackWebhook,
} = require("../controllers/paystack.controller");
const axios = require("axios");
const Order = require("../models/order.model");

// ✅ Webhook (server → server)
router.post("/webhook", express.json({ type: "*/*" }), paystackWebhook);

// ✅ Verify Transaction
router.get("/verify/:reference", async (req, res) => {
  try {
    const { reference } = req.params;

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = response.data;

    const order = await Order.findOne({ "paymentResult.id": reference });
    if (order && data.data.status === "success") {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: reference,
        status: data.data.status,
        update_time: data.data.paidAt,
        email_address: data.data.customer.email,
      };
      await order.save();
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Verification failed" });
  }
});

// ✅ Initialize Transaction for an existing order
router.post("/init/:orderId", protect, initPaystackPayment);

module.exports = router;
