const crypto = require("crypto");
const Order = require("../models/Order"); // adjust path if different

/**
 * Paystack Webhook Controller
 */
exports.paystackWebhook = async (req, res) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;

    // ✅ Validate signature using raw body
    const hash = crypto
      .createHmac("sha512", secret)
      .update(req.body) // raw body from express.raw()
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      console.log("❌ Invalid Paystack signature");
      return res.status(401).json({ message: "Invalid signature" });
    }

    const event = JSON.parse(req.body.toString());

    // ✅ Handle successful payment
    if (event.event === "charge.success") {
      const data = event.data;
      const reference = data.reference;

      // Find order by reference
      const order = await Order.findOne({ "paymentResult.id": reference });
      if (order) {
        order.isPaid = true;
        order.paidAt = new Date();
        order.paymentResult = {
          id: data.reference,
          status: data.status,
          channel: data.channel,
          currency: data.currency,
          amount: data.amount / 100, // Paystack sends in kobo
          gateway_response: data.gateway_response,
          email_address: data.customer.email,
        };
        await order.save();
        console.log(`✅ Order ${order._id} marked as paid via webhook`);
      } else {
        console.log(`⚠️ No order found for reference: ${reference}`);
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook Error:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
};
