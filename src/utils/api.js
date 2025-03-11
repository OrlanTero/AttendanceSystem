// API utility for the renderer process
const API_URL = "http://localhost:3000/api";

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
};
