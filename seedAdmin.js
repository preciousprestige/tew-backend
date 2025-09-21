// seedAdmin.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User"); // adjust path if your model is elsewhere

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const email = "admin@example.com";
    const password = "Admin@123"; // change before production!
    const hashedPassword = await bcrypt.hash(password, 10);

    // check if exists
    let admin = await User.findOne({ email });
    if (admin) {
      console.log("⚠️ Admin already exists:", admin.email);
      process.exit(0);
    }

    admin = new User({
      name: "Super Admin",
      email,
      password: hashedPassword,
      role: "admin", // ensure your User schema has this field
    });

    await admin.save();
    console.log("🎉 Admin account created:");
    console.log("   Email:", email);
    console.log("   Password:", password);

    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating admin:", err);
    process.exit(1);
  }
}

createAdmin();
