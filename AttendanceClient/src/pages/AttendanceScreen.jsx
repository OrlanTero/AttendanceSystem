import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Alert,
  Chip,
} from "@mui/material";
import logo from "../assets/logo.png";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import CelebrationIcon from "@mui/icons-material/Celebration";
import { io } from "socket.io-client";
import * as api from "../utils/api";

const AttendanceScreen = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState("idle"); // idle, init, connecting, ready, capturing, verifying, success, error, processing, holiday, rest-day
  const [message, setMessage] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [fingerprintData, setFingerprintData] = useState(null);
  const [socket, setSocket] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [attendanceRecord, setAttendanceRecord] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState(null); // present, late, absent
  const [attendanceType, setAttendanceType] = useState(null); // check-in, check-out
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [nonWorkingDayReason, setNonWorkingDayReason] = useState(null); // holiday, rest-day

  // Constants for time calculations
  const SHIFT_START_HOUR = 8; // 8 AM
  const SHIFT_END_HOUR = 18; // 6 PM
  const GRACE_PERIOD_MINUTES = 15; // 15 min grace period

  // Initialize socket connection
  useEffect(() => {
    // Create socket connection
    const newSocket = io(api.SOCKET_API_URL);

    newSocket.on("connect", () => {
      console.log("Connected to fingerprint server");
      setMessage("Connected to fingerprint server");
      setStatus("connecting");
    });

    newSocket.on("BIOMETRIC_CONNECTED", (data) => {
      console.log("Biometric connected:", data);
      setMessage("Biometric connected");
      setStatus("ready");

      if (newSocket.connected) {
        newSocket.emit("START");
      }
    });

    newSocket.on("BIOMETRIC_DISCONNECTED", (data) => {
      console.log("Biometric disconnected:", data);
      setMessage("Biometric disconnected");
      setStatus("error");
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from fingerprint server");
      setMessage("Disconnected from fingerprint server");
      setStatus("error");
      setIsInitialized(false);
    });

    newSocket.on("CAPTURE", (data) => {
      console.log("Fingerprint captured:", data);
      setFingerprintData(data);
      setMessage("Fingerprint captured successfully");
      setStatus("capturing");
    });

    // Listen for fingerprint capture results
    newSocket.on("FINGERPRINT_CAPTURE", (data) => {
      setFingerprintData(data);
      setMessage("Fingerprint captured successfully");
      setStatus("verifying");
    });

    newSocket.on("VERIFY_RESULT", (data) => {
      const result = JSON.parse(data.result);

      if (result.result === "success") {
        // employee is the same structure of the employee object in the database
        setEmployee(result.employee);
        setMessage("Employee found: " + result.employee.display_name);
        setStatus("processing"); // Change to processing to handle attendance logic
        handleEmployeeIdentified(result.employee);
      } else {
        setMessage("Employee not found");
        setStatus("error");
        setEmployee(null);

        // Reset after 5 seconds
        setTimeout(() => {
          resetScan();
        }, 2000);
      }
    });

    setSocket(newSocket);

    // Clean up on component unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (socket) {
      socket.emit("START");
    }
  }, [socket]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Effect for refreshing attendance data periodically
  useEffect(() => {
    // Initial fetch of today's attendance
    fetchTodayAttendance();

    // Set up interval for periodic refresh
    const refreshTimer = setInterval(() => {
      fetchTodayAttendance();
    }, 60000); // Every minute

    return () => clearInterval(refreshTimer);
  }, []);

  useEffect(() => {
    if (status === "verifying") {
      socket.emit("VERIFY", fingerprintData);
    }
  }, [status, fingerprintData]);

  // Function to fetch today's attendance records
  const fetchTodayAttendance = async () => {
    try {
      // Get today's date in local timezone YYYY-MM-DD format
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      const todayStr = `${year}-${month}-${day}`;

      console.log("Fetching attendance for today's date:", todayStr);
      const response = await api.getAttendanceByDate(todayStr);
      console.log("Today's attendance:", response);
      setTodayAttendance(response);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error("Error fetching today's attendance:", error);
    }
  };

  // Function to format time from ISO string
  const formatTime = (timeString) => {
    if (!timeString) return "N/A";

    // Create a date object from the ISO string
    // For consistent display in local time, we need to handle the timezone properly
    const time = new Date(timeString);

    // Format the time in the local timezone
    return time.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true, // Use 12-hour format with AM/PM
    });
  };

  // Helper function to get today's date in YYYY-MM-DD format in local timezone
  const getTodayDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Function to handle employee identification and determine attendance action
  const handleEmployeeIdentified = async (employee) => {
    try {
      console.log("Employee identified:", employee);

      // First, check if today is a working day for this employee
      const today = getTodayDateString();
      const workingDayCheck = await api.isWorkingDay(
        today,
        employee.employee_id
      );

      if (!workingDayCheck.isWorkingDay) {
        // Today is not a working day for this employee
        console.log(
          `Today is not a working day for ${employee.display_name}. Reason: ${workingDayCheck.reason}`
        );

        setNonWorkingDayReason(workingDayCheck.reason);

        if (workingDayCheck.reason === "holiday") {
          setMessage(
            `Today is a holiday. ${employee.display_name} is not scheduled to work.`
          );
          setStatus("holiday");
        } else if (workingDayCheck.reason === "rest day") {
          setMessage(`Today is a rest day for ${employee.display_name}.`);
          setStatus("rest-day");
        }

        // Reset after 5 seconds
        setTimeout(() => {
          resetScan();
        }, 5000);

        return;
      }

      // Get today's attendance records for this employee
      console.log("Checking attendance for employee ID:", employee.employee_id);
      const attendanceRecords = await api.getAttendanceByEmployeeAndDate(
        employee.employee_id,
        today
      );
      console.log("Attendance records found:", attendanceRecords);

      const currentTime = new Date();
      const currentHour = currentTime.getHours();
      const currentMinutes = currentTime.getMinutes();

      // Calculate if within shift hours
      const isWithinShiftHours =
        currentHour >= SHIFT_START_HOUR && currentHour < SHIFT_END_HOUR;

      // Calculate if late (after start time + grace period)
      const isLate =
        currentHour > SHIFT_START_HOUR ||
        (currentHour === SHIFT_START_HOUR &&
          currentMinutes > GRACE_PERIOD_MINUTES);

      // Determine attendance status
      let status = "present";
      if (isWithinShiftHours && isLate) {
        status = "late";
      } else if (!isWithinShiftHours && currentHour >= SHIFT_END_HOUR) {
        status = "present"; // Still present if checking out after shift end
      }

      // If no records for today, this is a check-in
      if (!attendanceRecords || attendanceRecords.length === 0) {
        setAttendanceType("check-in");
        setAttendanceStatus(status);

        // Record check-in
        console.log("Checking in employee with ID:", employee.employee_id);
        const checkInResult = await api.checkInEmployee(employee.employee_id);
        console.log("Check-in result:", checkInResult);

        if (checkInResult.success) {
          setAttendanceRecord(checkInResult.data);
          setMessage(
            `${employee.display_name} successfully checked in (${status})`
          );
          setStatus("success");

          // Refresh attendance list after successful check-in
          fetchTodayAttendance();
        } else {
          setMessage(`Failed to check in: ${checkInResult.message}`);
          setStatus("error");
        }
      }
      // If there's a record without check_out, this is a check-out
      else {
        const latestRecord = attendanceRecords[attendanceRecords.length - 1];

        if (!latestRecord.check_out) {
          setAttendanceType("check-out");
          setAttendanceStatus("present"); // Always present when checking out

          // Record check-out
          const checkOutResult = await api.checkOutEmployee(
            latestRecord.attendance_id
          );
          if (checkOutResult.success) {
            setAttendanceRecord(checkOutResult.data);
            setMessage(`${employee.display_name} successfully checked out`);
            setStatus("success");

            // Refresh attendance list after successful check-out
            fetchTodayAttendance();
          } else {
            setMessage(`Failed to check out: ${checkOutResult.message}`);
            setStatus("error");
          }
        } else {
          // Already checked in and out today
          setMessage(
            `${employee.display_name} has already completed attendance for today`
          );
          setStatus("success");
        }
      }

      // Reset after 5 seconds
      setTimeout(() => {
        resetScan();
      }, 5000);
    } catch (error) {
      console.error("Error handling employee identification:", error);
      setMessage("Error processing attendance: " + error.message);
      setStatus("error");

      // Reset after 5 seconds
      setTimeout(() => {
        resetScan();
      }, 5000);
    }
  };

  // Function to reset scan state
  const resetScan = () => {
    setStatus("ready");
    setMessage("Scanner initialized. Ready to scan.");
    setEmployee(null);
    setAttendanceRecord(null);
    setAttendanceStatus(null);
    setAttendanceType(null);
    setFingerprintData(null);
    setNonWorkingDayReason(null);

    // Restart scanning if socket is available
    if (socket) {
      socket.emit("START");
    }
  };

  // Helper function to render status icon
  const renderStatusIcon = () => {
    switch (status) {
      case "ready":
        return (
          <FingerprintIcon
            sx={{
              fontSize: 100,
              color: "primary.main",
              mb: 2,
            }}
          />
        );
      case "capturing":
      case "verifying":
      case "processing":
        return <CircularProgress size={100} sx={{ mb: 2 }} />;
      case "success":
        return (
          <CheckCircleIcon
            sx={{
              fontSize: 100,
              color: "success.main",
              mb: 2,
            }}
          />
        );
      case "error":
        return (
          <ErrorIcon
            sx={{
              fontSize: 100,
              color: "error.main",
              mb: 2,
            }}
          />
        );
      case "holiday":
        return (
          <CelebrationIcon
            sx={{
              fontSize: 100,
              color: "info.main",
              mb: 2,
            }}
          />
        );
      case "rest-day":
        return (
          <EventBusyIcon
            sx={{
              fontSize: 100,
              color: "info.main",
              mb: 2,
            }}
          />
        );
      default:
        return (
          <FingerprintIcon
            sx={{
              fontSize: 100,
              color: "primary.main",
              mb: 2,
            }}
          />
        );
    }
  };

  // Function to render attendance status badge
  const renderStatusBadge = (status) => {
    const colorMap = {
      present: "#4caf50",
      late: "#ff9800",
      absent: "#f44336",
    };

    return (
      <Box
        sx={{
          display: "inline-block",
          px: 1,
          py: 0.5,
          borderRadius: 1,
          backgroundColor: colorMap[status] || "#e0e0e0",
          color: "#fff",
          fontWeight: "bold",
          fontSize: "0.75rem",
          textTransform: "uppercase",
        }}
      >
        {status}
      </Box>
    );
  };

  // Function to render the non-working day message
  const renderNonWorkingDayAlert = () => {
    if (status !== "holiday" && status !== "rest-day") return null;

    const isHoliday = nonWorkingDayReason === "holiday";

    return (
      <Alert
        severity="info"
        sx={{
          mb: 2,
          alignItems: "center",
          backgroundColor: isHoliday
            ? "rgba(103, 58, 183, 0.1)"
            : "rgba(33, 150, 243, 0.1)",
        }}
        icon={isHoliday ? <CelebrationIcon /> : <EventBusyIcon />}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: "medium" }}>
            {isHoliday ? "Today is a holiday" : "Today is a scheduled rest day"}
          </Typography>
          <Chip
            label={isHoliday ? "Holiday" : "Rest Day"}
            color={isHoliday ? "secondary" : "primary"}
            size="small"
          />
        </Box>
      </Alert>
    );
  };

  return (
    <Box
      sx={{ height: "100vh", display: "flex", flexDirection: "column", p: 2 }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <img src={logo} alt="Logo" style={{ height: 40, marginRight: 16 }} />
          <Typography variant="h4">Attendance System</Typography>
        </Box>
        <Typography variant="h4">{currentTime.toLocaleTimeString()}</Typography>
      </Box>

      {/* Main Content - Split Screen Layout */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          overflow: "hidden",
        }}
      >
        {/* Left side - Check In/Out */}
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 3 },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: { xs: "100%", md: "40%" },
            height: { xs: "auto", md: "100%" },
            overflow: "auto",
          }}
        >
          <Typography variant="h5" gutterBottom align="center">
            Fingerprint Authentication
          </Typography>

          {renderStatusIcon()}

          {/* Display non-working day alert if applicable */}
          {renderNonWorkingDayAlert()}

          {status === "success" && employee && (
            <Typography variant="h6" gutterBottom align="center">
              {attendanceType === "check-in" ? "Check In" : "Check Out"} -{" "}
              {employee.display_name}
            </Typography>
          )}

          {status === "success" && attendanceStatus && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                bgcolor:
                  attendanceStatus === "late"
                    ? "warning.light"
                    : "success.light",
                px: 2,
                py: 1,
                borderRadius: 1,
                mb: 2,
              }}
            >
              <AccessTimeIcon
                sx={{
                  mr: 1,
                  color:
                    attendanceStatus === "late"
                      ? "warning.dark"
                      : "success.dark",
                }}
              />
              <Typography
                variant="body1"
                sx={{
                  color:
                    attendanceStatus === "late"
                      ? "warning.dark"
                      : "success.dark",
                  fontWeight: "bold",
                }}
              >
                {attendanceStatus === "late" ? "Late" : "On Time"}
              </Typography>
            </Box>
          )}

          <Typography
            variant="body1"
            textAlign="center"
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            {message ||
              "Please place your finger on the scanner to record your attendance."}
          </Typography>

          {employee && status === "success" && (
            <Box sx={{ textAlign: "center", mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {`ID: ${employee.unique_id || employee.employee_id}`}
              </Typography>
              {attendanceRecord && (
                <Typography variant="body2" color="text.secondary">
                  {attendanceType === "check-in"
                    ? `Check In Time: ${new Date(
                        attendanceRecord.check_in
                      ).toLocaleTimeString()}`
                    : `Check Out Time: ${new Date(
                        attendanceRecord.check_out
                      ).toLocaleTimeString()}`}
                </Typography>
              )}
            </Box>
          )}

          {status === "error" && (
            <Button
              variant="contained"
              color="error"
              onClick={resetScan}
              sx={{ mt: 2 }}
            >
              Try Again
            </Button>
          )}
        </Paper>

        {/* Right side - Today's Attendance */}
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 3 },
            width: { xs: "100%", md: "60%" },
            height: { xs: "auto", md: "100%" },
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography variant="h5">Today's Attendance</Typography>
            <Typography variant="body2" color="text.secondary">
              {new Date().toLocaleDateString()}
            </Typography>
          </Box>

          {lastRefreshed && (
            <Typography variant="caption" display="block" sx={{ mb: 1 }}>
              Last updated: {lastRefreshed.toLocaleTimeString()}
            </Typography>
          )}

          {todayAttendance.length === 0 ? (
            <Box
              sx={{
                my: 2,
                p: 3,
                textAlign: "center",
                backgroundColor: "info.light",
                borderRadius: 1,
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="body1">
                No attendance records for today yet.
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ flex: 1, overflow: "auto" }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "primary.main",
                        color: "white",
                      }}
                    >
                      Employee
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "primary.main",
                        color: "white",
                      }}
                    >
                      ID
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "primary.main",
                        color: "white",
                      }}
                    >
                      In
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "primary.main",
                        color: "white",
                      }}
                    >
                      Out
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "primary.main",
                        color: "white",
                      }}
                    >
                      Status
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {todayAttendance.map((record) => (
                    <TableRow
                      key={record.attendance_id}
                      sx={{
                        "&:nth-of-type(odd)": {
                          backgroundColor: "action.hover",
                        },
                        "&:hover": { backgroundColor: "action.selected" },
                      }}
                    >
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{
                          maxWidth: "150px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {record.display_name}
                      </TableCell>
                      <TableCell>{record.unique_id}</TableCell>
                      <TableCell>{formatTime(record.check_in)}</TableCell>
                      <TableCell>{formatTime(record.check_out)}</TableCell>
                      <TableCell>{renderStatusBadge(record.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default AttendanceScreen;
