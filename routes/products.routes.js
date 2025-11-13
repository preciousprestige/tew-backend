const express = require("express");
const router = express.Router();
const Product = require("../models/product");
const { protect, admin } = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// === Multer setup
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// === ROUTES ===

// 🟩 GET all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (err) {
    console.error("Fetch products error:", err);
    res.status(500).json({ message: "Failed to fetch products", error: err.message });
  }
});

// 🟩 GET single product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(product);
  } catch (err) {
    console.error("Fetch product error:", err);
    res.status(500).json({ message: "Error fetching product", error: err.message });
  }
});

// 🟩 CREATE new product (supports up to 3 images)
router.post("/", protect, admin, upload.array("images", 3), async (req, res) => {
  try {
    const imageUrls = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];
    const { name, brand, category, shopCategory, description, price, countInStock, discount } = req.body;

    if (!name || !price || !category || !brand) {
      return res.status(400).json({ message: "Name, price, brand, and category are required" });
    }

    const newProduct = new Product({
      name,
      brand,
      category,
      shopCategory: shopCategory || "GENERAL",
      description,
      price,
      countInStock,
      discount: discount || 0,
      images: imageUrls,
    });

    const saved = await newProduct.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Create product error:", err);
    res.status(500).json({ message: "Product creation failed", error: err.message });
  }
});

// 🟩 UPDATE product
router.put("/:id", protect, admin, upload.array("images", 3), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const imageUrls =
      req.files && req.files.length > 0
        ? req.files.map((file) => `/uploads/${file.filename}`)
        : product.images;

    product.name = req.body.name || product.name;
    product.brand = req.body.brand || product.brand;
    product.category = req.body.category || product.category;
    product.shopCategory = req.body.shopCategory || product.shopCategory;
    product.description = req.body.description || product.description;
    product.price = req.body.price || product.price;
    product.countInStock = req.body.countInStock || product.countInStock;
    product.discount = req.body.discount || product.discount;
    product.images = imageUrls;

    const updated = await product.save();
    res.status(200).json(updated);
  } catch (err) {
    console.error("Update product error:", err);
    res.status(500).json({ message: "Product update failed", error: err.message });
  }
});

// 🟩 DELETE product
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Product not found" });
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Delete product error:", err);
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
});

module.exports = router;
