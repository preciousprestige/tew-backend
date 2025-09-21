// routes/order.routes.js
const express = require("express");
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
} = require("../controllers/orderController"); // ✅ this should exist separately
const {
  initPaystackPayment,
  paystackWebhook,
} = require("../controllers/paystack.controller"); // ✅ Paystack stuff
const { protect, admin } = require("../middleware/authMiddleware");

// Order CRUD
router.post("/", protect, createOrder);
router.get("/", protect, admin, getOrders); // only admins see all orders
router.get("/:id", protect, getOrderById); // user sees own order, admin sees any
router.put("/:id", protect, admin, updateOrder);
router.delete("/:id", protect, admin, deleteOrder);

// Paystack routes
router.post("/paystack/init/:orderId", protect, initPaystackPayment);
router.post("/paystack/webhook", paystackWebhook); // public route for Paystack webhook

module.exports = router;
