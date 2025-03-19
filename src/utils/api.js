// API utility for the renderer process
export const IPADDRESS = "192.168.1.19";
export const API_URL = `http://${IPADDRESS}:3000/api`;
export const SOCKET_API_URL = `http://${IPADDRESS}:3005`;

// Helper function to format dates consistently
function formatDateForAPI(date) {
  if (!date) return "";

  // If it's already a string in YYYY-MM-DD format, return as is
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  // Otherwise convert to YYYY-MM-DD format
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Generic fetch function with error handling
async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: options.headers || {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "API request failed");
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

// Test API connection
export async function testConnection() {
  try {
    return await fetchAPI("/auth/test");
  } catch (error) {
    console.error("API connection test failed:", error);
    return { success: false, message: "API connection failed" };
  }
}

// Authentication
export async function login(username, password) {
  try {
    return await fetchAPI("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  } catch (error) {
    console.error("Login failed:", error);
    return { success: false, message: "Login failed" };
  }
}

// Users
export async function getUsers() {
  return await fetchAPI("/users");
}

export async function getTemplates() {
  return await fetchAPI("/employees/templates");
}

export async function getUser(id) {
  return await fetchAPI(`/users/${id}`);
}

export async function createUser(userData) {
  return await fetchAPI("/users", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

export async function updateUser(id, userData) {
  return await fetchAPI(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(userData),
  });
}

export async function deleteUser(id) {
  return await fetchAPI(`/users/${id}`, {
    method: "DELETE",
  });
}

// Employees
export async function getEmployees(searchTerm = "") {
  const endpoint = searchTerm
    ? `/employees?search=${encodeURIComponent(searchTerm)}`
    : "/employees";
  return await fetchAPI(endpoint);
}

export async function getEmployee(id) {
  return await fetchAPI(`/employees/${id}`);
}

export async function createEmployee(employeeData) {
  // Handle file uploads with FormData
  const formData = new FormData();

  // Add all text fields
  Object.keys(employeeData).forEach((key) => {
    if (key === "image") {
      if (employeeData[key] instanceof File) {
        formData.append("image", employeeData[key]);
      }
    } else if (employeeData[key] !== null && employeeData[key] !== undefined) {
      formData.append(key, employeeData[key].toString());
    }
  });

  return await fetch(`${API_URL}/employees`, {
    method: "POST",
    body: formData,
  }).then(async (response) => {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to create employee");
    }
    return data;
  });
}

export async function updateEmployee(id, employeeData) {
  // Handle file uploads with FormData
  const formData = new FormData();

  // Add all text fields
  Object.keys(employeeData).forEach((key) => {
    if (key === "image") {
      if (employeeData[key] instanceof File) {
        formData.append("image", employeeData[key]);
      }
    } else if (employeeData[key] !== null && employeeData[key] !== undefined) {
      formData.append(key, employeeData[key].toString());
    }
  });

  return await fetch(`${API_URL}/employees/${id}`, {
    method: "PUT",
    body: formData,
  }).then(async (response) => {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to update employee");
    }
    return data;
  });
}

export async function deleteEmployee(id) {
  return await fetchAPI(`/employees/${id}`, {
    method: "DELETE",
  });
}

// Department APIs
export const getDepartments = async (searchTerm = "") => {
  try {
    const response = await fetchAPI(
      `/departments${
        searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ""
      }`
    );
    return response.data || [];
  } catch (error) {
    console.error("Error in getDepartments:", error);
    return [];
  }
};

export const getDepartment = async (departmentId) => {
  try {
    const response = await fetchAPI(`/departments/${departmentId}`);
    return response.data || null;
  } catch (error) {
    console.error("Error in getDepartment:", error);
    return null;
  }
};

export const createDepartment = async (departmentData) => {
  try {
    return await fetchAPI("/departments", {
      method: "POST",
      body: JSON.stringify(departmentData),
    });
  } catch (error) {
    console.error("Error in createDepartment:", error);
    return {
      success: false,
      message: error.message || "Failed to create department",
    };
  }
};

export const updateDepartment = async (departmentId, departmentData) => {
  try {
    return await fetchAPI(`/departments/${departmentId}`, {
      method: "PUT",
      body: JSON.stringify(departmentData),
    });
  } catch (error) {
    console.error("Error in updateDepartment:", error);
    return {
      success: false,
      message: error.message || "Failed to update department",
    };
  }
};

export const deleteDepartment = async (departmentId) => {
  try {
    return await fetchAPI(`/departments/${departmentId}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.error("Error in deleteDepartment:", error);
    return {
      success: false,
      message: error.message || "Failed to delete department",
    };
  }
};

// Holiday APIs
export const getHolidays = async (searchTerm = "") => {
  try {
    console.log("Fetching holidays with search term:", searchTerm);
    const response = await fetchAPI(
      `/holidays${
        searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ""
      }`
    );
    console.log("Holidays API response:", response);
    return response.data || [];
  } catch (error) {
    console.error("Error in getHolidays:", error);
    return [];
  }
};

export const getHoliday = async (holidayId) => {
  try {
    const response = await fetchAPI(`/holidays/${holidayId}`);
    return response.data || null;
  } catch (error) {
    console.error("Error in getHoliday:", error);
    return null;
  }
};

export const createHoliday = async (holidayData) => {
  try {
    return await fetchAPI("/holidays", {
      method: "POST",
      body: JSON.stringify(holidayData),
    });
  } catch (error) {
    console.error("Error in createHoliday:", error);
    return {
      success: false,
      message: error.message || "Failed to create holiday",
    };
  }
};

export const updateHoliday = async (holidayId, holidayData) => {
  try {
    return await fetchAPI(`/holidays/${holidayId}`, {
      method: "PUT",
      body: JSON.stringify(holidayData),
    });
  } catch (error) {
    console.error("Error in updateHoliday:", error);
    return {
      success: false,
      message: error.message || "Failed to update holiday",
    };
  }
};

export const deleteHoliday = async (holidayId) => {
  try {
    return await fetchAPI(`/holidays/${holidayId}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.error("Error in deleteHoliday:", error);
    return {
      success: false,
      message: error.message || "Failed to delete holiday",
    };
  }
};

// Attendance APIs
export const getAttendanceByDate = async (date) => {
  try {
    const formattedDate = formatDateForAPI(date);
    console.log("Getting attendance for date:", formattedDate);
    const response = await fetchAPI(`/attendance?date=${formattedDate}`);
    return response.data || [];
  } catch (error) {
    console.error("Error in getAttendanceByDate:", error);
    return [];
  }
};

export async function getAttendanceByEmployee(employeeId) {
  try {
    const response = await fetchAPI(`/attendance?employeeId=${employeeId}`);
    return response;
  } catch (error) {
    console.error("Error in getAttendanceByEmployee:", error);
    return { success: false, message: "Failed to fetch attendance records" };
  }
}

export const getAttendanceByEmployeeAndDate = async (employeeId, date) => {
  try {
    const formattedDate = formatDateForAPI(date);
    console.log(
      "Getting attendance for employee ID:",
      employeeId,
      "and date:",
      formattedDate
    );
    const response = await fetchAPI(
      `/attendance?employeeId=${employeeId}&date=${formattedDate}`
    );
    return response.data || [];
  } catch (error) {
    console.error("Error in getAttendanceByEmployeeAndDate:", error);
    return [];
  }
};

export const fetchAttendanceWithPagination = async (endpoint) => {
  try {
    console.log("Fetching attendance with pagination:", endpoint);
    const response = await fetchAPI(endpoint);
    return response;
  } catch (error) {
    console.error("Error in fetchAttendanceWithPagination:", error);
    return { success: false, message: "Failed to fetch attendance records" };
  }
};

export async function checkInEmployee(employeeId) {
  try {
    const today = formatDateForAPI(new Date());
    console.log(
      "Checking in employee with ID:",
      employeeId,
      "for date:",
      today
    );

    return await fetchAPI("/attendance/check-in", {
      method: "POST",
      body: JSON.stringify({ employeeId, date: today }),
    });
  } catch (error) {
    console.error("Error in checkInEmployee:", error);
    return {
      success: false,
      message: error.message || "Failed to check in employee",
    };
  }
}

export async function checkOutEmployee(attendanceId) {
  try {
    return await fetchAPI(`/attendance/check-out/${attendanceId}`, {
      method: "PUT",
    });
  } catch (error) {
    console.error("Error in checkOutEmployee:", error);
    return {
      success: false,
      message: error.message || "Failed to check out employee",
    };
  }
}

// Report-specific APIs
export const getAttendanceReport = async (
  startDate,
  endDate,
  employeeId = null
) => {
  try {
    // Format dates
    const formattedStartDate = formatDateForAPI(startDate);
    const formattedEndDate = formatDateForAPI(endDate);

    console.log(
      "Generating attendance report from",
      formattedStartDate,
      "to",
      formattedEndDate
    );

    // Build query parameters
    let endpoint = "/attendance?";
    const params = new URLSearchParams();

    params.append("startDate", formattedStartDate);
    params.append("endDate", formattedEndDate);
    params.append("limit", "1000"); // Get a large number of records for reports

    if (employeeId) {
      params.append("employeeId", employeeId);
    }

    endpoint += params.toString();

    // Fetch data
    const response = await fetchAPI(endpoint);
    return response;
  } catch (error) {
    console.error("Error in getAttendanceReport:", error);
    return {
      success: false,
      message: "Failed to generate attendance report",
      data: [],
    };
  }
};

// Work Schedule APIs
export const getEmployeeWorkSchedule = async (employeeId) => {
  try {
    const response = await fetchAPI(`/work-schedule/${employeeId}`);
    return response;
  } catch (error) {
    console.error("Error in getEmployeeWorkSchedule:", error);
    return {
      success: false,
      message: "Failed to fetch work schedule",
      data: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
      },
    };
  }
};

export const updateEmployeeWorkSchedule = async (employeeId, scheduleData) => {
  try {
    return await fetchAPI(`/work-schedule/${employeeId}`, {
      method: "PUT",
      body: JSON.stringify(scheduleData),
    });
  } catch (error) {
    console.error("Error in updateEmployeeWorkSchedule:", error);
    return {
      success: false,
      message: "Failed to update work schedule",
    };
  }
};

export default {
  testConnection,
  login,
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getHolidays,
  getHoliday,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  getAttendanceByDate,
  getAttendanceByEmployee,
  getAttendanceByEmployeeAndDate,
  fetchAttendanceWithPagination,
  checkInEmployee,
  checkOutEmployee,
  getAttendanceReport,
  getEmployeeWorkSchedule,
  updateEmployeeWorkSchedule,
  IPADDRESS,
  API_URL,
  SOCKET_API_URL,
};
