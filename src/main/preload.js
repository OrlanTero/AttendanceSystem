const { contextBridge, ipcRenderer } = require("electron");

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: {
    send: (channel, data) => {
      ipcRenderer.send(channel, data);
    },
    on: (channel, func) => {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
    removeAllListeners: (channel) => {
      ipcRenderer.removeAllListeners(channel);
    },
  },
  // Expose fingerprint scanner methods through IPC
  fingerprintScanner: {
    checkDevices: async () => {
      try {
        return await ipcRenderer.invoke("fingerprint:checkDevices");
      } catch (error) {
        console.error("Error checking devices:", error);
        throw error;
      }
    },
    startCapture: async () => {
      try {
        return await ipcRenderer.invoke("fingerprint:startCapture");
      } catch (error) {
        console.error("Error starting capture:", error);
        throw error;
      }
    },
    captureSample: async () => {
      try {
        return await ipcRenderer.invoke("fingerprint:captureSample");
      } catch (error) {
        console.error("Error capturing sample:", error);
        throw error;
      }
    },
    stopCapture: async () => {
      try {
        return await ipcRenderer.invoke("fingerprint:stopCapture");
      } catch (error) {
        console.error("Error stopping capture:", error);
        throw error;
      }
    },
  },
});
