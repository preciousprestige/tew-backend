const express = require("express");
const { registerUser, loginUser, getUserProfile } = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth");

const router = express.Router();

// @route   POST /api/auth/register
router.post("/register", registerUser);

// @route   POST /api/auth/login
router.post("/login", loginUser);

// @route   GET /api/auth/profile
router.get("/profile", protect, getUserProfile);

module.exports = router;
