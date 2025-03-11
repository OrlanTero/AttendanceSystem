const db = require("../database");

class User {
  // Get all users
  static async getAll() {
    try {
      return await db.getAllUsers();
    } catch (error) {
      console.error("Error getting all users:", error);
      return [];
    }
  }

  // Get user by ID
  static async getById(userId) {
    try {
      return await db.getUserById(userId);
    } catch (error) {
      console.error("Error getting user by ID:", error);
      return null;
    }
  }

  // Get user by username
  static async getByUsername(username) {
    try {
      return await db.getUserByUsername(username);
    } catch (error) {
      console.error("Error getting user by username:", error);
      return null;
    }
  }

  // Create a new user
  static async create(userData) {
    try {
      return await db.createUser(userData);
    } catch (error) {
      console.error("Error creating user:", error);
      return { success: false, message: error.message };
    }
  }

  // Update user
  static async update(userId, userData) {
    try {
      return await db.updateUser(userId, userData);
    } catch (error) {
      console.error("Error updating user:", error);
      return { success: false, message: error.message };
    }
  }

  // Delete user
  static async delete(userId) {
    try {
      return await db.deleteUser(userId);
    } catch (error) {
      console.error("Error deleting user:", error);
      return { success: false, message: error.message };
    }
  }

  // Authenticate user
  static async authenticate(username, password) {
    try {
      return await db.authenticateUser(username, password);
    } catch (error) {
      console.error("Error authenticating user:", error);
      return { success: false, message: "Authentication error" };
    }
  }
}

module.exports = User;
