import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.competitionId = null;
    this.listeners = new Map();
  }

  // Connect to Socket.IO server
  connect(competitionData) {
    return new Promise((resolve, reject) => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          return reject(new Error("Authentication token required"));
        }

        // If already connected, just return success
        if (this.socket && this.isConnected) {
          this.joinCompetition(competitionData);
          return resolve(this.socket);
        }

        const socketUrl =
          import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

        this.socket = io(socketUrl, {
          auth: {
            token: token,
          },
          transports: ["websocket", "polling"],
        });

        this.competitionId = competitionData.competition.id;

        // Connection event handlers
        this.socket.on("connect", () => {
          console.log("Connected to Socket.IO server:", this.socket.id);
          this.isConnected = true;

          // Join competition room
          this.joinCompetition(competitionData);
          resolve(this.socket);
        });

        this.socket.on("disconnect", (reason) => {
          console.log("Disconnected from Socket.IO server:", reason);
          this.isConnected = false;
        });

        this.socket.on("connect_error", (error) => {
          console.error("Socket connection error:", error);
          this.isConnected = false;
          reject(error);
        });

        // Competition-specific event handlers
        this.setupCompetitionListeners();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Join competition room
  joinCompetition(competitionData) {
    if (!this.socket || !this.isConnected) {
      console.error("Socket not connected");
      return;
    }

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    this.socket.emit("joinCompetition", {
      competitionId: competitionData.competition.id,
      username: user.username || user.name || "Anonymous",
    });

    console.log(`Joining competition: ${competitionData.competition.name}`);
  }

  // Setup competition-specific event listeners
  setupCompetitionListeners() {
    if (!this.socket) return;

    // Leaderboard updates
    this.socket.on("leaderboardUpdate", (leaderboard) => {
      console.log("Leaderboard updated:", leaderboard?.length, "entries");
      this.emit("leaderboardUpdate", leaderboard);
    });

    // Live score update (individual player)
    this.socket.on("liveScoreUpdate", (data) => {
      console.log("Live score update:", data?.username, data?.score);
      this.emit("liveScoreUpdate", data);
    });

    // Competition ended
    this.socket.on("competitionEnded", (finalResults) => {
      console.log("Competition ended:", finalResults);
      this.emit("competitionEnded", finalResults);
    });

    // Participant joined
    this.socket.on("participantJoined", (data) => {
      console.log("New participant joined:", data);
      this.emit("participantJoined", data);
    });

    // Competition started
    this.socket.on("competitionStarted", (data) => {
      console.log("Competition started:", data);
      this.emit("competitionStarted", data);
    });

    // Competition Joined (Initial Data & Time Sync)
    this.socket.on("competitionJoined", (data) => {
      console.log("Joined competition:", data);
      this.emit("competitionJoined", data);
    });

    // Error handling
    this.socket.on("error", (error) => {
      console.error("Socket error:", error);
      this.emit("error", error);
    });
  }

  // Add event listener
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Remove event listener
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Emit event to listeners
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error("Error in event listener:", error);
        }
      });
    }
  }

  // Refresh leaderboard manually
  refreshLeaderboard() {
    if (this.socket && this.isConnected && this.competitionId) {
      this.socket.emit("refreshLeaderboard", {
        competitionId: this.competitionId,
      });
    }
  }

  // Disconnect from socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.competitionId = null;
      this.listeners.clear();
      console.log("Socket disconnected");
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      competitionId: this.competitionId,
      socketId: this.socket?.id || null,
    };
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
