const express = require("express");
const router = express.Router();
const Department = require("../models/department");

// Get all departments
router.get("/", async (req, res) => {
  try {
    const searchTerm = req.query.search;
    let departments;

    if (searchTerm) {
      departments = await Department.search(searchTerm);
    } else {
      departments = await Department.getAll();
    }

    res.json({ success: true, data: departments });
  } catch (error) {
    console.error("Error in GET /departments:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get department by ID
router.get("/:id", async (req, res) => {
  try {
    const department = await Department.getById(req.params.id);
    if (!department) {
      return res
        .status(404)
        .json({ success: false, message: "Department not found" });
    }
    res.json({ success: true, data: department });
  } catch (error) {
    console.error("Error in GET /departments/:id:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create department
router.post("/", async (req, res) => {
  try {
    const result = await Department.create(req.body);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("Error in POST /departments:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update department
router.put("/:id", async (req, res) => {
  try {
    const result = await Department.update(req.params.id, req.body);

    if (!result.success) {
      if (result.message && result.message.includes("not found")) {
        return res.status(404).json(result);
      }
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Error in PUT /departments/:id:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete department
router.delete("/:id", async (req, res) => {
  try {
    const result = await Department.delete(req.params.id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in DELETE /departments/:id:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
