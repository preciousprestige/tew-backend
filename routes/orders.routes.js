const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
} = require("../controllers/order.controller");

const { protect, admin } = require("../middleware/authMiddleware");

// ✅ Public route for guest + logged-in order creation
router.post("/", createOrder);

// ✅ Admin: get all orders
router.get("/", protect, admin, getOrders);

// ✅ Admin: get single order
router.get("/:id", protect, admin, getOrderById);

// ✅ Admin: update order (mark paid, etc.)
router.put("/:id", protect, admin, updateOrder);

// ✅ Admin: delete order
router.delete("/:id", protect, admin, deleteOrder);

module.exports = router;
