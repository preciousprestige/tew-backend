const axios = require("axios");
const Order = require("../models/orderModel");

// Verify Paystack payment manually (after frontend redirect)
const verifyPaystackPayment = async (req, res) => {
  try {
    const { reference } = req.body; // frontend sends reference
    const orderId = req.params.id;

    if (!reference) {
      return res.status(400).json({ message: "Payment reference is required" });
    }

    // Call Paystack verify endpoint
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = response.data;

    if (data.status && data.data.status === "success") {
      // Payment successful → update order
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: data.data.id,
        status: data.data.status,
        reference: data.data.reference,
        amount: data.data.amount / 100,
        channel: data.data.channel,
      };

      const updatedOrder = await order.save();

      return res.json({
        message: "Payment verified successfully",
        order: updatedOrder,
      });
    } else {
      return res.status(400).json({ message: "Payment verification failed" });
    }
  } catch (error) {
    console.error("Verify Paystack Payment Error:", error);
    res.status(500).json({
      message: "Server error verifying payment",
      error: error.response?.data || error.message,
    });
  }
};

module.exports = {
  verifyPaystackPayment,
};
