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
    const { name, email, password, isAdmin } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email: email.trim().toLowerCase(),
      password, // will hash in pre-save hook
      isAdmin: isAdmin || false,
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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
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
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Get current user profile
 * @route GET /api/auth/profile
 */
const getUserProfile = async (req, res) => {
  return res.json({ success: true, user: req.user });
};

/**
 * @desc Update Admin Settings (email/password)
 * @route PUT /api/auth/update-settings
 * @access Private/Admin
 */
const updateAdminSettings = async (req, res) => {
  try {
    const adminId = req.user?._id;
    const { oldEmail, newEmail, oldPassword, newPassword } = req.body;

    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized: Admin not authenticated" });
    }

    const admin = await User.findById(adminId);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // Verify old email
    if (oldEmail && admin.email !== oldEmail) {
      return res.status(400).json({ message: "Old email does not match current email" });
    }

    // Verify old password
    if (oldPassword) {
      const match = await bcrypt.compare(oldPassword, admin.password);
      if (!match) {
        return res.status(400).json({ message: "Old password is incorrect" });
      }
    }

    // Update email & password
    if (newEmail) admin.email = newEmail;
    if (newPassword) {
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(newPassword, salt);
    }

    await admin.save();
    return res.json({ success: true, message: "✅ Settings updated successfully!" });
  } catch (err) {
    console.error("Error updating admin settings:", err);
    return res.status(500).json({ message: "Server error updating settings" });
  }
};

/**
 * @desc Forgot Password (Send Reset Email)
 * @route POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await User.findOne({ email });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found with this email" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

    admin.resetPasswordToken = resetTokenHash;
    admin.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 mins
    await admin.save();

    const resetURL = `http://localhost:5173/admin/reset/${resetToken}`;

    // Email setup (configure .env)
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
      subject: "TEW Admin Password Reset",
      html: `
        <p>Hello Admin,</p>
        <p>You requested to reset your password. Click below to continue:</p>
        <a href="${resetURL}" target="_blank" 
        style="background:#a17c4d;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;">
          Reset Password
        </a>
        <p>This link expires in 10 minutes.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "✅ Password reset link sent to your email" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error sending reset email" });
  }
};

/**
 * @desc Reset Password via Token
 * @route POST /api/auth/reset-password/:token
 */
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

    // clear reset token
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpire = undefined;

    await admin.save();
    res.json({ message: "✅ Password has been reset successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error resetting password" });
  }
};

// ✅ Properly export everything
module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateAdminSettings,
  forgotPassword,
  resetPassword,
};
