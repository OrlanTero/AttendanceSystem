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
import { io } from "socket.io-client";
import { SOCKET_API_URL } from "../utils/api";

/**
 * FingerprintScanner component for interacting with the fingerprint API via Socket.io
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
  const [socket, setSocket] = useState(null);

  // Initialize socket connection when the dialog opens
  useEffect(() => {
    if (open) {
      // Create socket connection
      const newSocket = io(SOCKET_API_URL);

      newSocket.on("connect", () => {
        console.log("Connected to fingerprint server");
        setMessage("Connected to fingerprint server");
        setStatus("connecting");
      });

      newSocket.on("disconnect", () => {
        console.log("Disconnected from fingerprint server");
        setMessage("Disconnected from fingerprint server");
        setStatus("error");
        setIsInitialized(false);
      });

      // Listen for status change events
      newSocket.on("STATUS", (data) => {
        console.log("Status change:", data);
        setMessage("Scanner initialized. Ready to scan.");
        setStatus("ready");
        setIsInitialized(true);
      });

      // Listen for fingerprint capture results
      newSocket.on("CAPTURE", (data) => {
        console.log("Fingerprint captured:", data);
        handleCaptureSuccess(data);
      });

      // Alternative event name for fingerprint capture
      newSocket.on("FINGERPRINT_CAPTURE", (data) => {
        console.log("Fingerprint captured:", data);
        handleCaptureSuccess(data);
      });

      // Listen for errors
      newSocket.on("ERROR", (data) => {
        console.error("Socket error:", data);
        setStatus("error");
        setMessage(`Error: ${data.message}`);
      });

      setSocket(newSocket);

      // Initialize scanner once connected
      setTimeout(() => {
        if (newSocket.connected) {
          newSocket.emit("START");
        }
      }, 1000);

      // Clean up on dialog close
      return () => {
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    } else {
      // Reset state when dialog closes
      setStatus("idle");
      setMessage("");
      setIsInitialized(false);
      setFingerprintData(null);
    }
  }, [open]);

  // Handle successful fingerprint capture
  const handleCaptureSuccess = (data) => {
    setFingerprintData(data.message);
    setStatus("success");
    setMessage("Fingerprint captured successfully.");

    if (mode === "verify" && employeeId) {
      verifyFingerprint(data, employeeId);
    }
  };

  // Capture a fingerprint
  const captureFingerprint = () => {
    if (!socket || !socket.connected) {
      setStatus("error");
      setMessage("Socket not connected. Please try again.");
      return;
    }

    if (!isInitialized) {
      socket.emit("START");
      return;
    }

    setStatus("capturing");
    setMessage("Place your finger on the scanner...");
    socket.emit("CAPTURE");
  };

  // Verify a fingerprint
  const verifyFingerprint = (fingerprintData, employeeId) => {
    if (!socket || !socket.connected) {
      setStatus("error");
      setMessage("Socket not connected. Please try again.");
      return;
    }

    setStatus("processing");
    setMessage("Verifying fingerprint...");

    socket.emit("VERIFY", {
      fingerprintData,
      employeeId,
    });
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
                  animation:
                    status === "capturing" ? "pulse 1.5s infinite" : "none",
                  "@keyframes pulse": {
                    "0%": { opacity: 1 },
                    "50%": { opacity: 0.3 },
                    "100%": { opacity: 1 },
                  },
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
