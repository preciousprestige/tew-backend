const express = require("express");
const router = express.Router();
const Settings = require("../models/settings");

// ✅ Get all settings (public)
router.get("/", async (req, res) => {
  try {
    const settings = await Settings.findOne();
    res.json(settings || { deliveryFee: 0, locations: [] });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch settings" });
  }
});

// ✅ Get delivery fee for a location (public)
router.get("/delivery", async (req, res) => {
  try {
    const { location } = req.query;
    const settings = await Settings.findOne();
    if (!settings) return res.json({ fee: 0 });

    const found =
      settings.locations?.find(
        (loc) => loc.name.toLowerCase() === location?.toLowerCase()
      ) || null;

    res.json({ fee: found ? found.fee : settings.deliveryFee });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch delivery fee" });
  }
});

// ✅ Update settings (admin)
router.put("/", async (req, res) => {
  try {
    const { deliveryFee, locations } = req.body;
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();

    settings.deliveryFee = deliveryFee;
    settings.locations = locations;
    await settings.save();

    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: "Failed to update settings" });
  }
});

module.exports = router;
