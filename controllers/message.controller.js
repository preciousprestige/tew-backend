const Message = require("../models/message.model");

/**
 * @desc Send a new message (admin or user)
 * @route POST /api/messages
 */
const sendMessage = async (req, res) => {
  try {
    const { sender, receiver, message } = req.body;
    if (!sender || !receiver || !message)
      return res.status(400).json({ message: "Missing required fields" });

    const msg = await Message.create({ sender, receiver, message });
    res.status(201).json(msg);
  } catch (err) {
    console.error("❌ sendMessage error:", err);
    res.status(500).json({ message: "Server error sending message" });
  }
};

/**
 * @desc Get messages by userId (for both admin & user)
 * @route GET /api/messages/:userId
 */
const getMessagesByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error("❌ getMessagesByUser error:", err);
    res.status(500).json({ message: "Server error fetching messages" });
  }
};

/**
 * @desc Get all unique users who have chatted (admin)
 * @route GET /api/messages
 */
const getAllUsers = async (req, res) => {
  try {
    const messages = await Message.find({});
    const userIds = [
      ...new Set(messages.map((m) => (m.sender !== "admin" ? m.sender : m.receiver))),
    ];
    res.json(userIds);
  } catch (err) {
    console.error("❌ getAllUsers error:", err);
    res.status(500).json({ message: "Server error fetching users" });
  }
};

module.exports = { sendMessage, getMessagesByUser, getAllUsers };
