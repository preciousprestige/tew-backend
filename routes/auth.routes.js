const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  forgotPassword,
  resetPassword,
  updateAdminSettings,
} = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth");

// 🔹 Auth routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getUserProfile);

// 🔹 Admin Settings Update (requires authentication)
router.put("/update-settings", protect, updateAdminSettings);

// 🔹 Forgot / Reset Password
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

module.exports = router;
