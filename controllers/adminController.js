const User = require("../models/user");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");


// =============================
// UPDATE ADMIN SETTINGS
// =============================
exports.updateAdminSettings = async (req, res) => {
  try {
    const adminId = req.user?._id;
    const { oldEmail, newEmail, oldPassword, newPassword } = req.body;

    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized: Admin not authenticated" });
    }

    const admin = await User.findById(adminId);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    if (oldEmail && admin.email !== oldEmail) {
      return res.status(400).json({ message: "Old email does not match current email" });
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
    res.json({ success: true, message: "Settings updated successfully!" });
  } catch (err) {
    console.error("Error updating admin settings:", err);
    res.status(500).json({ message: "Server error updating settings" });
  }
};



// =============================
// FORGOT PASSWORD
// =============================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await User.findOne({ email });

    if (!admin) return res.status(404).json({ message: "Admin not found with this email" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hash = crypto.createHash("sha256").update(resetToken).digest("hex");

    admin.resetPasswordToken = hash;
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

    await transporter.sendMail({
      from: `"TEW Admin" <${process.env.ADMIN_EMAIL}>`,
      to: admin.email,
      subject: "Password Reset",
      html: `<p>Click below to reset your password:</p>
             <a href="${resetURL}" target="_blank">Reset Password</a>`,
    });

    res.json({ message: "Password reset email sent" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error sending email" });
  }
};



// =============================
// RESET PASSWORD
// =============================
exports.resetPassword = async (req, res) => {
  try {
    const hash = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const admin = await User.findOne({
      resetPasswordToken: hash,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!admin) return res.status(400).json({ message: "Invalid or expired token" });

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(req.body.newPassword, salt);

    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpire = undefined;

    await admin.save();
    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error resetting password" });
  }
};



// =============================
// ADMIN LOGIN  ← FIXED POSITION
// =============================
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await User.findOne({ email });
    if (!admin) return res.status(401).json({ message: "Invalid email or password" });

    if (!admin.isAdmin)
      return res.status(403).json({ message: "Access denied. Not an admin." });

    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(401).json({ message: "Invalid email or password" });

    const token = admin.generateToken();

    res.json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      token,
      isAdmin: true,
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ message: "Server error during admin login" });
  }
};
