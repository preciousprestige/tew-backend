// controllers/auth.controller.js
const User = require("../models/user");
const generateToken = require("../utils/generateToken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

/**
 * @desc Register user
 * @route POST /api/auth/register
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, password, isAdmin, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password correctly here
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      isAdmin: isAdmin || false,
      role: role || "user",
    });

    const token = generateToken(user._id, user.isAdmin);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Login user
 * @route POST /api/auth/login
 */
const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body || {};

    email = typeof email === "string" ? email.trim().toLowerCase() : email;

    console.log("LOGIN ATTEMPT -> email:", email, "password present:", !!password);

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    console.log("FOUND USER:", !!user, user ? user.email : "none");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    let isMatch = false;

    if (user.password.startsWith("$2")) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = password === user.password;
    }

    console.log("PASSWORD MATCH:", isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id, user.isAdmin);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getUserProfile = async (req, res) => {
  return res.json({ success: true, user: req.user });
};

const updateAdminSettings = async (req, res) => {
  try {
    const adminId = req.user?._id;
    const { oldEmail, newEmail, oldPassword, newPassword } = req.body;

    if (!adminId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Admin not authenticated" });
    }

    const admin = await User.findById(adminId);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    if (oldEmail && admin.email !== oldEmail) {
      return res
        .status(400)
        .json({ message: "Old email does not match current email" });
    }

    if (oldPassword) {
      const match = await bcrypt.compare(oldPassword, admin.password);
      if (!match) {
        return res.status(400).json({ message: "Old password is incorrect" });
      }
    }

    if (newEmail) admin.email = newEmail;
    if (newPassword) {
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(newPassword, salt);
    }

    await admin.save();

    return res.json({
      success: true,
      message: "Settings updated successfully!",
    });
  } catch (err) {
    console.error("Error updating admin settings:", err);
    return res.status(500).json({ message: "Server error updating settings" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await User.findOne({ email });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found with this email" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    admin.resetPasswordToken = resetTokenHash;
    admin.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await admin.save();

    const resetURL = `http://localhost:5173/admin/reset/${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"TEW Admin" <${process.env.ADMIN_EMAIL}>`,
      to: admin.email,
      subject: "Password Reset",
      html: `
        <p>You requested to reset your password.</p>
        <a href="${resetURL}" target="_blank">Reset Password</a>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "Password reset link sent to email" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error sending reset email" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const admin = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!admin) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const { newPassword } = req.body;
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);

    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpire = undefined;

    await admin.save();

    res.json({ message: "Password has been reset successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error resetting password" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateAdminSettings,
  forgotPassword,
  resetPassword,
};
