import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FaClock,
  FaCheckCircle,
  FaPuzzlePiece,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";

import ChessBoard from "../../components/ChessBoard/ChessBoard";
import PageHeader from "../../components/PageHeader/PageHeader";
import { puzzleAPI, competitionAPI } from "../../services/api";
import { liveCompetitionAPI } from "../../services/liveCompetitionAPI";
import { useAuth } from "../../contexts/AuthContext";
import { useLiveCompetition } from "../../contexts/LiveCompetitionContext";
import PuzzleRacer from "../../components/PuzzleRacer/PuzzleRacer";
import styles from "./PuzzlePage.module.css";

function PuzzlePage() {
  const { id: paramCompetitionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const {
    participateInCompetition,
    disconnectFromCompetition,
    getLeaderboard,
    leaderboard,
    getCurrentUserRank,
    ensureSocketConnection,
    updateParticipant,
  } = useLiveCompetition();

  // State - Initialize instantly from location.state if available to eliminate loading delays
  const [competitionData, setCompetitionData] = useState(() => {
    if (location.state?.competitionId) {
      return {
        _id: location.state.competitionId,
        name: location.state.competitionTitle,
        duration: location.state.time,
        status: 'live' // Assume live if navigated from lobby
      };
    }
    return null;
  });

  const [puzzles, setPuzzles] = useState(() => {
    if (location.state?.puzzles && Array.isArray(location.state.puzzles)) {
      return location.state.puzzles.map((p, index) => ({
        id: p._id,
        _id: p._id,
        index: index + 1,
        fen: p.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        solution: p.solutionMoves || [],
        alternativeSolutions: p.alternativeSolutions || [],
        title: p.title || `Puzzle ${index + 1}`,
        type: p.type === "kids" ? "Kids" : p.title || "Puzzle",
        difficulty: p.difficulty || "medium",
        puzzleType: p.type || "normal",
        firstMoveBy: p.firstMoveBy || 'human',
        isSolved: false,
        isFailed: false,
        status: "unsolved",
      }));
    }
    return [];
  });
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0); // For pagination (0 = 1-20, 1 = 21-40, etc.)
  const ITEMS_PER_PAGE = 10;

  // Chapter state
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);

  // If we have initial location state, we don't need to show the loading screen at all!
  const [loading, setLoading] = useState(!location.state?.competitionId);
  const [solving, setSolving] = useState(false);
  const [isLiveCompetition, setIsLiveCompetition] = useState(!!location.state?.competitionId);
  const [isReviewMode, setIsReviewMode] = useState(location.state?.reviewMode || false);
  const [showSolution, setShowSolution] = useState(false);

  const [puzzleStatuses, setPuzzleStatuses] = useState({}); // { [puzzleId]: 'success' | 'failed' }
  const [puzzleBoardStates, setPuzzleBoardStates] = useState({}); // { [puzzleId]: { fen: string, moveHistory: string[] } }

  // Timer & Score
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [score, setScore] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());

  // Submission Modal State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Solution Modal State (for Review Mode)
  const [showSolutionModal, setShowSolutionModal] = useState(false);

  // Countdown state for 10-second buffer before start
  const [countdown, setCountdown] = useState(0);

  // Refs for tracking without re-renders
  const timerRef = useRef(null);
  const isLoadedRef = useRef(false);

  // Listen for competition events from socket directly
  useEffect(() => {
    if (isLiveCompetition && paramCompetitionId) {
      const onCompetitionEnded = () => {
        toast.success("Competition Ended! Redirecting to lobby...");
        setTimeout(() => {
          navigate(`/competition/${paramCompetitionId}/lobby`);
        }, 1000);
      };

      // Attach
      import("../../services/socketService").then((module) => {
        const socketService = module.default;
        socketService.on("competitionEnded", onCompetitionEnded);
      });

      return () => {
        import("../../services/socketService").then((module) => {
          const socketService = module.default;
          socketService.off("competitionEnded", onCompetitionEnded);
        });
      };
    }
  }, [isLiveCompetition, paramCompetitionId, navigate]);

  // 1. Initial Data Fetch & Restore
  useEffect(() => {
    loadPuzzleContext();
    return () => {
      clearInterval(timerRef.current);
      // Clean up live competition connection on unmount/change
      if (paramCompetitionId) {
        disconnectFromCompetition();
      }
    };
  }, [paramCompetitionId]);

  // Synchronize Active Chapter with Current Puzzle
  useEffect(() => {
    if (competitionData?.chapters && puzzles.length > 0) {
      const currentPuzzleId = (puzzles[currentPuzzleIndex]?._id || puzzles[currentPuzzleIndex]?.id)?.toString();
      if (!currentPuzzleId) return;

      const chapterIdx = competitionData.chapters.findIndex(ch =>
        (ch.puzzleIds || []).map(id => id.toString()).includes(currentPuzzleId)
      );

      if (chapterIdx !== -1 && chapterIdx !== activeChapterIndex) {
        setActiveChapterIndex(chapterIdx);
        // Automatically sync the pagination frame for the chapter
        const chPuzzleIds = (competitionData.chapters[chapterIdx].puzzleIds || []).map(id => id.toString());
        const navPuzzles = puzzles.filter(p => chPuzzleIds.includes((p._id || p.id).toString()));
        const localIdx = navPuzzles.findIndex(p => (p._id || p.id).toString() === currentPuzzleId);
        if (localIdx !== -1) {
          setCurrentFrame(Math.floor(localIdx / ITEMS_PER_PAGE));
        }
      } else if (chapterIdx !== -1) {
        // Just sync frame if chapter is same but frame might be wrong
        const chPuzzleIds = (competitionData.chapters[chapterIdx].puzzleIds || []).map(id => id.toString());
        const navPuzzles = puzzles.filter(p => chPuzzleIds.includes((p._id || p.id).toString()));
        const localIdx = navPuzzles.findIndex(p => (p._id || p.id).toString() === currentPuzzleId);
        if (localIdx !== -1) {
          const expectedFrame = Math.floor(localIdx / ITEMS_PER_PAGE);
          if (currentFrame !== expectedFrame) {
            setCurrentFrame(expectedFrame);
          }
        }
      }
    }
  }, [currentPuzzleIndex, competitionData?.chapters, puzzles]);

  // Persist State
  useEffect(() => {
    if (!loading && puzzles.length > 0 && isLoadedRef.current) {
      const stateKey = `puzzleState_${paramCompetitionId || "casual"}`;
      const stateToSave = {
        currentPuzzleIndex,
        timeLeft,
        score,
        solvedCount,
        puzzleStatuses,
        puzzleBoardStates,
      };
      localStorage.setItem(stateKey, JSON.stringify(stateToSave));
    }
  }, [
    currentPuzzleIndex,
    timeLeft,
    score,
    solvedCount,
    puzzleStatuses,
    puzzleBoardStates,
    loading,
    paramCompetitionId,
    puzzles,
  ]);

  const loadPuzzleContext = async () => {
    try {
      // Only show loading spinner if we don't have instant state from the Lobby
      if (!location.state?.competitionId) {
        setLoading(true);
      }

      // Check if this is a competition
      if (paramCompetitionId) {
        // Fetch competition data
        const response = await competitionAPI.getById(paramCompetitionId);

        if (!response.success || !response.data) {
          throw new Error("Failed to load competition data");
        }

        const comp = response.data;
        setCompetitionData(comp);

        // Check active status
        const now = new Date();
        const start = new Date(comp.startTime);
        const end = new Date(comp.endTime);

        const isLive = comp.status === "live" || comp.status === "LIVE";
        setIsLiveCompetition(isLive);

        // Check review mode
        const reviewMode = location.state?.reviewMode || false;
        setIsReviewMode(reviewMode);

        if (!reviewMode) {
          if (!isLive) {
            navigate(`/competition/${paramCompetitionId}/lobby`);
            return;
          }
        }

        // Calculate Time Remaining from Server (Source of Truth)
        const msUntilEnd = end - now;
        const secondsLeft = Math.floor(msUntilEnd / 1000);
        setTimeLeft(secondsLeft);

        // LIVE COMPETITION LOGIC
        if (isLive && !reviewMode) {
          try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");

            // Check if we already have valid puzzle data to avoid duplicate participation calls
            const stateKey = `puzzleState_${paramCompetitionId}`;
            const savedState = localStorage.getItem(stateKey);
            let hasValidState = false;

            if (savedState) {
              try {
                const parsed = JSON.parse(savedState);
                hasValidState =
                  parsed.puzzleStatuses &&
                  Object.keys(parsed.puzzleStatuses).length > 0;
              } catch (e) {
                console.error("Error parsing saved state:", e);
              }
            }

            // Only participate if we don't have valid state already
            let participationResponse = null;
            if (!hasValidState) {
              try {
                participationResponse = await participateInCompetition(
                  paramCompetitionId,
                  user.username || user.name,
                );
              } catch (participationError) {
                // Silent handling of participation errors during initialization
                console.log(
                  "Participation error (continuing with fallback):",
                  participationError.message,
                );
              }
            } else {
              console.log(
                "Using existing valid state, skipping participation call",
              );
            }

            // Immediately explicitly fetch the leaderboard so rank is available
            getLeaderboard(paramCompetitionId);
            ensureSocketConnection(paramCompetitionId);

            // Parallel loading for performance
            const [puzzleRes] = await Promise.all([
              liveCompetitionAPI.getPuzzles(paramCompetitionId)
            ]);

            if (puzzleRes.success) {
              // Update Puzzles with IsSolved status
              const normalized = puzzleRes.puzzles.map((p, index) => ({
                id: p._id,
                _id: p._id,
                index: index + 1,
                fen:
                  p.fen ||
                  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                solution: p.solutionMoves || [],
                alternativeSolutions: p.alternativeSolutions || [],
                title: p.title || `Puzzle ${index + 1}`,
                type: p.type === "kids" ? "Kids" : p.title || "Puzzle",
                difficulty: p.difficulty || "medium",
                description: p.description || "",
                kidsConfig: p.kidsConfig,
                puzzleType: p.type || "normal",
                level: p.level || 1,
                rating: p.rating || 400,
                firstMoveBy: p.firstMoveBy || 'human',
                isSolved: p.isSolved,
                isFailed: p.isFailed,
                status: p.status,
              }));
              setPuzzles(normalized);

              // Update Statuses map from server data
              const statuses = {};
              normalized.forEach((p) => {
                if (p.isSolved || p.status === "solved") {
                  statuses[p.id] = "success";
                } else if (p.isFailed || p.status === "failed") {
                  statuses[p.id] = "failed";
                }
              });

              console.log("Setting puzzle statuses from server:", statuses);
              setPuzzleStatuses(statuses);

              // Restore board states from localStorage and merge with server data
              const stateKey = `puzzleState_${paramCompetitionId}`;
              const savedState = localStorage.getItem(stateKey);
              if (savedState) {
                try {
                  const parsed = JSON.parse(savedState);
                  // Merge server statuses with localStorage statuses
                  const mergedStatuses = {
                    ...parsed.puzzleStatuses,
                    ...statuses,
                  };
                  setPuzzleStatuses(mergedStatuses);
                  setPuzzleBoardStates(parsed.puzzleBoardStates || {});
                  console.log(
                    "Merged puzzle statuses (server + localStorage):",
                    mergedStatuses,
                  );
                  console.log(
                    "Restored board states from localStorage:",
                    parsed.puzzleBoardStates,
                  );
                } catch (e) {
                  console.error("Error parsing saved state:", e);
                }
              }

              // Update Score and Solved Count from Backend
              if (puzzleRes.participant) {
                setScore(puzzleRes.participant.score);
                setSolvedCount(puzzleRes.participant.puzzlesSolved);
                // Immediately sync into context so PuzzleRacer shows correct score on first load (no refresh needed)
                updateParticipant({
                  score: puzzleRes.participant.score,
                  puzzlesSolved: puzzleRes.participant.puzzlesSolved,
                });
              }

              // Find first unsolved puzzle
              const firstUnsolved = normalized.findIndex(
                (p) =>
                  !p.isSolved && p.status !== "solved" && p.status !== "failed",
              );
              if (firstUnsolved !== -1) {
                setCurrentPuzzleIndex(firstUnsolved);
              } else {
                // All puzzles are solved, stay on current or go to first
                setCurrentPuzzleIndex(0);
              }
            }
          } catch (err) {
            console.error("Error syncing live competition data", err);
            // Silent error handling during initialization - no toast errors

            // Fallback: Load basic puzzles from competition data
            if (comp.puzzles && comp.puzzles.length > 0) {
              const normalized = comp.puzzles.map((p, index) => ({
                id: p._id,
                _id: p._id,
                index: index + 1,
                fen:
                  p.fen ||
                  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                solution: p.solutionMoves || [],
                alternativeSolutions: p.alternativeSolutions || [],
                title: p.title || `Puzzle ${index + 1}`,
                type: p.type === "kids" ? "Kids" : p.title || "Puzzle",
                difficulty: p.difficulty || "medium",
                description: p.description || "",
                kidsConfig: p.kidsConfig,
                puzzleType: p.type || "normal",
                firstMoveBy: p.firstMoveBy || 'human',
                isSolved: false,
                isFailed: false,
                status: "unsolved",
              }));
              setPuzzles(normalized);

              // Try to restore from localStorage with proper state merging
              const stateKey = `puzzleState_${paramCompetitionId}`;
              const savedState = localStorage.getItem(stateKey);
              if (savedState) {
                try {
                  const parsed = JSON.parse(savedState);
                  setPuzzleStatuses(parsed.puzzleStatuses || {});
                  setPuzzleBoardStates(parsed.puzzleBoardStates || {});
                  setScore(parsed.score || 0);
                  setSolvedCount(parsed.solvedCount || 0);
                  if (parsed.currentPuzzleIndex !== undefined) {
                    setCurrentPuzzleIndex(parsed.currentPuzzleIndex);
                  }
                  console.log("Restored complete state from localStorage:", {
                    statuses: parsed.puzzleStatuses,
                    score: parsed.score,
                    solvedCount: parsed.solvedCount,
                    currentIndex: parsed.currentPuzzleIndex,
                  });
                } catch (e) {
                  console.error("Error parsing saved state:", e);
                }
              }
            }
          }
        }

        // If Puzzles not loaded yet (fallback or non-live or review mode)
        if (
          puzzles.length === 0 &&
          ((!isLive && !reviewMode) || puzzles.length === 0)
        ) {
          // Load Basic Puzzles
          if (comp.puzzles && comp.puzzles.length > 0) {
            const normalized = comp.puzzles.map((p, index) => ({
              id: p._id,
              _id: p._id,
              index: index + 1,
              fen:
                p.fen ||
                "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
              solution: p.solutionMoves || [],
              alternativeSolutions: p.alternativeSolutions || [],
              title: p.title,
              type: p.type,
              difficulty: p.difficulty,
              kidsConfig: p.kidsConfig,
              puzzleType: p.type || "normal",
              level: p.level || 1,
              rating: p.rating || 400,
            }));
            setPuzzles(normalized);
          }
        }

        if (!reviewMode) {
          // If we haven't answered anything and the game is just starting, apply 10s buffer
          const stateKey = `puzzleState_${paramCompetitionId}`;
          const savedState = localStorage.getItem(stateKey);
          let hasStarted = false;

          if (savedState) {
            try {
              const parsed = JSON.parse(savedState);
              hasStarted = parsed.score > 0 || parsed.solvedCount > 0 || (parsed.puzzleStatuses && Object.keys(parsed.puzzleStatuses).length > 0) || parsed.currentPuzzleIndex > 0;
            } catch (e) {
              console.error(e);
            }
          }

          if (isLive && !hasStarted) {
            // Check if competition started very recently (e.g. less than 10 seconds ago)
            const timeSinceStartMs = now.getTime() - start.getTime();
            const timeSinceStartSec = Math.floor(timeSinceStartMs / 1000);

            // Allow up to 10 seconds of buffer. If they joined 3 seconds late, they get 7 seconds buffer.
            if (timeSinceStartSec < 10 && timeSinceStartSec >= 0) {
              setCountdown(10 - timeSinceStartSec);
              startCountdownTimer();
            } else {
              // They joined late (e.g. 15s after start), no buffer needed
              startTimer();
            }
          } else {
            startTimer();
          }
        }
      } else {
        // Casual Mode (Dashboard link)
        const data = await puzzleAPI.getAll();
        const normalized = data
          .filter((p) => p.fen && (p.solutionMoves?.length || p.kidsConfig))

          .map((p, i) => ({
            id: p._id,
            index: i + 1,
            fen: p.fen,
            solution: p.solutionMoves,
            alternativeSolutions: p.alternativeSolutions,
            type: p.type,
            description: p.description,
            kidsConfig: p.kidsConfig,
            puzzleType: p.type,
            level: p.level || 1,
            rating: p.rating || 400,
            firstMoveBy: p.firstMoveBy || 'human',
          }));
        setPuzzles(normalized);

        // Restore Casual State
        const stateKey = `puzzleState_casual`;
        const savedState = localStorage.getItem(stateKey);
        if (savedState) {
          const parsed = JSON.parse(savedState);
          setScore(parsed.score);
          setSolvedCount(parsed.solvedCount);
          setPuzzleStatuses(parsed.puzzleStatuses || {});
          setPuzzleBoardStates(parsed.puzzleBoardStates || {});
          setCurrentPuzzleIndex(parsed.currentPuzzleIndex || 0);
        } else {
          setTimeLeft(300); // Default 5 mins for casual
        }
      }
    } catch (error) {
      console.error("Error loading puzzles:", error);
      // Silent error handling during initialization to prevent black page

      // Provide fallback to prevent black page
      setLoading(false);
      isLoadedRef.current = true;

      // Only navigate away for critical errors, not initialization issues
      if (error.message && error.message.includes("critical")) {
        setTimeout(() => {
          if (paramCompetitionId) {
            navigate(`/competition/${paramCompetitionId}/lobby`);
          } else {
            navigate("/");
          }
        }, 3000);
      }
    } finally {
      // Hide loading overlay regardless of what happened
      setLoading(false);
      isLoadedRef.current = true;
      setStartTime(Date.now());
    }
  };

  const startCountdownTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          startTimer(); // Start the actual game timer once countdown ends
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeout = () => {
    toast.error("Time's up!");
    // Redirect to lobby for competition, or home for casual
    setTimeout(() => {
      if (paramCompetitionId) {
        navigate(`/competition/${paramCompetitionId}/lobby`); // Lobby will show as leaderboard
      } else {
        navigate("/");
      }
    }, 2000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handlePuzzleSolved = async (winningMoves) => {
    const currentPuzzle = puzzles[currentPuzzleIndex];
    if (!currentPuzzle) return;

    // Use passed winning moves or fallback to default solution
    // If winningMoves is an array of strings (SAN), use it.
    const solutionToSend =
      Array.isArray(winningMoves) && winningMoves.length > 0
        ? winningMoves
        : currentPuzzle.solution;

    // Check if already solved
    if (puzzleStatuses[currentPuzzle.id] === "success") return;

    // Calculate time taken for this puzzle (simple approximation)
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    // If Review Mode, don't submit to backend, just show correct locally
    if (isReviewMode) {
      setPuzzleStatuses((prev) => ({ ...prev, [currentPuzzle.id]: "success" }));
      toast.success("Correct! (Review Mode)");

      // Move to next puzzle automatically
      setTimeout(() => {
        if (currentPuzzleIndex < puzzles.length - 1) {
          setCurrentPuzzleIndex((prev) => prev + 1);
          setShowSolution(false); // Reset solution view
        } else {
          toast.success("All puzzles completed in review!");
        }
      }, 100); // 100ms for instant feel
      return;
    }

    // --- OPTIMISTIC UPDATE ---
    // Instantly update UI states so the player feels zero latency
    setSolvedCount((prev) => prev + 1);
    setPuzzleStatuses((prev) => ({ ...prev, [currentPuzzle.id]: "success" }));
    toast.success("Correct!", { duration: 1500 });

    // Move to next puzzle immediately
    setStartTime(Date.now()); // Reset puzzle timer
    setTimeout(() => {
      // Find the next available unsolved puzzle
      const nextUnsolvedIndex = puzzles.findIndex((p, idx) =>
        idx > currentPuzzleIndex && puzzleStatuses[p.id || p._id] !== "success" && puzzleStatuses[p.id || p._id] !== "failed"
      );

      // Also check from the beginning if we didn't find one after current index
      const wrapAroundUnsolvedIndex = nextUnsolvedIndex === -1 ? puzzles.findIndex((p) =>
        puzzleStatuses[p.id || p._id] !== "success" && puzzleStatuses[p.id || p._id] !== "failed"
      ) : -1;

      const finalNextIndex = nextUnsolvedIndex !== -1 ? nextUnsolvedIndex : wrapAroundUnsolvedIndex;

      if (finalNextIndex !== -1 && finalNextIndex !== currentPuzzleIndex) {
        // Still have unsolved puzzles, go to next one
        setCurrentPuzzleIndex(finalNextIndex);
      } else if (finalNextIndex === -1) {
        toast.success("All puzzles attempted!");
        // End flow
        if (!paramCompetitionId || !isLiveCompetition) {
          if (competitionData) navigate("/");
        }
      }
    }, 100); // 100ms delay provides just enough time for a visual "correct" indication on the board

    // --- BACKGROUND SUBMISSION ---
    if (competitionData) {
      // Fire-and-forget promise
      (async () => {
        try {
          if (isLiveCompetition) {
            const res = await liveCompetitionAPI.submitSolution(
              competitionData._id,
              currentPuzzle.id,
              solutionToSend,
              timeTaken,
            );

            if (res && res.success && res.scoreEarned) {
              setScore((prev) => {
                const newScore = prev + res.scoreEarned;
                // Instantly sync to LiveCompetitionContext so PuzzleRacer updates
                updateParticipant({
                  puzzlesSolved: solvedCount + 1,
                  score: newScore,
                });
                return newScore;
              });
            } else if (res && res.success === false) {
              console.warn("Backend rejected correct solution:", res.message);
              // Revert optimistic update could be placed here if strictly needed
            }
          } else {
            // Regular competition
            const res = await competitionAPI.submitSolution(
              competitionData._id,
              currentPuzzle.id,
              solutionToSend,
              timeTaken,
            );

            if (res.points) {
              setScore((prev) => prev + res.points);
            }
          }
        } catch (error) {
          console.error("Background submission failed:", error);
        }
      })();
    } else {
      // No competition, just add local score
      setScore((prev) => prev + 10);
    }
  };

  const handleWrongMove = async () => {
    const currentPuzzle = puzzles[currentPuzzleIndex];
    if (!currentPuzzle) return;

    const puzzleId = currentPuzzle.id || currentPuzzle._id;

    // Check if already marked as failed
    if (puzzleStatuses[puzzleId] === "failed") return;

    // Calculate time taken for this puzzle
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    // If Review Mode, don't submit wrong move
    if (isReviewMode) {
      toast.error("Incorrect move! Try again.");
      return;
    }

    // --- OPTIMISTIC UPDATE ---
    setPuzzleStatuses((prev) => ({ ...prev, [puzzleId]: "failed" }));
    toast.error("Incorrect! Moving to next.", { duration: 1500 });

    // Move to next puzzle automatically (instant feel)
    setStartTime(Date.now());
    setTimeout(() => {
      // Find the next available unsolved puzzle
      const nextUnsolvedIndex = puzzles.findIndex((p, idx) =>
        idx > currentPuzzleIndex && puzzleStatuses[p.id || p._id] !== "success" && puzzleStatuses[p.id || p._id] !== "failed"
      );

      // Also check from the beginning if we didn't find one after current index
      const wrapAroundUnsolvedIndex = nextUnsolvedIndex === -1 ? puzzles.findIndex((p) =>
        puzzleStatuses[p.id || p._id] !== "success" && puzzleStatuses[p.id || p._id] !== "failed"
      ) : -1;

      const finalNextIndex = nextUnsolvedIndex !== -1 ? nextUnsolvedIndex : wrapAroundUnsolvedIndex;

      if (finalNextIndex !== -1 && finalNextIndex !== currentPuzzleIndex) {
        // Still have unsolved puzzles, go to next one
        setCurrentPuzzleIndex(finalNextIndex);
      } else if (finalNextIndex === -1) {
        toast.success("All puzzles attempted!");
        // End flow
        if (!paramCompetitionId || !isLiveCompetition) {
          if (competitionData) navigate("/");
        }
      }
    }, 200); // 200ms delay to show red error state on board explicitly

    // --- BACKGROUND SUBMISSION ---
    // Submit failed attempt to backend if it's a live competition
    if (competitionData && isLiveCompetition) {
      (async () => {
        try {
          // Submit wrong solution to backend to mark as failed
          await liveCompetitionAPI.submitSolution(
            competitionData._id,
            currentPuzzle.id,
            ["wrong", "move"], // Send wrong moves
            timeTaken,
          );
        } catch (error) {
          console.error("Failed to submit wrong move in background:", error);
        }
      })();
    }
  };

  // Handle early submission
  const handleSubmitCompetition = async () => {
    if (!competitionData || !isLiveCompetition) return;

    try {
      setSubmitting(true);

      const response = await liveCompetitionAPI.submitCompetition(
        competitionData._id,
      );

      if (response.success) {
        toast.success("Submitted! Returning to lobby...");
        setShowSubmitModal(false);

        // Clear local storage
        const stateKey = `puzzleState_${paramCompetitionId}`;
        localStorage.removeItem(stateKey);

        // Navigate back to Lobby (player waits there with live scores)
        navigate(`/competition/${competitionData._id}/lobby`);
      } else {
        toast.error(response.message || "Submission failed");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(error.message || "Failed to submit competition");
    } finally {
      setSubmitting(false);
    }
  };

  // Check if there are unsolved puzzles
  const getUnattemptedCount = () => {
    let count = 0;
    puzzles.forEach(p => {
      const pid = p.id || p._id;
      if (puzzleStatuses[pid] !== "success" && puzzleStatuses[pid] !== "failed") {
        count++;
      }
    });
    return count;
  };

  const currentPuzzle = puzzles[currentPuzzleIndex];

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading your chess training session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Toaster position="top-right" />

      {/* Page Header */}
      <PageHeader
        title={competitionData ? competitionData.name : "Daily Training"}
        subtitle={(() => {
          const chapters = competitionData?.chapters;
          if (chapters && chapters.length > 0) {
            const chPuzzleIds = chapters[activeChapterIndex]?.puzzleIds || [];
            const chPuzzles = puzzles.filter(p => chPuzzleIds.includes(p._id || p.id));
            const chIdx = chPuzzles.findIndex(p => (p._id || p.id) === (puzzles[currentPuzzleIndex]?._id || puzzles[currentPuzzleIndex]?.id));
            return `Puzzle ${chIdx + 1} of ${chPuzzles.length} · ${chapters[activeChapterIndex]?.name || ''}`;
          }
          return `Puzzle ${currentPuzzleIndex + 1} of ${puzzles.length}`;
        })()}
        icon={<FaPuzzlePiece />}
        showBackButton
        onBack={() => navigate(-1)}
        actions={
          <>
            {isLiveCompetition && !isReviewMode && (
              <div className={styles.liveIndicator}>
                <span className={styles.liveStatus}>🟢 LIVE</span>
              </div>
            )}
            {isReviewMode && (
              <div className={styles.liveIndicator}>
                <span className={styles.reviewStatus}>Review Mode</span>
              </div>
            )}
          </>
        }
      />

      {/* Main Content - New Grid Layout: Timer/Submit Left, Board Center, Info/Nav Right, Race Bottom */}
      <div className={styles.mainContent}>
        {/* Timer Card - Top Left */}
        {competitionData && (
          <div className={styles.timerCard}>
            <div className={styles.statCard}>
              {/* Turn Indicator */}

              <div className={styles.timerDisplay}>
                <FaClock className={styles.timerIcon} />
                <div className={styles.statLabel}>Time Left</div>
                <div className={styles.timerBadge}>
                  {isReviewMode ? "∞" : formatTime(timeLeft)}
                </div>
              </div>

              <div className={styles.statsRow}>
                <div className={styles.statItem}>
                  <div className={styles.statLabel}>Score</div>
                  <div className={`${styles.statValue} ${styles.highlight}`}>
                    {Math.round(score)}
                  </div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statLabel}>Solved</div>
                  <div className={styles.statValue}>{solvedCount}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Card - Bottom Left */}
        {competitionData && isLiveCompetition && !isReviewMode && (
          <div className={styles.submitCard}>
            <button
              className={`${styles.actionBtn} ${styles.btnSubmit}`}
              onClick={() => setShowSubmitModal(true)}
              disabled={submitting || getUnattemptedCount() > 0 || countdown > 0}
              style={{ width: "100%", fontSize: "1rem", padding: "12px", opacity: (submitting || getUnattemptedCount() > 0 || countdown > 0) ? 0.5 : 1, cursor: (submitting || getUnattemptedCount() > 0 || countdown > 0) ? 'not-allowed' : 'pointer' }}
              title={getUnattemptedCount() > 0 ? `Please attempt ${getUnattemptedCount()} remaining puzzle(s)` : ''}
            >
              Submit Competition
            </button>

            {/* Real-time Rank Card */}
            <div className={styles.rankCard}>
              <div className={styles.rankHeader}>
                <span className={styles.rankTrophy}>♟️</span>
                <span className={styles.rankTitle}>Your Rank</span>
                <span className={styles.rankTrophy}>♟️</span>

              </div>
              <div className={styles.rankBody}>
                <div className={styles.rankNumber}>
                  #{getCurrentUserRank() || "–"}
                </div>
              </div>
              <div className={styles.rankFooter}>
                <div className={styles.rankProgressBar}>
                  <div
                    className={styles.rankProgressFill}
                    style={{ width: `${puzzles.length > 0 ? (solvedCount / puzzles.length) * 100 : 0}%` }}
                  ></div>
                </div>
                <div className={styles.rankParticipants}>
                  {leaderboard.length} participant{leaderboard.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Board Area - Center */}
        <div className={styles.boardArea}>
          {countdown > 0 && (
            <div className={styles.countdownOverlay}>
              <div className={styles.countdownCircle}>
                <span className={styles.countdownNumber}>{countdown}</span>
                <span className={styles.countdownText}>Get Ready!</span>
              </div>
            </div>
          )}

          <div className={`${styles.boardWrapper} ${countdown > 0 ? styles.blurBoard : ''}`}>
            {puzzles.length > 0 && currentPuzzle ? (
              <ChessBoard
                key={`${currentPuzzle.id || currentPuzzle._id}-${currentPuzzleIndex}`}
                fen={currentPuzzle.fen}
                solution={currentPuzzle.solution}
                alternativeSolutions={currentPuzzle.alternativeSolutions}
                puzzleType={currentPuzzle.puzzleType || currentPuzzle.type}
                kidsConfig={currentPuzzle.kidsConfig}
                firstMoveBy={currentPuzzle.firstMoveBy}
                onPuzzleSolved={handlePuzzleSolved}
                onWrongMove={handleWrongMove}
                onBoardStateChange={(fen, moveHistory) => {
                  const puzzleId = currentPuzzle.id || currentPuzzle._id;
                  setPuzzleBoardStates((prev) => ({
                    ...prev,
                    [puzzleId]: { fen, moveHistory },
                  }));
                }}
                savedBoardState={
                  puzzleBoardStates[currentPuzzle.id || currentPuzzle._id]
                }
                interactive={
                  !solving &&
                  (isReviewMode ||
                    (puzzleStatuses[currentPuzzle.id || currentPuzzle._id] !==
                      "success" &&
                      puzzleStatuses[currentPuzzle.id || currentPuzzle._id] !==
                      "failed"))
                }
                showSolution={showSolution}
              />
            ) : (
              <div className={styles.loading}>No Puzzles Available</div>
            )}
          </div>
        </div>

        {/* Puzzle Info Card - Right Panel Top */}
        {competitionData && currentPuzzle && (
          <div className={styles.puzzleInfoPanel}>
            {/* Category badge above card */}
            {currentPuzzle.category && (
              <div className={styles.categoryBadge}>
                <span className={styles.categoryDot} />
                {currentPuzzle.category}
              </div>
            )}
            <div className={styles.puzzleInfoCard}>
              {(() => {
                const fenTurn = currentPuzzle.fen?.split(' ')[1];
                const userColor = fenTurn === 'w' ? 'b' : 'w';
                return (
                  <>
                    {/* Left: King Icon */}
                    <div className={styles.puzzleKingIcon}>{userColor === 'w' ? '♔' : '♚'}</div>
                    {/* Right: Info */}
                    <div className={styles.puzzleInfoRight}>
                      {/* Turn indicator — now replaces the title */}
                      <div className={`${styles.turnPillInline} ${userColor === 'w' ? styles.turnWhite : styles.turnBlack}`}>
                        <span className={`${styles.turnDot} ${userColor === 'w' ? styles.dotWhite : styles.dotBlack}`} />
                        {userColor === 'w' ? 'White to play' : 'Black to play'}
                      </div>

                      <div className={styles.puzzleMetadata}>
                        <div className={styles.metadataItem}>
                          <span className={styles.metadataLabel}>Level</span>
                          <span className={styles.metadataValue}>{currentPuzzle.level || 1}</span>
                        </div>
                        <div className={styles.metadataDivider} />
                        <div className={styles.metadataItem}>
                          <span className={styles.metadataLabel}>Difficulty</span>
                          <span className={`${styles.metadataValue} ${styles['diff_' + (currentPuzzle.difficulty || 'medium').toLowerCase()]}`}>
                            {currentPuzzle.difficulty || 'Medium'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Puzzle Navigation Panel - Right */}
        {competitionData && (
          <div className={styles.puzzleNavPanel}>

            {/* ---- Chapter Tabs --- */}
            {competitionData.chapters && competitionData.chapters.length > 0 && (
              <>
                <div className={styles.chapterTabBar}>
                  {competitionData.chapters.map((chapter, idx) => {
                    const chPuzzleIds = (chapter.puzzleIds || []).map(id => id.toString());
                    const chPuzzles = puzzles.filter(p => chPuzzleIds.includes((p._id || p.id).toString()));
                    const solvedCount = chPuzzles.filter(p => puzzleStatuses[(p.id || p._id).toString()] === 'success').length;
                    return (
                      <button
                        key={idx}
                        type="button"
                        className={`${styles.chapterTab} ${activeChapterIndex === idx ? styles.chapterTabActive : ''}`}
                        onClick={() => {
                          setActiveChapterIndex(idx);
                          // ALWAYS reset frame to 0 when switching chapters
                          setCurrentFrame(0);
                          // Jump to first puzzle of this chapter if any
                          if (chPuzzles.length > 0) {
                            const firstPuzzleId = (chPuzzles[0]._id || chPuzzles[0].id).toString();
                            const globalIdx = puzzles.findIndex(p => (p._id || p.id).toString() === firstPuzzleId);
                            if (globalIdx !== -1) {
                              setCurrentPuzzleIndex(globalIdx);
                            }
                          }
                        }}
                      >
                        <span className={styles.chapterTabName}>{chapter.name}</span>
                        <span className={styles.chapterTabBadge}>
                          {solvedCount}/{chPuzzles.length}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {/* Chapter Navigation Arrows */}
                {competitionData.chapters.length > 1 && (
                  <div className={styles.navControls} style={{ marginBottom: '15px' }}>
                    <button
                      className={styles.navArrow}
                      onClick={() => {
                        const newIdx = Math.max(0, activeChapterIndex - 1);
                        setActiveChapterIndex(newIdx);
                        setCurrentFrame(0);
                        const chPuzzleIds = (competitionData.chapters[newIdx].puzzleIds || []).map(id => id.toString());
                        const chPuzzles = puzzles.filter(p => chPuzzleIds.includes((p._id || p.id).toString()));
                        if (chPuzzles.length > 0) {
                          const firstPuzzleId = (chPuzzles[0]._id || chPuzzles[0].id).toString();
                          const globalIdx = puzzles.findIndex(p => (p._id || p.id).toString() === firstPuzzleId);
                          if (globalIdx !== -1) {
                            setCurrentPuzzleIndex(globalIdx);
                          }
                        }
                      }}
                      disabled={activeChapterIndex <= 0}
                      title="Previous Chapter"
                      style={{ flex: 1 }}
                    >
                      ← Prev Chapter
                    </button>
                    <button
                      className={styles.navArrow}
                      onClick={() => {
                        const newIdx = Math.min(competitionData.chapters.length - 1, activeChapterIndex + 1);
                        setActiveChapterIndex(newIdx);
                        setCurrentFrame(0);
                        const chPuzzleIds = (competitionData.chapters[newIdx].puzzleIds || []).map(id => id.toString());
                        const chPuzzles = puzzles.filter(p => chPuzzleIds.includes((p._id || p.id).toString()));
                        if (chPuzzles.length > 0) {
                          const firstPuzzleId = (chPuzzles[0]._id || chPuzzles[0].id).toString();
                          const globalIdx = puzzles.findIndex(p => (p._id || p.id).toString() === firstPuzzleId);
                          if (globalIdx !== -1) {
                            setCurrentPuzzleIndex(globalIdx);
                          }
                        }
                      }}
                      disabled={activeChapterIndex >= competitionData.chapters.length - 1}
                      title="Next Chapter"
                      style={{ flex: 1 }}
                    >
                      Next Chapter →
                    </button>
                  </div>
                )}
              </>
            )}

            <div className={styles.controlCard}>
              {/* Compute chapter-scoped puzzle list ONCE for all nav elements */}
              {(() => {
                const chapterData = competitionData?.chapters;
                let navPuzzles = puzzles;
                if (chapterData && chapterData.length > 0) {
                  const chPuzzleIds = (chapterData[activeChapterIndex]?.puzzleIds || []).map(id => id.toString());
                  navPuzzles = puzzles.filter(p => chPuzzleIds.includes((p._id || p.id).toString()));
                }
                const totalPages = Math.ceil(navPuzzles.length / ITEMS_PER_PAGE);
                // Current puzzle's position within this chapter
                const currentPuzzleId = (puzzles[currentPuzzleIndex]?._id || puzzles[currentPuzzleIndex]?.id)?.toString();
                const chapterCurrentIndex = navPuzzles.findIndex(
                  p => (p._id || p.id).toString() === currentPuzzleId
                );

                return (
                  <>
                    {/* Page counter */}
                    {totalPages > 1 && (
                      <div className={styles.paginationInfo}>
                        Page {currentFrame + 1} of {totalPages}
                      </div>
                    )}

                    {/* Nav grid — chapter puzzles only */}
                    <div className={styles.navGrid}>
                      {navPuzzles
                        .slice(currentFrame * ITEMS_PER_PAGE, (currentFrame + 1) * ITEMS_PER_PAGE)
                        .map((puzzle, localIndex) => {
                          const globalIndex = puzzles.findIndex(p => (p._id || p.id) === (puzzle._id || puzzle.id));
                          const chapterIndex = currentFrame * ITEMS_PER_PAGE + localIndex; // position in chapter
                          const pid = puzzle.id || puzzle._id;
                          const status = puzzleStatuses[pid];
                          return (
                            <div
                              key={pid}
                              className={`
                                ${styles.navItem}
                                ${chapterCurrentIndex === chapterIndex ? styles.active : ''}
                                ${status === 'success' ? styles.success : ''}
                                ${status === 'failed' ? styles.danger : ''}
                              `}
                              onClick={() => {
                                if (!solving) {
                                  setCurrentPuzzleIndex(globalIndex);
                                  if (status === 'success') toast.info('Puzzle already solved!');
                                  else if (status === 'failed') toast.info('Puzzle failed - you can view but not interact!');
                                }
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                              {status === 'success' ? <FaCheckCircle /> : globalIndex + 1}
                            </div>
                          );
                        })
                      }
                    </div>

                    {/* Prev / Next within chapter */}
                    <div className={styles.navControls} style={{ marginBottom: '10px' }}>
                      <button
                        className={styles.navArrow}
                        onClick={() => {
                          if (chapterCurrentIndex <= 0) {
                            // Go to previous chapter's last puzzle
                            if (activeChapterIndex > 0) {
                              const prevChapterIdx = activeChapterIndex - 1;
                              const chPuzzleIds = (competitionData.chapters[prevChapterIdx].puzzleIds || []).map(id => id.toString());
                              const chPuzzles = puzzles.filter(p => chPuzzleIds.includes((p._id || p.id).toString()));
                              if (chPuzzles.length > 0) {
                                const lastPuzzleId = (chPuzzles[chPuzzles.length - 1]._id || chPuzzles[chPuzzles.length - 1].id).toString();
                                const globalIdx = puzzles.findIndex(p => (p._id || p.id).toString() === lastPuzzleId);
                                if (globalIdx !== -1) setCurrentPuzzleIndex(globalIdx);
                              }
                            }
                          } else {
                            const newChIdx = chapterCurrentIndex - 1;
                            const newGlobalIdx = puzzles.findIndex(p => (p._id || p.id) === (navPuzzles[newChIdx]?._id || navPuzzles[newChIdx]?.id));
                            if (newGlobalIdx !== -1) {
                              setCurrentPuzzleIndex(newGlobalIdx);
                            }
                          }
                        }}
                        disabled={chapterCurrentIndex <= 0 && activeChapterIndex <= 0}
                        title="Previous Puzzle"
                        style={{ flex: 1 }}
                      >
                        ← Prev
                      </button>

                      <button
                        className={styles.navArrow}
                        onClick={() => {
                          if (chapterCurrentIndex >= navPuzzles.length - 1) {
                            // Go to next chapter's first puzzle
                            if (competitionData.chapters && activeChapterIndex < competitionData.chapters.length - 1) {
                              const nextChapterIdx = activeChapterIndex + 1;
                              const chPuzzleIds = (competitionData.chapters[nextChapterIdx].puzzleIds || []).map(id => id.toString());
                              const chPuzzles = puzzles.filter(p => chPuzzleIds.includes((p._id || p.id).toString()));
                              if (chPuzzles.length > 0) {
                                const firstPuzzleId = (chPuzzles[0]._id || chPuzzles[0].id).toString();
                                const globalIdx = puzzles.findIndex(p => (p._id || p.id).toString() === firstPuzzleId);
                                if (globalIdx !== -1) setCurrentPuzzleIndex(globalIdx);
                              }
                            }
                          } else {
                            const newChIdx = chapterCurrentIndex + 1;
                            const newGlobalIdx = puzzles.findIndex(p => (p._id || p.id) === (navPuzzles[newChIdx]?._id || navPuzzles[newChIdx]?.id));
                            if (newGlobalIdx !== -1) {
                              setCurrentPuzzleIndex(newGlobalIdx);
                            }
                          }
                        }}
                        disabled={chapterCurrentIndex >= navPuzzles.length - 1 && activeChapterIndex >= (competitionData.chapters?.length || 1) - 1}
                        title="Next Puzzle"
                        style={{ flex: 1 }}
                      >
                        Next →
                      </button>
                    </div>

                    {/* Frame pagination — only shown if >1 page */}
                    {totalPages > 1 && (
                      <div className={styles.paginationContainer}>
                        <button className={styles.pageBtn} onClick={() => setCurrentFrame(0)} disabled={currentFrame === 0} title="First Page">«</button>
                        <button className={styles.pageBtn} onClick={() => setCurrentFrame(Math.max(0, currentFrame - 1))} disabled={currentFrame === 0} title="Previous Page">‹</button>
                        <button className={styles.pageBtn} onClick={() => setCurrentFrame(Math.min(totalPages - 1, currentFrame + 1))} disabled={currentFrame >= totalPages - 1} title="Next Page">›</button>
                        <button className={styles.pageBtn} onClick={() => setCurrentFrame(totalPages - 1)} disabled={currentFrame >= totalPages - 1} title="Last Page">»</button>
                      </div>
                    )}

                    {/* Review Mode: Show Solution Button */}
                    {isReviewMode && (
                      <div style={{ marginTop: '15px' }}>
                        <button
                          className={styles.actionBtn}
                          style={{ width: '100%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                          onClick={() => setShowSolutionModal(true)}
                        >
                          <FaCheckCircle style={{ marginRight: '8px' }} /> Show Solution
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Race Container - Full Width Bottom */}
        {isLiveCompetition && !isReviewMode && (
          <div className={styles.raceContainer}>
            <PuzzleRacer />
          </div>
        )}
      </div>

      {/* Solution Viewing Modal (Review Mode) */}
      {showSolutionModal && currentPuzzle && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Puzzle Solution</h3>
            <p style={{ marginBottom: '15px', color: 'var(--text-secondary, #a89f91)' }}>
              Here are the correct moves to solve this puzzle:
            </p>

            <div className={styles.solutionMoves} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
              {currentPuzzle.solution && currentPuzzle.solution.length > 0 ? (
                currentPuzzle.solution.map((move, i) => (
                  <span key={i} className={styles.moveTag} style={{ display: 'inline-block', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '8px 16px', borderRadius: '8px', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ` : ''}{move}
                  </span>
                ))
              ) : (
                <p>No explicit solution text available.</p>
              )}
            </div>

            <div className={styles.modalActions}>
              <button
                className={`${styles.modalBtn} ${styles.cancelBtn}`}
                onClick={() => setShowSolutionModal(false)}
                style={{ width: '100%' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submission Confirmation Modal */}
      {showSubmitModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Submit Competition?</h3>

            {/* <div className={styles.modalStats}>
              <div className={styles.modalStat}>
                <span className={styles.modalStatLabel}>Puzzles Solved:</span>
                <span className={styles.modalStatValue}>{solvedCount} / {puzzles.length}</span>
              </div>
              <div className={styles.modalStat}>
                <span className={styles.modalStatLabel}>Current Score:</span>
                <span className={styles.modalStatValue}>{Math.round(score)} points</span>
              </div>
              <div className={styles.modalStat}>
                <span className={styles.modalStatLabel}>Time Remaining:</span>
                <span className={styles.modalStatValue}>{formatTime(timeLeft)}</span>
              </div>
            </div> */}

            {getUnattemptedCount() > 0 && (
              <div className={styles.modalWarning}>
                ⚠️ You still have {getUnattemptedCount()} unattempted puzzle
                {getUnattemptedCount() > 1 ? "s" : ""}. Please attempt all puzzles before submitting.
              </div>
            )}

            <p className={styles.modalText}>
              Once you submit, you cannot make any more changes to your answers.
              Your final score will be calculated and you'll be taken to the
              leaderboard.
            </p>

            <div className={styles.modalActions}>
              <button
                className={styles.modalCancel}
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className={styles.modalSubmit}
                onClick={handleSubmitCompetition}
                disabled={submitting || getUnattemptedCount() > 0}
                style={{ opacity: (submitting || getUnattemptedCount() > 0) ? 0.5 : 1, cursor: (submitting || getUnattemptedCount() > 0) ? 'not-allowed' : 'pointer' }}
              >
                {submitting ? "Submitting..." : "Submit Competition"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PuzzlePage;
