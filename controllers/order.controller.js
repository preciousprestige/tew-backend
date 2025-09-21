// controllers/orderController.js
const Order = require("../models/order.model");

/**
 * @desc    Create new order
 * @route   POST /api/orders
 * @access  Private
 */
const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, totalPrice } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items in order" });
    }

    const order = new Order({
      user: req.user._id,
      items,
      shippingAddress,
      totalPrice,
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (err) {
    console.error("❌ createOrder error:", err);
    res.status(500).json({ message: "Server error creating order" });
  }
};

/**
 * @desc    Get all orders (Admin only)
 * @route   GET /api/orders
 * @access  Private/Admin
 */
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("user", "id name email") // show user details
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("❌ getOrders error:", err);
    res.status(500).json({ message: "Server error fetching orders" });
  }
};

/**
 * @desc    Get order by ID
 * @route   GET /api/orders/:id
 * @access  Private (user can see own, admin can see any)
 */
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "id name email"
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // only allow owner or admin
    if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized to view this order" });
    }

    res.json(order);
  } catch (err) {
    console.error("❌ getOrderById error:", err);
    res.status(500).json({ message: "Server error fetching order" });
  }
};

/**
 * @desc    Update order (Admin only, e.g. mark as shipped/delivered)
 * @route   PUT /api/orders/:id
 * @access  Private/Admin
 */
const updateOrder = async (req, res) => {
  try {
    const { paid, paymentResult, shippingAddress } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (paid !== undefined) {
      order.paid = paid;
    }
    if (paymentResult) {
      order.paymentResult = paymentResult;
    }
    if (shippingAddress) {
      order.shippingAddress = shippingAddress;
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (err) {
    console.error("❌ updateOrder error:", err);
    res.status(500).json({ message: "Server error updating order" });
  }
};

/**
 * @desc    Delete order (Admin only)
 * @route   DELETE /api/orders/:id
 * @access  Private/Admin
 */
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    await order.deleteOne();
    res.json({ message: "Order removed" });
  } catch (err) {
    console.error("❌ deleteOrder error:", err);
    res.status(500).json({ message: "Server error deleting order" });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
};
