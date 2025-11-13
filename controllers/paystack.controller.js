// controllers/paystack.controller.js
const axios = require("axios");
const crypto = require("crypto");
const Order = require("../models/order");


const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

/**
 * @desc    Initialize Paystack payment for an order
 * @route   POST /api/orders/:orderId/paystack/init
 * @access  Private
 */
const initPaystackPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: req.user.email,
        amount: Math.round(order.totalPrice * 100),
        callback_url: `${process.env.FRONTEND_URL}/order/${orderId}`,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    const { authorization_url, reference } = response.data.data;

    order.paymentResult = {
      id: reference,
      status: "pending",
      update_time: new Date().toISOString(),
      email_address: req.user.email,
    };
    await order.save();

    res.json({ authorizationUrl: authorization_url, reference });
  } catch (err) {
    console.error("Paystack init error:", err.response?.data || err.message);
    res.status(500).json({ message: "Paystack init failed" });
  }
};

/**
 * @desc    Paystack Webhook Handler
 * @route   POST /api/webhook/paystack
 * @access  Public
 */
const paystackWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-paystack-signature"];
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== signature) {
      console.log("❌ Invalid Paystack signature");
      return res.status(401).send("Invalid signature");
    }

    const event = req.body;

    if (event.event === "charge.success") {
      const reference = event.data.reference;

      const order = await Order.findOne({ "paymentResult.id": reference });
      if (order) {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentResult = {
          id: reference,
          status: event.data.status,
          update_time: event.data.paidAt,
          email_address: event.data.customer.email,
        };
        await order.save();

        console.log(`✅ Order ${order._id} marked as paid via webhook`);
      } else {
        console.log(`⚠️ No order found for reference: ${reference}`);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook error:", error.message || error);
    res.sendStatus(500);
  }
};

/**
 * @desc    Verify Paystack Payment
 * @route   GET /api/orders/:orderId/paystack/verify/:reference
 * @access  Private
 */
const verifyPaystackPayment = async (req, res) => {
  try {
    const { orderId, reference } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
      }
    );

    const data = response.data.data;

    if (data.status === "success") {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: reference,
        status: data.status,
        update_time: data.paidAt,
        email_address: data.customer.email,
      };
      await order.save();

      return res.json({ message: "Payment verified successfully", order });
    } else {
      return res.status(400).json({ message: "Payment not successful" });
    }
  } catch (error) {
    console.error("Verify payment error:", error.response?.data || error.message);
    res.status(500).json({ message: "Error verifying payment" });
  }
};

module.exports = {
  initPaystackPayment,
  paystackWebhook,
  verifyPaystackPayment,
};
