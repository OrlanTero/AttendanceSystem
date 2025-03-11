import React, { useState, useEffect } from "react";
import * as api from "../utils/api";
import Navbar from "../components/Navbar";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material";
import {
  People,
  CheckCircle,
  Cancel,
  AccessTime,
  TrendingUp,
} from "@mui/icons-material";

const MainPage = ({ user, onLogout }) => {
  const [users, setUsers] = useState([]);
  const [apiAvailable, setApiAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check API connection and fetch users if available
    const checkApiAndFetchUsers = async () => {
      try {
        setIsLoading(true);
        const connectionResult = await api.testConnection();
        setApiAvailable(connectionResult.success);

        if (connectionResult.success) {
          const usersResult = await api.getUsers();
          if (usersResult.success && usersResult.data) {
            setUsers(usersResult.data);
          }
        }
      } catch (error) {
        console.error("API error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkApiAndFetchUsers();
  }, []);

  const stats = [
    {
      title: "Total Employees",
      value: users.length || 42,
      icon: <People fontSize="large" />,
      color: "#4caf50",
      bgColor: "#e8f5e9",
    },
    {
      title: "Present Today",
      value: 38,
      icon: <CheckCircle fontSize="large" />,
      color: "#2196f3",
      bgColor: "#e3f2fd",
    },
    {
      title: "Absent Today",
      value: 4,
      icon: <Cancel fontSize="large" />,
      color: "#f44336",
      bgColor: "#ffebee",
    },
    {
      title: "Late Today",
      value: 2,
      icon: <AccessTime fontSize="large" />,
      color: "#ff9800",
      bgColor: "#fff3e0",
    },
  ];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pt: 8 }}>
      <Navbar user={user} onLogout={onLogout} />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: "bold" }}>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome to your attendance management dashboard. Here's an overview
            of today's attendance statistics.
          </Typography>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: "100%",
                  borderRadius: 2,
                  bgcolor: stat.bgColor,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: stat.color,
                      width: 52,
                      height: 52,
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Box>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: "bold", color: stat.color }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {apiAvailable && users.length > 0 && (
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 3,
              }}
            >
              <TrendingUp color="primary" />
              <Typography variant="h6">Recent Activity</Typography>
            </Box>

            <List>
              {users.slice(0, 5).map((user) => (
                <ListItem
                  key={user.user_id}
                  sx={{
                    bgcolor: "background.default",
                    mb: 1,
                    borderRadius: 1,
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "primary.main" }}>
                      {user.display_name
                        ? user.display_name[0].toUpperCase()
                        : "U"}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.display_name || user.username}
                    secondary={`Logged in at ${new Date().toLocaleTimeString()}`}
                  />
                  <ListItemSecondaryAction>
                    <Chip
                      label="On Time"
                      color="success"
                      size="small"
                      sx={{ borderRadius: 1 }}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default MainPage;
