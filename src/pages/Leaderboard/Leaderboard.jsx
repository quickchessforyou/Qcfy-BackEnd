import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaTrophy,
  FaMedal,
  FaClock,
  FaSync,
  FaCrown,
  FaBolt,
  FaChartLine,
  FaUserCircle,
  FaArrowUp,
  FaFire,
  FaArrowLeft,
  FaChessKnight,
  FaBullseye,
  FaStopwatch
} from "react-icons/fa";
import { liveCompetitionAPI } from "../../services/liveCompetitionAPI";
import { competitionAPI } from "../../services/api";
import socketService from "../../services/socketService";
import styles from "./Leaderboard.module.css";

function Leaderboard() {
  const { competitionId } = useParams();
  const navigate = useNavigate();

  const [leaderboard, setLeaderboard] = useState([]);
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const hasAutoPaginatedRef = React.useRef(false);

  useEffect(() => {
    if (competitionId) {
      loadCompetitionData();
      loadLeaderboard();
    }

    // Cleanup on unmount
    return () => {
      socketService.off('leaderboardUpdate', handleLeaderboardUpdate);
      socketService.off('participantJoined', handleParticipantJoined);
    };
  }, [competitionId]);

  // Polling fallback for live competitions (every 10 seconds)
  useEffect(() => {
    if (!isLive || !competitionId) return;

    const pollInterval = setInterval(() => {
      loadLeaderboard(false); // silent refresh
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [isLive, competitionId]);

  // Socket event handlers (stable references for cleanup)
  const handleLeaderboardUpdate = (newLeaderboard) => {
    console.log('[Leaderboard] Socket: leaderboardUpdate received', newLeaderboard?.length);
    setLeaderboard(newLeaderboard);
  };

  const handleParticipantJoined = (data) => {
    console.log('[Leaderboard] Socket: participantJoined', data);
    // Refresh leaderboard when someone joins
    loadLeaderboard(false);
  };

  const loadCompetitionData = async () => {
    try {
      const response = await competitionAPI.getById(competitionId);
      if (response.success) {
        setCompetition(response.data);
        const competitionIsLive = response.data.status === 'live' || response.data.status === 'LIVE';
        setIsLive(competitionIsLive);
        if (competitionIsLive) {
          setupLiveUpdates();
        }
      }
    } catch (error) {
      console.error('Failed to load competition:', error);
    }
  };

  const loadLeaderboard = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const response = await liveCompetitionAPI.getLeaderboard(competitionId);
      if (response.success && response.leaderboard) {
        setLeaderboard(response.leaderboard);

        // Auto-paginate to the user's page on initial load
        if (!hasAutoPaginatedRef.current) {
          const currentId = getCurrentUser();
          if (currentId) {
            const userIndex = response.leaderboard.findIndex(u => {
              const targetId = typeof u.userId === 'object' ? (u.userId?._id || u.userId?.id) : u.userId;
              return String(targetId) === String(currentId);
            });
            if (userIndex !== -1) {
              const expectedPage = Math.floor(userIndex / itemsPerPage) + 1;
              setCurrentPage(expectedPage);
              hasAutoPaginatedRef.current = true;
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const setupLiveUpdates = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      // Properly await the socket connection
      await socketService.connect({ competition: { id: competitionId } });
      console.log('[Leaderboard] Socket connected, setting up listeners');

      // Listen for real-time leaderboard updates
      socketService.on('leaderboardUpdate', handleLeaderboardUpdate);
      socketService.on('participantJoined', handleParticipantJoined);
    } catch (error) {
      console.error('[Leaderboard] Socket connection failed, using polling only:', error);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return "-";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getCurrentUser = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id || user._id;
  };

  const isCurrentUser = (userId) => {
    const currentId = getCurrentUser();
    if (!currentId || !userId) return false;
    const targetId = typeof userId === 'object' ? (userId._id || userId.id) : userId;
    return String(targetId) === String(currentId);
  };

  const calculateAccuracy = (puzzlesSolved, totalPuzzles) => {
    if (!totalPuzzles || totalPuzzles === 0) return 0;
    return Math.round((puzzlesSolved / totalPuzzles) * 100);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  const totalPuzzles = competition?.totalPuzzles || competition?.puzzles?.length || 20;
  const top3 = [...leaderboard];
  while (top3.length < 3) top3.push(null);

  const averageAccuracy = leaderboard.length > 0
    ? Math.round(leaderboard.reduce((acc, curr) => acc + (calculateAccuracy(curr.puzzlesSolved, totalPuzzles)), 0) / leaderboard.length)
    : 0;

  // The user explicitly requested to base the 50% criteria on the TOTAL puzzles possible, not the max score achieved by others.
  const requiredPuzzlesSolved = Math.ceil(totalPuzzles * 0.5);
  const eligibleSolvers = leaderboard.filter(u => (u.puzzlesSolved || 0) >= requiredPuzzlesSolved && (u.puzzlesSolved || 0) > 0);

  const fastestSolver = eligibleSolvers.length > 0
    ? [...eligibleSolvers].sort((a, b) => (a.timeSpent || 999999) - (b.timeSpent || 999999))[0]
    : null;

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLeaderboard = leaderboard.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(leaderboard.length / itemsPerPage);

  const handlePageChange = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  return (
    <div className={styles.leaderboardPage}>
      {/* Remove generic page header layout from here, moving elements individually */}

      {leaderboard.length === 0 ? (
        <div className={styles.emptyState}>
          <FaTrophy className={styles.emptyIcon} />
          <h3>No Participants Yet</h3>
          <p>Be the first to join and compete!</p>
        </div>
      ) : (
        <div className={styles.mainContent}>
          {/* LEFT: Podium */}
          <div className={styles.leftPanel}>
            <div className={styles.podiumSection}>
              {/* Solid header block matching figma */}
              <div className={styles.topChampionsHeader}>
                <FaTrophy className={styles.headerTrophyIcon} />
                <h2>TOP CHAMPIONS</h2>
              </div>

              <div className={styles.podium}>
                {/* 2nd Place */}
                <div className={`${styles.podiumPlace} ${styles.second}`}>
                  <div className={styles.podiumAvatar}>
                    <div className={styles.avatarCircle}>
                      {top3[1] ? top3[1].username?.[0]?.toUpperCase() : '?'}
                    </div>
                    <div className={`${styles.rankBadge} ${styles.badge2}`}>2</div>
                  </div>
                  <div className={styles.podiumName}>{top3[1]?.username || '—'}</div>
                  <div className={styles.podiumScore}>{top3[1]?.score || 0} pts</div>
                  <div className={`${styles.podiumBar} ${styles.bar2}`}>
                    {top3[1] && (
                      <div className={styles.barStats}>
                        <span className={styles.accBadge}>{calculateAccuracy(top3[1].puzzlesSolved, totalPuzzles)}% Acc</span>
                        <span className={styles.timeBadge}>{formatTime(top3[1].timeSpent)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 1st Place */}
                <div className={`${styles.podiumPlace} ${styles.first}`}>
                  <FaCrown className={styles.crownIcon} />
                  <div className={styles.podiumAvatar}>
                    <div className={styles.avatarCircle}>
                      {top3[0] ? top3[0].username?.[0]?.toUpperCase() : '?'}
                    </div>
                    <div className={`${styles.rankBadge} ${styles.badge1}`}>1</div>
                  </div>
                  <div className={styles.podiumName}>{top3[0]?.username || '—'}</div>
                  <div className={styles.podiumScore}>{top3[0]?.score || 0} pts</div>
                  <div className={`${styles.podiumBar} ${styles.bar1}`}>
                    {top3[0] && (
                      <div className={styles.barStats}>
                        <span className={styles.accBadge}>{calculateAccuracy(top3[0].puzzlesSolved, totalPuzzles)}% Acc</span>
                        <span className={styles.timeBadge}>{formatTime(top3[0].timeSpent)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3rd Place */}
                <div className={`${styles.podiumPlace} ${styles.third}`}>
                  <div className={styles.podiumAvatar}>
                    <div className={styles.avatarCircle}>
                      {top3[2] ? top3[2].username?.[0]?.toUpperCase() : '?'}
                    </div>
                    <div className={`${styles.rankBadge} ${styles.badge3}`}>3</div>
                  </div>
                  <div className={styles.podiumName}>{top3[2]?.username || '—'}</div>
                  <div className={styles.podiumScore}>{top3[2]?.score || 0} pts</div>
                  <div className={`${styles.podiumBar} ${styles.bar3}`}>
                    {top3[2] && (
                      <div className={styles.barStats}>
                        <span className={styles.accBadge}>{calculateAccuracy(top3[2].puzzlesSolved, totalPuzzles)}% Acc</span>
                        <span className={styles.timeBadge}>{formatTime(top3[2].timeSpent)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Fastest Solver Banner in separate card */}
            {fastestSolver && (
              <div className={styles.fastestSolverCard}>
                <div className={styles.fastestBanner}>
                  <FaBolt /> Fastest Solver
                </div>
                <div className={styles.userStatsFooter}>
                  <div className={styles.footerName}>{fastestSolver.username}</div>
                  <div className={styles.footerAcc}>
                    Avg Accuracy {calculateAccuracy(fastestSolver.puzzlesSolved, totalPuzzles)}%
                    <FaArrowUp style={{ color: '#10b981', marginLeft: '4px', marginRight: '4px' }} />
                    {/* Mock static stat for visual parity with design */}
                    <span>{`+${Math.max(1, calculateAccuracy(fastestSolver.puzzlesSolved, totalPuzzles) - averageAccuracy)}% Vs Avg`}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Competition Info + Full Rankings */}
          <div className={styles.rightPanel}>
            {/* Top Right Competition Details Block */}
            <div className={styles.competitionInfoCard}>
              <div className={styles.compHeaderRow}>
                <div className={styles.compTitleWrapper}>
                  <button onClick={() => navigate('/dashboard')} className={styles.backBtnWrapper}>
                    <FaArrowLeft />
                  </button>
                  <h2 className={styles.compTitle}>{competition?.name || 'Test Competition'}</h2>
                </div>
                {isLive && (
                  <button onClick={loadLeaderboard} className={styles.refreshBtn}>
                    <FaSync />
                  </button>
                )}
              </div>
              <div className={styles.competitionMeta}>
                <div className={styles.metaPill}>
                  <FaClock /> {competition?.duration || 15} MIN
                </div>
                <div className={styles.metaPill}>
                  <FaUserCircle /> {leaderboard.length} PLAYERS
                </div>
                <div className={styles.metaPill}>
                  {isLive ? '🔴 LIVE' : '✅ COMPLETED'}
                </div>
              </div>
            </div>

            {/* Bottom Right: Full Rankings List */}
            <div className={styles.rankingsPanel}>
              <div className={styles.rankingsPanelHeader}>
                <div className={styles.rankingsTitle}>
                  <FaChartLine /> Full Ranking
                </div>
                {/* Pagination UI moved to TOP */}
                {totalPages > 1 && (
                  <div className={styles.paginationContainer} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      style={{ padding: '4px 12px', borderRadius: '4px', background: currentPage === 1 ? 'rgba(255,255,255,0.1)' : '#d4a373', color: currentPage === 1 ? '#666' : '#fff', border: 'none', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
                    >
                      Prev
                    </button>
                    <span style={{ color: '#d4a373', fontWeight: '600', fontSize: '0.85rem' }}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      style={{ padding: '4px 12px', borderRadius: '4px', background: currentPage === totalPages ? 'rgba(255,255,255,0.1)' : '#d4a373', color: currentPage === totalPages ? '#666' : '#fff', border: 'none', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.rankingsList}>
                {currentLeaderboard.map((user, idx) => {
                  const actualRank = indexOfFirstItem + idx + 1;
                  return (
                    <div
                      key={user.userId}
                      className={`${styles.rankRow} ${isCurrentUser(user.userId) ? styles.currentUser : ''}`}
                    >
                      <div className={styles.rankNum}>
                        <span className={styles.rankNumber}>{actualRank}</span>
                      </div>

                      <div className={styles.rankAvatar}>
                        {user.username?.[0]?.toUpperCase()}
                      </div>

                      <div className={styles.rankInfo}>
                        <span className={styles.rankName}>
                          {isCurrentUser(user.userId) ? 'You' : user.username}
                        </span>
                      </div>

                      <div className={styles.rankScore}>
                        <span className={styles.scoreNumber}>{Math.round(user.score || 0)}</span>
                        <span className={styles.scoreLabel}>pts</span>
                      </div>

                      <div className={styles.rankTime} style={{ display: 'flex', alignItems: 'center', gap: '3px', marginLeft: '10px', minWidth: '55px', justifyContent: 'flex-end', color: 'var(--text-muted)' }}>
                        <span className={styles.timeNumber} style={{ fontSize: '0.9rem', fontWeight: '600', fontFamily: 'monospace' }}>
                          {formatTime(user.timeSpent)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Leaderboard;