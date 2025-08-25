// controllers/paystackController.js
import axios from "axios";
import crypto from "crypto";
import Order from "../models/Order.js";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

/**
 * @desc    Initialize Paystack payment for an order
 * @route   POST /api/orders/:orderId/paystack/init
 * @access  Private
 */
export const initPaystackPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Call Paystack init endpoint
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: req.user.email,
        amount: Math.round(order.totalPrice * 100), // Paystack expects amount in kobo
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

    // Save reference on the order
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
export const paystackWebhook = async (req, res) => {
  try {
    const secret = PAYSTACK_SECRET;

    // Generate hash from raw body
    const hash = crypto
      .createHmac("sha512", secret)
      .update(req.body)
      .digest("hex");

    const signature = req.headers["x-paystack-signature"];

    // Compare signature
    if (hash !== signature) {
      console.log("❌ Invalid Paystack signature");
      return res.status(401).send("Invalid signature");
    }

    // Parse the event payload
    const event = JSON.parse(req.body.toString());

    if (event.event === "charge.success") {
      const reference = event.data.reference;

      // Update order
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
    console.error("Webhook error:", error);
    res.sendStatus(500);
  }
};
