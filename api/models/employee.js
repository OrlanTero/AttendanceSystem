const db = require("../database");

class Employee {
  // Get all employees
  static async getAll() {
    try {
      return await db.getAllEmployees();
    } catch (error) {
      console.error("Error getting all employees:", error);
      return [];
    }
  }

  // Get employee by ID
  static async getById(employeeId) {
    try {
      return await db.getEmployeeById(employeeId);
    } catch (error) {
      console.error("Error getting employee by ID:", error);
      return null;
    }
  }

  // Get employee by unique ID
  static async getByUniqueId(uniqueId) {
    try {
      return await db.getEmployeeByUniqueId(uniqueId);
    } catch (error) {
      console.error("Error getting employee by unique ID:", error);
      return null;
    }
  }

  // Create a new employee
  static async create(employeeData) {
    try {
      // Validate required fields
      const { unique_id, lastname, firstname, display_name } = employeeData;

      if (!unique_id || !lastname || !firstname) {
        return {
          success: false,
          message: "Unique ID, last name, and first name are required",
        };
      }

      // If display_name is not provided, create it from first and last name
      const data = {
        ...employeeData,
        display_name: display_name || `${firstname} ${lastname}`,
      };

      return await db.createEmployee(data);
    } catch (error) {
      console.error("Error creating employee:", error);
      return { success: false, message: error.message };
    }
  }

  // Update employee
  static async update(employeeId, employeeData) {
    try {
      // Get the existing employee to merge with updates
      const existingEmployee = await this.getById(employeeId);

      if (!existingEmployee) {
        return { success: false, message: "Employee not found" };
      }

      // Merge existing data with updates
      const updatedData = { ...existingEmployee, ...employeeData };

      // If display_name is not provided, create it from first and last name
      if (
        !updatedData.display_name &&
        updatedData.firstname &&
        updatedData.lastname
      ) {
        updatedData.display_name = `${updatedData.firstname} ${updatedData.lastname}`;
      }

      return await db.updateEmployee(employeeId, updatedData);
    } catch (error) {
      console.error("Error updating employee:", error);
      return { success: false, message: error.message };
    }
  }

  // Delete employee
  static async delete(employeeId) {
    try {
      return await db.deleteEmployee(employeeId);
    } catch (error) {
      console.error("Error deleting employee:", error);
      return { success: false, message: error.message };
    }
  }

  // Search employees
  static async search(searchTerm) {
    try {
      if (!searchTerm || searchTerm.trim() === "") {
        return await this.getAll();
      }

      return await db.searchEmployees(searchTerm);
    } catch (error) {
      console.error("Error searching employees:", error);
      return [];
    }
  }
}

module.exports = Employee;
