import React, { useState } from "react";
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  TextField,
  Button,
  Paper,
  Snackbar,
  Alert,
} from "@mui/material";
import FingerprintScanner from "../components/FingerprintScanner";

/**
 * TabPanel component for tab content
 */
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`fingerprint-tabpanel-${index}`}
      aria-labelledby={`fingerprint-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

/**
 * FingerprintPage component for fingerprint verification and registration
 */
const FingerprintPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [employeeId, setEmployeeId] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setShowScanner(false);
    setEmployeeId("");
  };

  // Handle employee ID input change
  const handleEmployeeIdChange = (event) => {
    setEmployeeId(event.target.value);
  };

  // Handle form submission
  const handleSubmit = (event) => {
    event.preventDefault();
    if (employeeId.trim() === "") {
      setNotification({
        open: true,
        message: "Please enter an employee ID",
        severity: "error",
      });
      return;
    }
    setShowScanner(true);
  };

  // Handle successful fingerprint operation
  const handleSuccess = (data) => {
    setNotification({
      open: true,
      message:
        tabValue === 0
          ? `Employee ${employeeId} verified successfully`
          : `Fingerprint registered for employee ${employeeId}`,
      severity: "success",
    });

    // Reset form after success
    setTimeout(() => {
      setShowScanner(false);
      setEmployeeId("");
    }, 3000);
  };

  // Handle fingerprint operation error
  const handleError = (message) => {
    setNotification({
      open: true,
      message: `Error: ${message}`,
      severity: "error",
    });
  };

  // Close notification
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Fingerprint Management
      </Typography>

      <Paper sx={{ mt: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          centered
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Verify Fingerprint" />
          <Tab label="Register Fingerprint" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Verify Employee Fingerprint
          </Typography>

          {!showScanner ? (
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <TextField
                label="Employee ID"
                variant="outlined"
                fullWidth
                value={employeeId}
                onChange={handleEmployeeIdChange}
                margin="normal"
                required
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
                fullWidth
              >
                Verify Fingerprint
              </Button>
            </Box>
          ) : (
            <FingerprintScanner
              mode="verify"
              employeeId={employeeId}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Register New Fingerprint
          </Typography>

          {!showScanner ? (
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <TextField
                label="Employee ID"
                variant="outlined"
                fullWidth
                value={employeeId}
                onChange={handleEmployeeIdChange}
                margin="normal"
                required
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
                fullWidth
              >
                Register Fingerprint
              </Button>
            </Box>
          ) : (
            <FingerprintScanner
              mode="register"
              employeeId={employeeId}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          )}
        </TabPanel>
      </Paper>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default FingerprintPage;
