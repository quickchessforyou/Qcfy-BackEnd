import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { competitionAPI } from "../../services/api";
import { liveCompetitionAPI } from "../../services/liveCompetitionAPI";
import socketService from "../../services/socketService";
import { useAuth } from "../../contexts/AuthContext";
import { useLiveCompetition } from "../../contexts/LiveCompetitionContext"; // Import Context
import {
  FaClock,
  FaTrophy,
  FaUserCircle,
  FaCheckCircle,
  FaHourglassStart,
  FaPlayCircle,
  FaBolt,
  FaChartLine,
  FaHistory,
  FaArrowUp,
  FaMedal,
  FaCrown,
  FaFire,
} from "react-icons/fa";
import { useRef } from "react";
import toast from "react-hot-toast";
import styles from "./CompetitionLobby.module.css";

const CompetitionLobby = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Use Context for Real-time updates
  const {
    leaderboard: liveLeaderboard,
    competitionEnded,
    isConnected,
    participateInCompetition, // Ensure we can connect if not already
  } = useLiveCompetition();

  const [competition, setCompetition] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState("");

  // New simplified state
  const [competitionState, setCompetitionState] = useState("");
  const [participantState, setParticipantState] = useState("NOT_JOINED");
  // serverTime state removed to prevent re-renders
  const [isJoinProcessing, setIsJoinProcessing] = useState(false);
  const timeOffsetRef = useRef(0);

  const getServerNow = () => Date.now() + timeOffsetRef.current;
  // Track redirect to prevent back-button loops
  const hasAutoRedirectedRef = useRef(
    sessionStorage.getItem(`redirected_${id}`) === "true",
  );

  // REF that always holds the latest participantState — solves stale closure bug
  const participantStateRef = useRef(participantState);
  participantStateRef.current = participantState;

  // Access Code Modal State
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Handle Competition Events from Socket
  useEffect(() => {
    // We can use socketService directly to listen for events
    // This allows us to navigate even if state hasn't propagated yet

    // Define handlers
    const onCompetitionStarted = () => {
      setCompetitionState("LIVE");

      if (
        !hasAutoRedirectedRef.current &&
        (participantStateRef.current === "JOINED" ||
          participantStateRef.current === "PLAYING")
      ) {
        hasAutoRedirectedRef.current = true;
        sessionStorage.setItem(`redirected_${id}`, "true");

        toast.success("Competition Started! Redirecting...");

        navigate(`/competition/${id}/puzzle`, { replace: true });
      }
    };

    const onCompetitionEnded = (data) => {
      setCompetitionState("ENDED");
      // Update leaderboard with final results
      if (data && data.leaderboard) {
        setParticipants(data.leaderboard);
      }
      toast.success("Competition Ended! Redirecting to Leaderboard...");
      setTimeout(() => {
        navigate(`/leaderboard/${id}`);
      }, 1500);
    };

    const onLeaderboardUpdate = (leaderboard) => {
      setParticipants(leaderboard);
    };

    const onLiveScoreUpdate = (data) => {
      // Real-time score update for individual player
      setParticipants((prev) => {
        const updated = prev.map((p) =>
          p.userId === data.userId
            ? {
              ...p,
              score: data.score,
              puzzlesSolved: data.puzzlesSolved,
              timeSpent: data.timeSpent,
              status: data.status,
            }
            : p,
        );
        // Re-sort by puzzles solved, then time
        return updated.sort((a, b) => {
          if (b.puzzlesSolved !== a.puzzlesSolved)
            return b.puzzlesSolved - a.puzzlesSolved;
          return a.timeSpent - b.timeSpent;
        });
      });
    };

    const onParticipantSubmitted = (data) => {
      // Refresh leaderboard when someone submits
      liveCompetitionAPI.getLobbyState(id).then((res) => {
        if (res.success) {
          setParticipants(res.leaderboard);
          // Update participant state if it's the current user
          if (participantState === "PLAYING") {
            setParticipantState("SUBMITTED");
          }
        }
      });
    };

    // Attach listeners
    socketService.on("competitionStarted", onCompetitionStarted);
    socketService.on("competitionEnded", onCompetitionEnded);
    socketService.on("leaderboardUpdate", onLeaderboardUpdate);
    socketService.on("liveScoreUpdate", onLiveScoreUpdate);
    socketService.on("participantSubmitted", onParticipantSubmitted);

    // Cleanup
    return () => {
      socketService.off("competitionStarted", onCompetitionStarted);
      socketService.off("competitionEnded", onCompetitionEnded);
      socketService.off("leaderboardUpdate", onLeaderboardUpdate);
      socketService.off("liveScoreUpdate", onLiveScoreUpdate);
      socketService.off("participantSubmitted", onParticipantSubmitted);
    };
  }, [id, navigate]);

  // Sync Participants with Live Leaderboard if available
  useEffect(() => {
    if (isConnected && liveLeaderboard && liveLeaderboard.length > 0) {
      setParticipants(liveLeaderboard);
    }
  }, [liveLeaderboard, isConnected]);

  useEffect(() => {
    if (competitionState === "ENDED") {
      navigate(`/leaderboard/${id}`, { replace: true });
    }
  }, [competitionState, id, navigate]);

  // Declarative Auto-Redirect (Handles background tabs securely)
  useEffect(() => {
    if (
      !hasAutoRedirectedRef.current &&
      (competitionState === "LIVE" || competitionState === "PLAYING") &&
      (participantState === "JOINED" || participantState === "PLAYING")
    ) {
      hasAutoRedirectedRef.current = true;
      sessionStorage.setItem(`redirected_${id}`, "true");
      navigate(`/competition/${id}/puzzle`, { replace: true });
    }
  }, [competitionState, participantState, navigate, id]);

  // Main Load Effect
  useEffect(() => {
    async function loadLobby() {
      try {
        const res = await liveCompetitionAPI.getLobbyState(id);

        if (res.success) {
          setCompetition(res.competition);
          // Always update participants from server (server is source of truth)
          setParticipants(res.leaderboard);

          setCompetitionState(res.competitionState);
          setParticipantState(res.participantState);

          if (res.serverTime) {
            timeOffsetRef.current = res.serverTime - Date.now();
          }
          // Predict start redirect using server time
          if (res.competition && res.competition.startTime) {
            const start = new Date(res.competition.startTime).getTime();
            const delay = start - getServerNow();

            if (
              delay > 0 &&
              (res.participantState === "JOINED" ||
                res.participantState === "PLAYING")
            ) {
              setTimeout(() => {
                if (!hasAutoRedirectedRef.current) {
                  hasAutoRedirectedRef.current = true;
                  sessionStorage.setItem(`redirected_${id}`, "true");
                  navigate(`/competition/${id}/puzzle`, { replace: true });
                }
              }, delay);
            }
          }
        } else {
          setError(res.message || "Failed to load lobby.");
        }
      } catch (err) {
        console.error(err);
        setError("Error loading competition.");
      } finally {
        setLoading(false);
      }
    }

    loadLobby();

    // Poll occasionally to sync server time/state if socket fails (bypass cache)
    const interval = setInterval(() => {
      liveCompetitionAPI
        .getLobbyState(id, true)
        .then((res) => {
          if (res.success) {
            setCompetition(res.competition);
            setParticipants(res.leaderboard);
            setCompetitionState(res.competitionState);
            // Only update participantState if we haven't optimistically joined
            if (res.participantState !== "NOT_JOINED") {
              setParticipantState(res.participantState);
            } else if (participantStateRef.current === "NOT_JOINED") {
              setParticipantState(res.participantState);
            }
            if (res.serverTime)
              timeOffsetRef.current = res.serverTime - Date.now();
          }
        })
        .catch(() => { });
    }, 15000);
    return () => clearInterval(interval);
  }, [id]);

  // Timer Logic simplified
  useEffect(() => {
    if (competition) {
      const timer = setInterval(() => {
        calculateTimeLeft();
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [competition, competitionState]);

  const calculateTimeLeft = () => {
    if (!competition) return;

    const start = new Date(competition.startTime).getTime();
    const end = new Date(competition.endTime).getTime();
    const now = Date.now() + timeOffsetRef.current;

    // Check if competition should have started
    if (
      competitionState === "UPCOMING" &&
      now >= start &&
      !hasAutoRedirectedRef.current &&
      (participantStateRef.current === "JOINED" ||
        participantStateRef.current === "PLAYING")
    ) {
      // Refresh state to get LIVE status (bypass cache)
      liveCompetitionAPI
        .getLobbyState(id, true)
        .then((res) => {
          if (res.success && res.competitionState === "LIVE") {
            setCompetitionState("LIVE");
            // Auto-redirect if user is joined and we haven't already redirected
            if (
              !hasAutoRedirectedRef.current &&
              (res.participantState === "JOINED" ||
                res.participantState === "PLAYING" ||
                participantStateRef.current === "JOINED")
            ) {
              hasAutoRedirectedRef.current = true;
              sessionStorage.setItem(`redirected_${id}`, "true");
              toast.success("Competition Started! Redirecting...");
              setTimeout(() => {
                navigate(`/competition/${id}/puzzle`, { replace: true });
              }, 100);
            }
          }
        })
        .catch((err) => console.error(err));
    }

    // Determine target based on state
    let target = start;

    if (
      competitionState === "LIVE" ||
      (competitionState === "UPCOMING" && now >= start)
    ) {
      target = end;
    } else if (competitionState === "ENDED") {
      setTimeLeft("Competition Ended!");
      return;
    }

    const diff = target - now;

    if (diff <= 0) {
      if (competitionState === "UPCOMING") {
        setTimeLeft("Starting...");
      } else if (competitionState === "ENDED") {
        setTimeLeft("Competition Ended!");
        navigate(`/leaderboard/${id}`);
      }
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    setTimeLeft(
      `${days > 0 ? days + "d " : ""}${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
    );
  };

  const joinCompetitionWithCode = async (code = null) => {
    if (!user) {
      navigate("/", { state: { openLogin: true } });
      return;
    }

    setIsJoinProcessing(true);
    setCodeError("");
    try {
      // Join competition with access code if provided
      const response = await liveCompetitionAPI.participate(
        id,
        user.username || user.name,
        code,
      );

      if (response.success) {
        // 1. Instantly update UI (Optimistic update)
        setShowCodeModal(false);
        setAccessCodeInput("");
        setParticipantState("JOINED");
        participantStateRef.current = "JOINED";

        // Optimistically add user to leaderboard
        setParticipants((prev) => {
          if (
            prev.some((p) => p.userId === user.id || p.userId?._id === user.id)
          )
            return prev;
          return [
            ...prev,
            {
              userId: user.id || user._id,
              username: user.username || user.name,
              status: "Waiting",
              puzzlesSolved: 0,
              timeSpent: 0,
            },
          ];
        });

        // 2. Refresh full state in background (non-blocking) - *bypass cache!*
        liveCompetitionAPI
          .getLobbyState(id, true)
          .then((res) => {
            if (res.success) {
              // Only update if it doesn't overwrite our optimistic join
              if (res.participantState !== "NOT_JOINED") {
                setParticipantState(res.participantState);
              }
              setCompetitionState(res.competitionState);
              setParticipants(res.leaderboard);

              // Auto-redirect if the competition is already live or user is already playing
              if (
                !hasAutoRedirectedRef.current &&
                (res.competitionState === "LIVE" ||
                  res.competitionState === "PLAYING" ||
                  res.participantState === "PLAYING")
              ) {
                hasAutoRedirectedRef.current = true;
                toast.success("Competition Active! Redirecting...");
                setTimeout(() => {
                  navigate(`/competition/${id}/puzzle`);
                }, 100);
              }
            }
          })
          .catch((err) =>
            console.error("Background lobby refresh failed:", err),
          );

        // 3. Join socket room for real-time updates
        // The socket connection should be established when user enters the lobby
        // We'll join the competition room when socket is ready
        socketService
          .connect({ competition: { id } })
          .then(() => {
            socketService.socket?.emit("joinCompetition", {
              competitionId: id,
            });
          })
          .catch((err) => {
            console.error("Socket connection failed:", err);
          });
      }
    } catch (err) {
      const errorData = err?.response?.data || {};
      const msg =
        errorData.error || errorData.message || err.message || "Failed to join";

      // If already joined, just update state optimistically
      if (
        msg.toLowerCase().includes("already") ||
        msg.toLowerCase().includes("participating")
      ) {
        setParticipantState("JOINED");
        participantStateRef.current = "JOINED";
        setShowCodeModal(false);
        setAccessCodeInput("");

        liveCompetitionAPI
          .getLobbyState(id, true)
          .then((res) => {
            if (res.success && res.participantState !== "NOT_JOINED") {
              setParticipantState(res.participantState);
            }
          })
          .catch((e) => console.error("Background lobby refresh failed:", e));
      } else {
        if (code !== null) {
          setCodeError(msg);
        } else {
          alert(msg);
        }
      }
    } finally {
      setIsJoinProcessing(false);
    }
  };

  const handleJoin = () => {
    if (!user) {
      navigate("/", { state: { openLogin: true } });
      return;
    }

    // Check if access code is required (from competition data)
    if (competition && competition.requiresAccessCode) {
      setShowCodeModal(true);
      setAccessCodeInput("");
      setCodeError("");
      return;
    }

    joinCompetitionWithCode(null);
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    // Server will validate the code, just send it
    if (accessCodeInput.trim()) {
      await joinCompetitionWithCode(accessCodeInput.trim());
    } else {
      setCodeError("Please enter an access code");
    }
  };

  const handleEnterCompetition = () => {
    if (participantState === "SUBMITTED" || participantState === "ENDED") {
      alert(
        "You have already submitted your score. Waiting for other players to finish...",
      );
      return;
    }

    navigate(`/competition/${id}/puzzle`, {
      state: {
        competitionId: competition._id,
        competitionTitle: competition.title || competition.name,
        puzzles: competition.puzzles,
        time: competition.duration,
      },
    });
  };

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return "--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatus = (participant) => {
    // Just fallback if participant.status isn't populated for some reason
    if (participant.status) return participant.status;
    if (participant.isSubmitted) return "Submitted";
    return "Waiting";
  };

  // Helper function to calculate accuracy
  const calculateAccuracy = (puzzlesSolved, totalPuzzles) => {
    if (!totalPuzzles || totalPuzzles === 0) return 0;
    return Math.round((puzzlesSolved / totalPuzzles) * 100);
  };

  if (loading) return <div className={styles.loadingContainer}>Loading...</div>;
  if (error) return <div className={styles.errorContainer}>{error}</div>;

  // IF competition state is ENDED, the useEffect above will redirect the user.
  // In the split second before redirect, we can show a brief loading or transition message.
  if (competitionState === "ENDED") {
    return (
      <div className={styles.loadingContainer}>
        <h2>Redirecting to Leaderboard...</h2>
      </div>
    );
  }

  // ORIGINAL LOBBY VIEW FOR UPCOMING/LIVE COMPETITIONS

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentParticipants = participants.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(participants.length / itemsPerPage);

  const handlePageChange = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  return (
    <div className={styles.competitionLobby}>
      {/* Modal for Access Code */}
      {showCodeModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Enter Access Code</h3>
            <p>This competition is password protected.</p>
            <form onSubmit={handleCodeSubmit}>
              <input
                type="text"
                placeholder="Enter Code"
                value={accessCodeInput}
                onChange={(e) => setAccessCodeInput(e.target.value)}
                className={styles.codeInput}
                autoFocus
              />
              {codeError && <p className={styles.errorMsg}>{codeError}</p>}
              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowCodeModal(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Join
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header Card */}
      <div className={`${styles.lobbyCard} ${styles.headerCard}`}>
        <div className={styles.headerLeft}>
          <h1 className={styles.compTitle}>
            {competition?.title || competition?.name}
            <span className={styles.compDate}>
              {competition?.startTime &&
                ` – ${new Date(competition.startTime).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}`}
            </span>
          </h1>
          <div className={styles.statusBadgeContainer}>
            <span
              className={`${styles.statusPill} ${styles[competitionState?.toLowerCase() || "upcoming"]}`}
            >
              {competitionState || "UPCOMING"}
            </span>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.timerSection}>
            {/* Show countdown timer for live/upcoming */}
            {(competitionState === "UPCOMING" ||
              competitionState === "LIVE") && (
                <div className={styles.countdownDisplay}>
                  <span className={styles.timerLabel}>
                    {competitionState === "LIVE" ? "Ends in:" : "Starts in:"}
                  </span>
                  <div className={styles.timerValue}>
                    <FaClock className={styles.timerIcon} />{" "}
                    {timeLeft || "--:--:--"}
                  </div>
                </div>
              )}

            <div className={styles.actionButtons}>
              {participantState === "NOT_JOINED" ? (
                <button
                  className={`${styles.actionBtn} ${styles.joinBtn}`}
                  onClick={handleJoin}
                  disabled={isJoinProcessing}
                >
                  {isJoinProcessing ? "Joining..." : "Join Competition"}
                </button>
              ) : (
                <>
                  {/* If joined, we show 'Joined' status OR 'Enter' if it's Live/Playing */}
                  {/* Logic: If competition is live, show Enter. If upcoming, show Joined. */}

                  {participantState === "SUBMITTED" ? (
                    <span
                      className={styles.joinedText}
                      style={{
                        color: "#d97706",
                        backgroundColor: "rgba(217, 119, 6, 0.1)",
                        borderColor: "rgba(217, 119, 6, 0.2)",
                      }}
                    >
                      <FaCheckCircle /> Submitted
                    </span>
                  ) : competitionState === "LIVE" ||
                    competitionState === "PLAYING" ? (
                    <button
                      className={`${styles.actionBtn} ${styles.enterBtn}`}
                      onClick={handleEnterCompetition}
                    >
                      {participantState === "PLAYING"
                        ? "Resume Competition"
                        : "Enter Competition"}
                    </button>
                  ) : (
                    <span className={styles.joinedText}>
                      <FaCheckCircle />{" "}
                      {competitionState === "UPCOMING"
                        ? "Waiting to start"
                        : "Joined"}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Split Layout */}
      <div className={styles.lobbyMainContent}>
        {/* Participants Card */}
        <div className={`${styles.lobbyCard} ${styles.participantsCard}`}>
          <h2 className={styles.sectionTitle}>
            Participants ({participants.length})
          </h2>
          <div className={styles.tableResponsive}>
            <table className={styles.participantsTable}>
              <thead>
                <tr>
                  <th className={styles.thRank}>Rank</th>
                  <th className={styles.thPlayer}>Player</th>
                  <th className={styles.thStatus}>Status</th>
                  <th className={styles.thPuzzles}>Score</th>
                  <th className={styles.thTime}>Time</th>
                </tr>
              </thead>
              <tbody>
                {participants.length > 0 ? (
                  currentParticipants.map((p, idx) => {
                    const actualRank = indexOfFirstItem + idx + 1;
                    return (
                      <tr
                        key={p.userId || idx}
                        className={`${p.userId === user?.id ? styles.rowHighlight : ""}`}
                      >
                        <td className={styles.tdRank}>#{actualRank}</td>
                        <td className={styles.tdPlayer}>
                          <div className={styles.playerInfo}>
                            {p.userId === user?.id ? (
                              <span
                                className={`${styles.playerAvatar} ${styles.self}`}
                              >
                                You
                              </span>
                            ) : (
                              <span className={styles.playerAvatar}>
                                <FaUserCircle />
                              </span>
                            )}
                            <span className={styles.playerName}>
                              {p.username || p.name || "User"}
                            </span>
                          </div>
                        </td>
                        <td className={styles.tdStatus}>
                          <span
                            className={`${styles.statusBadge} ${styles[getStatus(p).toLowerCase()] || styles.defaultStatus}`}
                          >
                            {getStatus(p)}
                          </span>
                        </td>
                        <td className={styles.tdPuzzles}>
                          <div className={styles.scoreContainer}>
                            <span className={styles.scoreHighlight}>
                              {p.puzzlesSolved || 0}
                            </span>
                            <span className={styles.scoreSeparator}>/</span>
                            <span className={styles.scoreTotal}>
                              {competition?.totalPuzzles ||
                                competition?.puzzles?.length ||
                                0}
                            </span>
                          </div>
                        </td>
                        <td className={styles.tdTime}>
                          <span className={styles.timeBadge}>
                            {p.timeSpent ? formatTime(p.timeSpent) : "--:--"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className={styles.emptyRow}>
                      No participants yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination UI */}
          {totalPages > 1 && (
            <div
              className={styles.paginationContainer}
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "10px",
                marginTop: "15px",
              }}
            >
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background:
                    currentPage === 1 ? "rgba(255,255,255,0.05)" : "#d4a373",
                  color: currentPage === 1 ? "#666" : "#fff",
                  border: "none",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                }}
              >
                Prev
              </button>
              <span
                style={{
                  color: "#d4a373",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background:
                    currentPage === totalPages
                      ? "rgba(255,255,255,0.05)"
                      : "#d4a373",
                  color: currentPage === totalPages ? "#666" : "#fff",
                  border: "none",
                  cursor:
                    currentPage === totalPages ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Rules Card */}
        <div className={`${styles.lobbyCard} ${styles.rulesCard}`}>
          <h2 className={styles.sectionTitle}>
            <FaFire className={styles.titleIcon} /> Rules & Guidelines
          </h2>
          <ul className={styles.rulesList}>
            <li>
              <div className={styles.ruleIconWrapper}>
                <FaCheckCircle className={styles.ruleIcon} />
              </div>
              <span>
                <strong>Stable Connection:</strong> Ensure a stable internet
                connection before joining.
              </span>
            </li>
            <li>
              <div className={styles.ruleIconWrapper}>
                <FaClock className={styles.ruleIcon} />
              </div>
              <span>
                <strong>Time Management:</strong> Keep an eye on the timer;
                solve puzzles within the duration.
              </span>
            </li>
            <li>
              <div className={styles.ruleIconWrapper}>
                <FaBolt className={styles.ruleIcon} />
              </div>
              <span>
                <strong>Scoring System:</strong> Points consider both accuracy
                and speed of solving.
              </span>
            </li>
            <li>
              <div className={styles.ruleIconWrapper}>
                <FaUserCircle className={styles.ruleIcon} />
              </div>
              <span>
                <strong>Fair Play:</strong> Use of external engines or outside
                help is strictly prohibited.
              </span>
            </li>
            <li>
              <div className={styles.ruleIconWrapper}>
                <FaTrophy className={styles.ruleIcon} />
              </div>
              <span>
                <strong>Leaderboard:</strong> Top players will be featured on
                the podium at the end.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CompetitionLobby;
