import React, { useState, useEffect } from "react";
import { liveCompetitionAPI } from "../../services/liveCompetitionAPI";
import socketService from "../../services/socketService";
import {
  FaTrophy,
  FaMedal,
  FaUserCircle,
  FaSync,
  FaClock,
  FaPuzzlePiece,
} from "react-icons/fa";
import "./CompetitionLeaderboard.css";

const CompetitionLeaderboard = ({
  competitionId,
  isLive = false,
  theme = "dark",
}) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!competitionId) return;

    // Load initial leaderboard
    loadLeaderboard();

    // If it's a live competition, setup real-time updates and ensure participation
    if (isLive) {
      ensureParticipation();
      setupLiveUpdates();
    }

    return () => {
      if (isLive) {
        cleanup();
      }
    };
  }, [competitionId, isLive]);

  const ensureParticipation = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const token = localStorage.getItem("token");

      if (!user.id || !token) {
        return;
      }

      // Try to participate in the live competition
      await liveCompetitionAPI.participate(
        competitionId,
        user.username || user.name,
      );

      // Reload leaderboard after participation
      setTimeout(() => {
        loadLeaderboard();
      }, 1000);
    } catch (error) {
      // This is expected if user is already participating
    }
  };

  const loadLeaderboard = async () => {
    try {
      setLoading(true);

      const response = await liveCompetitionAPI.getLeaderboard(competitionId);

      if (response.success) {
        setLeaderboard(response.leaderboard);
        setLastUpdate(new Date());
      } else {
        // Fallback to regular competition API
        try {
          const fallbackResponse = await fetch(
            `http://localhost:4000/api/competition/${competitionId}/leaderboard`,
          );
          const fallbackData = await fallbackResponse.json();

          if (fallbackData.leaderboard) {
            // Convert regular leaderboard format to live format
            const convertedLeaderboard = fallbackData.leaderboard.map(
              (participant, index) => ({
                rank: index + 1,
                userId: participant.user._id || participant.user,
                username:
                  participant.user.name ||
                  participant.user.username ||
                  "Unknown",
                score: participant.score || 0,
                puzzlesSolved: participant.ENDEDPuzzles?.length || 0,
                timeSpent: 0,
              }),
            );
            setLeaderboard(convertedLeaderboard);
            setLastUpdate(new Date());
          }
        } catch (fallbackError) {
          console.error("Fallback leaderboard failed:", fallbackError);
        }
      }
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const setupLiveUpdates = () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      socketService
        .connect({
          competition: { id: competitionId },
        })
        .then((socket) => {
          setIsConnected(true);

          const user = JSON.parse(localStorage.getItem("user") || "{}");

          socket.emit("joinCompetition", {
            competitionId,
            username: user.username || user.name || "Anonymous",
          });

          socket.on("connect", () => setIsConnected(true));
          socket.on("disconnect", () => setIsConnected(false));
        })
        .catch((error) => {
          console.error("Socket connection failed:", error);
          setIsConnected(false);
        });

      socketService.on("leaderboardUpdate", (newLeaderboard) => {
        setLeaderboard(newLeaderboard);
        setLastUpdate(new Date());
      });

      socketService.on("error", () => setIsConnected(false));
    } catch (error) {
      setIsConnected(false);
    }
  };

  const cleanup = () => {
    socketService.disconnect();
    setIsConnected(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getRankStart = (rank) => {
    switch (rank) {
      case 1:
        return (
          <div className="rank-icon gold">
            <FaTrophy />
          </div>
        );
      case 2:
        return (
          <div className="rank-icon silver">
            <FaMedal />
          </div>
        );
      case 3:
        return (
          <div className="rank-icon bronze">
            <FaMedal />
          </div>
        );
      default:
        return <div className="rank-number">#{rank}</div>;
    }
  };

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  if (loading) {
    return (
      <div className="competition-leaderboard loading">
        <div className="loading-pulse"></div>
        <p>Fetching rankings...</p>
      </div>
    );
  }

  return (
    <div
      className={`competition-leaderboard ${theme === "light" ? "light-theme" : ""}`}
    >
      <div className="leaderboard-header-stylish">
        <div className="header-content">
          <h3>Top Performers</h3>
          <p className="subtitle">
            {isLive ? "Live Updates" : "Final Results"}
          </p>
        </div>
        <button
          className="refresh-btn-stylish"
          onClick={loadLeaderboard}
          title="Refresh leaderboard"
        >
          <FaSync className={loading ? "spinning" : ""} />
        </button>
      </div>

      <div className="leaderboard-list-stylish">
        {leaderboard.length > 0 ? (
          leaderboard.slice(0, 50).map((participant, index) => (
            <div
              key={participant.userId}
              className={`leaderboard-card ${
                participant.userId === currentUser.id ? "current-user-card" : ""
              } rank-${participant.rank}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="card-left">
                <div className="rank-display">
                  {getRankStart(participant.rank)}
                </div>
                <div className="user-info">
                  <span className="user-avatar">
                    <FaUserCircle />
                  </span>
                  <span className="username">{participant.username}</span>
                  {participant.userId === currentUser.id && (
                    <span className="you-badge">YOU</span>
                  )}
                </div>
              </div>

              <div className="card-right">
                <div className="stat-group primary">
                  <div className="stat-value">{participant.score}</div>
                  <div className="stat-label">PTS</div>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-group">
                  <div className="stat-value">
                    <FaPuzzlePiece className="icon-small" />{" "}
                    {participant.puzzlesSolved}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state-stylish">
            <div className="empty-icon">
              <FaTrophy />
            </div>
            <h3>No Participants Yet</h3>
            <p>Be the first to join and solve puzzles!</p>
            {isLive && (
              <button
                onClick={ensureParticipation}
                className="join-btn-stylish"
              >
                Join Competition
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitionLeaderboard;
