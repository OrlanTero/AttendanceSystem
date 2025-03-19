@echo off
echo Starting Electron Application...
npm start
echo Starting API
cd api && node server.js
