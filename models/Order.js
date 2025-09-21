// models/Order.js
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        price: { type: Number, required: true },
        image: { type: String },
      },
    ],
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String, required: true },
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    // 🔑 Paystack integration fields
    reference: {
      type: String,
      unique: true,
      sparse: true, // allows some orders w/o reference until payment starts
    },
    paid: {
      type: Boolean,
      default: false,
    },
    paymentResult: {
      type: Object, // raw Paystack event data
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);
module.exports = Order; // ✅ CommonJS export
