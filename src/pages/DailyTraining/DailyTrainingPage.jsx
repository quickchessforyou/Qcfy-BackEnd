import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaPuzzlePiece, FaUndo, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";

import ChessBoard from "../../components/ChessBoard/ChessBoard";
import PageHeader from "../../components/PageHeader/PageHeader";
import { puzzleAPI } from "../../services/api";
import styles from "./DailyTrainingPage.module.css";

function DailyTrainingPage() {
    const navigate = useNavigate();

    // State
    const [puzzles, setPuzzles] = useState([]);
    const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [solving, setSolving] = useState(false);
    const [showSolution, setShowSolution] = useState(false);
    const [puzzleStatuses, setPuzzleStatuses] = useState({}); // { [puzzleId]: 'success' | 'failed' }
    const [puzzleBoardStates, setPuzzleBoardStates] = useState({}); // { [puzzleId]: { fen, moveHistory } }

    // Load puzzles on mount
    useEffect(() => {
        loadDailyPuzzles();
    }, []);

    // Persist state to localStorage
    useEffect(() => {
        if (!loading && puzzles.length > 0) {
            const stateToSave = {
                currentPuzzleIndex,
                puzzleStatuses,
                puzzleBoardStates,
            };
            localStorage.setItem("dailyTrainingState", JSON.stringify(stateToSave));
        }
    }, [currentPuzzleIndex, puzzleStatuses, puzzleBoardStates, loading, puzzles]);

    const loadDailyPuzzles = async () => {
        try {
            setLoading(true);

            // Fetch only 10 daily training puzzles for demo
            const response = await puzzleAPI.getAll({ limit: 10 });

            // apiRequest in api.js returns the raw data (which is an array of puzzles from backend)
            // Wait, puzzle.controller.js getPuzzles returns `res.status(200).json(puzzles);` meaning it's an array, not `{success: true, data: []}` structure!
            const puzzlesData = Array.isArray(response) ? response : (response.data || []);
            setPuzzles(puzzlesData);

            // Restore saved state
            const savedState = localStorage.getItem("dailyTrainingState");
            if (savedState) {
                const parsed = JSON.parse(savedState);
                setCurrentPuzzleIndex(parsed.currentPuzzleIndex || 0);
                setPuzzleStatuses(parsed.puzzleStatuses || {});
                setPuzzleBoardStates(parsed.puzzleBoardStates || {});
            }

            setLoading(false);
        } catch (error) {
            console.error("Error loading puzzles:", error);
            toast.error("Failed to load puzzles");
            setLoading(false);
        }
    };

    const handlePuzzleSolved = (moveHistory) => {
        setSolving(false);
        const puzzleId = currentPuzzle.id || currentPuzzle._id;

        setPuzzleStatuses((prev) => ({
            ...prev,
            [puzzleId]: "success",
        }));

        toast.success("Puzzle solved! Great job! 🎉");
    };

    const handleWrongMove = () => {
        setSolving(false);
        const puzzleId = currentPuzzle.id || currentPuzzle._id;

        setPuzzleStatuses((prev) => ({
            ...prev,
            [puzzleId]: "failed",
        }));

        toast.error("Wrong move! Try again or view the solution.");
    };

    const handlePuzzleNavigation = (index) => {
        if (index >= 0 && index < puzzles.length) {
            setCurrentPuzzleIndex(index);
            setShowSolution(false);
        }
    };

    const handleReset = () => {
        const puzzleId = currentPuzzle.id || currentPuzzle._id;
        setPuzzleBoardStates((prev) => {
            const newStates = { ...prev };
            delete newStates[puzzleId];
            return newStates;
        });
        setPuzzleStatuses((prev) => {
            const newStatuses = { ...prev };
            delete newStatuses[puzzleId];
            return newStatuses;
        });
        setShowSolution(false);
        toast.success("Puzzle reset!");
    };

    const currentPuzzle = puzzles[currentPuzzleIndex];
    const solvedCount = Object.values(puzzleStatuses).filter(s => s === "success").length;

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading Daily Training Puzzles...</p>
            </div>
        );
    }

    if (!puzzles || puzzles.length === 0) {
        return (
            <div className={styles.loading}>
                <p>No puzzles available</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Toaster position="top-right" />

            {/* Page Header */}
            <PageHeader
                title="Daily Training"
                subtitle={`Puzzle ${currentPuzzleIndex + 1} of ${puzzles.length} • ${solvedCount} Solved`}
                icon={<FaPuzzlePiece />}
                showBackButton
                onBack={() => navigate("/Dashboard")}
            />

            {/* Main Content - 3 Column Layout */}
            <div className={styles.mainContent}>
                {/* Left Panel - Puzzle Info */}
                <div className={styles.leftPanel}>
                    {/* Puzzle Information Card */}
                    <div className={styles.puzzleInfoCard}>
                        <h2 className={styles.puzzleCardTitle}>
                            {currentPuzzle?.title || "Chess Puzzle"}
                        </h2>
                        {currentPuzzle?.description && (
                            <p className={styles.puzzleDescription}>
                                {currentPuzzle.description}
                            </p>
                        )}

                        {/* To Move Indicator - Highlighted */}
                        {currentPuzzle && (() => {
                            const fenTurn = currentPuzzle.fen.split(" ")[1]; // 'w' or 'b' from FEN
                            // Computer always plays first, student plays the opposite color
                            const studentColor = fenTurn === 'w' ? 'b' : 'w';
                            return (
                                <div className={styles.toMoveSection}>
                                    <div className={styles.toMoveLabel}>You Play As:</div>
                                    <div className={styles.toMoveIndicator}>
                                        <div
                                            className={`${styles.colorDot} ${studentColor === "w"
                                                ? styles.whiteDot
                                                : styles.blackDot
                                                }`}
                                        ></div>
                                        <span className={styles.toMoveText}>
                                            {studentColor === "w" ? "White" : "Black"}
                                        </span>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Level and Rating */}
                        {currentPuzzle && (
                            <div className={styles.puzzleMetadata}>
                                <div className={styles.metadataItem}>
                                    <span className={styles.metadataLabel}>Level:</span>
                                    <span className={styles.metadataValue}>{currentPuzzle.level || 1}</span>
                                </div>
                                <div className={styles.metadataItem}>
                                    <span className={styles.metadataLabel}>Rating:</span>
                                    <span className={styles.metadataValue}>{currentPuzzle.rating || 400}</span>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className={styles.actionButtons}>
                            <button
                                className={`${styles.actionBtn} ${styles.btnPrimary}`}
                                onClick={() => setShowSolution(!showSolution)}
                            >
                                <FaEye />
                                {showSolution ? "Hide Solution" : "View Solution"}
                            </button>

                            <button
                                className={`${styles.actionBtn} ${styles.btnSecondary}`}
                                onClick={handleReset}
                            >
                                <FaUndo />
                                Reset Puzzle
                            </button>
                        </div>
                    </div>

                    {/* Progress Card */}
                    <div className={styles.progressCard}>
                        <div className={styles.progressLabel}>Your Progress</div>
                        <div className={styles.progressStats}>
                            <div className={styles.progressItem}>
                                <span className={styles.progressValue}>{solvedCount}</span>
                                <span className={styles.progressText}>Solved</span>
                            </div>
                            <div className={styles.progressItem}>
                                <span className={styles.progressValue}>{puzzles.length - solvedCount}</span>
                                <span className={styles.progressText}>Remaining</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center Panel - Board Only */}
                <div className={styles.boardArea}>
                    <div className={styles.boardWrapper}>
                        {currentPuzzle ? (
                            <ChessBoard
                                key={`${currentPuzzle.id || currentPuzzle._id}-${currentPuzzleIndex}`}
                                fen={currentPuzzle.fen}
                                solution={currentPuzzle.solution || currentPuzzle.solutionMoves}
                                alternativeSolutions={currentPuzzle.alternativeSolutions}
                                puzzleType={currentPuzzle.puzzleType || currentPuzzle.type}
                                kidsConfig={currentPuzzle.kidsConfig}
                                firstMoveBy={currentPuzzle.firstMoveBy}
                                onPuzzleSolved={handlePuzzleSolved}
                                onWrongMove={handleWrongMove}
                                onBoardStateChange={(fen, moveHistory) => {
                                    const puzzleId = currentPuzzle.id || currentPuzzle._id;
                                    setPuzzleBoardStates(prev => ({
                                        ...prev,
                                        [puzzleId]: { fen, moveHistory }
                                    }));
                                }}
                                savedBoardState={puzzleBoardStates[currentPuzzle.id || currentPuzzle._id]}
                                interactive={
                                    !solving &&
                                    puzzleStatuses[currentPuzzle.id || currentPuzzle._id] !== "success"
                                }
                                showSolution={showSolution}
                            />
                        ) : (
                            <div className={styles.loading}>No Puzzle Available</div>
                        )}
                    </div>
                </div>

                {/* Right Panel - Navigation */}
                <div className={styles.rightPanel}>
                    <div className={styles.controlCard}>
                        <div className={styles.controlHeader}>Puzzle Navigation</div>

                        {/* Navigation Grid */}
                        <div className={styles.navGrid}>
                            {puzzles.map((puzzle, index) => {
                                const puzzleId = puzzle.id || puzzle._id;
                                const status = puzzleStatuses[puzzleId];
                                return (
                                    <button
                                        key={puzzleId}
                                        className={`${styles.navItem} ${index === currentPuzzleIndex ? styles.active : ""
                                            } ${status === "success" ? styles.success : ""} ${status === "failed" ? styles.danger : ""
                                            }`}
                                        onClick={() => handlePuzzleNavigation(index)}
                                    >
                                        {index + 1}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Navigation Controls */}
                        <div className={styles.navControls}>
                            <button
                                className={styles.navArrow}
                                onClick={() => handlePuzzleNavigation(currentPuzzleIndex - 1)}
                                disabled={currentPuzzleIndex === 0}
                            >
                                <FaArrowLeft />
                            </button>
                            <button
                                className={styles.navArrow}
                                onClick={() => handlePuzzleNavigation(currentPuzzleIndex + 1)}
                                disabled={currentPuzzleIndex === puzzles.length - 1}
                            >
                                <FaArrowRight />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DailyTrainingPage;
