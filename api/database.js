const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");

// Ensure the data directory exists
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database file path
const dbPath = path.join(dataDir, "attendance.db");

// Initialize database connection
let db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Database connection error:", err.message);
  } else {
    console.log("Connected to the SQLite database");
  }
});

// Create tables if they don't exist
function initDatabase() {
  return new Promise((resolve, reject) => {
    // Users table
    db.run(
      `
      CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        display_name TEXT NOT NULL,
        biometric_data TEXT,
        image TEXT,
        date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
      (err) => {
        if (err) {
          console.error("Error creating users table:", err.message);
          reject(err);
          return;
        }

        // Create Employees table
        db.run(
          `
        CREATE TABLE IF NOT EXISTS employees (
          employee_id INTEGER PRIMARY KEY AUTOINCREMENT,
          department_id INTEGER,
          unique_id TEXT UNIQUE NOT NULL,
          lastname TEXT NOT NULL,
          firstname TEXT NOT NULL,
          middlename TEXT,
          display_name TEXT NOT NULL,
          age INTEGER,
          gender TEXT,
          biometric_data TEXT,
          image BLOB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `,
          (err) => {
            if (err) {
              console.error("Error creating employees table:", err.message);
              reject(err);
              return;
            }

            // Create Departments table
            db.run(
              `
              CREATE TABLE IF NOT EXISTS departments (
                department_id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                department_head TEXT NOT NULL,
                date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              )
            `,
              (err) => {
                if (err) {
                  console.error(
                    "Error creating departments table:",
                    err.message
                  );
                  reject(err);
                  return;
                }

                // Create Holidays table
                db.run(
                  `
                  CREATE TABLE IF NOT EXISTS holidays (
                    holiday_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    date TEXT NOT NULL,
                    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                  )
                `,
                  (err) => {
                    if (err) {
                      console.error(
                        "Error creating holidays table:",
                        err.message
                      );
                      reject(err);
                      return;
                    }

                    // Check if admin user exists, if not create default admin
                    db.get(
                      "SELECT * FROM users WHERE username = ?",
                      ["Admin"],
                      (err, row) => {
                        if (err) {
                          console.error(
                            "Error checking for admin user:",
                            err.message
                          );
                          reject(err);
                          return;
                        }

                        if (!row) {
                          db.run(
                            `
            INSERT INTO users (username, password, display_name)
            VALUES (?, ?, ?)
          `,
                            ["Admin", "Admin", "Administrator"],
                            function (err) {
                              if (err) {
                                console.error(
                                  "Error creating admin user:",
                                  err.message
                                );
                                reject(err);
                                return;
                              }
                              console.log("Default Admin user created");
                              resolve(true);
                            }
                          );
                        } else {
                          resolve(true);
                        }
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  });
}

// Initialize the database
initDatabase().catch((err) => {
  console.error("Database initialization failed:", err);
});

// Helper functions for database operations
const dbMethods = {
  // Get all users
  getAllUsers: () => {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT user_id, username, display_name, image, date_created FROM users",
        [],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows);
        }
      );
    });
  },

  // Get user by ID
  getUserById: (userId) => {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT user_id, username, display_name, image, date_created FROM users WHERE user_id = ?",
        [userId],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row);
        }
      );
    });
  },

  // Get user by username
  getUserByUsername: (username) => {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM users WHERE username = ?",
        [username],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row);
        }
      );
    });
  },

  // Create a new user
  createUser: (userData) => {
    const {
      username,
      password,
      display_name,
      biometric_data = null,
      image = null,
    } = userData;

    return new Promise((resolve, reject) => {
      db.run(
        `
        INSERT INTO users (username, password, display_name, biometric_data, image)
        VALUES (?, ?, ?, ?, ?)
      `,
        [username, password, display_name, biometric_data, image],
        function (err) {
          if (err) {
            if (err.message.includes("UNIQUE constraint failed")) {
              resolve({ success: false, message: "Username already exists" });
            } else {
              reject(err);
            }
            return;
          }

          resolve({
            success: true,
            user_id: this.lastID,
            message: "User created successfully",
          });
        }
      );
    });
  },

  // Update user
  updateUser: (userId, userData) => {
    const { display_name, biometric_data, image } = userData;

    return new Promise((resolve, reject) => {
      db.run(
        `
        UPDATE users 
        SET display_name = ?, biometric_data = ?, image = ?
        WHERE user_id = ?
      `,
        [display_name, biometric_data, image, userId],
        function (err) {
          if (err) {
            reject(err);
            return;
          }

          resolve({
            success: this.changes > 0,
            message:
              this.changes > 0
                ? "User updated successfully"
                : "No changes made or user not found",
          });
        }
      );
    });
  },

  // Delete user
  deleteUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.run("DELETE FROM users WHERE user_id = ?", [userId], function (err) {
        if (err) {
          reject(err);
          return;
        }

        resolve({
          success: this.changes > 0,
          message:
            this.changes > 0 ? "User deleted successfully" : "User not found",
        });
      });
    });
  },

  // Authenticate user
  authenticateUser: (username, password) => {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM users WHERE username = ? COLLATE NOCASE",
        [username],
        (err, user) => {
          if (err) {
            reject(err);
            return;
          }

          if (!user) {
            resolve({ success: false, message: "User not found" });
            return;
          }

          if (user.password === password) {
            // Don't return the password in the response
            const { password, ...userWithoutPassword } = user;
            resolve({
              success: true,
              message: "Authentication successful",
              user: userWithoutPassword,
            });
          } else {
            resolve({ success: false, message: "Invalid password" });
          }
        }
      );
    });
  },

  // Close database connection
  closeDatabase: () => {
    return new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) {
          console.error("Error closing database:", err.message);
          reject(err);
          return;
        }
        console.log("Database connection closed");
        resolve();
      });
    });
  },

  // Employee methods
  getAllEmployees: () => {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM employees ORDER BY lastname ASC",
        [],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows);
        }
      );
    });
  },

  getEmployeeById: (employeeId) => {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM employees WHERE employee_id = ?",
        [employeeId],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row);
        }
      );
    });
  },

  getEmployeeByUniqueId: (uniqueId) => {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM employees WHERE unique_id = ?",
        [uniqueId],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row);
        }
      );
    });
  },

  createEmployee: (employeeData) => {
    const {
      department_id,
      unique_id,
      lastname,
      firstname,
      middlename,
      display_name,
      age,
      gender,
      biometric_data,
      image,
    } = employeeData;

    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      db.run(
        `
        INSERT INTO employees (
          department_id, unique_id, lastname, firstname, middlename,
          display_name, age, gender, biometric_data, image, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          department_id,
          unique_id,
          lastname,
          firstname,
          middlename,
          display_name,
          age,
          gender,
          biometric_data,
          image,
          now,
          now,
        ],
        function (err) {
          if (err) {
            if (err.message.includes("UNIQUE constraint failed")) {
              resolve({
                success: false,
                message: "Employee ID already exists",
              });
            } else {
              reject(err);
            }
            return;
          }

          resolve({
            success: true,
            employee_id: this.lastID,
            message: "Employee created successfully",
          });
        }
      );
    });
  },

  updateEmployee: (employeeId, employeeData) => {
    const {
      department_id,
      unique_id,
      lastname,
      firstname,
      middlename,
      display_name,
      age,
      gender,
      biometric_data,
      image,
    } = employeeData;

    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      db.run(
        `
        UPDATE employees 
        SET department_id = ?, unique_id = ?, lastname = ?, firstname = ?, 
            middlename = ?, display_name = ?, age = ?, gender = ?, 
            biometric_data = ?, image = ?, updated_at = ?
        WHERE employee_id = ?
      `,
        [
          department_id,
          unique_id,
          lastname,
          firstname,
          middlename,
          display_name,
          age,
          gender,
          biometric_data,
          image,
          now,
          employeeId,
        ],
        function (err) {
          if (err) {
            if (err.message.includes("UNIQUE constraint failed")) {
              resolve({
                success: false,
                message: "Employee ID already exists",
              });
            } else {
              reject(err);
            }
            return;
          }

          resolve({
            success: this.changes > 0,
            message:
              this.changes > 0
                ? "Employee updated successfully"
                : "No changes made or employee not found",
          });
        }
      );
    });
  },

  deleteEmployee: (employeeId) => {
    return new Promise((resolve, reject) => {
      db.run(
        "DELETE FROM employees WHERE employee_id = ?",
        [employeeId],
        function (err) {
          if (err) {
            reject(err);
            return;
          }

          resolve({
            success: this.changes > 0,
            message:
              this.changes > 0
                ? "Employee deleted successfully"
                : "Employee not found",
          });
        }
      );
    });
  },

  searchEmployees: (searchTerm) => {
    return new Promise((resolve, reject) => {
      const searchPattern = `%${searchTerm}%`;
      db.all(
        `
        SELECT * FROM employees 
        WHERE unique_id LIKE ? 
        OR lastname LIKE ? 
        OR firstname LIKE ? 
        OR middlename LIKE ? 
        OR display_name LIKE ?
        ORDER BY lastname ASC
      `,
        [
          searchPattern,
          searchPattern,
          searchPattern,
          searchPattern,
          searchPattern,
        ],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows);
        }
      );
    });
  },

  // Department methods
  getAllDepartments: (searchTerm = "") => {
    return new Promise((resolve, reject) => {
      const query = searchTerm
        ? `SELECT * FROM departments WHERE name LIKE ? OR department_head LIKE ?`
        : `SELECT * FROM departments`;
      const params = searchTerm ? [`%${searchTerm}%`, `%${searchTerm}%`] : [];

      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  },

  getDepartmentById: (departmentId) => {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM departments WHERE department_id = ?",
        [departmentId],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row);
        }
      );
    });
  },

  createDepartment: (departmentData) => {
    const { name, department_head } = departmentData;
    return new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO departments (name, department_head) VALUES (?, ?)",
        [name, department_head],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({
            department_id: this.lastID,
            name,
            department_head,
            date_created: new Date().toISOString(),
          });
        }
      );
    });
  },

  updateDepartment: (departmentId, departmentData) => {
    const { name, department_head } = departmentData;
    return new Promise((resolve, reject) => {
      db.run(
        "UPDATE departments SET name = ?, department_head = ? WHERE department_id = ?",
        [name, department_head, departmentId],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({
            success: this.changes > 0,
            department_id: departmentId,
            name,
            department_head,
          });
        }
      );
    });
  },

  deleteDepartment: (departmentId) => {
    return new Promise((resolve, reject) => {
      db.run(
        "DELETE FROM departments WHERE department_id = ?",
        [departmentId],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({
            success: this.changes > 0,
          });
        }
      );
    });
  },

  // Holiday methods
  getAllHolidays: (searchTerm = "") => {
    return new Promise((resolve, reject) => {
      const query = searchTerm
        ? `SELECT * FROM holidays WHERE name LIKE ?`
        : `SELECT * FROM holidays`;
      const params = searchTerm ? [`%${searchTerm}%`] : [];

      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  },

  getHolidayById: (holidayId) => {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM holidays WHERE holiday_id = ?",
        [holidayId],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row);
        }
      );
    });
  },

  createHoliday: (holidayData) => {
    const { name, date } = holidayData;
    return new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO holidays (name, date) VALUES (?, ?)",
        [name, date],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({
            success: true,
            holiday_id: this.lastID,
            name,
            date,
            date_created: new Date().toISOString(),
          });
        }
      );
    });
  },

  updateHoliday: (holidayId, holidayData) => {
    const { name, date } = holidayData;
    return new Promise((resolve, reject) => {
      db.run(
        "UPDATE holidays SET name = ?, date = ? WHERE holiday_id = ?",
        [name, date, holidayId],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({
            success: this.changes > 0,
            holiday_id: holidayId,
            name,
            date,
          });
        }
      );
    });
  },

  deleteHoliday: (holidayId) => {
    return new Promise((resolve, reject) => {
      db.run(
        "DELETE FROM holidays WHERE holiday_id = ?",
        [holidayId],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({
            success: this.changes > 0,
          });
        }
      );
    });
  },
};

module.exports = {
  db,
  ...dbMethods,
};
