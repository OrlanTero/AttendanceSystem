import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  CircularProgress,
  Alert,
  TextField,
  Divider,
} from "@mui/material";
import FingerprintIcon from "@mui/icons-material/Fingerprint";

const FingerprintPage = () => {
  const [status, setStatus] = useState("idle"); // idle, initializing, ready, capturing, processing, success, error
  const [message, setMessage] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [mode, setMode] = useState("verify"); // verify or register
  const [fingerprintData, setFingerprintData] = useState(null);

  // Base URL for the fingerprint API
  const API_BASE_URL = "http://localhost:3000/api/fingerprint";

  // Check if the scanner is connected
  const checkStatus = async () => {
    setStatus("initializing");
    setMessage("Checking scanner status...");

    try {
      const response = await fetch(`${API_BASE_URL}/status`);
      const data = await response.json();

      if (data.success) {
        setStatus("ready");
        setMessage(
          "Scanner is connected and ready. Enter an employee ID and select an action."
        );
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

  // Initialize the component
  useEffect(() => {
    checkStatus();
  }, []);

  // Handle employee ID change
  const handleEmployeeIdChange = (e) => {
    setEmployeeId(e.target.value);
  };

  // Set mode to verify
  const handleVerifyMode = () => {
    setMode("verify");
  };

  // Set mode to register
  const handleRegisterMode = () => {
    setMode("register");
  };

  // Capture a fingerprint
  const captureFingerprint = async () => {
    if (!employeeId) {
      setMessage("Please enter an employee ID first.");
      return;
    }

    setStatus("capturing");
    setMessage("Place your finger on the scanner...");

    try {
      const response = await fetch(`${API_BASE_URL}/capture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        console.log("Fingerprint captured successfully:", data.data);
        setFingerprintData(data.data);
        setMessage("Fingerprint captured successfully.");

        if (mode === "verify") {
          verifyFingerprint(data.data, employeeId);
        } else {
          registerFingerprint(data.data, employeeId);
        }
      } else {
        setStatus("error");
        setMessage(`Failed to capture fingerprint: ${data.message}`);
      }
    } catch (error) {
      console.error("Error capturing fingerprint:", error);
      setStatus("error");
      setMessage("Error capturing fingerprint. Please try again.");
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
        setMessage(
          `Fingerprint verified successfully for employee ${employeeId}.`
        );
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
        setMessage(
          `Fingerprint registered successfully for employee ${employeeId}.`
        );
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

  // Reset the form
  const resetForm = () => {
    setStatus("ready");
    setMessage("Scanner is ready. Enter an employee ID and select an action.");
    setFingerprintData(null);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Fingerprint Management
      </Typography>

      <Paper sx={{ p: 4, mt: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Employee Information
          </Typography>
          <TextField
            label="Employee ID"
            variant="outlined"
            fullWidth
            value={employeeId}
            onChange={handleEmployeeIdChange}
            disabled={status === "capturing" || status === "processing"}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant={mode === "verify" ? "contained" : "outlined"}
              onClick={handleVerifyMode}
              disabled={status === "capturing" || status === "processing"}
              sx={{ flex: 1 }}
            >
              Verify Mode
            </Button>
            <Button
              variant={mode === "register" ? "contained" : "outlined"}
              onClick={handleRegisterMode}
              disabled={status === "capturing" || status === "processing"}
              sx={{ flex: 1 }}
            >
              Register Mode
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ textAlign: "center", my: 4 }}>
          {status === "capturing" || status === "processing" ? (
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
              }}
            />
          )}

          <Typography variant="body1" sx={{ mt: 2, mb: 3 }}>
            {message}
          </Typography>

          {status === "error" && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {message}
            </Alert>
          )}

          {status === "success" && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {message}
            </Alert>
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<FingerprintIcon />}
            onClick={captureFingerprint}
            disabled={
              status === "capturing" || status === "processing" || !employeeId
            }
            sx={{ minWidth: 200 }}
          >
            {mode === "verify" ? "Verify Fingerprint" : "Register Fingerprint"}
          </Button>

          {(status === "success" || status === "error") && (
            <Button
              variant="outlined"
              onClick={resetForm}
              sx={{ minWidth: 200 }}
            >
              Reset
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default FingerprintPage;
