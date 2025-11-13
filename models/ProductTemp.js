const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    name: { type: String, required: true },
    images: [{ type: String }], // ✅ supports multiple images
    brand: { type: String, required: true },
    category: { type: String, required: true },

    // ✅ FIX: shopCategory fully flexible (accepts TEW NEW IN, etc.)
    shopCategory: {
      type: String,
      required: true,
      trim: true,
    },

    description: { type: String },
    price: { type: Number, required: true, default: 0 },
    countInStock: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ✅ Force model overwrite to clear old enum from memory
const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
module.exports = Product;
