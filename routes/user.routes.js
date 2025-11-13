// routes/user.routes.js
const express = require("express");
const router = express.Router();

// ✅ Import all user controller functions from ONE file only
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/user.controller");

// ✅ Auth middleware
const { protect, admin } = require("../middleware/authMiddleware");

// === Routes ===

// Get all users (Admin only)
router.get("/", protect, admin, getUsers);

// Get a specific user (Admin only)
router.get("/:id", protect, admin, getUserById);

// Update a user (Admin only)
router.put("/:id", protect, admin, updateUser);

// Delete a user (Admin only)
router.delete("/:id", protect, admin, deleteUser);

module.exports = router;
