import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import FingerprintIcon from "@mui/icons-material/Fingerprint";

const fingerprintScanner = window.electron?.fingerprintScanner;

const FingerprintScanner = ({ open, onClose, onCapture }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [deviceReady, setDeviceReady] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");

  useEffect(() => {
    if (open) {
      checkDevice();
    }
  }, [open]);

  const checkDevice = async () => {
    try {
      setError("");
      setDebugInfo("");
      setIsChecking(true);

      if (!window.electron) {
        throw new Error("Electron API not available");
      }

      if (!fingerprintScanner) {
        throw new Error("Fingerprint scanner API not available");
      }

      console.log("Checking for fingerprint devices...");
      const result = await fingerprintScanner.checkDevices();
      console.log("Device check result:", result);

      setDeviceReady(true);
      setDebugInfo("Device detected and ready");
    } catch (error) {
      console.error("Device check error:", error);
      setError(error.message || "Failed to detect fingerprint scanner");
      setDebugInfo(`Error details: ${error.message}`);
      setDeviceReady(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    let timer;
    if (isScanning) {
      timer = setInterval(() => {
        setProgress((prevProgress) => {
          const newProgress = prevProgress + 10;
          if (newProgress >= 100) {
            clearInterval(timer);
            return 100;
          }
          return newProgress;
        });
      }, 500);
    }
    return () => clearInterval(timer);
  }, [isScanning]);

  const handleStartScan = async () => {
    try {
      setError("");
      setDebugInfo("");
      setIsScanning(true);
      setProgress(0);

      console.log("Starting fingerprint capture...");
      await fingerprintScanner.startCapture();

      console.log("Capturing fingerprint sample...");
      const biometricData = await fingerprintScanner.captureSample();

      console.log("Fingerprint captured successfully");
      onCapture(biometricData);
      handleClose();
    } catch (error) {
      console.error("Fingerprint scan error:", error);
      setError(
        error.message || "Failed to capture fingerprint. Please try again."
      );
      setDebugInfo(`Scan error details: ${error.message}`);
    } finally {
      setIsScanning(false);
      setProgress(0);
      try {
        await fingerprintScanner.stopCapture();
      } catch (error) {
        console.error("Error stopping capture:", error);
      }
    }
  };

  const handleClose = () => {
    setIsScanning(false);
    setError("");
    setProgress(0);
    setDeviceReady(false);
    setDebugInfo("");
    onClose();
  };

  const handleRetry = () => {
    checkDevice();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Fingerprint Scanner</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            py: 3,
          }}
        >
          {error ? (
            <>
              <Alert severity="error" sx={{ width: "100%", mb: 2 }}>
                {error}
              </Alert>
              {debugInfo && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {debugInfo}
                </Typography>
              )}
              <Button
                onClick={handleRetry}
                variant="outlined"
                disabled={isChecking}
                startIcon={isChecking ? <CircularProgress size={20} /> : null}
              >
                Retry Device Detection
              </Button>
            </>
          ) : null}

          {isScanning ? (
            <>
              <CircularProgress
                variant="determinate"
                value={progress}
                size={80}
                thickness={4}
                sx={{ mb: 2 }}
              />
              <Typography variant="body1" color="text.secondary">
                Place your finger on the scanner...
              </Typography>
            </>
          ) : (
            <>
              {isChecking ? (
                <CircularProgress size={80} sx={{ mb: 2 }} />
              ) : (
                <FingerprintIcon
                  sx={{
                    fontSize: 80,
                    color: deviceReady ? "primary.main" : "action.disabled",
                    mb: 2,
                  }}
                />
              )}
              <Typography variant="body1" color="text.secondary">
                {isChecking
                  ? "Checking scanner availability..."
                  : deviceReady
                  ? "Scanner ready. Click Start Scan to begin."
                  : "Scanner not detected. Please check connection."}
              </Typography>
              {debugInfo && !error && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  {debugInfo}
                </Typography>
              )}
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isScanning}>
          Cancel
        </Button>
        <Button
          onClick={handleStartScan}
          variant="contained"
          disabled={isScanning || !deviceReady || isChecking}
          startIcon={<FingerprintIcon />}
        >
          {isScanning ? "Scanning..." : "Start Scan"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FingerprintScanner;
