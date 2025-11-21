const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },

    // ✅ REQUIRED for forgot/reset password (YOU WERE MISSING THESE)
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
  },
  { timestamps: true }
);

// Ensure consistency between role and isAdmin
userSchema.pre("save", function (next) {
  if (this.role === "admin") this.isAdmin = true;
  next();
});

// Auto-hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with stored hash
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
