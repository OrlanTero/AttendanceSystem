# Fingerprint Integration Guide

This guide explains how to integrate the Digital Persona fingerprint scanner with the Attendance Management System.

## Architecture Overview

The integration uses a bridge architecture:

1. **VB.NET Fingerprint API Service**: A Windows service built with Visual Basic .NET that directly interfaces with the Digital Persona SDK.
2. **Express.js API**: A Node.js/Express API that acts as a bridge between the Electron app and the VB.NET service.
3. **Electron Application**: The main application that communicates with the Express.js API.

## Setup Instructions

### 1. Configure the VB.NET Fingerprint API Service

1. Open the FingerprintAPIService solution in Visual Studio.
2. Build and run the service.
3. The service should be configured to run on `http://localhost:5000` by default.

### 2. Configure the Express.js API

The Express.js API is already configured to communicate with the VB.NET service. If you need to change the port or host of the VB.NET service, update the following file:

```javascript
// api/routes/fingerprint.js
const FINGERPRINT_API_HOST = "localhost";
const FINGERPRINT_API_PORT = 5000; // Update this to match your VB.NET service port
```

### 3. Start the Application

1. Start the Express.js API server:
   ```
   npm run api
   ```

2. Start the Electron application:
   ```
   npm start
   ```

3. Alternatively, start both with a single command:
   ```
   npm run start-all
   ```

## Using the Fingerprint Scanner

The application provides two main functionalities:

### Fingerprint Verification

1. Navigate to the Fingerprint Management page.
2. Select the "Verify Fingerprint" tab.
3. Enter the Employee ID.
4. Click "Verify Fingerprint".
5. Place the finger on the scanner when prompted.
6. The system will verify the fingerprint against the stored template for the employee.

### Fingerprint Registration

1. Navigate to the Fingerprint Management page.
2. Select the "Register Fingerprint" tab.
3. Enter the Employee ID.
4. Click "Register Fingerprint".
5. Place the finger on the scanner when prompted.
6. The system will capture and store the fingerprint template for the employee.

## Troubleshooting

### Scanner Not Detected

1. Ensure the Digital Persona scanner is properly connected to the computer.
2. Check that the VB.NET service is running.
3. Verify that the ports configured in the application match the ports used by the VB.NET service.

### Communication Errors

1. Check that both the Express.js API and the VB.NET service are running.
2. Verify network connectivity between the services if they're running on different machines.
3. Check the console logs for any error messages.

## API Endpoints

The following API endpoints are available for fingerprint operations:

- `GET /api/fingerprint/status`: Check if the scanner is connected
- `GET /api/fingerprint/initialize`: Initialize the fingerprint scanner
- `POST /api/fingerprint/capture`: Capture a fingerprint
- `POST /api/fingerprint/verify`: Verify a fingerprint against a stored template
- `POST /api/fingerprint/register`: Register a new fingerprint

## Technical Details

### Data Flow

1. The Electron application sends requests to the Express.js API.
2. The Express.js API forwards these requests to the VB.NET service.
3. The VB.NET service communicates with the Digital Persona SDK.
4. Results flow back through the same path.

### Security Considerations

- The fingerprint data is only transmitted locally between services.
- No raw fingerprint data is stored; only encrypted templates are saved.
- The API should not be exposed to external networks.

## Development Notes

### Adding New Fingerprint Functionality

To add new fingerprint functionality:

1. Implement the feature in the VB.NET service.
2. Add a corresponding endpoint in the Express.js API (`api/routes/fingerprint.js`).
3. Add the necessary IPC handlers in the Electron main process (`src/index.js`).
4. Update the React components to use the new functionality.

### Testing

Always test the fingerprint functionality with actual hardware. The Digital Persona SDK does not provide a simulation mode. 