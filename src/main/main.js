const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const isDev = process.env.NODE_ENV === "development";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

let mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Load the entry point
  if (isDev) {
    mainWindow.loadURL("http://localhost:3001");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../build/index.html"));
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Set up IPC handlers for fingerprint scanner
const fingerprintScanner = require("./utils/fingerprintScanner");

// Handle fingerprint scanner IPC events
ipcMain.handle("fingerprint:checkDevices", async () => {
  try {
    return await fingerprintScanner.checkDevices();
  } catch (error) {
    console.error("Error checking devices:", error);
    throw error;
  }
});

ipcMain.handle("fingerprint:startCapture", async () => {
  try {
    return await fingerprintScanner.startCapture();
  } catch (error) {
    console.error("Error starting capture:", error);
    throw error;
  }
});

ipcMain.handle("fingerprint:captureSample", async () => {
  try {
    return await fingerprintScanner.captureSample();
  } catch (error) {
    console.error("Error capturing sample:", error);
    throw error;
  }
});

ipcMain.handle("fingerprint:stopCapture", async () => {
  try {
    return await fingerprintScanner.stopCapture();
  } catch (error) {
    console.error("Error stopping capture:", error);
    throw error;
  }
});

// Clean up fingerprint scanner when app is quitting
app.on("before-quit", () => {
  if (fingerprintScanner) {
    fingerprintScanner.cleanup();
  }
});
