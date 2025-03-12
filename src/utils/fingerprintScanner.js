const { WebUSB } = require("usb");

class FingerprintScanner {
  constructor() {
    this.device = null;
    this.isCapturing = false;

    // U.are.U 4500 USB device identifiers
    this.VENDOR_IDS = [0x05ba]; // Digital Persona
    this.PRODUCT_IDS = [0x000a, 0x0007, 0x0008]; // Different model variants
  }

  async checkDevices() {
    try {
      console.log("Checking for USB devices...");
      const devices = await WebUSB.getDevices();
      console.log("Available USB devices:", devices);

      // Check if any of the connected devices match our fingerprint scanner
      const fingerprintDevice = devices.find(
        (device) =>
          this.VENDOR_IDS.includes(device.vendorId) &&
          this.PRODUCT_IDS.includes(device.productId)
      );

      if (!fingerprintDevice) {
        throw new Error(
          "Fingerprint scanner not found. Please check connection."
        );
      }

      this.device = fingerprintDevice;
      console.log("Fingerprint scanner found:", this.device);
      return true;
    } catch (error) {
      console.error("Error checking devices:", error);
      throw error;
    }
  }

  async startCapture() {
    try {
      if (!this.device) {
        throw new Error("No fingerprint scanner connected");
      }

      await this.device.open();
      await this.device.selectConfiguration(1);
      await this.device.claimInterface(0);

      this.isCapturing = true;
      console.log("Capture started");
      return true;
    } catch (error) {
      console.error("Error starting capture:", error);
      throw error;
    }
  }

  async captureSample() {
    try {
      if (!this.isCapturing) {
        throw new Error("Capture not started");
      }

      // Send command to capture fingerprint
      const data = new Uint8Array([0x01]); // Example command - adjust based on device protocol
      await this.device.transferOut(1, data);

      // Read fingerprint data
      const result = await this.device.transferIn(1, 64); // Adjust buffer size as needed

      return new Uint8Array(result.data.buffer);
    } catch (error) {
      console.error("Error capturing sample:", error);
      throw error;
    }
  }

  async stopCapture() {
    try {
      if (this.device && this.isCapturing) {
        await this.device.releaseInterface(0);
        await this.device.close();
        this.isCapturing = false;
        console.log("Capture stopped");
      }
    } catch (error) {
      console.error("Error stopping capture:", error);
      throw error;
    }
  }

  cleanup() {
    if (this.isCapturing) {
      this.stopCapture().catch(console.error);
    }
    this.device = null;
  }
}

// Create and export a singleton instance
const scanner = new FingerprintScanner();
module.exports = scanner;
