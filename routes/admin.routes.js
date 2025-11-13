// backend/routes/admin.routes.js
const express = require("express");
const router = express.Router();
const {
  updateAdminSettings,
  forgotPassword,
  resetPassword,
} = require("../controllers/adminController");
const { protect, admin } = require("../middleware/authMiddleware");

// ✅ Update Admin Settings (requires login)
router.put("/settings", protect, admin, updateAdminSettings);

// ✅ Forgot password (email link)
router.post("/forgot", forgotPassword);

// ✅ Reset password (new password via token)
router.post("/reset/:token", resetPassword);

module.exports = router;
