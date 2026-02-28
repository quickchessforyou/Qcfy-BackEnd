import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveCompetition } from '../../contexts/LiveCompetitionContext';
import { competitionAPI } from '../../services/api';
import LiveLeaderboard from '../../components/LiveCompetition/LiveLeaderboard';
import CompetitionTimer from '../../components/LiveCompetition/CompetitionTimer';
import PuzzleRacer from '../../components/PuzzleRacer/PuzzleRacer';
import toast from 'react-hot-toast';
import styles from './LiveCompetitionPage.module.css';

const LiveCompetitionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    competition,
    puzzles,
    participant,
    isConnected,
    isLoading,
    error,
    competitionEnded,
    participateInCompetition,
    submitSolution,
    disconnectFromCompetition,
    getSolvedPuzzlesCount,
    getTotalPuzzlesCount,
    isCompetitionActive,
    saveBoardPosition,
    getBoardPosition,
    isPuzzleLocked,
    loadCompetitionPuzzles,
    ensureSocketConnection
  } = useLiveCompetition();

  const [competitionData, setCompetitionData] = useState(null);
  const [loadingCompetition, setLoadingCompetition] = useState(true);
  const [hasParticipated, setHasParticipated] = useState(false);
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [puzzleStartTime, setPuzzleStartTime] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(true);

  // Load competition data on mount
  useEffect(() => {
    loadCompetitionData();
    // Also try to load puzzle states if user is already participating
    if (id) {
      loadCompetitionPuzzles(id).then(() => {
        ensureSocketConnection(id);
      }).catch(error => {
        console.log('User not participating yet:', error.message);
      });
    }
  }, [id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        disconnectFromCompetition();
      }
    };
  }, []);

  const loadCompetitionData = async () => {
    try {
      setLoadingCompetition(true);
      const response = await competitionAPI.getById(id);

      if (response.success) {
        setCompetitionData(response.data);
      }
    } catch (error) {
      console.error('Failed to load competition:', error);
      toast.error('Failed to load competition details');
    } finally {
      setLoadingCompetition(false);
    }
  };

  const handleParticipate = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await participateInCompetition(id, user.username || user.name);
      setHasParticipated(true);
    } catch (error) {
      console.error('Participation failed:', error);
    }
  };

  const handlePuzzleSelect = (puzzle) => {
    // Check if puzzle is locked (solved or failed)
    if (puzzle.isLocked || puzzle.isSolved || puzzle.isFailed) {
      if (puzzle.isSolved) {
        toast.info('You have already solved this puzzle!');
      } else if (puzzle.isFailed) {
        toast.info('This puzzle has been failed and is locked.');
      }
      return;
    }

    setSelectedPuzzle(puzzle);
    setPuzzleStartTime(Date.now());
  };

  const handleSolutionSubmit = async (solution) => {
    if (!selectedPuzzle || !puzzleStartTime) return;

    try {
      const timeSpent = Math.floor((Date.now() - puzzleStartTime) / 1000);

      // Get current board position if available (for future chess board integration)
      const boardPosition = null; // TODO: Get from chess board component
      const moveHistory = []; // TODO: Get from chess board component

      await submitSolution(selectedPuzzle._id, solution, timeSpent, boardPosition, moveHistory);

      // Close puzzle view
      setSelectedPuzzle(null);
      setPuzzleStartTime(null);

    } catch (error) {
      console.error('Solution submission failed:', error);
      // Don't close puzzle view on error, let user try again or navigate away manually
    }
  };

  const handleBackToPuzzles = () => {
    setSelectedPuzzle(null);
    setPuzzleStartTime(null);
  };

  if (loadingCompetition) {
    return (
      <div className={styles['live-competition-loading']}>
        <div className={styles['loading-spinner']}></div>
        <p>Loading competition...</p>
      </div>
    );
  }

  if (!competitionData) {
    return (
      <div className={styles['live-competition-error']}>
        <h2>Competition not found</h2>
        <button onClick={() => navigate('/competitions')}>
          Back to Competitions
        </button>
      </div>
    );
  }

  // Show participation screen if not participated yet
  if (!hasParticipated && !competition) {
    return (
      <div className={styles['live-competition-page']}>
        <div className={styles['participation-screen']}>
          <div className={styles['competition-info']}>
            <h1>{competitionData.name}</h1>
            <p className={styles['competition-description']}>{competitionData.description}</p>

            <div className={styles['competition-details']}>
              <div className={styles['detail-item']}>
                <span className={styles.label}>Start Time:</span>
                <span className={styles.value}>
                  {new Date(competitionData.startTime).toLocaleString()}
                </span>
              </div>
              <div className={styles['detail-item']}>
                <span className={styles.label}>End Time:</span>
                <span className={styles.value}>
                  {new Date(competitionData.endTime).toLocaleString()}
                </span>
              </div>
              <div className={styles['detail-item']}>
                <span className={styles.label}>Duration:</span>
                <span className={styles.value}>{competitionData.duration} minutes</span>
              </div>
              <div className={styles['detail-item']}>
                <span className={styles.label}>Puzzles:</span>
                <span className={styles.value}>{competitionData.puzzles?.length || 0}</span>
              </div>
            </div>

            <div className={styles['participation-actions']}>
              <button
                className={styles['participate-btn']}
                onClick={handleParticipate}
                disabled={isLoading}
              >
                {isLoading ? 'Joining...' : '🚀 Participate Now'}
              </button>

              <button
                className={styles['back-btn']}
                onClick={() => navigate('/competitions')}
              >
                Back to Competitions
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show puzzle solving interface if puzzle is selected
  if (selectedPuzzle) {
    return (
      <div className={styles['live-competition-page']}>
        <div className={styles['puzzle-solving-interface']}>
          <div className={styles['puzzle-header']}>
            <button className={styles['back-btn']} onClick={handleBackToPuzzles}>
              ← Back to Puzzles
            </button>
            <h2>{selectedPuzzle.title}</h2>
            <div className={styles['puzzle-info']}>
              <span className={styles.difficulty}>{selectedPuzzle.difficulty}</span>
              <span className={styles.category}>{selectedPuzzle.category}</span>
            </div>
          </div>

          <div className={styles['puzzle-content']}>
            {/* Chess board component would go here */}
            <div className={styles['chess-board-placeholder']}>
              <p>Chess Board Component</p>
              <p>FEN: {selectedPuzzle.fen}</p>
              <p>Solution: {JSON.stringify(selectedPuzzle.solutionMoves)}</p>

              {/* Temporary solution buttons for testing */}
              <div className={styles['temp-solution-buttons']}>
                <button
                  onClick={() => handleSolutionSubmit(selectedPuzzle.solutionMoves)}
                  className={styles['correct-solution-btn']}
                >
                  Submit Correct Solution
                </button>
                <button
                  onClick={() => handleSolutionSubmit(['wrong', 'moves'])}
                  className={styles['wrong-solution-btn']}
                >
                  Submit Wrong Solution
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main competition interface
  return (
    <div className={styles['live-competition-page']}>
      <div className={styles['competition-header']}>
        <div className={styles['header-left']}>
          {/* Timer moved to top-left */}
          <CompetitionTimer />
        </div>

        <div className={styles['header-center']}>
          <h1>{competition?.name}</h1>
          <div className={styles['connection-indicator']}>
            <span className={`${styles.indicator} ${isConnected ? styles.connected : styles.disconnected}`}>
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
          </div>
        </div>

        <div className={styles['header-actions']}>
          <button
            className={styles['toggle-leaderboard-btn']}
            onClick={() => setShowLeaderboard(!showLeaderboard)}
          >
            {showLeaderboard ? 'Hide' : 'Show'} Leaderboard
          </button>
          <button
            className={styles['leave-btn']}
            onClick={() => {
              disconnectFromCompetition();
              navigate('/competitions');
            }}
          >
            Leave Competition
          </button>
        </div>
      </div>

      {error && (
        <div className={styles['error-banner']}>
          <span>⚠️ {error}</span>
        </div>
      )}

      {competitionEnded && (
        <div className={styles['competition-ended-banner']}>
          <span>🏁 Competition has ended! Check the final results below.</span>
        </div>
      )}

      <div className={styles['competition-content']}>
        <div className={styles['main-area']}>
          {/* Puzzles Grid Section */}
          <div className={styles['puzzles-section']}>
            <h3>Competition Puzzles</h3>
            <div className={styles['puzzles-grid']}>
              {puzzles.map((puzzle, index) => (
                <div
                  key={puzzle._id}
                  className={`${styles['puzzle-card']} 
                    ${puzzle.isSolved ? styles.solved : ''} 
                    ${puzzle.isFailed ? styles.failed : ''} 
                    ${puzzle.isLocked ? styles.locked : ''} 
                    ${!isCompetitionActive() ? styles.disabled : ''}`}
                  onClick={() => isCompetitionActive() && handlePuzzleSelect(puzzle)}
                >
                  <div className={styles['puzzle-number']}>#{index + 1}</div>
                  <div className={styles['puzzle-title']}>{puzzle.title}</div>
                  <div className={styles['puzzle-difficulty']}>{puzzle.difficulty}</div>

                  {puzzle.isSolved && (
                    <div className={styles['solved-indicator']}>
                      ✅ +{puzzle.solvedData?.scoreEarned || 0} pts
                    </div>
                  )}

                  {puzzle.isFailed && (
                    <div className={styles['failed-indicator']}>
                      ❌ Failed
                    </div>
                  )}

                  {puzzle.status === 'in_progress' && (
                    <div className={styles['in-progress-indicator']}>
                      🔄 In Progress
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Live Racing Animation - Below Board */}
          <div className={styles['race-section']}>
            <PuzzleRacer />
          </div>
        </div>

        {/* Right Sidebar - Puzzle Details/Stats */}
        {participant && (
          <div className={styles['right-panel']}>
            <div className={styles['participant-stats']}>
              <h3>Your Progress</h3>
              <div className={styles['stats-grid']}>
                <div className={styles['stat-item']}>
                  <span className={styles['stat-value']}>{participant.score}</span>
                  <span className={styles['stat-label']}>Score</span>
                </div>
                <div className={styles['stat-item']}>
                  <span className={styles['stat-value']}>
                    {getSolvedPuzzlesCount()}/{getTotalPuzzlesCount()}
                  </span>
                  <span className={styles['stat-label']}>Puzzles Solved</span>
                </div>
                <div className={styles['stat-item']}>
                  <span className={styles['stat-value']}>
                    {Math.floor(participant.timeSpent / 60)}m
                  </span>
                  <span className={styles['stat-label']}>Time</span>
                </div>
              </div>
            </div>

            {showLeaderboard && (
              <div className={styles['leaderboard-container']}>
                <LiveLeaderboard />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveCompetitionPage;