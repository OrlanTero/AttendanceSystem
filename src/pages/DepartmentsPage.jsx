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
  InputAdornment,
  Grid,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

const DepartmentsPage = ({ user, onLogout }) => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [currentDepartment, setCurrentDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    department_head: "",
  });

  useEffect(() => {
    fetchDepartments();
  }, [searchTerm]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const result = await api.getDepartments(searchTerm);
      console.log(result);
      setDepartments(result || []);
    } catch (error) {
      console.error("Error fetching departments:", error);
      setError("Failed to fetch departments");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDepartments();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      department_head: "",
    });
    setCurrentDepartment(null);
  };

  const handleAddNew = () => {
    resetForm();
    setOpenDialog(true);
  };

  const handleEdit = async (departmentId) => {
    try {
      setLoading(true);
      const department = await api.getDepartment(departmentId);
      console.log(department);
      if (department) {
        setFormData({
          name: department.name || "",
          department_head: department.department_head || "",
        });
        setCurrentDepartment(department);
        setOpenDialog(true);
      } else {
        setError("Failed to fetch department details");
      }
    } catch (error) {
      console.error("Error fetching department details:", error);
      setError("Failed to fetch department details");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (departmentId) => {
    if (!window.confirm("Are you sure you want to delete this department?")) {
      return;
    }

    try {
      setLoading(true);
      await api.deleteDepartment(departmentId);
      fetchDepartments();
    } catch (error) {
      console.error("Error deleting department:", error);
      setError("Failed to delete department");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      let result;

      if (currentDepartment) {
        result = await api.updateDepartment(
          currentDepartment.department_id,
          formData
        );
      } else {
        result = await api.createDepartment(formData);
      }

      resetForm();
      setOpenDialog(false);
      fetchDepartments();
    } catch (error) {
      console.error("Error saving department:", error);
      setError("Failed to save department");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpenDialog(false);
    resetForm();
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pt: 8 }}>
      <Navbar user={user} onLogout={onLogout} />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: "bold" }}>
            Departments Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your departments and assign department heads.
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
                placeholder="Search departments..."
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
              Add New Department
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
          ) : departments.length === 0 ? (
            <Box
              sx={{
                textAlign: "center",
                py: 8,
                bgcolor: "background.default",
                borderRadius: 1,
              }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No departments found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add a new department to get started
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Department Head</TableCell>
                    <TableCell>Date Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {departments.map((department) => (
                    <TableRow key={department.department_id}>
                      <TableCell>{department.department_id}</TableCell>
                      <TableCell>{department.name}</TableCell>
                      <TableCell>{department.department_head}</TableCell>
                      <TableCell>
                        {new Date(department.date_created).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(department.department_id)}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(department.department_id)}
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
        maxWidth="sm"
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
              {currentDepartment ? "Edit Department" : "Add New Department"}
            </Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Department Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Department Head"
                  name="department_head"
                  value={formData.department_head}
                  onChange={handleInputChange}
                  required
                />
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
              {currentDepartment ? "Update" : "Save"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default DepartmentsPage;
