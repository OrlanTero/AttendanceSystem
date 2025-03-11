const db = require("../database");

class Department {
  // Get all departments
  static async getAll() {
    try {
      return await db.getAllDepartments();
    } catch (error) {
      console.error("Error getting all departments:", error);
      return [];
    }
  }

  // Get department by ID
  static async getById(departmentId) {
    try {
      return await db.getDepartmentById(departmentId);
    } catch (error) {
      console.error("Error getting department by ID:", error);
      return null;
    }
  }

  // Create a new department
  static async create(departmentData) {
    try {
      // Validate required fields
      const { name, department_head } = departmentData;

      if (!name || !department_head) {
        return {
          success: false,
          message: "Department name and department head are required",
        };
      }

      return await db.createDepartment(departmentData);
    } catch (error) {
      console.error("Error creating department:", error);
      return { success: false, message: error.message };
    }
  }

  // Update department
  static async update(departmentId, departmentData) {
    try {
      // Get the existing department to merge with updates
      const existingDepartment = await this.getById(departmentId);

      if (!existingDepartment) {
        return { success: false, message: "Department not found" };
      }

      // Validate required fields
      const { name, department_head } = departmentData;
      if (!name || !department_head) {
        return {
          success: false,
          message: "Department name and department head are required",
        };
      }

      return await db.updateDepartment(departmentId, departmentData);
    } catch (error) {
      console.error("Error updating department:", error);
      return { success: false, message: error.message };
    }
  }

  // Delete department
  static async delete(departmentId) {
    try {
      return await db.deleteDepartment(departmentId);
    } catch (error) {
      console.error("Error deleting department:", error);
      return { success: false, message: error.message };
    }
  }

  // Search departments
  static async search(searchTerm) {
    try {
      if (!searchTerm || searchTerm.trim() === "") {
        return await this.getAll();
      }

      return await db.getAllDepartments(searchTerm);
    } catch (error) {
      console.error("Error searching departments:", error);
      return [];
    }
  }
}

module.exports = Department;
