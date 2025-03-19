const express = require("express");
const router = express.Router();

// Get all departments
router.get("/", async (req, res) => {
  try {
    res.json({ success: true, data: "Successfully Tested!" });
  } catch (error) {
    console.error("Error in GET /test:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
