const express = require("express");
const router = express.Router();
const User = require("../models/user");

// Get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.getAll();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.getById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new user
router.post("/", async (req, res) => {
  try {
    const { username, password, display_name, biometric_data, image } =
      req.body;

    if (!username || !password || !display_name) {
      return res.status(400).json({
        success: false,
        message: "Username, password, and display name are required",
      });
    }

    const result = await User.create({
      username,
      password,
      display_name,
      biometric_data,
      image,
    });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user
router.put("/:id", async (req, res) => {
  try {
    const { display_name, biometric_data, image } = req.body;

    if (!display_name) {
      return res.status(400).json({
        success: false,
        message: "Display name is required",
      });
    }

    const result = await User.update(req.params.id, {
      display_name,
      biometric_data,
      image,
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete user
router.delete("/:id", async (req, res) => {
  try {
    const result = await User.delete(req.params.id);

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
