const db = require("../database");

class Attendance {
  // Get all attendance records
  static async getAll() {
    try {
      console.log("Getting all attendance records");

      // Use direct SQL instead of db.getAllAttendance
      return new Promise((resolve, reject) => {
        db.db.all(
          `
          SELECT a.*, e.display_name, e.unique_id 
          FROM attendance a
          JOIN employees e ON a.employee_id = e.employee_id
          ORDER BY a.date DESC, a.check_in DESC
          `,
          [],
          (err, rows) => {
            if (err) {
              console.error(
                "Direct SQL error in getting all attendance records:",
                err.message
              );
              reject(err);
              return;
            }

            console.log(`Retrieved ${rows.length} attendance records`);
            resolve(rows);
          }
        );
      });
    } catch (error) {
      console.error("Error getting all attendance records:", error);
      return [];
    }
  }

  // Get attendance by ID
  static async getById(attendanceId) {
    try {
      console.log("Getting attendance record with ID:", attendanceId);

      // Use direct SQL instead of db.getAttendanceById
      return new Promise((resolve, reject) => {
        db.db.get(
          `
          SELECT a.*, e.display_name, e.unique_id 
          FROM attendance a
          JOIN employees e ON a.employee_id = e.employee_id
          WHERE a.attendance_id = ?
          `,
          [attendanceId],
          (err, row) => {
            if (err) {
              console.error(
                "Direct SQL error in getting attendance by ID:",
                err.message
              );
              reject(err);
              return;
            }

            console.log("Retrieved attendance record:", row || "None found");
            resolve(row);
          }
        );
      });
    } catch (error) {
      console.error("Error getting attendance by ID:", error);
      return null;
    }
  }

  // Get attendance records by employee ID
  static async getByEmployeeId(employeeId) {
    try {
      console.log("Getting attendance records for employee ID:", employeeId);

      // Use direct SQL instead of db.getAttendanceByEmployeeId
      return new Promise((resolve, reject) => {
        db.db.all(
          `
          SELECT a.*, e.display_name, e.unique_id 
          FROM attendance a
          JOIN employees e ON a.employee_id = e.employee_id
          WHERE a.employee_id = ?
          ORDER BY a.date DESC, a.check_in DESC
          `,
          [employeeId],
          (err, rows) => {
            if (err) {
              console.error(
                "Direct SQL error in getting attendance by employee ID:",
                err.message
              );
              reject(err);
              return;
            }

            console.log(
              `Retrieved ${rows.length} attendance records for employee ID ${employeeId}`
            );
            resolve(rows);
          }
        );
      });
    } catch (error) {
      console.error("Error getting attendance by employee ID:", error);
      return [];
    }
  }

  // Get attendance records by date
  static async getByDate(date) {
    try {
      console.log("Getting attendance records for date:", date);

      // Use direct SQL instead of db.getAttendanceByDate
      return new Promise((resolve, reject) => {
        db.db.all(
          `
          SELECT a.*, e.display_name, e.unique_id 
          FROM attendance a
          JOIN employees e ON a.employee_id = e.employee_id
          WHERE a.date = ?
          ORDER BY a.check_in ASC
          `,
          [date],
          (err, rows) => {
            if (err) {
              console.error(
                "Direct SQL error in getting attendance by date:",
                err.message
              );
              reject(err);
              return;
            }

            console.log(
              `Retrieved ${rows.length} attendance records for date ${date}`
            );
            resolve(rows);
          }
        );
      });
    } catch (error) {
      console.error("Error getting attendance by date:", error);
      return [];
    }
  }

  // Get attendance records by employee ID and date
  static async getByEmployeeAndDate(employeeId, date) {
    try {
      console.log(
        "Getting attendance records for employee ID:",
        employeeId,
        "and date:",
        date
      );

      // Use direct SQL instead of db.getAttendanceByEmployeeAndDate
      return new Promise((resolve, reject) => {
        db.db.all(
          `
          SELECT a.*, e.display_name, e.unique_id 
          FROM attendance a
          JOIN employees e ON a.employee_id = e.employee_id
          WHERE a.employee_id = ? AND a.date = ?
          ORDER BY a.check_in ASC
          `,
          [employeeId, date],
          (err, rows) => {
            if (err) {
              console.error(
                "Direct SQL error in getting attendance by employee ID and date:",
                err.message
              );
              reject(err);
              return;
            }

            console.log(
              `Retrieved ${rows.length} attendance records for employee ID ${employeeId} and date ${date}`
            );
            resolve(rows);
          }
        );
      });
    } catch (error) {
      console.error("Error getting attendance by employee ID and date:", error);
      return [];
    }
  }

  // Create a new attendance record
  static async create(attendanceData) {
    try {
      console.log(
        "Creating attendance record with data:",
        JSON.stringify(attendanceData)
      );

      // Validate required fields
      const { employee_id, date } = attendanceData;

      if (!employee_id || !date) {
        console.log("Missing required fields:", { employee_id, date });
        return {
          success: false,
          message: "Employee ID and date are required",
        };
      }

      // Use direct SQL instead of db.createAttendance
      const now = new Date().toISOString();
      const check_in = attendanceData.check_in || now;
      const status = attendanceData.status || "present";

      return new Promise((resolve, reject) => {
        db.db.run(
          `
          INSERT INTO attendance (
            employee_id, date, check_in, status, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?)
          `,
          [employee_id, date, check_in, status, now, now],
          function (err) {
            if (err) {
              console.error(
                "Direct SQL error in attendance creation:",
                err.message
              );
              resolve({ success: false, message: err.message });
              return;
            }

            console.log("Attendance record created with ID:", this.lastID);

            // Get the newly created record
            db.db.get(
              `
              SELECT a.*, e.display_name, e.unique_id 
              FROM attendance a
              JOIN employees e ON a.employee_id = e.employee_id
              WHERE a.attendance_id = ?
              `,
              [this.lastID],
              (err, row) => {
                if (err) {
                  console.error(
                    "Error retrieving inserted record:",
                    err.message
                  );
                  resolve({ success: false, message: err.message });
                  return;
                }

                console.log("Retrieved inserted record:", row);
                resolve({
                  success: true,
                  data: row,
                  message: "Attendance record created successfully",
                });
              }
            );
          }
        );
      });
    } catch (error) {
      console.error("Error creating attendance record:", error);
      return { success: false, message: error.message };
    }
  }

  // Update attendance record
  static async update(attendanceId, attendanceData) {
    try {
      console.log("Updating attendance record with ID:", attendanceId);
      console.log("Update data:", JSON.stringify(attendanceData));

      // Get the existing attendance to merge with updates
      const existingAttendance = await this.getById(attendanceId);

      if (!existingAttendance) {
        console.log("No attendance record found with ID:", attendanceId);
        return { success: false, message: "Attendance record not found" };
      }

      // Use direct SQL instead of db.updateAttendance
      const now = new Date().toISOString();

      // Build the SQL query dynamically based on provided fields
      let setClause = [];
      let params = [];

      if (attendanceData.check_out) {
        setClause.push("check_out = ?");
        params.push(attendanceData.check_out);
      }

      if (attendanceData.status) {
        setClause.push("status = ?");
        params.push(attendanceData.status);
      }

      // Always update the updated_at field
      setClause.push("updated_at = ?");
      params.push(now);

      // Add the attendanceId to the parameters
      params.push(attendanceId);

      if (setClause.length === 1) {
        console.log("No fields to update other than updated_at");
        return {
          success: false,
          message: "No fields to update",
        };
      }

      const sql = `
        UPDATE attendance
        SET ${setClause.join(", ")}
        WHERE attendance_id = ?
      `;

      console.log("Executing SQL:", sql);
      console.log("With parameters:", params);

      return new Promise((resolve, reject) => {
        db.db.run(sql, params, function (err) {
          if (err) {
            console.error(
              "Direct SQL error in attendance update:",
              err.message
            );
            resolve({ success: false, message: err.message });
            return;
          }

          if (this.changes === 0) {
            console.log("No changes made to the attendance record");
            resolve({
              success: false,
              message: "Attendance record not found or no changes made",
            });
            return;
          }

          console.log("Attendance record updated successfully");

          // Get the updated record
          db.db.get(
            `
              SELECT a.*, e.display_name, e.unique_id 
              FROM attendance a
              JOIN employees e ON a.employee_id = e.employee_id
              WHERE a.attendance_id = ?
              `,
            [attendanceId],
            (err, row) => {
              if (err) {
                console.error("Error retrieving updated record:", err.message);
                resolve({ success: false, message: err.message });
                return;
              }

              console.log("Retrieved updated record:", row);
              resolve({
                success: true,
                data: row,
                message: "Attendance record updated successfully",
              });
            }
          );
        });
      });
    } catch (error) {
      console.error("Error updating attendance record:", error);
      return { success: false, message: error.message };
    }
  }

  // Delete attendance record
  static async delete(attendanceId) {
    try {
      console.log("Deleting attendance record with ID:", attendanceId);

      // Use direct SQL instead of db.deleteAttendance
      return new Promise((resolve, reject) => {
        db.db.run(
          "DELETE FROM attendance WHERE attendance_id = ?",
          [attendanceId],
          function (err) {
            if (err) {
              console.error(
                "Direct SQL error in attendance deletion:",
                err.message
              );
              resolve({ success: false, message: err.message });
              return;
            }

            if (this.changes === 0) {
              console.log("No attendance record found to delete");
              resolve({
                success: false,
                message: "Attendance record not found",
              });
              return;
            }

            console.log("Attendance record deleted successfully");
            resolve({
              success: true,
              message: "Attendance record deleted successfully",
            });
          }
        );
      });
    } catch (error) {
      console.error("Error deleting attendance record:", error);
      return { success: false, message: error.message };
    }
  }

  // Check in employee
  static async checkIn(employeeId, date = null) {
    try {
      console.log("Attendance.checkIn called with employeeId:", employeeId);
      console.log("Attendance.checkIn called with date:", date);

      const checkInTime = new Date().toISOString();
      const currentDate = date || new Date().toISOString().split("T")[0];
      const currentHour = new Date().getHours();
      const currentMinutes = new Date().getMinutes();

      // Define shift times
      const SHIFT_START_HOUR = 8; // 8 AM
      const GRACE_PERIOD_MINUTES = 15; // 15 minute grace period

      // Determine status based on time
      let status = "present";
      if (
        currentHour > SHIFT_START_HOUR ||
        (currentHour === SHIFT_START_HOUR &&
          currentMinutes > GRACE_PERIOD_MINUTES)
      ) {
        status = "late";
      }

      // Instead of using db.createAttendance, directly execute the SQL query
      const now = new Date().toISOString();
      console.log("Creating attendance record with direct SQL", {
        employee_id: employeeId,
        date: currentDate,
        check_in: checkInTime,
        status,
      });

      return new Promise((resolve, reject) => {
        db.db.run(
          `
          INSERT INTO attendance (
            employee_id, date, check_in, status, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?)
          `,
          [employeeId, currentDate, checkInTime, status, now, now],
          function (err) {
            if (err) {
              console.error(
                "Direct SQL error in attendance creation:",
                err.message
              );
              resolve({ success: false, message: err.message });
              return;
            }

            console.log("Attendance record created with ID:", this.lastID);

            // Get the newly created record
            db.db.get(
              `
              SELECT a.*, e.display_name, e.unique_id 
              FROM attendance a
              JOIN employees e ON a.employee_id = e.employee_id
              WHERE a.attendance_id = ?
              `,
              [this.lastID],
              (err, row) => {
                if (err) {
                  console.error(
                    "Error retrieving inserted record:",
                    err.message
                  );
                  resolve({ success: false, message: err.message });
                  return;
                }

                console.log("Retrieved inserted record:", row);
                resolve({
                  success: true,
                  data: row,
                  message: "Attendance record created successfully",
                });
              }
            );
          }
        );
      });
    } catch (error) {
      console.error("Error checking in employee:", error);
      return { success: false, message: error.message };
    }
  }

  // Check out employee
  static async checkOut(attendanceId) {
    try {
      console.log("Checking out attendance record with ID:", attendanceId);
      const checkOutTime = new Date().toISOString();
      const now = new Date().toISOString();

      // Use direct SQL instead of db.updateAttendance
      return new Promise((resolve, reject) => {
        db.db.run(
          `
          UPDATE attendance
          SET check_out = ?, updated_at = ?
          WHERE attendance_id = ?
          `,
          [checkOutTime, now, attendanceId],
          function (err) {
            if (err) {
              console.error(
                "Direct SQL error in attendance checkout:",
                err.message
              );
              resolve({ success: false, message: err.message });
              return;
            }

            if (this.changes === 0) {
              console.log("No attendance record found to check out");
              resolve({
                success: false,
                message: "Attendance record not found or no changes made",
              });
              return;
            }

            console.log("Attendance record checked out successfully");

            // Get the updated record
            db.db.get(
              `
              SELECT a.*, e.display_name, e.unique_id 
              FROM attendance a
              JOIN employees e ON a.employee_id = e.employee_id
              WHERE a.attendance_id = ?
              `,
              [attendanceId],
              (err, row) => {
                if (err) {
                  console.error(
                    "Error retrieving updated record:",
                    err.message
                  );
                  resolve({ success: false, message: err.message });
                  return;
                }

                console.log("Retrieved updated record:", row);
                resolve({
                  success: true,
                  data: row,
                  message: "Attendance record checked out successfully",
                });
              }
            );
          }
        );
      });
    } catch (error) {
      console.error("Error checking out employee:", error);
      return { success: false, message: error.message };
    }
  }

  // Search attendance records
  static async search(searchTerm) {
    try {
      // This would be a more comprehensive search if implemented in the database
      // For now, we'll just get all records and filter them here
      const allRecords = await this.getAll();
      const searchPattern = searchTerm.toLowerCase();

      return allRecords.filter((record) => {
        return (
          record.display_name?.toLowerCase().includes(searchPattern) ||
          record.unique_id?.toLowerCase().includes(searchPattern)
        );
      });
    } catch (error) {
      console.error("Error searching attendance:", error);
      return [];
    }
  }
}

module.exports = Attendance;
