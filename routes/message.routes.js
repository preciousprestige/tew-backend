const express = require("express");
const router = express.Router();
const {
  sendMessage,
  getMessagesByUser,
  getAllUsers,
} = require("../controllers/message.controller");

// ✅ Send message (user or admin)
router.post("/", sendMessage);

// ✅ Get messages with a specific user (admin or user)
router.get("/:userId", getMessagesByUser);

// ✅ Get all unique users who have chatted (admin view)
router.get("/", getAllUsers);

module.exports = router;
