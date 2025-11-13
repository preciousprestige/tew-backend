require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/user");

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const email = "admin@example.com";

    // 🧹 Remove any existing admin user with that email
    const deleted = await User.deleteMany({ email });
    if (deleted.deletedCount > 0) console.log("🧹 Old admin removed");

    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    // ✅ Create new admin
    const admin = new User({
      name: "Super Admin",
      email,
      password: hashedPassword,
      isAdmin: true, // force
      role: "admin", // force
    });

    // ✅ Hard-set both values just before save (guaranteed override)
    admin.isAdmin = true;
    admin.role = "admin";

    await admin.save();

    console.log("🎉 Admin account created successfully:");
    console.log("   Email: admin@example.com");
    console.log("   Password: Admin@123");

    await mongoose.disconnect();
    process.exit();
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();
