const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  deliveryFee: { type: Number, required: true, default: 0 },
  locations: [
    {
      name: { type: String, required: true },
      fee: { type: Number, required: true },
    },
  ],
});

module.exports = mongoose.model("Settings", settingsSchema);
