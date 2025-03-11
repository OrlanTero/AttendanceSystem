const { spawn } = require("child_process");
const path = require("path");

// Start the API server
const apiServer = spawn("node", [path.join(__dirname, "start-server.js")], {
  stdio: "inherit",
  shell: true,
});

console.log("API server started on port 3000");

// Wait for the API server to start
setTimeout(() => {
  // Start the Electron app
  const electronApp = spawn("npm", ["start"], {
    stdio: "inherit",
    shell: true,
    cwd: path.resolve(__dirname, ".."),
  });

  console.log("Electron app started");

  // Handle process termination
  process.on("SIGINT", () => {
    console.log("Shutting down...");
    apiServer.kill();
    electronApp.kill();
    process.exit(0);
  });
}, 2000);

console.log("Starting both API server and Electron app...");
