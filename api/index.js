const express = require("express");
const router = express.Router();

// Import models for table creation
const Employee = require("./models/employee");
const Department = require("./models/department");
const Holiday = require("./models/holiday");

// Import route handlers
const employeesRouter = require("./routes/employees");
const departmentsRouter = require("./routes/departments");
const holidaysRouter = require("./routes/holidays");

// Initialize database tables
const initDb = async () => {
  try {
    await Employee.createEmployeesTable();
    await Department.createDepartmentsTable();
    await Holiday.createHolidaysTable();
    console.log("All tables initialized successfully");
  } catch (error) {
    console.error("Error initializing tables:", error);
    throw error;
  }
};

// Initialize database on startup
initDb().catch(console.error);

// Mount routes
router.use("/employees", employeesRouter);
router.use("/departments", departmentsRouter);
router.use("/holidays", holidaysRouter);

module.exports = router;
