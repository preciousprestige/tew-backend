const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        price: { type: Number, required: true },
        image: { type: String },
      },
    ],
    status: {
  type: String,
  enum: ["pending", "processing", "completed", "cancelled"],
  default: "pending",
},
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      postalCode: { type: String, default: "" },
      country: { type: String, default: "Nigeria" },
    },
    totalPrice: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    paid: { type: Boolean, default: false },
    paymentResult: {
      name: String,
      phone: String,
      email: String,
      note: String,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
