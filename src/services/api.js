//import { updateCompetition } from "../../../backend/controllers/compition.controlller";

// API Base URL - Update this to match your backend server
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

/**
 * Generic API request function
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @param {string} token - Optional token (if not provided, will get from localStorage)
 */
const apiRequest = async (endpoint, options = {}, token = null) => {
  const authToken = token || localStorage.getItem("atoken");

  const config = {
    ...options,
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    },
  };

  // Handle FormData
  if (options.body instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Handle non-JSON responses
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || 'An error occurred');
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || 'An error occurred');
    }

    return data;
  } catch (error) {
    // Re-throw with more context if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Could not connect to server. Please check if the backend is running.');
    }
    throw error;
  }
};


/**
 * Authentication APIs
 */
export const authAPI = {
  // Register a new user
  register: async (userData, avatarFile) => {
    const formData = new FormData();
    formData.append('name', userData.name);
    formData.append('email', userData.email);
    formData.append('password', userData.password);
    formData.append('username', userData.username);

    if (userData.wins !== undefined) formData.append('wins', userData.wins);
    if (userData.losses !== undefined) formData.append('losses', userData.losses);
    if (userData.draws !== undefined) formData.append('draws', userData.draws);

    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    return apiRequest("/user/register", {
      method: "POST",
      body: formData,
    });
  },

  // Login user
  login: async (email, password) => {
    return apiRequest("/user/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  // Send OTP to user's email
  sendOTP: async (email) => {
    return apiRequest("/user/send-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  // Verify OTP and login
  verifyOTP: async (email, otp) => {
    return apiRequest("/user/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });
  },

  // Reset password
  resetPassword: async (password, token) => {
    return apiRequest(
      "/user/reset-password",
      {
        method: "POST",
        body: JSON.stringify({ password }),
      },
      token
    );
  },

  // Send OTP for signup email verification
  sendSignupOTP: async (userData) => {
    return apiRequest("/user/send-signup-otp", {
      method: "POST",
      body: JSON.stringify({
        email: userData.email,
        name: userData.name,
        username: userData.username,
        password: userData.password
      }),
    });
  },

  // Verify signup OTP and complete registration
  verifySignupOTP: async (email, otp, userData) => {
    return apiRequest("/user/verify-signup-otp", {
      method: "POST",
      body: JSON.stringify({
        email,
        otp,
        name: userData.name,
        username: userData.username,
        password: userData.password
      }),
    });
  },

  // Google OAuth authentication
  googleAuth: async (credential) => {
    return apiRequest("/user/google-auth", {
      method: "POST",
      body: JSON.stringify({ credential }),
    });
  },

  // Get current user data
  getCurrentUser: async () => {
    const userToken = localStorage.getItem("token");
    return apiRequest(
      "/user/me",
      {
        method: "GET",
      },
      userToken
    );
  },

  // Update user profile (name, username, avatar)
  updateUser: async (userData, avatarFile) => {
    const userToken = localStorage.getItem("token");
    const formData = new FormData();

    if (userData.name) formData.append('name', userData.name);
    if (userData.username) formData.append('username', userData.username);

    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    return apiRequest(
      "/user/update",
      {
        method: "PUT",
        body: formData,
      },
      userToken
    );
  },
};

/**
 * Admin APIs - puzzle management
 */
export const adminAPI = {
  // Login admin
  login: async (email, password) => {
    return apiRequest(
      "/admin/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
      null
    ); // Don't send token for login
  },
  // Get all puzzles (admin view)
  getPuzzles: async () => {
    const adminToken = localStorage.getItem("atoken");
    // Matches backend router: app.use('/api/puzzles', puzzleRouter)
    // backend route: router.get('/get-puzzles', ...)
    return apiRequest(
      "/puzzle/get-puzzles",
      {
        method: "GET",
      },
      adminToken
    );
  },
  // Get a puzzle by id
  getPuzzleById: async (id) => {
    const adminToken = localStorage.getItem("atoken");
    // backend route: router.get('/get-puzzle/:id', ...)
    return apiRequest(
      `/puzzle/get-puzzle/${id}`,
      {
        method: "GET",
      },
      adminToken
    );
  },

  // Create a puzzle
  createPuzzle: async (puzzleData) => {
    const adminToken = localStorage.getItem("atoken");

    return apiRequest("/puzzle/create-puzzle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(puzzleData),
    });
  },

  // Bulk create puzzles
  bulkCreatePuzzles: async (puzzles) => {
    const adminToken = localStorage.getItem("atoken");

    return apiRequest("/puzzle/bulk-create-puzzle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(puzzles),
    });
  },

  // Export puzzles
  exportPuzzles: async () => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest("/puzzle/export-puzzles", {
      method: "GET",
    }, adminToken);
  },

  // Update a puzzle
  updatePuzzle: async (id, puzzleData) => {
    const adminToken = localStorage.getItem("atoken");
    // backend route: router.put('/update-puzzle/:id', ...)
    return apiRequest(
      `/puzzle/update-puzzle/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(puzzleData),
      },
      adminToken
    );
  },
  // Delete a puzzle
  deletePuzzle: async (id) => {
    const adminToken = localStorage.getItem("atoken");
    // backend route: router.delete('/delete-puzzle/:id', ...)
    return apiRequest(
      `/puzzle/delete-puzzle/${id}`,
      {
        method: "DELETE",
      },
      adminToken
    );
  },

  // Delete ALL puzzles
  deleteAllPuzzles: async () => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      "/puzzle/delete-all-puzzles",
      {
        method: "DELETE",
      },
      adminToken
    );
  },

  // Delete multiple puzzles
  deleteMultiplePuzzles: async (puzzleIds) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      "/puzzle/delete-multiple-puzzles",
      {
        method: "POST",
        body: JSON.stringify({ puzzleIds }),
      },
      adminToken
    );
  },

  // Import puzzles from Lichess
  importFromLichess: async (count = 50) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      "/puzzle/import-lichess",
      {
        method: "POST",
        body: JSON.stringify({ count }),
      },
      adminToken
    );
  },

  // Get puzzles with filters
  getPuzzlesFiltered: async (filters = {}) => {
    const adminToken = localStorage.getItem("atoken");
    const queryParams = new URLSearchParams(filters).toString();
    return apiRequest(
      `/puzzle/puzzles-filtered?${queryParams}`,
      {
        method: "GET",
      },
      adminToken
    );
  },

  // Get puzzle statistics
  getPuzzleStats: async () => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      "/puzzle/puzzle-stats",
      {
        method: "GET",
      },
      adminToken
    );
  },

  // Get all users/students
  getAllUsers: async () => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      "/admin/users",
      {
        method: "GET",
      },
      adminToken
    );
  },

  // Delete a user by ID
  deleteUser: async (id) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      `/admin/users/${id}`,
      {
        method: "DELETE",
      },
      adminToken
    );
  },
};

/**
 * Public puzzle APIs
 */
export const puzzleAPI = {
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const url = `/puzzle/get-puzzles${queryParams ? `?${queryParams}` : ''}`;
    return apiRequest(
      url,
      {
        method: "GET",
      },
      null
    );
  },

  // Get random puzzle from Lichess (for casual play)
  getRandomPuzzle: async () => {
    return apiRequest(
      "/puzzle/random-puzzle",
      {
        method: "GET",
      },
      null
    );
  },
};

/**
 * Category APIs
 */
export const categoryAPI = {
  // Get all categories
  getAll: async (includeInactive = false) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      `/category/get-categories?includeInactive=${includeInactive}`,
      {
        method: "GET",
      },
      adminToken
    );
  },

  // Get category by ID
  getById: async (id) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      `/category/get-category/${id}`,
      {
        method: "GET",
      },
      adminToken
    );
  },

  // Create category
  createCategory: async (categoryData) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      "/category/create-category",
      {
        method: "POST",
        body: JSON.stringify(categoryData),
      },
      adminToken
    );
  },

  // Update category
  updateCategory: async (id, categoryData) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      `/category/update-category/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(categoryData),
      },
      adminToken
    );
  },

  // Delete category
  deleteCategory: async (id) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      `/category/delete-category/${id}`,
      {
        method: "DELETE",
      },
      adminToken
    );
  },

  // Get category statistics
  getStats: async () => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      "/category/category-stats",
      {
        method: "GET",
      },
      adminToken
    );
  },
};

export const competitionAPI = {
  // Get all competitions
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return apiRequest(
      `/competition/?${queryParams}`,
      {
        method: "GET",
      },
      null
    );
  },

  // Get competitions with filters (alias for getAll)
  getCompetitions: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return apiRequest(
      `/competition/?${queryParams}`,
      {
        method: "GET",
      },
      null
    );
  },

  // Get competition by ID
  getById: async (id) => {
    return apiRequest(`/competition/${id}`, {
      method: "GET",
    });
  },

  // Create competition
  createCompetition: async (competitionData) => {
    const adminToken = localStorage.getItem("atoken");

    return apiRequest(
      "/competition/create-competition",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(competitionData),
      },
      adminToken
    );
  },


  // Update competition
  updateCompetition: async (id, competitionData) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      `/competition/update-competition/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(competitionData),
      },
      adminToken
    );
  },

  // Delete competition
  deleteCompetition: async (id) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      `/competition/delete-competition/${id}`,
      {
        method: "DELETE",
      },
      adminToken
    );
  },

  // Join competition (user)
  joinCompetition: async (id, accessCode = null) => {
    const userToken = localStorage.getItem("token");
    const body = {};
    if (accessCode) {
      body.accessCode = accessCode;
    }

    return apiRequest(
      `/competition/${id}/join`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      userToken
    );
  },

  // Submit solution (user)
  submitSolution: async (competitionId, puzzleId, moves, timeTaken) => {
    const userToken = localStorage.getItem("token");
    return apiRequest(
      `/competition/${competitionId}/submit/${puzzleId}`,
      {
        method: "POST",
        body: JSON.stringify({ moves, timeTaken }),
      },
      userToken
    );
  },

  // Get leaderboard
  getLeaderboard: async (id) => {
    return apiRequest(`/competition/${id}/leaderboard`, {
      method: "GET",
    });
  },

  // Add puzzles to competition
  addPuzzlesToCompetition: async (competitionId, puzzleIds) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      `/competition/${competitionId}/add-puzzles`,
      {
        method: "POST",
        body: JSON.stringify({ puzzles: puzzleIds }),
      },
      adminToken
    );
  },

  // Get puzzles for competition creation with advanced filtering
  getPuzzlesForCompetition: async (filters = {}) => {
    const adminToken = localStorage.getItem("atoken");
    const queryParams = new URLSearchParams(filters).toString();
    return apiRequest(
      `/competition/puzzles/for-competition?${queryParams}`,
      {
        method: "GET",
      },
      adminToken
    );
  },
};

export default {
  authAPI,
  adminAPI,
  puzzleAPI,
  categoryAPI,
  competitionAPI,
};
