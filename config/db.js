// config/db.js
const mongoose = require("mongoose");
require("dotenv").config({ path:__dirname + "/.env" });

const connectDB = async () => {
  try {
    console.log("Mongo URI:", process.env.MONGO_URI); // 👈 TEMPORARY debug
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully ✅");
  } catch (err) {
    console.error("MongoDB connection failed ❌", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
