const express = require("express");
const router = express.Router();
const Employee = require("../models/employee");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Set up multer for file uploads
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "employee-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }

    cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
  },
});

// Get all employees
router.get("/", async (req, res) => {
  try {
    const searchTerm = req.query.search;
    let employees;

    if (searchTerm) {
      employees = await Employee.search(searchTerm);
    } else {
      employees = await Employee.getAll();
    }

    res.json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get employee by ID
router.get("/:id", async (req, res) => {
  try {
    const employee = await Employee.getById(req.params.id);
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }
    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new employee
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const employeeData = req.body;

    // If image was uploaded, add the path
    if (req.file) {
      employeeData.image = req.file.path;
    }

    const result = await Employee.create(employeeData);

    if (result.success) {
      res.status(201).json(result);
    } else {
      // If creation failed and we uploaded an image, delete it
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(400).json(result);
    }
  } catch (error) {
    // If there was an error and we uploaded an image, delete it
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update employee
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const employeeData = req.body;

    // If image was uploaded, add the path
    if (req.file) {
      employeeData.image = req.file.path;

      // Get the existing employee to delete old image if exists
      const existingEmployee = await Employee.getById(req.params.id);
      if (existingEmployee && existingEmployee.image) {
        try {
          fs.unlinkSync(existingEmployee.image);
        } catch (err) {
          console.error("Error deleting old image:", err);
        }
      }
    }

    const result = await Employee.update(req.params.id, employeeData);

    if (result.success) {
      res.json(result);
    } else {
      // If update failed and we uploaded an image, delete it
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(400).json(result);
    }
  } catch (error) {
    // If there was an error and we uploaded an image, delete it
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete employee
router.delete("/:id", async (req, res) => {
  try {
    // Get the employee to delete the image if exists
    const employee = await Employee.getById(req.params.id);

    const result = await Employee.delete(req.params.id);

    if (result.success && employee && employee.image) {
      try {
        fs.unlinkSync(employee.image);
      } catch (err) {
        console.error("Error deleting image:", err);
      }
    }

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
