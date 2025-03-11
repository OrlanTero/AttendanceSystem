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

const HolidaysPage = ({ user, onLogout }) => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [currentHoliday, setCurrentHoliday] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    date: "",
  });

  useEffect(() => {
    fetchHolidays();
  }, [searchTerm]);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const result = await api.getHolidays(searchTerm);
      console.log("Holidays result:", result);
      setHolidays(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("Error fetching holidays:", error);
      setError("Failed to fetch holidays");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchHolidays();
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
      date: "",
    });
    setCurrentHoliday(null);
  };

  const handleAddNew = () => {
    resetForm();
    setOpenDialog(true);
  };

  const handleEdit = async (holidayId) => {
    try {
      setLoading(true);
      const holiday = await api.getHoliday(holidayId);
      if (holiday) {
        setFormData({
          name: holiday.name || "",
          date: holiday.date || "",
        });
        setCurrentHoliday(holiday);
        setOpenDialog(true);
      } else {
        setError("Failed to fetch holiday details");
      }
    } catch (error) {
      console.error("Error fetching holiday details:", error);
      setError("Failed to fetch holiday details");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (holidayId) => {
    if (!window.confirm("Are you sure you want to delete this holiday?")) {
      return;
    }

    try {
      setLoading(true);
      const result = await api.deleteHoliday(holidayId);
      if (result.success) {
        fetchHolidays();
      } else {
        setError("Failed to delete holiday");
      }
    } catch (error) {
      console.error("Error deleting holiday:", error);
      setError("Failed to delete holiday");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      let result;

      if (currentHoliday) {
        result = await api.updateHoliday(currentHoliday.holiday_id, formData);
      } else {
        result = await api.createHoliday(formData);
      }

      if (result.success) {
        resetForm();
        setOpenDialog(false);
        fetchHolidays();
      } else {
        setError(result.message || "Failed to save holiday");
      }
    } catch (error) {
      console.error("Error saving holiday:", error);
      setError("Failed to save holiday");
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
            Holidays Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your holidays and special events calendar.
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
                placeholder="Search holidays..."
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
              Add New Holiday
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
          ) : holidays.length === 0 ? (
            <Box
              sx={{
                textAlign: "center",
                py: 8,
                bgcolor: "background.default",
                borderRadius: 1,
              }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No holidays found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add a new holiday to get started
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Holiday</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Date Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {holidays.map((holiday) => (
                    <TableRow key={holiday.holiday_id}>
                      <TableCell>{holiday.holiday_id}</TableCell>
                      <TableCell>{holiday.name}</TableCell>
                      <TableCell>{holiday.date}</TableCell>
                      <TableCell>
                        {new Date(holiday.date_created).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(holiday.holiday_id)}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(holiday.holiday_id)}
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
              {currentHoliday ? "Edit Holiday" : "Add New Holiday"}
            </Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Holiday Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
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
              {currentHoliday ? "Update" : "Save"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default HolidaysPage;
