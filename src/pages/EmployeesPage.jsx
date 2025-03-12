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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  InputAdornment,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  PhotoCamera as PhotoCameraIcon,
  Fingerprint as FingerprintIcon,
} from "@mui/icons-material";
import FingerprintScanner from "../components/FingerprintScanner";

const EmployeesPage = ({ user, onLogout }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [formData, setFormData] = useState({
    unique_id: "",
    department_id: "",
    lastname: "",
    firstname: "",
    middlename: "",
    display_name: "",
    age: "",
    gender: "",
    biometric_data: "",
    image: null,
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [openFingerprintDialog, setOpenFingerprintDialog] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, [searchTerm]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const result = await api.getEmployees(searchTerm);
      if (result.success) {
        setEmployees(result.data || []);
      } else {
        setError("Failed to fetch employees");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      setError("Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEmployees();
  };

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file") {
      const file = files[0];
      setFormData({
        ...formData,
        [name]: file,
      });

      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewImage(null);
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      unique_id: "",
      department_id: "",
      lastname: "",
      firstname: "",
      middlename: "",
      display_name: "",
      age: "",
      gender: "",
      biometric_data: "",
      image: null,
    });
    setPreviewImage(null);
    setCurrentEmployee(null);
  };

  const handleAddNew = () => {
    resetForm();
    setOpenDialog(true);
  };

  const handleEdit = async (employeeId) => {
    try {
      setLoading(true);
      const result = await api.getEmployee(employeeId);

      if (result.success && result.data) {
        const employee = result.data;
        setFormData({
          unique_id: employee.unique_id || "",
          department_id: employee.department_id || "",
          lastname: employee.lastname || "",
          firstname: employee.firstname || "",
          middlename: employee.middlename || "",
          display_name: employee.display_name || "",
          age: employee.age || "",
          gender: employee.gender || "",
          biometric_data: employee.biometric_data || "",
          image: null,
        });
        setCurrentEmployee(employee);
        if (employee.image) {
          setPreviewImage(`/uploads/${employee.image.split("/").pop()}`);
        }
        setOpenDialog(true);
      } else {
        setError("Failed to fetch employee details");
      }
    } catch (error) {
      console.error("Error fetching employee details:", error);
      setError("Failed to fetch employee details");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (employeeId) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) {
      return;
    }

    try {
      setLoading(true);
      const result = await api.deleteEmployee(employeeId);
      if (result.success) {
        fetchEmployees();
      } else {
        setError("Failed to delete employee");
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      setError("Failed to delete employee");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      let result;

      if (currentEmployee) {
        result = await api.updateEmployee(
          currentEmployee.employee_id,
          formData
        );
      } else {
        result = await api.createEmployee(formData);
      }

      if (result.success) {
        resetForm();
        setOpenDialog(false);
        fetchEmployees();
      } else {
        setError(result.message || "Failed to save employee");
      }
    } catch (error) {
      console.error("Error saving employee:", error);
      setError("Failed to save employee");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpenDialog(false);
    resetForm();
  };

  const handleFingerprintCapture = (biometricData) => {
    setFormData((prev) => ({
      ...prev,
      biometric_data: biometricData,
    }));
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pt: 8 }}>
      <Navbar user={user} onLogout={onLogout} />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: "bold" }}>
            Employees Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your employee records, add new employees, and update existing
            information.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 3 }} elevation={0}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <form onSubmit={handleSearch} style={{ flex: 1, marginRight: 16 }}>
              <TextField
                fullWidth
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </form>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddNew}
            >
              Add New Employee
            </Button>
          </Box>

          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                py: 8,
              }}
            >
              <CircularProgress />
            </Box>
          ) : employees.length === 0 ? (
            <Box
              sx={{
                textAlign: "center",
                py: 8,
                bgcolor: "background.default",
                borderRadius: 1,
              }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No employees found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add a new employee to get started
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Photo</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Gender</TableCell>
                    <TableCell>Age</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.employee_id}>
                      <TableCell>{employee.unique_id}</TableCell>
                      <TableCell>
                        <Avatar
                          src={
                            employee.image
                              ? `/uploads/${employee.image.split("/").pop()}`
                              : undefined
                          }
                          alt={employee.display_name}
                        >
                          {employee.display_name?.[0]}
                        </Avatar>
                      </TableCell>
                      <TableCell>{employee.display_name}</TableCell>
                      <TableCell>
                        {employee.department_id || (
                          <Chip
                            label="Not Assigned"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell>{employee.gender || "N/A"}</TableCell>
                      <TableCell>{employee.age || "N/A"}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(employee.employee_id)}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(employee.employee_id)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Container>

      <Dialog
        open={openDialog}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">
              {currentEmployee ? "Edit Employee" : "Add New Employee"}
            </Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Employee ID"
                  name="unique_id"
                  value={formData.unique_id}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Department ID"
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  required
                  label="Last Name"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  required
                  label="First Name"
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Middle Name"
                  name="middlename"
                  value={formData.middlename}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Display Name"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleInputChange}
                  helperText="Generated from first and last name if empty"
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Age"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    label="Gender"
                  >
                    <MenuItem value="">Select Gender</MenuItem>
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<FingerprintIcon />}
                    onClick={() => setOpenFingerprintDialog(true)}
                  >
                    {formData.biometric_data
                      ? "Update Fingerprint"
                      : "Capture Fingerprint"}
                  </Button>
                  {formData.biometric_data && (
                    <Typography variant="body2" color="success.main">
                      Fingerprint data captured
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                    p: 3,
                    border: "2px dashed",
                    borderColor: "divider",
                    borderRadius: 1,
                  }}
                >
                  {previewImage ? (
                    <Box
                      sx={{
                        position: "relative",
                        width: 200,
                        height: 200,
                      }}
                    >
                      <img
                        src={previewImage}
                        alt="Preview"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: 8,
                        }}
                      />
                      <IconButton
                        sx={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          bgcolor: "background.paper",
                        }}
                        size="small"
                        onClick={() => {
                          setPreviewImage(null);
                          setFormData({ ...formData, image: null });
                        }}
                      >
                        <CloseIcon />
                      </IconButton>
                    </Box>
                  ) : (
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<PhotoCameraIcon />}
                    >
                      Choose Image
                      <input
                        type="file"
                        hidden
                        name="image"
                        onChange={handleInputChange}
                        accept="image/jpeg,image/png,image/jpg"
                      />
                    </Button>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    Supported formats: JPG, JPEG, PNG
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={
                loading && <CircularProgress size={20} color="inherit" />
              }
            >
              {currentEmployee ? "Update" : "Save"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <FingerprintScanner
        open={openFingerprintDialog}
        onClose={() => setOpenFingerprintDialog(false)}
        onCapture={handleFingerprintCapture}
      />
    </Box>
  );
};

export default EmployeesPage;
