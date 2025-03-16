const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// Configuration for the VB.NET Fingerprint API Service
const FINGERPRINT_API_HOST = "localhost";
const FINGERPRINT_API_PORT = 5000;
const FINGERPRINT_API_URL = `http://${FINGERPRINT_API_HOST}:${FINGERPRINT_API_PORT}`;

// Directory to store fingerprint templates
const TEMPLATES_DIR = path.join(__dirname, "../data/fingerprints");

// Ensure the templates directory exists
if (!fs.existsSync(TEMPLATES_DIR)) {
  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
}

// Helper function to make requests to the VB.NET service with retry logic
async function callFingerprintService(
  endpoint,
  method = "GET",
  data = null,
  maxRetries = 2
) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const url = `${FINGERPRINT_API_URL}/${endpoint}`;
      console.log(
        `Calling fingerprint service (attempt ${attempt}/${
          maxRetries + 1
        }): ${method} ${url}`
      );

      const options = {
        method,
        url,
        headers: {
          "Content-Type": "application/json",
        },
        // Set a longer timeout for the request (30 seconds)
        timeout: 30000,
      };

      if (data) {
        options.data = data;
        console.log(
          `Request data:`,
          JSON.stringify(data).substring(0, 200) +
            (JSON.stringify(data).length > 200 ? "..." : "")
        );
      }

      const response = await axios(options);
      console.log(`Fingerprint service response (${endpoint}):`, response.data);
      return response.data;
    } catch (error) {
      lastError = error;
      console.error(
        `Error calling fingerprint service (${endpoint}, attempt ${attempt}/${
          maxRetries + 1
        }):`,
        error.message
      );

      if (error.response) {
        console.error("Response data:", error.response.data);
      }

      // If we have retries left, wait a bit and try again
      if (attempt <= maxRetries) {
        console.log(`Retrying in 2 seconds... (${attempt}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  // If we get here, all attempts failed
  throw lastError;
}

// Check if scanner is connected
router.get("/status", async (req, res) => {
  console.log("Checking fingerprint scanner status");

  try {
    const result = await callFingerprintService("status");
    res.json({
      success: result.success,
      message: result.message || "Scanner status checked",
    });
  } catch (error) {
    console.error("Error checking scanner status:", error);
    res.status(500).json({
      success: false,
      message:
        "Error connecting to fingerprint service. Please ensure the service is running.",
    });
  }
});

// Initialize scanner
router.get("/initialize", async (req, res) => {
  console.log("Initializing fingerprint scanner");

  try {
    const result = await callFingerprintService("initialize");
    res.json({
      success: result.success,
      message: result.message || "Scanner initialized",
    });
  } catch (error) {
    console.error("Error initializing scanner:", error);
    res.status(500).json({
      success: false,
      message:
        "Error initializing fingerprint scanner. Please ensure the service is running.",
    });
  }
});

// Capture fingerprint
router.post("/capture", async (req, res) => {
  console.log("Capturing fingerprint");

  try {
    // Set a longer timeout for the response
    req.setTimeout(40000); // 40 seconds

    console.log("Sending capture request to fingerprint service...");

    // Try to initialize first to ensure the scanner is ready
    try {
      console.log("Ensuring scanner is initialized before capture...");
      await callFingerprintService("initialize", "GET");
      console.log("Scanner initialized successfully");
    } catch (initError) {
      console.warn(
        "Failed to initialize scanner before capture:",
        initError.message
      );
      // Continue anyway, as the scanner might already be initialized
    }

    // Add a small delay to ensure the scanner is ready
    console.log("Waiting for scanner to be ready...");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Now try to capture
    console.log("Starting fingerprint capture...");
    const result = await callFingerprintService("capture", "POST", null, 1); // Allow 1 retry
    console.log("Capture result:", result);

    if (result.success) {
      console.log("Fingerprint captured successfully, sending response");
      res.json({
        success: true,
        message: result.message || "Fingerprint captured successfully",
        data: result.data,
      });
    } else {
      console.log("Failed to capture fingerprint:", result.message);
      res.json({
        success: false,
        message: result.message || "Failed to capture fingerprint",
      });
    }
  } catch (error) {
    console.error("Error capturing fingerprint:", error);

    // Check if it's a timeout error
    if (error.code === "ECONNABORTED") {
      res.status(504).json({
        success: false,
        message: "Fingerprint capture timed out. Please try again.",
      });
    } else {
      res.status(500).json({
        success: false,
        message: `Error capturing fingerprint: ${error.message}. Please ensure the service is running.`,
      });
    }
  }
});

// Verify fingerprint
router.post("/verify", async (req, res) => {
  console.log("Verifying fingerprint");

  const { fingerprintData, employeeId } = req.body;

  if (!employeeId) {
    return res.status(400).json({
      success: false,
      message: "Employee ID is required",
    });
  }

  if (!fingerprintData) {
    return res.status(400).json({
      success: false,
      message: "Fingerprint data is required",
    });
  }

  try {
    // Get the stored template for this employee
    const templatePath = path.join(TEMPLATES_DIR, `${employeeId}.json`);

    if (!fs.existsSync(templatePath)) {
      return res.json({
        success: false,
        message: "No stored template found for this employee",
      });
    }

    const storedTemplate = JSON.parse(fs.readFileSync(templatePath, "utf8"));

    // Call the VB.NET service to verify the fingerprint
    const result = await callFingerprintService("verify", "POST", {
      capturedTemplate: fingerprintData,
      storedTemplate: storedTemplate.template,
    });

    res.json({
      success: result.success,
      message:
        result.message ||
        (result.success
          ? "Fingerprint verified successfully"
          : "Fingerprint verification failed"),
      score: result.score,
    });
  } catch (error) {
    console.error("Error verifying fingerprint:", error);
    res.status(500).json({
      success: false,
      message:
        "Error verifying fingerprint. Please ensure the service is running.",
    });
  }
});

// Register fingerprint
router.post("/register", async (req, res) => {
  console.log("Registering fingerprint");

  const { fingerprintData, employeeId } = req.body;

  if (!employeeId) {
    return res.status(400).json({
      success: false,
      message: "Employee ID is required",
    });
  }

  if (!fingerprintData) {
    return res.status(400).json({
      success: false,
      message: "Fingerprint data is required",
    });
  }

  try {
    // Save the template to a file
    const template = {
      employeeId,
      timestamp: new Date().toISOString(),
      template: fingerprintData.template,
      metadata: {
        quality: fingerprintData.quality,
        width: fingerprintData.width,
        height: fingerprintData.height,
        resolution: fingerprintData.resolution,
      },
    };

    const templatePath = path.join(TEMPLATES_DIR, `${employeeId}.json`);
    fs.writeFileSync(templatePath, JSON.stringify(template, null, 2));

    res.json({
      success: true,
      message: "Fingerprint registered successfully",
    });
  } catch (error) {
    console.error("Error registering fingerprint:", error);
    res.status(500).json({
      success: false,
      message: `Failed to register fingerprint: ${error.message}`,
    });
  }
});

module.exports = router;
