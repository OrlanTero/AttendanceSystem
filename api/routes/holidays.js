const express = require("express");
const router = express.Router();
const Holiday = require("../models/holiday");

// Get all holidays
router.get("/", async (req, res) => {
  try {
    const searchTerm = req.query.search;
    let holidays;

    if (searchTerm) {
      holidays = await Holiday.search(searchTerm);
    } else {
      holidays = await Holiday.getAll();
    }

    res.json({ success: true, data: holidays });
  } catch (error) {
    console.error("Error in GET /holidays:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get holiday by ID
router.get("/:id", async (req, res) => {
  try {
    const holiday = await Holiday.getById(req.params.id);
    if (!holiday) {
      return res
        .status(404)
        .json({ success: false, message: "Holiday not found" });
    }
    res.json({ success: true, data: holiday });
  } catch (error) {
    console.error("Error in GET /holidays/:id:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create holiday
router.post("/", async (req, res) => {
  try {
    const result = await Holiday.create(req.body);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("Error in POST /holidays:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update holiday
router.put("/:id", async (req, res) => {
  try {
    const result = await Holiday.update(req.params.id, req.body);

    if (!result.success) {
      if (result.message && result.message.includes("not found")) {
        return res.status(404).json(result);
      }
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Error in PUT /holidays/:id:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete holiday
router.delete("/:id", async (req, res) => {
  try {
    const result = await Holiday.delete(req.params.id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in DELETE /holidays/:id:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
