const express = require("express");
const router = express.Router();
const WorkSchedule = require("../models/workSchedule");

// Get work schedule by employee ID
router.get("/:employeeId", async (req, res) => {
  try {
    const schedule = await WorkSchedule.getByEmployeeId(req.params.employeeId);

    if (!schedule) {
      return res.json({
        success: true,
        data: {
          employee_id: parseInt(req.params.employeeId),
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: false,
          sunday: false,
        },
        message: "No schedule found, returning default",
      });
    }

    res.json({ success: true, data: schedule });
  } catch (error) {
    console.error("Error in GET /work-schedule/:employeeId:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new work schedule
router.post("/", async (req, res) => {
  try {
    const result = await WorkSchedule.create(req.body);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("Error in POST /work-schedule:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update work schedule
router.put("/:employeeId", async (req, res) => {
  try {
    const result = await WorkSchedule.update(req.params.employeeId, req.body);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Error in PUT /work-schedule/:employeeId:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete work schedule
router.delete("/:employeeId", async (req, res) => {
  try {
    const result = await WorkSchedule.delete(req.params.employeeId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Error in DELETE /work-schedule/:employeeId:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
