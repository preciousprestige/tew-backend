const Product = require("../models/Product");
const path = require("path");
const fs = require("fs");

// ✅ Create a new product (Admin only)
const createProduct = async (req, res) => {
  try {
    const { name, brand, category, description, price, countInStock, shopCategory } = req.body;
    let image = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !price || !category || !brand) {
      return res.status(400).json({ message: "Name, price, brand, and category are required" });
    }

    // 🧩 Temporarily skip user reference (since no auth yet)
    const product = await Product.create({
      name,
      brand,
      category,
      description,
      price,
      countInStock,
      image,
      shopCategory: shopCategory || "GENERAL", // ✅ added field
      // user: req.user ? req.user._id : null, // uncomment after adding admin auth
    });

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create Product Error:", error.message);
    res.status(500).json({ message: "Failed to create product", error: error.message });
  }
};

// ✅ Get all products
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    console.error("Fetch Products Error:", error.message);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

// ✅ Get single product by ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(product);
  } catch (error) {
    console.error("Get Product Error:", error.message);
    res.status(500).json({ message: "Failed to fetch product" });
  }
};

// ✅ Update product
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const { name, brand, category, description, price, countInStock, shopCategory } = req.body;

    if (req.file) {
      // Delete old image if replaced
      if (product.image) {
        const oldImage = path.join(__dirname, "..", product.image);
        if (fs.existsSync(oldImage)) fs.unlinkSync(oldImage);
      }
      product.image = `/uploads/${req.file.filename}`;
    }

    product.name = name || product.name;
    product.brand = brand || product.brand;
    product.category = category || product.category;
    product.description = description || product.description;
    product.price = price ?? product.price;
    product.countInStock = countInStock ?? product.countInStock;
    product.shopCategory = shopCategory || product.shopCategory; // ✅ added field

    const updatedProduct = await product.save();
    res.status(200).json({
      message: "Product updated successfully",
      updatedProduct,
    });
  } catch (error) {
    console.error("Update Product Error:", error.message);
    res.status(500).json({ message: "Failed to update product" });
  }
};

// ✅ Delete product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Delete image file
    if (product.image) {
      const imagePath = path.join(__dirname, "..", product.image);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    await product.deleteOne();
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete Product Error:", error.message);
    res.status(500).json({ message: "Failed to delete product" });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
