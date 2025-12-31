import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * MERN Backend API Service
 *
 * This service handles all API communication with the backend.
 * It automatically transforms MongoDB responses (_id -> id) and handles authentication.
 *
 * Backend is running at: http://localhost:5000/api
 *
 * API ENDPOINTS:
 * - POST /api/auth/signup - { username, email, password } -> { token, user }
 * - POST /api/auth/login - { email, password } -> { token, user }
 * - GET /api/tasks - Returns array of tasks for authenticated user
 * - GET /api/tasks/:id - Returns single task
 * - POST /api/tasks - { name, description } -> Creates new task
 * - PUT /api/tasks/:id - { name, description } -> Updates task
 * - DELETE /api/tasks/:id - Deletes task
 * - POST /api/sessions - { taskId, startTime, endTime, duration, completed }
 * - GET /api/sessions?startDate=&endDate= - Returns sessions in date range
 * - GET /api/sessions/task/:taskId - Returns sessions for specific task
 * - GET /api/sessions/stats/daily - Returns daily statistics
 * - GET /api/sessions/stats/tasks - Returns task-wise statistics
 */

// Backend API Base URL
//
// Choose the correct URL based on where you're running:
//
// iOS Simulator: 'http://localhost:5000/api'
// Android Emulator: 'http://10.0.2.2:5000/api'
// Expo Go on Physical Device: 'http://YOUR_COMPUTER_IP:5000/api'
//   - Find your IP: Windows: ipconfig | Mac/Linux: ifconfig
//   - Example: 'http://192.168.1.100:5000/api'
// Production: 'https://your-backend.com/api'
//
// For Expo Go on physical device, replace YOUR_COMPUTER_IP with your actual IP
// To find your IP on Windows: Run 'ipconfig' and look for "IPv4 Address"
const API_BASE_URL = "http://192.168.1.2:5000/api";

// Helper function to get auth token
async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem("authToken");
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
}

// Helper function to transform MongoDB document to frontend format
function transformTask(task: any) {
  return {
    id: task._id || task.id,
    name: task.name,
    description: task.description,
    userId: task.userId,
    createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
    updatedAt: task.updatedAt ? new Date(task.updatedAt) : new Date(),
  };
}

// Helper function to transform session
function transformSession(session: any) {
  return {
    id: session._id || session.id,
    taskId: session.taskId,
    userId: session.userId,
    startTime: session.startTime ? new Date(session.startTime) : new Date(),
    endTime: session.endTime ? new Date(session.endTime) : new Date(),
    duration: session.duration,
    completed: session.completed,
  };
}

// Helper function to make authenticated requests
async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Request failed" }));
      throw new Error(
        error.message || `Request failed with status ${response.status}`
      );
    }

    return response.json();
  } catch (error: any) {
    if (error.message) {
      throw error;
    }
    throw new Error("Network error: Could not connect to backend server");
  }
}

// Auth API
export const authAPI = {
  signup: async (username: string, email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Signup failed");
    }

    const data = await response.json();
    if (data.token) {
      await AsyncStorage.setItem("authToken", data.token);
      // Transform user object to ensure id field
      const user = {
        id: data.user._id || data.user.id,
        username: data.user.username,
        email: data.user.email,
      };
      await AsyncStorage.setItem("user", JSON.stringify(user));
      return { token: data.token, user };
    }
    return data;
  },

  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }

    const data = await response.json();
    if (data.token) {
      await AsyncStorage.setItem("authToken", data.token);
      // Transform user object to ensure id field
      const user = {
        id: data.user._id || data.user.id,
        username: data.user.username,
        email: data.user.email,
      };
      await AsyncStorage.setItem("user", JSON.stringify(user));
      return { token: data.token, user };
    }
    return data;
  },

  logout: async () => {
    await AsyncStorage.removeItem("authToken");
    await AsyncStorage.removeItem("user");
  },

  getCurrentUser: async () => {
    const userStr = await AsyncStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },
};

// Tasks API
export const tasksAPI = {
  getTasks: async () => {
    const tasks = await authenticatedFetch("/tasks");
    return Array.isArray(tasks) ? tasks.map(transformTask) : [];
  },

  getTask: async (id: string) => {
    const task = await authenticatedFetch(`/tasks/${id}`);
    return transformTask(task);
  },

  createTask: async (name: string, description?: string) => {
    const task = await authenticatedFetch("/tasks", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    });
    return transformTask(task);
  },

  updateTask: async (id: string, name: string, description?: string) => {
    const task = await authenticatedFetch(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name, description }),
    });
    return transformTask(task);
  },

  deleteTask: async (id: string) => {
    return authenticatedFetch(`/tasks/${id}`, {
      method: "DELETE",
    });
  },
};

// Pomodoro Sessions API
export const sessionsAPI = {
  createSession: async (
    taskId: string,
    startTime: Date,
    endTime: Date,
    duration: number,
    completed: boolean
  ) => {
    const session = await authenticatedFetch("/sessions", {
      method: "POST",
      body: JSON.stringify({
        taskId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        completed,
      }),
    });
    return transformSession(session);
  },

  getSessions: async (startDate?: Date, endDate?: Date) => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate.toISOString());
    if (endDate) params.append("endDate", endDate.toISOString());

    const sessions = await authenticatedFetch(`/sessions?${params.toString()}`);
    return Array.isArray(sessions) ? sessions.map(transformSession) : [];
  },

  getSessionsByTask: async (taskId: string) => {
    const sessions = await authenticatedFetch(`/sessions/task/${taskId}`);
    return Array.isArray(sessions) ? sessions.map(transformSession) : [];
  },

  getDailyStats: async () => {
    return authenticatedFetch("/sessions/stats/daily");
  },

  getTaskStats: async () => {
    return authenticatedFetch("/sessions/stats/tasks");
  },
};

// Settings API
export const settingsAPI = {
  getSettings: async () => {
    try {
      const settings = await AsyncStorage.getItem("timerSettings");
      return settings
        ? JSON.parse(settings)
        : {
            focusDuration: 25,
            breakDuration: 5,
            longBreakDuration: 15,
            sessionsUntilLongBreak: 4,
          };
    } catch (error) {
      console.error("Error getting settings:", error);
      return {
        focusDuration: 25,
        breakDuration: 5,
        longBreakDuration: 15,
        sessionsUntilLongBreak: 4,
      };
    }
  },

  saveSettings: async (settings: any) => {
    await AsyncStorage.setItem("timerSettings", JSON.stringify(settings));
  },
};
