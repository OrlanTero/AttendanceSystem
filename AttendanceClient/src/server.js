const http = require("http");
const { Server } = require("socket.io");
const express = require("express");
const application = express();
const server = http.createServer(application);
const PORT = 3005;
const api = require("./utils/api");

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
