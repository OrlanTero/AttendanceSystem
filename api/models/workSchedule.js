const db = require("../database");

class WorkSchedule {
  // Get work schedule by employee ID
  static async getByEmployeeId(employeeId) {
    try {
      console.log("Getting work schedule for employee ID:", employeeId);
      return new Promise((resolve, reject) => {
        db.db.get(
          "SELECT * FROM work_schedule WHERE employee_id = ?",
          [employeeId],
          (err, row) => {
            if (err) {
              console.error("Error in getByEmployeeId:", err.message);
              reject(err);
              return;
            }

            console.log("Retrieved work schedule:", row || "None found");
            resolve(row);
          }
        );
      });
    } catch (error) {
      console.error("Error getting work schedule by employee ID:", error);
      return null;
    }
  }

  // Create work schedule
  static async create(scheduleData) {
    try {
      console.log(
        "Creating work schedule with data:",
        JSON.stringify(scheduleData)
      );

      // Validate required fields
      const { employee_id } = scheduleData;
      if (!employee_id) {
        console.log("Missing required employee_id field");
        return {
          success: false,
          message: "Employee ID is required",
        };
      }

      // Set default values
      const monday =
        scheduleData.monday !== undefined ? scheduleData.monday : true;
      const tuesday =
        scheduleData.tuesday !== undefined ? scheduleData.tuesday : true;
      const wednesday =
        scheduleData.wednesday !== undefined ? scheduleData.wednesday : true;
      const thursday =
        scheduleData.thursday !== undefined ? scheduleData.thursday : true;
      const friday =
        scheduleData.friday !== undefined ? scheduleData.friday : true;
      const saturday =
        scheduleData.saturday !== undefined ? scheduleData.saturday : false;
      const sunday =
        scheduleData.sunday !== undefined ? scheduleData.sunday : false;

      return new Promise((resolve, reject) => {
        db.db.run(
          `INSERT INTO work_schedule (
            employee_id, monday, tuesday, wednesday, thursday, friday, saturday, sunday
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            employee_id,
            monday ? 1 : 0,
            tuesday ? 1 : 0,
            wednesday ? 1 : 0,
            thursday ? 1 : 0,
            friday ? 1 : 0,
            saturday ? 1 : 0,
            sunday ? 1 : 0,
          ],
          function (err) {
            if (err) {
              console.error("Error creating work schedule:", err.message);
              resolve({ success: false, message: err.message });
              return;
            }

            console.log("Work schedule created with ID:", this.lastID);

            // Get the created schedule
            db.db.get(
              "SELECT * FROM work_schedule WHERE schedule_id = ?",
              [this.lastID],
              (err, row) => {
                if (err) {
                  console.error(
                    "Error retrieving created schedule:",
                    err.message
                  );
                  resolve({ success: false, message: err.message });
                  return;
                }

                resolve({
                  success: true,
                  data: row,
                  message: "Work schedule created successfully",
                });
              }
            );
          }
        );
      });
    } catch (error) {
      console.error("Error creating work schedule:", error);
      return { success: false, message: error.message };
    }
  }

  // Update work schedule
  static async update(employeeId, scheduleData) {
    try {
      console.log("Updating work schedule for employee ID:", employeeId);
      console.log("Update data:", JSON.stringify(scheduleData));

      // Get the existing schedule
      const existingSchedule = await this.getByEmployeeId(employeeId);

      // If no schedule exists, create one
      if (!existingSchedule) {
        console.log("No schedule found, creating new one");
        return await this.create({ ...scheduleData, employee_id: employeeId });
      }

      // Extract and validate data with defaults from existing schedule
      const monday =
        scheduleData.monday !== undefined
          ? scheduleData.monday
          : !!existingSchedule.monday;
      const tuesday =
        scheduleData.tuesday !== undefined
          ? scheduleData.tuesday
          : !!existingSchedule.tuesday;
      const wednesday =
        scheduleData.wednesday !== undefined
          ? scheduleData.wednesday
          : !!existingSchedule.wednesday;
      const thursday =
        scheduleData.thursday !== undefined
          ? scheduleData.thursday
          : !!existingSchedule.thursday;
      const friday =
        scheduleData.friday !== undefined
          ? scheduleData.friday
          : !!existingSchedule.friday;
      const saturday =
        scheduleData.saturday !== undefined
          ? scheduleData.saturday
          : !!existingSchedule.saturday;
      const sunday =
        scheduleData.sunday !== undefined
          ? scheduleData.sunday
          : !!existingSchedule.sunday;

      return new Promise((resolve, reject) => {
        db.db.run(
          `UPDATE work_schedule 
           SET monday = ?, tuesday = ?, wednesday = ?, thursday = ?, friday = ?, 
               saturday = ?, sunday = ?, updated_at = CURRENT_TIMESTAMP
           WHERE employee_id = ?`,
          [
            monday ? 1 : 0,
            tuesday ? 1 : 0,
            wednesday ? 1 : 0,
            thursday ? 1 : 0,
            friday ? 1 : 0,
            saturday ? 1 : 0,
            sunday ? 1 : 0,
            employeeId,
          ],
          function (err) {
            if (err) {
              console.error("Error updating work schedule:", err.message);
              resolve({ success: false, message: err.message });
              return;
            }

            if (this.changes === 0) {
              console.log("No work schedule was updated");
              resolve({
                success: false,
                message: "Work schedule not found or no changes made",
              });
              return;
            }

            console.log("Work schedule updated successfully");

            // Get the updated schedule
            db.db.get(
              "SELECT * FROM work_schedule WHERE employee_id = ?",
              [employeeId],
              (err, row) => {
                if (err) {
                  console.error(
                    "Error retrieving updated schedule:",
                    err.message
                  );
                  resolve({ success: false, message: err.message });
                  return;
                }

                resolve({
                  success: true,
                  data: row,
                  message: "Work schedule updated successfully",
                });
              }
            );
          }
        );
      });
    } catch (error) {
      console.error("Error updating work schedule:", error);
      return { success: false, message: error.message };
    }
  }

  // Delete work schedule
  static async delete(employeeId) {
    try {
      console.log("Deleting work schedule for employee ID:", employeeId);

      return new Promise((resolve, reject) => {
        db.db.run(
          "DELETE FROM work_schedule WHERE employee_id = ?",
          [employeeId],
          function (err) {
            if (err) {
              console.error("Error deleting work schedule:", err.message);
              resolve({ success: false, message: err.message });
              return;
            }

            if (this.changes === 0) {
              console.log("No work schedule found to delete");
              resolve({
                success: false,
                message: "Work schedule not found",
              });
              return;
            }

            console.log("Work schedule deleted successfully");
            resolve({
              success: true,
              message: "Work schedule deleted successfully",
            });
          }
        );
      });
    } catch (error) {
      console.error("Error deleting work schedule:", error);
      return { success: false, message: error.message };
    }
  }
}

module.exports = WorkSchedule;
