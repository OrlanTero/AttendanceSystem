const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("node:path");
const isDev = process.env.NODE_ENV === "development";
const { initDatabase, authenticateUser, closeDb } = require("./utils/db");

let mainWindow = null;
let splashWindow = null;

const createSplashWindow = () => {
  // Create the splash window with fixed dimensions
  splashWindow = new BrowserWindow({
    width: 800,
    height: 600,
    transparent: true,
    frame: false,
    resizable: false,
    center: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // Load the splash screen HTML file
  splashWindow.loadFile(path.join(__dirname, "index.html"));

  // Center the splash window
  splashWindow.center();

  // Pass the initial route to the renderer process
  splashWindow.webContents.on("did-finish-load", () => {
    splashWindow.webContents.send("set-initial-route", "/splash");
  });
};

const createMainWindow = () => {
  // Get the primary display dimensions
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // Create the main window with fixed dimensions
  mainWindow = new BrowserWindow({
    width: Math.min(1600, width),
    height: Math.min(1000, height),
    minWidth: 1280,
    minHeight: 800,
    show: false,
    center: true,
    backgroundColor: "#ffffff",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // Center the window
  mainWindow.center();

  // Open the DevTools in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();

    // Load from webpack dev server in development mode
    mainWindow.loadURL("http://localhost:8080");

    // Set up hot reload
    const webpackDevServer = require("webpack-dev-server");
    const webpack = require("webpack");
    const config = require("../webpack.config.js");
    const compiler = webpack(config);

    const server = new webpackDevServer(config.devServer, compiler);

    server.startCallback(() => {
      console.log("Webpack Dev Server running on port 8080");
    });
  } else {
    // Load the local file in production mode
    mainWindow.loadFile(path.join(__dirname, "index.html"));
  }

  // Show main window when it's ready
  mainWindow.once("ready-to-show", () => {
    if (splashWindow) {
      // Close splash window after a delay to ensure smooth transition
      setTimeout(() => {
        splashWindow.close();
        splashWindow = null;
        mainWindow.show();
        mainWindow.maximize(); // Maximize the window on first show
      }, 2000); // 2 seconds delay
    } else {
      mainWindow.show();
      mainWindow.maximize(); // Maximize the window on first show
    }
  });

  // Handle window state
  mainWindow.on("maximize", () => {
    mainWindow.webContents.send("window-state-change", { isMaximized: true });
  });

  mainWindow.on("unmaximize", () => {
    mainWindow.webContents.send("window-state-change", { isMaximized: false });
  });
};

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createSplashWindow();

  // Create main window after a delay to show splash screen
  setTimeout(() => {
    createMainWindow();
  }, 2000); // 2 seconds delay

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });

  // Initialize the database when the app starts
  initDatabase();
});

// Quit when all windows are closed, except on macOS.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// IPC handlers for login
ipcMain.on("login", async (event, { username, password }) => {
  try {
    // Use the database for authentication
    const result = await authenticateUser(username, password);
    event.reply("login-response", result);
  } catch (error) {
    console.error("Login error:", error);
    event.reply("login-response", {
      success: false,
      message: "Authentication error",
    });
  }
});

// Close the database when the app is about to quit
app.on("will-quit", async () => {
  try {
    await closeDb();
  } catch (error) {
    console.error("Error closing database:", error);
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
