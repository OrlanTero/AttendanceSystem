const express = require("express");
const router = express.Router();
const Attendance = require("../models/attendance");

// Get all attendance records with optional filters for employee_id, date, and status
// Added pagination support
router.get("/", async (req, res) => {
  try {
    const {
      employeeId,
      date,
      startDate,
      endDate,
      status,
      page = 1,
      limit = 10,
    } = req.query;

    let attendanceRecords;
    let totalRecords = 0;

    // Calculate pagination values
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    console.log("Attendance query parameters:", {
      employeeId,
      date,
      startDate,
      endDate,
      status,
      page,
      limit,
    });

    // Date range filtering takes precedence over single date
    if (startDate && endDate) {
      console.log(
        `Fetching attendance records from ${startDate} to ${endDate}`
      );
      // TODO: Add DB query to support date range
      const allRecords = await Attendance.getAll();

      // Filter by date range
      const filteredByDate = allRecords.filter((record) => {
        return record.date >= startDate && record.date <= endDate;
      });

      // Filter by employee ID if provided
      const filteredByEmployee = employeeId
        ? filteredByDate.filter(
            (record) => record.employee_id === parseInt(employeeId, 10)
          )
        : filteredByDate;

      // Filter by status if provided
      const filteredRecords = status
        ? filteredByEmployee.filter((record) => record.status === status)
        : filteredByEmployee;

      totalRecords = filteredRecords.length;
      attendanceRecords = filteredRecords.slice(offset, offset + limitNum);
    }
    // First, get total count for pagination
    else if (employeeId && date) {
      // Query by both employee ID and date
      const allRecords = await Attendance.getByEmployeeAndDate(
        employeeId,
        date
      );
      totalRecords = allRecords.length;

      // Filter by status if provided
      const filteredRecords = status
        ? allRecords.filter((record) => record.status === status)
        : allRecords;

      totalRecords = filteredRecords.length;

      // Apply pagination manually
      attendanceRecords = filteredRecords.slice(offset, offset + limitNum);
    } else if (employeeId) {
      // Query by employee ID only
      const allRecords = await Attendance.getByEmployeeId(employeeId);

      // Filter by status if provided
      const filteredRecords = status
        ? allRecords.filter((record) => record.status === status)
        : allRecords;

      // Filter by date if provided without exact match
      const dateFilteredRecords = date
        ? filteredRecords.filter((record) => record.date.includes(date))
        : filteredRecords;

      totalRecords = dateFilteredRecords.length;

      // Apply pagination manually
      attendanceRecords = dateFilteredRecords.slice(offset, offset + limitNum);
    } else if (date) {
      // Query by date only
      const allRecords = await Attendance.getByDate(date);

      // Filter by status if provided
      const filteredRecords = status
        ? allRecords.filter((record) => record.status === status)
        : allRecords;

      totalRecords = filteredRecords.length;

      // Apply pagination manually
      attendanceRecords = filteredRecords.slice(offset, offset + limitNum);
    } else {
      // Get all records and then filter/paginate
      const allRecords = await Attendance.getAll();

      // Filter by status if provided
      const filteredRecords = status
        ? allRecords.filter((record) => record.status === status)
        : allRecords;

      totalRecords = filteredRecords.length;

      // Apply pagination manually
      attendanceRecords = filteredRecords.slice(offset, offset + limitNum);
    }

    res.json({
      success: true,
      data: attendanceRecords,
      total: totalRecords,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalRecords / limitNum),
    });
  } catch (error) {
    console.error("Error in GET /attendance:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get attendance by ID
router.get("/:id", async (req, res) => {
  try {
    const attendance = await Attendance.getById(req.params.id);
    if (!attendance) {
      return res
        .status(404)
        .json({ success: false, message: "Attendance record not found" });
    }
    res.json({ success: true, data: attendance });
  } catch (error) {
    console.error("Error in GET /attendance/:id:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create attendance record
router.post("/", async (req, res) => {
  try {
    const result = await Attendance.create(req.body);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("Error in POST /attendance:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update attendance record
router.put("/:id", async (req, res) => {
  try {
    const result = await Attendance.update(req.params.id, req.body);

    if (!result.success) {
      if (result.message && result.message.includes("not found")) {
        return res.status(404).json(result);
      }
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Error in PUT /attendance/:id:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete attendance record
router.delete("/:id", async (req, res) => {
  try {
    const result = await Attendance.delete(req.params.id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in DELETE /attendance/:id:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Check in employee
router.post("/check-in", async (req, res) => {
  try {
    console.log("Check-in request received with body:", req.body);
    const { employeeId, date } = req.body;

    console.log("Extracted employeeId:", employeeId);
    console.log("Extracted date:", date);

    if (!employeeId) {
      console.log("No employeeId found in request");
      return res.status(400).json({
        success: false,
        message: "Employee ID is required",
      });
    }

    console.log(
      "Calling Attendance.checkIn with employeeId:",
      employeeId,
      "and date:",
      date
    );
    const result = await Attendance.checkIn(employeeId, date);
    console.log("CheckIn result:", result);

    if (!result.success) {
      console.log("CheckIn failed:", result.message);
      return res.status(400).json(result);
    }

    console.log("CheckIn successful, returning result");
    res.status(201).json(result);
  } catch (error) {
    console.error("Error in POST /attendance/check-in:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Check out employee
router.put("/check-out/:id", async (req, res) => {
  try {
    const result = await Attendance.checkOut(req.params.id);

    if (!result.success) {
      if (result.message && result.message.includes("not found")) {
        return res.status(404).json(result);
      }
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Error in PUT /attendance/check-out/:id:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
