import React, { useState, useEffect } from "react";
import * as api from "../utils/api";
import Navbar from "../components/Navbar";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut, Line, Pie } from "react-chartjs-2";
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
  Button,
  Card,
  CardContent,
  CardActions,
  Tab,
  Tabs,
  CircularProgress,
} from "@mui/material";
import {
  People,
  CheckCircle,
  Cancel,
  AccessTime,
  TrendingUp,
  EventNote,
  Work,
  CalendarMonth,
  Group,
  Description,
  BarChart,
  DonutLarge,
  ShowChart,
  PieChart,
} from "@mui/icons-material";
import { format, subDays, parseISO, startOfMonth, endOfMonth } from "date-fns";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const MainPage = ({ user, onLogout, onNavigate }) => {
  const [users, setUsers] = useState([]);
  const [apiAvailable, setApiAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [chartTab, setChartTab] = useState(0);
  const [monthlyData, setMonthlyData] = useState({});
  const [weeklyData, setWeeklyData] = useState({});
  const [deptData, setDeptData] = useState({});
  const [dailyStats, setDailyStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    total: 0,
  });
  const [chartLoading, setChartLoading] = useState(false);
  const [summaryData, setSummaryData] = useState({});

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

          // Fetch departments
          const deptsResult = await api.getDepartments();
          setDepartments(deptsResult);

          // Fetch attendance data
          await fetchAttendanceData();
        }
      } catch (error) {
        console.error("API error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkApiAndFetchUsers();
  }, []);

  // Fetch attendance data for charts
  const fetchAttendanceData = async () => {
    setChartLoading(true);
    try {
      // Get current date and date from 30 days ago
      const today = new Date();
      const endDate = format(today, "yyyy-MM-dd");

      // Monthly data (current month)
      const startOfCurrentMonth = format(startOfMonth(today), "yyyy-MM-dd");
      const endOfCurrentMonth = format(endOfMonth(today), "yyyy-MM-dd");

      // Weekly data (last 7 days)
      const startOfWeek = format(subDays(today, 6), "yyyy-MM-dd");

      // Get today's stats
      const todayData = await api.getAttendanceByDate(endDate);
      processCurrentDayStats(todayData);

      // Get monthly data
      const monthlyResult = await api.getAttendanceReport(
        startOfCurrentMonth,
        endOfCurrentMonth
      );
      if (monthlyResult.success) {
        processMonthlyData(monthlyResult.data);
        processSummaryData(monthlyResult.data);
      }

      // Get weekly data
      const weeklyResult = await api.getAttendanceReport(startOfWeek, endDate);
      if (weeklyResult.success) {
        processWeeklyData(weeklyResult.data);
      }

      // Get department data
      processDepartmentData(monthlyResult.data || []);
    } catch (error) {
      console.error("Error fetching attendance data for charts:", error);
    } finally {
      setChartLoading(false);
    }
  };

  // Process today's stats
  const processCurrentDayStats = (data) => {
    if (!Array.isArray(data)) return;

    const present = data.filter((record) => record.status === "present").length;
    const late = data.filter((record) => record.status === "late").length;
    const total = data.length;

    setDailyStats({
      present,
      late,
      absent: total > 0 ? total - (present + late) : 0,
      total,
    });
  };

  // Process monthly data for the trend chart
  const processMonthlyData = (data) => {
    if (!Array.isArray(data)) return;

    // Group by date
    const groupedByDate = data.reduce((acc, record) => {
      const date = record.date.split("T")[0];
      if (!acc[date]) {
        acc[date] = { present: 0, late: 0, absent: 0, total: 0 };
      }

      if (record.status === "present") acc[date].present++;
      else if (record.status === "late") acc[date].late++;
      else acc[date].absent++;

      acc[date].total++;
      return acc;
    }, {});

    // Convert to format for chart
    const sortedDates = Object.keys(groupedByDate).sort();

    const chartData = {
      labels: sortedDates.map((date) => format(parseISO(date), "MMM dd")),
      datasets: [
        {
          label: "Present",
          data: sortedDates.map((date) => groupedByDate[date].present),
          borderColor: "#4caf50",
          backgroundColor: "rgba(76, 175, 80, 0.5)",
          tension: 0.3,
        },
        {
          label: "Late",
          data: sortedDates.map((date) => groupedByDate[date].late),
          borderColor: "#ff9800",
          backgroundColor: "rgba(255, 152, 0, 0.5)",
          tension: 0.3,
        },
        {
          label: "Absent",
          data: sortedDates.map((date) => groupedByDate[date].absent),
          borderColor: "#f44336",
          backgroundColor: "rgba(244, 67, 54, 0.5)",
          tension: 0.3,
        },
      ],
    };

    setMonthlyData(chartData);
  };

  // Process weekly data for the bar chart
  const processWeeklyData = (data) => {
    if (!Array.isArray(data)) return;

    // Get last 7 days
    const today = new Date();
    const last7Days = Array(7)
      .fill()
      .map((_, i) => {
        const date = subDays(today, 6 - i);
        return format(date, "yyyy-MM-dd");
      });

    // Initialize counts for each day
    const dailyCounts = last7Days.reduce((acc, date) => {
      acc[date] = { present: 0, late: 0, absent: 0 };
      return acc;
    }, {});

    // Fill in actual data
    data.forEach((record) => {
      const recordDate = record.date.split("T")[0];
      if (dailyCounts[recordDate]) {
        if (record.status === "present") dailyCounts[recordDate].present++;
        else if (record.status === "late") dailyCounts[recordDate].late++;
        else dailyCounts[recordDate].absent++;
      }
    });

    // Create chart data
    const chartData = {
      labels: last7Days.map((date) => format(parseISO(date), "EEE dd")),
      datasets: [
        {
          label: "Present",
          data: last7Days.map((date) => dailyCounts[date].present),
          backgroundColor: "rgba(76, 175, 80, 0.7)",
        },
        {
          label: "Late",
          data: last7Days.map((date) => dailyCounts[date].late),
          backgroundColor: "rgba(255, 152, 0, 0.7)",
        },
        {
          label: "Absent",
          data: last7Days.map((date) => dailyCounts[date].absent),
          backgroundColor: "rgba(244, 67, 54, 0.7)",
        },
      ],
    };

    setWeeklyData(chartData);
  };

  // Process department data for the doughnut chart
  const processDepartmentData = (data) => {
    if (!Array.isArray(data) || departments.length === 0) return;

    // Initialize department counts
    const deptCounts = departments.reduce((acc, dept) => {
      acc[dept.name] = 0;
      return acc;
    }, {});

    // Add unknown/unassigned department in case some records don't have department info
    deptCounts["Unassigned"] = 0;

    // Count attendance by department using employee's department
    const processedRecords = 0;

    // Try to fetch employees if we need department data
    Promise.all(
      [...new Set(data.map((record) => record.employee_id))]
        .filter((id) => id)
        .map((id) => api.getEmployee(id))
    )
      .then((employeeResults) => {
        // Create employee to department lookup
        const employeeDeptMap = {};
        employeeResults.forEach((result) => {
          if (result && result.department_id) {
            employeeDeptMap[result.employee_id] = result.department_id;
          }
        });

        // Count attendance by department
        data.forEach((record) => {
          if (!record.employee_id) {
            deptCounts["Unassigned"]++;
            return;
          }

          const deptId = employeeDeptMap[record.employee_id];
          if (!deptId) {
            deptCounts["Unassigned"]++;
            return;
          }

          // Find department name from id
          const dept = departments.find((d) => d.department_id === deptId);
          if (dept) {
            deptCounts[dept.name] = (deptCounts[dept.name] || 0) + 1;
          } else {
            deptCounts["Unassigned"]++;
          }
        });

        // Remove departments with no attendance records
        Object.keys(deptCounts).forEach((key) => {
          if (deptCounts[key] === 0) {
            delete deptCounts[key];
          }
        });

        // Generate colors
        const backgroundColors = [
          "#4caf50",
          "#2196f3",
          "#9c27b0",
          "#ff9800",
          "#f44336",
          "#009688",
          "#673ab7",
          "#3f51b5",
          "#e91e63",
          "#ffc107",
        ];

        // Create chart data
        const chartData = {
          labels: Object.keys(deptCounts),
          datasets: [
            {
              data: Object.values(deptCounts),
              backgroundColor: backgroundColors.slice(
                0,
                Object.keys(deptCounts).length
              ),
              borderWidth: 1,
            },
          ],
        };

        setDeptData(chartData);
      })
      .catch((error) => {
        console.error("Error processing department data:", error);

        // Fallback to a simple dataset if error occurs
        const chartData = {
          labels: ["No Department Data Available"],
          datasets: [
            {
              data: [1],
              backgroundColor: ["#9e9e9e"],
              borderWidth: 1,
            },
          ],
        };

        setDeptData(chartData);
      });
  };

  // Process attendance data for overall summary pie chart
  const processSummaryData = (data) => {
    if (!Array.isArray(data)) return;

    // Count by status
    const statusCounts = {
      present: 0,
      late: 0,
      absent: 0,
      other: 0,
    };

    data.forEach((record) => {
      if (record.status === "present") statusCounts.present++;
      else if (record.status === "late") statusCounts.late++;
      else if (record.status === "absent") statusCounts.absent++;
      else statusCounts.other++;
    });

    // Create chart data
    const chartData = {
      labels: ["Present", "Late", "Absent", "Other"],
      datasets: [
        {
          data: [
            statusCounts.present,
            statusCounts.late,
            statusCounts.absent,
            statusCounts.other > 0 ? statusCounts.other : 0, // Only include if there are entries
          ],
          backgroundColor: [
            "rgba(76, 175, 80, 0.8)",
            "rgba(255, 152, 0, 0.8)",
            "rgba(244, 67, 54, 0.8)",
            "rgba(158, 158, 158, 0.8)",
          ],
          borderColor: [
            "rgb(76, 175, 80)",
            "rgb(255, 152, 0)",
            "rgb(244, 67, 54)",
            "rgb(158, 158, 158)",
          ],
          borderWidth: 1,
        },
      ],
    };

    // Remove "Other" if count is 0
    if (statusCounts.other === 0) {
      chartData.labels.pop();
      chartData.datasets[0].data.pop();
      chartData.datasets[0].backgroundColor.pop();
      chartData.datasets[0].borderColor.pop();
    }

    setSummaryData(chartData);
  };

  const handleChartTabChange = (event, newValue) => {
    setChartTab(newValue);
  };

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
      value: dailyStats.present,
      icon: <CheckCircle fontSize="large" />,
      color: "#2196f3",
      bgColor: "#e3f2fd",
    },
    {
      title: "Absent Today",
      value: dailyStats.absent,
      icon: <Cancel fontSize="large" />,
      color: "#f44336",
      bgColor: "#ffebee",
    },
    {
      title: "Late Today",
      value: dailyStats.late,
      icon: <AccessTime fontSize="large" />,
      color: "#ff9800",
      bgColor: "#fff3e0",
    },
  ];

  const navigationCards = [
    {
      title: "Employee Management",
      description: "Add, edit, or remove employees from the system",
      icon: <People fontSize="large" color="primary" />,
      action: () => onNavigate("employees"),
      color: "#2196f3",
    },
    {
      title: "Department Management",
      description: "Manage departments and organizational structure",
      icon: <Group fontSize="large" color="primary" />,
      action: () => onNavigate("departments"),
      color: "#4caf50",
    },
    {
      title: "Attendance Records",
      description: "View and manage detailed attendance history",
      icon: <EventNote fontSize="large" color="primary" />,
      action: () => onNavigate("attendance"),
      color: "#9c27b0",
    },
    {
      title: "Holiday Management",
      description: "Set up holidays and special non-working days",
      icon: <CalendarMonth fontSize="large" color="primary" />,
      action: () => onNavigate("holidays"),
      color: "#ff9800",
    },
    {
      title: "Attendance Reports",
      description: "Generate and export detailed attendance reports",
      icon: <Description fontSize="large" color="primary" />,
      action: () => onNavigate("reports"),
      color: "#e91e63",
    },
  ];

  // Chart options
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Monthly Attendance Trends",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Weekly Attendance Summary",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
      },
      title: {
        display: true,
        text: "Attendance by Department",
      },
    },
  };

  // Add pie chart options
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
      },
      title: {
        display: true,
        text: "Overall Attendance Summary",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.formattedValue || "";
            const total = context.dataset.data.reduce(
              (acc, val) => acc + val,
              0
            );
            const percentage = Math.round((context.raw / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

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

        <Grid container spacing={3} sx={{ mb: 6 }}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  height: "100%",
                }}
              >
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    mb: 2,
                    bgcolor: stat.bgColor,
                    color: stat.color,
                  }}
                >
                  {stat.icon}
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: "bold", mb: 1 }}>
                  {stat.value}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {stat.title}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Charts Section */}
        <Paper sx={{ p: 3, mb: 6 }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
            <Tabs
              value={chartTab}
              onChange={handleChartTabChange}
              aria-label="attendance charts tabs"
            >
              <Tab icon={<BarChart />} label="Weekly" />
              <Tab icon={<ShowChart />} label="Monthly Trends" />
              <Tab icon={<DonutLarge />} label="By Department" />
              <Tab icon={<PieChart />} label="Summary" />
            </Tabs>
          </Box>

          <Box sx={{ height: 400, position: "relative" }}>
            {chartLoading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <CircularProgress />
              </Box>
            ) : (
              <>
                {chartTab === 0 && Object.keys(weeklyData).length > 0 && (
                  <Bar options={barOptions} data={weeklyData} />
                )}
                {chartTab === 1 && Object.keys(monthlyData).length > 0 && (
                  <Line options={lineOptions} data={monthlyData} />
                )}
                {chartTab === 2 && Object.keys(deptData).length > 0 && (
                  <Box
                    sx={{
                      height: "100%",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <Box sx={{ width: "70%", height: "100%" }}>
                      <Doughnut options={doughnutOptions} data={deptData} />
                    </Box>
                  </Box>
                )}
                {chartTab === 3 && Object.keys(summaryData).length > 0 && (
                  <Box
                    sx={{
                      height: "100%",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <Box sx={{ width: "60%", height: "100%" }}>
                      <Pie options={pieOptions} data={summaryData} />
                    </Box>
                  </Box>
                )}
                {((chartTab === 0 && Object.keys(weeklyData).length === 0) ||
                  (chartTab === 1 && Object.keys(monthlyData).length === 0) ||
                  (chartTab === 2 && Object.keys(deptData).length === 0) ||
                  (chartTab === 3 &&
                    Object.keys(summaryData).length === 0)) && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100%",
                    }}
                  >
                    <Typography variant="body1" color="text.secondary">
                      No data available for the selected chart.
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Paper>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
            Quick Access
          </Typography>
          <Grid container spacing={3}>
            {navigationCards.map((card, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  elevation={2}
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "translateY(-5px)",
                      boxShadow: 6,
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        mb: 2,
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 50,
                          height: 50,
                          bgcolor: `${card.color}20`,
                          color: card.color,
                        }}
                      >
                        {card.icon}
                      </Avatar>
                    </Box>
                    <Typography variant="h6" align="center" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      align="center"
                    >
                      {card.description}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "center", pb: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={card.action}
                      sx={{ borderColor: card.color, color: card.color }}
                    >
                      Go to {card.title}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {apiAvailable && users.length > 0 && (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Recent Users
            </Typography>
            <List>
              {users.slice(0, 5).map((user) => (
                <ListItem key={user.user_id}>
                  <ListItemAvatar>
                    <Avatar>{user.display_name.charAt(0)}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.display_name}
                    secondary={`Username: ${user.username}`}
                  />
                  <ListItemSecondaryAction>
                    <Chip
                      size="small"
                      label={new Date(user.date_created).toLocaleDateString()}
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
