const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const { Server } = require("socket.io");
const http = require("http");

const Employee = require("./models/employee");

// Import routes
const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const employeeRoutes = require("./routes/employees");
const departmentRoutes = require("./routes/departments");
const holidayRoutes = require("./routes/holidays");
const fingerprintRoutes = require("./routes/fingerprint");
const testRoutes = require("./routes/test");
const attendanceRoutes = require("./routes/attendance");
const workScheduleRoutes = require("./routes/workSchedule");

// Initialize express app
const app = express();
const socketApp = express();
const server = http.createServer(socketApp);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const PORT = process.env.PORT || 3000;
const SOCKET_PORT = process.env.SOCKET_PORT || 3005;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static files (for uploads)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/test", testRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/fingerprint", fingerprintRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/work-schedule", workScheduleRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Attendance Management System API",
    version: "1.0.0",
    endpoints: [
      "/api/auth/login",
      "/api/auth/test",
      "/api/users",
      "/api/employees",
      "/api/departments",
      "/api/holidays",
      "/api/fingerprint",
      "/api/attendance",
    ],
  });
});

// Handle Socket.IO Connections
io.on("connection", (socket) => {
  console.log("Fingerprint Scanner connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });

  socket.on("BIOMETRIC_CONNECTED", (data) => {
    socket.broadcast.emit("BIOMETRIC_CONNECTED", {
      message: data,
      initiatorId: socket.id,
    });

    socket.on("disconnect", (data) => {
      socket.broadcast.emit("BIOMETRIC_DISCONNECTED", {
        message: data,
        initiatorId: socket.id,
      });
    });
  });

  socket.on("FINGERPRINT_CAPTURE", (data) => {
    socket.broadcast.emit("FINGERPRINT_CAPTURE", {
      message: data,
      initiatorId: socket.id,
    });
  });

  socket.on("VERIFY", (data) => {
    Employee.getAll().then((employees) => {
      socket.broadcast.emit("VERIFY_TEMPLATE", {
        templates: { data: employees, success: true },
        fingerprint: data,
      });
    });
  });

  socket.on("VERIFY_RESULT", (data) => {
    socket.broadcast.emit("VERIFY_RESULT", {
      result: data,
      initiatorId: socket.id,
    });
  });

  socket.on("START", () => {
    // Broadcast to all sockets except the sender
    socket.broadcast.emit("START", {
      message: "Scanner started by another client",
      initiatorId: socket.id,
    });
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  server.listen(SOCKET_PORT, () => {
    console.log(`Socket server running on port ${SOCKET_PORT}`);
  });
}

module.exports = app;
