import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import CloseIcon from "@mui/icons-material/Close";

/**
 * FingerprintScanner component for interacting with the fingerprint API
 * This component provides UI for initializing, capturing, verifying, and registering fingerprints
 */
const FingerprintScanner = ({
  open,
  onClose,
  onCapture,
  mode = "register",
  employeeId = null,
}) => {
  const [status, setStatus] = useState("idle"); // idle, initializing, ready, capturing, processing, success, error
  const [message, setMessage] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [fingerprintData, setFingerprintData] = useState(null);

  // Base URL for the fingerprint API
  const API_BASE_URL = "http://localhost:3000/api/fingerprint";

  // Initialize the scanner when the dialog opens
  useEffect(() => {
    if (open) {
      checkStatus();
    } else {
      // Reset state when dialog closes
      setStatus("idle");
      setMessage("");
      setIsInitialized(false);
      setFingerprintData(null);
    }
  }, [open]);

  // Check if the scanner is connected
  const checkStatus = async () => {
    setStatus("initializing");
    setMessage("Checking scanner status...");

    try {
      const response = await fetch(`${API_BASE_URL}/status`);
      const data = await response.json();

      if (data.success) {
        setMessage("Scanner is connected.");
        initializeScanner();
      } else {
        setStatus("error");
        setMessage(
          "Scanner not connected. Please connect the scanner and try again."
        );
      }
    } catch (error) {
      console.error("Error checking scanner status:", error);
      setStatus("error");
      setMessage(
        "Error connecting to fingerprint service. Please ensure the service is running."
      );
    }
  };

  // Initialize the scanner
  const initializeScanner = async () => {
    setStatus("initializing");
    setMessage("Initializing scanner...");

    try {
      const response = await fetch(`${API_BASE_URL}/initialize`);
      const data = await response.json();

      if (data.success) {
        setStatus("ready");
        setIsInitialized(true);
        setMessage("Scanner initialized. Ready to scan.");
      } else {
        setStatus("error");
        setMessage(`Failed to initialize scanner: ${data.message}`);
      }
    } catch (error) {
      console.error("Error initializing scanner:", error);
      setStatus("error");
      setMessage("Error initializing scanner. Please try again.");
    }
  };

  // Capture a fingerprint
  const captureFingerprint = async () => {
    if (!isInitialized) {
      initializeScanner();
      return;
    }

    setStatus("capturing");
    setMessage("Place your finger on the scanner...");

    try {
      console.log("Starting fingerprint capture request...");

      // Create a controller for each attempt instead of one for the whole process
      let success = false;
      let lastError = null;
      let data = null;
      const maxAttempts = 3;

      for (let attempts = 1; attempts <= maxAttempts; attempts++) {
        console.log(`Capture attempt ${attempts}/${maxAttempts}...`);

        // Create a new controller for each attempt with a longer timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log(`Timeout for attempt ${attempts}, aborting...`);
          controller.abort();
        }, 45000); // 45 seconds timeout - longer than the server-side timeout

        try {
          const response = await fetch(`${API_BASE_URL}/capture`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            signal: controller.signal,
          });

          // Clear the timeout as soon as we get a response
          clearTimeout(timeoutId);

          console.log(
            `Received response from capture endpoint (attempt ${attempts}):`,
            response.status
          );
          data = await response.json();
          console.log(`Capture response data (attempt ${attempts}):`, data);

          if (data.success) {
            success = true;
            break;
          } else {
            console.warn(
              `Capture failed (attempt ${attempts}): ${data.message}`
            );
            // Wait a bit before retrying
            if (attempts < maxAttempts) {
              setMessage(`Retrying capture (${attempts}/${maxAttempts})...`);
              await new Promise((resolve) => setTimeout(resolve, 2000));
              setMessage("Place your finger on the scanner...");
            }
          }
        } catch (err) {
          // Clear the timeout if there was an error
          clearTimeout(timeoutId);

          console.error(`Error during capture attempt ${attempts}:`, err);
          lastError = err;

          // Wait a bit before retrying
          if (attempts < maxAttempts) {
            setMessage(`Retrying capture (${attempts}/${maxAttempts})...`);
            await new Promise((resolve) => setTimeout(resolve, 2000));
            setMessage("Place your finger on the scanner...");
          }
        }
      }

      if (success && data) {
        setFingerprintData(data.data);
        setStatus("success");
        setMessage("Fingerprint captured successfully.");

        console.log("Fingerprint captured successfully:", data);
        if (mode === "verify" && employeeId) {
          verifyFingerprint(data.data, employeeId);
        } else if (mode === "register" && employeeId) {
          registerFingerprint(data.data, employeeId);
        } else {
          // Call the onCapture callback with the fingerprint data
          if (onCapture) {
            onCapture(data.data);
          }
        }
      } else {
        setStatus("error");
        const errorMessage = data
          ? data.message
          : lastError
          ? lastError.message
          : "Unknown error";
        setMessage(
          `Failed to capture fingerprint after ${maxAttempts} attempts: ${errorMessage}`
        );
        console.error("All capture attempts failed:", errorMessage);
      }
    } catch (error) {
      console.error("Error in capture process:", error);
      setStatus("error");
      setMessage(
        `Error capturing fingerprint: ${error.message}. Please try again.`
      );
    }
  };

  // Verify a fingerprint
  const verifyFingerprint = async (fingerprintData, employeeId) => {
    setStatus("processing");
    setMessage("Verifying fingerprint...");

    try {
      const response = await fetch(`${API_BASE_URL}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fingerprintData,
          employeeId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus("success");
        setMessage("Fingerprint verified successfully.");
        if (onCapture) {
          onCapture(fingerprintData);
        }
      } else {
        setStatus("error");
        setMessage(`Fingerprint verification failed: ${data.message}`);
      }
    } catch (error) {
      console.error("Error verifying fingerprint:", error);
      setStatus("error");
      setMessage("Error verifying fingerprint. Please try again.");
    }
  };

  // Register a fingerprint
  const registerFingerprint = async (fingerprintData, employeeId) => {
    setStatus("processing");
    setMessage("Registering fingerprint...");

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fingerprintData,
          employeeId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus("success");
        setMessage("Fingerprint registered successfully.");
        if (onCapture) {
          onCapture(fingerprintData);
        }
      } else {
        setStatus("error");
        setMessage(`Fingerprint registration failed: ${data.message}`);
      }
    } catch (error) {
      console.error("Error registering fingerprint:", error);
      setStatus("error");
      setMessage("Error registering fingerprint. Please try again.");
    }
  };

  // Reset the component state
  const resetScanner = () => {
    setStatus("ready");
    setMessage("Scanner ready. Click to scan.");
    setFingerprintData(null);
  };

  // Handle dialog close
  const handleClose = () => {
    if (status !== "capturing" && status !== "processing") {
      onClose();
    }
  };

  // Handle save and close
  const handleSave = () => {
    if (fingerprintData && onCapture) {
      onCapture(fingerprintData);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">
            {mode === "verify" ? "Verify Fingerprint" : "Register Fingerprint"}
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} alignItems="center">
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: 200,
              width: "100%",
              position: "relative",
            }}
          >
            {status === "initializing" ||
            status === "capturing" ||
            status === "processing" ? (
              <CircularProgress size={80} />
            ) : (
              <FingerprintIcon
                sx={{
                  fontSize: 100,
                  color:
                    status === "success"
                      ? "success.main"
                      : status === "error"
                      ? "error.main"
                      : "primary.main",
                  opacity: status === "idle" ? 0.5 : 1,
                }}
              />
            )}

            <Typography variant="body1" sx={{ mt: 2, textAlign: "center" }}>
              {message}
            </Typography>
          </Box>

          <Box sx={{ width: "100%" }}>
            {status === "error" && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {message}
              </Alert>
            )}

            {status === "success" && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {message}
              </Alert>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        {status === "success" ? (
          <Button variant="contained" color="primary" onClick={handleSave}>
            Save
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={captureFingerprint}
            disabled={status === "capturing" || status === "processing"}
          >
            {status === "idle" || status === "initializing"
              ? "Initialize Scanner"
              : status === "ready"
              ? "Scan Fingerprint"
              : status === "capturing"
              ? "Scanning..."
              : status === "processing"
              ? mode === "verify"
                ? "Verifying..."
                : "Registering..."
              : "Scan Again"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default FingerprintScanner;
