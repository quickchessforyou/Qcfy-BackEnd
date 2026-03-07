// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

/**
 * Generic API request function for live competitions
 */
const apiRequest = async (endpoint, options = {}, token = null) => {
  const authToken = token || localStorage.getItem("token");

  const config = {
    ...options,
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Handle 401 Unauthorized (Token expired or user invalid)
    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Force redirect to login/home
      window.location.href = "/";
      throw new Error("Session expired. Please login again.");
    }

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
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Could not connect to server. Please check if the backend is running.');
    }
    throw error;
  }
};

/**
 * Live Competition APIs
 */
// ─── Short-lived cache for getLobbyState (supports prefetching from Dashboard) ───
const lobbyCache = new Map();
const LOBBY_CACHE_TTL = 3000; // 3 seconds

export const liveCompetitionAPI = {
  // Participate in live competition (REST API validation)
  participate: async (competitionId, username, accessCode = null) => {
    const userToken = localStorage.getItem("token");
    const body = { username };
    if (accessCode) {
      body.accessCode = accessCode;
    }
    return apiRequest(
      `/live-competition/${competitionId}/participate`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      userToken
    );
  },

  // Submit entire competition (early submission)
  submitCompetition: async (competitionId) => {
    const userToken = localStorage.getItem("token");
    return apiRequest(
      `/live-competition/${competitionId}/submit`,
      {
        method: "POST",
      },
      userToken
    );
  },

  // Submit puzzle solution with Socket.IO notification
  submitSolution: async (competitionId, puzzleId, solution, timeSpent, boardPosition = null, moveHistory = []) => {
    const userToken = localStorage.getItem("token");
    const body = { solution, timeSpent };

    if (boardPosition) {
      body.boardPosition = boardPosition;
    }

    if (moveHistory && moveHistory.length > 0) {
      body.moveHistory = moveHistory;
    }

    return apiRequest(
      `/live-competition/${competitionId}/puzzles/${puzzleId}/submit`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      userToken
    );
  },

  // Get live leaderboard (REST API fallback)
  getLeaderboard: async (competitionId) => {
    return apiRequest(`/live-competition/${competitionId}/leaderboard?t=${Date.now()}`, {
      method: "GET",
    });
  },

  getLobbyState: async (competitionId, bypassCache = false) => {
    // Check cache first (supports prefetch from Dashboard hover without delay)
    if (!bypassCache) {
      const cached = lobbyCache.get(competitionId);
      if (cached && (Date.now() - cached.timestamp) < LOBBY_CACHE_TTL) {
        return cached.data;
      }
    }

    const token = localStorage.getItem("token");
    const result = await apiRequest(
      `/live-competition/${competitionId}/lobby-state`,
      { method: "GET" },
      token
    );

    // Cache the result ONLY if it wasn't a bypass call, 
    // or cache it anyway since it's fresh data
    lobbyCache.set(competitionId, { data: result, timestamp: Date.now() });
    return result;
  },

  // Check for active participation
  getActiveParticipation: async () => {
    const userToken = localStorage.getItem("token");
    return apiRequest(
      `/live-competition/user/active-participation`,
      { method: "GET" },
      userToken
    );
  },


  // Get competition puzzles for participants
  getPuzzles: async (competitionId) => {
    const userToken = localStorage.getItem("token");
    return apiRequest(
      `/live-competition/${competitionId}/puzzles`,
      {
        method: "GET",
      },
      userToken
    );
  },

  // Start competition (Admin only)
  startCompetition: async (competitionId) => {
    const adminToken = localStorage.getItem("atoken");
    return apiRequest(
      `/live-competition/${competitionId}/start`,
      {
        method: "POST",
      },
      adminToken
    );
  },
};

export default liveCompetitionAPI;