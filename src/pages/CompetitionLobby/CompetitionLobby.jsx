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
  FaChessKnight,
} from "react-icons/fa";
import { useRef } from "react";
import toast from "react-hot-toast";
import styles from "./CompetitionLobby.module.css";
import ParticipantList from "./components/ParticipantList";
import CompetitionTimer from "./components/CompetitionTimer";
import PremiumLoader from "../../components/PremiumLoader/PremiumLoader";

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
      navigate(`/leaderboard/${id}`, { replace: true });
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
    let isMounted = true;

    async function loadLobby() {
      try {
        // FAST PATH: Try to get data with cache entirely bypassed first
        // If the cache hits (either Memory or SessionStorage), it returns instantly.
        const res = await liveCompetitionAPI.getLobbyState(id, false);

        if (isMounted && res.success) {
          setCompetition(res.competition);
          setParticipants(res.leaderboard);
          setCompetitionState(res.competitionState);
          setParticipantState(res.participantState);

          if (res.serverTime) {
            timeOffsetRef.current = res.serverTime - Date.now();
          }

          // Clear the loading screen IMMEDAIATELY since we have acceptable data.
          setLoading(false);

          // If the data came from cache (it was fast), silently trigger a background 
          // fetch to ensure we have the absolute latest accurate leaderboard/timer.
          // This ensures instant UX but fresh data.
          liveCompetitionAPI.getLobbyState(id, true).then((freshRes) => {
            if (isMounted && freshRes.success) {
              setCompetition(freshRes.competition);
              setParticipants(freshRes.leaderboard);
              setCompetitionState(freshRes.competitionState);
              if (freshRes.participantState !== "NOT_JOINED") {
                setParticipantState(freshRes.participantState);
              }
              if (freshRes.serverTime) {
                timeOffsetRef.current = freshRes.serverTime - Date.now();
              }
            }
          }).catch(console.error);

        } else if (isMounted) {
          setError(res.message || "Failed to load lobby.");
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error(err);
          setError("Error loading competition.");
          setLoading(false);
        }
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

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
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

    // Check if competition should have started or is about to start (10s buffer)
    if (
      competitionState === "UPCOMING" &&
      !hasAutoRedirectedRef.current &&
      (participantStateRef.current === "JOINED" ||
        participantStateRef.current === "PLAYING")
    ) {
      const diffToStart = start - now;

      // Auto-redirect when 10 seconds left
      if (diffToStart <= 10000 && diffToStart > 0) {
        hasAutoRedirectedRef.current = true;
        sessionStorage.setItem(`redirected_${id}`, "true");
        toast.success("Competition starting in 10s! Redirecting...");
        navigate(`/competition/${id}/puzzle`, {
          replace: true,
          state: {
            competitionId: competition._id,
            competitionTitle: competition.title || competition.name,
            puzzles: competition.puzzles,
            time: competition.duration,
            isEarlyRedirect: true,
          },
        });
        return;
      }

      // Existing logic for when it should have already started
      if (now >= start) {
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
                navigate(`/competition/${id}/puzzle`, { replace: true });
              }
            }
          })
          .catch((err) => console.error(err));
      }
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
                navigate(`/competition/${id}/puzzle`, { replace: true });
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

  if (loading) {
    return <PremiumLoader text="Entering Lobby..." />;
  }

  if (error) {
    return (
      <div className={styles.premiumLoaderOverlay}>
        <div className={styles.errorBox}>
          <div className={styles.errorIcon}>⚠</div>
          <h3>Lobby Access Failed</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // IF competition state is ENDED, the useEffect above will redirect the user.
  // In the split second before redirect, we can show a brief loading or transition message.
  if (competitionState === "ENDED") {
    return <PremiumLoader text="Redirecting..." />;
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
            <CompetitionTimer
              competitionState={competitionState}
              timeLeft={timeLeft}
            />

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
                      className={`${styles.actionBtn} ${styles.enterBtnLive}`}
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
        <ParticipantList
          participants={participants}
          user={user}
          competition={competition}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
        />

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
