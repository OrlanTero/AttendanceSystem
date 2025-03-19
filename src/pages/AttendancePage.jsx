import React, { useState, useEffect } from "react";
import * as api from "../utils/api";
import Navbar from "../components/Navbar";
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  InputAdornment,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  ClearAll as ClearAllIcon,
  CalendarMonth as CalendarIcon,
  Person as PersonIcon,
  Info as InfoIcon,
  Edit as EditIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { format, parseISO } from "date-fns";

const AttendancePage = ({ user, onLogout }) => {
  // States for attendance data and UI
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  // States for filters
  const [dateFilter, setDateFilter] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [employees, setEmployees] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);

  const statuses = [
    { value: "", label: "All Statuses" },
    { value: "present", label: "Present" },
    { value: "late", label: "Late" },
    { value: "absent", label: "Absent" },
  ];

  // Fetch attendance records with filters and pagination
  useEffect(() => {
    fetchAttendanceRecords();
  }, [page, rowsPerPage, dateFilter, employeeFilter, statusFilter]);

  // Fetch employees for filter dropdown
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const result = await api.getEmployees();
      if (result.success) {
        setEmployees(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      setError("");

      // Format date for API call - dateFilter is already in YYYY-MM-DD format
      const formattedDate = dateFilter;

      // Build query parameters
      const params = new URLSearchParams();
      if (formattedDate) params.append("date", formattedDate);
      if (employeeFilter) params.append("employeeId", employeeFilter);
      if (statusFilter) params.append("status", statusFilter);
      params.append("page", page + 1); // API uses 1-based indexing
      params.append("limit", rowsPerPage);

      // Make API call
      const endpoint = `/attendance?${params.toString()}`;
      const result = await api.fetchAttendanceWithPagination(endpoint);

      if (result.success) {
        setAttendanceRecords(result.data || []);
        setTotalRecords(result.total || 0);
      } else {
        setError("Failed to fetch attendance records");
      }
    } catch (error) {
      console.error("Error fetching attendance records:", error);
      setError("Failed to fetch attendance records");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDateChange = (event) => {
    setDateFilter(event.target.value);
    setPage(0);
  };

  const handleEmployeeChange = (event) => {
    setEmployeeFilter(event.target.value);
    setPage(0);
  };

  const handleStatusChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleClearFilters = () => {
    setDateFilter(format(new Date(), "yyyy-MM-dd"));
    setEmployeeFilter("");
    setStatusFilter("");
    setPage(0);
  };

  const handleViewDetails = (record) => {
    setSelectedRecord(record);
    setOpenDetailDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDetailDialog(false);
  };

  const formatTime = (timeString) => {
    if (!timeString) return "—";
    try {
      return format(parseISO(timeString), "hh:mm a");
    } catch (e) {
      return timeString;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return format(parseISO(dateString), "MMM dd, yyyy");
    } catch (e) {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "present":
        return "#4caf50";
      case "late":
        return "#ff9800";
      case "absent":
        return "#f44336";
      default:
        return "#9e9e9e";
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Navbar user={user} onLogout={onLogout} title="Attendance Records" />

      <Container
        maxWidth="xl"
        sx={{
          mt: 4,
          mb: 4,
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Attendance Management
          </Typography>

          {/* Filters Section */}
          <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth variant="outlined">
                <InputLabel htmlFor="date-filter">Date</InputLabel>
                <TextField
                  id="date-filter"
                  type="date"
                  value={dateFilter}
                  onChange={handleDateChange}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarIcon />
                      </InputAdornment>
                    ),
                  }}
                  label="Date"
                />
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth>
                <InputLabel id="employee-filter-label">Employee</InputLabel>
                <Select
                  labelId="employee-filter-label"
                  id="employee-filter"
                  value={employeeFilter}
                  label="Employee"
                  onChange={handleEmployeeChange}
                  startAdornment={
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">All Employees</MenuItem>
                  {employees.map((employee) => (
                    <MenuItem
                      key={employee.employee_id}
                      value={employee.employee_id}
                    >
                      {employee.display_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth>
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  id="status-filter"
                  value={statusFilter}
                  label="Status"
                  onChange={handleStatusChange}
                >
                  {statuses.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={12} md={3}>
              <Stack
                direction="row"
                spacing={1}
                justifyContent={{ xs: "center", md: "flex-end" }}
              >
                <Button
                  variant="outlined"
                  startIcon={<ClearAllIcon />}
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </Button>
              </Stack>
            </Grid>
          </Grid>

          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Table Section */}
          <Paper elevation={0} sx={{ width: "100%", overflow: "hidden" }}>
            <TableContainer sx={{ maxHeight: "calc(100vh - 300px)" }}>
              <Table stickyHeader aria-label="attendance records table">
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "primary.main",
                        color: "white",
                      }}
                    >
                      Date
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "primary.main",
                        color: "white",
                      }}
                    >
                      Employee ID
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "primary.main",
                        color: "white",
                      }}
                    >
                      Employee Name
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "primary.main",
                        color: "white",
                      }}
                    >
                      Check In
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "primary.main",
                        color: "white",
                      }}
                    >
                      Check Out
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
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "primary.main",
                        color: "white",
                      }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <CircularProgress size={40} sx={{ my: 2 }} />
                      </TableCell>
                    </TableRow>
                  ) : attendanceRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body1" sx={{ py: 2 }}>
                          No attendance records found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    attendanceRecords.map((record) => (
                      <TableRow key={record.attendance_id} hover>
                        <TableCell>{formatDate(record.date)}</TableCell>
                        <TableCell>{record.unique_id}</TableCell>
                        <TableCell>{record.display_name}</TableCell>
                        <TableCell>{formatTime(record.check_in)}</TableCell>
                        <TableCell>{formatTime(record.check_out)}</TableCell>
                        <TableCell>
                          <Chip
                            label={record.status}
                            size="small"
                            sx={{
                              backgroundColor: getStatusColor(record.status),
                              color: "white",
                              fontWeight: "bold",
                              textTransform: "uppercase",
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewDetails(record)}
                          >
                            <InfoIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={totalRecords}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </Paper>
      </Container>

      {/* Attendance Detail Dialog */}
      <Dialog
        open={openDetailDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "primary.main", color: "white" }}>
          Attendance Details
          <IconButton
            onClick={handleCloseDialog}
            sx={{ position: "absolute", right: 8, top: 8, color: "white" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedRecord && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Avatar
                    src={selectedRecord.image || ""}
                    sx={{ width: 64, height: 64, mr: 2 }}
                  />
                  <Box>
                    <Typography variant="h6" component="div">
                      {selectedRecord.display_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ID: {selectedRecord.unique_id}
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Date
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formatDate(selectedRecord.date)}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={selectedRecord.status}
                  size="small"
                  sx={{
                    backgroundColor: getStatusColor(selectedRecord.status),
                    color: "white",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                  }}
                />
              </Grid>

              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Check In Time
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formatTime(selectedRecord.check_in)}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Check Out Time
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formatTime(selectedRecord.check_out) ||
                    "Not checked out yet"}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Hours Worked
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedRecord.check_in && selectedRecord.check_out
                    ? calculateHoursWorked(
                        selectedRecord.check_in,
                        selectedRecord.check_out
                      )
                    : "N/A"}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Helper function to calculate hours worked
const calculateHoursWorked = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return "N/A";
  try {
    const startTime = new Date(checkIn);
    const endTime = new Date(checkOut);
    const diffInMs = endTime - startTime;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    return `${diffInHours.toFixed(2)} hours`;
  } catch (e) {
    return "N/A";
  }
};

export default AttendancePage;
