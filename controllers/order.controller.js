const Order = require("../models/order.model");

/**
 * @desc Create Order
 * @route POST /api/orders
 */
const createOrder = async (req, res) => {
  try {
    const { customer, items, totalPrice, deliveryFee } = req.body;

    if (!items || items.length === 0)
      return res.status(400).json({ message: "No items in order" });

    const order = new Order({
      user: req.user?._id || null,
      items: items.map((i) => ({
        product: i.product || null,
        name: i.name,
        qty: i.qty,
        price: i.price,
        image: i.image,
      })),
      shippingAddress: {
        address: customer?.address || "N/A",
        city: customer?.city || "",
        state: customer?.state || "",
        country: "Nigeria",
      },
      totalPrice: totalPrice + (deliveryFee || 0),
      deliveryFee: deliveryFee || 0,
      paymentResult: {
        name: customer?.name || "",
        phone: customer?.phone || "",
        email: customer?.email || "",
        note: customer?.note || "",
      },
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (err) {
    console.error("❌ createOrder error:", err);
    res.status(500).json({ message: "Server error creating order" });
  }
};

/**
 * @desc Get All Orders (Admin)
 * @route GET /api/orders
 */
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Server error fetching orders" });
  }
};

/**
 * @desc Get Order By ID (Admin)
 * @route GET /api/orders/:id
 */
const getOrderById = async (req, res) => {  // 🔧 Added
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    console.error("getOrderById error:", err);
    res.status(500).json({ message: "Server error fetching order" });
  }
};

/**
 * @desc Update Order (Status)
 * @route PUT /api/orders/:id
 */
const updateOrder = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (status) order.status = status;

    const updated = await order.save();
    res.json(updated);
  } catch (err) {
    console.error("updateOrder error:", err);
    res.status(500).json({ message: "Server error updating order" });
  }
};

/**
 * @desc Delete Order (Admin)
 * @route DELETE /api/orders/:id
 */
const deleteOrder = async (req, res) => {  // 🔧 Added
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    await order.deleteOne();
    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error("deleteOrder error:", err);
    res.status(500).json({ message: "Server error deleting order" });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById, // 🔧 Added
  updateOrder,
  deleteOrder,  // 🔧 Added
};
