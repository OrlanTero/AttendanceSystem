const db = require("../database");

class Holiday {
  // Get all holidays
  static async getAll() {
    try {
      console.log("Holiday.getAll() called");
      const holidays = await db.getAllHolidays();
      console.log("Holidays from database:", holidays);
      return holidays;
    } catch (error) {
      console.error("Error getting all holidays:", error);
      return [];
    }
  }

  // Get holiday by ID
  static async getById(holidayId) {
    try {
      return await db.getHolidayById(holidayId);
    } catch (error) {
      console.error("Error getting holiday by ID:", error);
      return null;
    }
  }

  // Create a new holiday
  static async create(holidayData) {
    try {
      // Validate required fields
      const { name, date } = holidayData;

      if (!name || !date) {
        return {
          success: false,
          message: "Holiday name and date are required",
        };
      }

      // Validate date format
      if (!this.isValidDate(date)) {
        return {
          success: false,
          message: "Invalid date format. Please use YYYY-MM-DD format.",
        };
      }

      return await db.createHoliday(holidayData);
    } catch (error) {
      console.error("Error creating holiday:", error);
      return { success: false, message: error.message };
    }
  }

  // Update holiday
  static async update(holidayId, holidayData) {
    try {
      // Get the existing holiday to merge with updates
      const existingHoliday = await this.getById(holidayId);

      if (!existingHoliday) {
        return { success: false, message: "Holiday not found" };
      }

      // Validate required fields
      const { name, date } = holidayData;
      if (!name || !date) {
        return {
          success: false,
          message: "Holiday name and date are required",
        };
      }

      // Validate date format
      if (!this.isValidDate(date)) {
        return {
          success: false,
          message: "Invalid date format. Please use YYYY-MM-DD format.",
        };
      }

      return await db.updateHoliday(holidayId, holidayData);
    } catch (error) {
      console.error("Error updating holiday:", error);
      return { success: false, message: error.message };
    }
  }

  // Delete holiday
  static async delete(holidayId) {
    try {
      return await db.deleteHoliday(holidayId);
    } catch (error) {
      console.error("Error deleting holiday:", error);
      return { success: false, message: error.message };
    }
  }

  // Search holidays
  static async search(searchTerm) {
    try {
      console.log("Holiday.search() called with term:", searchTerm);
      if (!searchTerm || searchTerm.trim() === "") {
        return await this.getAll();
      }

      const holidays = await db.getAllHolidays(searchTerm);
      console.log("Holidays from search:", holidays);
      return holidays;
    } catch (error) {
      console.error("Error searching holidays:", error);
      return [];
    }
  }

  // Helper method to validate date format (YYYY-MM-DD)
  static isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }
}

module.exports = Holiday;
