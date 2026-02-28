import { useState, useEffect } from 'react';
import { FaTrophy, FaClock, FaUsers, FaChartLine, FaPause, FaStop } from 'react-icons/fa';
import { competitionAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import styles from './LiveTournament.module.css';

function LiveTournament() {
  const [liveTournaments, setLiveTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  // Poll for live tournaments
  useEffect(() => {
    fetchLiveTournaments();
    const interval = setInterval(fetchLiveTournaments, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Poll for leaderboard if a tournament is selected
  useEffect(() => {
    if (selectedTournament) {
      fetchLeaderboard(selectedTournament._id);
      const interval = setInterval(() => fetchLeaderboard(selectedTournament._id), 10000); // Poll every 10s
      return () => clearInterval(interval);
    }
  }, [selectedTournament]);

  const fetchLiveTournaments = async () => {
    try {
      const response = await competitionAPI.getAll({ status: 'live' });
      if (response.success) {
        setLiveTournaments(response.data);
        // Auto-select first if none selected
        if (!selectedTournament && response.data.length > 0) {
          setSelectedTournament(response.data[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch live tournaments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async (id) => {
    try {
      const response = await competitionAPI.getLeaderboard(id);
      if (response.leaderboard) {
        setLeaderboard(response.leaderboard);
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    }
  };

  const handlePause = (id) => {
    toast('Pause functionality coming soon (requires Backend update)', { icon: '🚧' });
  };

  const handleEnd = async (id) => {
    if (!window.confirm("Are you sure you want to end this tournament?")) return;
    try {
      // Logic to force end (update status to ENDED) - assuming updateCompetition exists
      await competitionAPI.updateCompetition(id, { status: 'ENDED', isActive: false });
      toast.success("Tournament ended.");
      fetchLiveTournaments();
      setSelectedTournament(null);
      setLeaderboard([]);
    } catch (error) {
      toast.error("Failed to end tournament.");
    }
  };

  const calculateProgress = (val, max) => {
    if (!max) return 0;
    return Math.min(100, (val / max) * 100);
  };

  if (loading) return <div className={styles.loading}>Loading live tournaments...</div>;

  return (
    <div className={styles.liveTournament}>
      <div className={styles.header}>
        <h2>Live Tournaments</h2>
        <p>Monitor ongoing competitions in real-time</p>
      </div>

      {liveTournaments.length === 0 ? (
        <div className={styles.emptyState}>
          <FaTrophy style={{ fontSize: '3rem', color: '#ccc', marginBottom: '1rem' }} />
          <p>No live tournaments at the moment.</p>
        </div>
      ) : (
        <>
          <div className={styles.tournamentsGrid}>
            {liveTournaments.map(tournament => (
              <div
                key={tournament._id}
                className={`${styles.tournamentCard} ${selectedTournament?._id === tournament._id ? styles.activeCard : ''}`}
                onClick={() => setSelectedTournament(tournament)}
              >
                <div className={styles.cardHeader}>
                  <h3>{tournament.name}</h3>
                  <span className={styles.liveBadge}>🔴 LIVE</span>
                </div>

                <div className={styles.tournamentInfo}>
                  <div className={styles.infoRow}>
                    <FaClock />
                    <span>Ends: {new Date(tournament.endTime).toLocaleTimeString()}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <FaUsers />
                    <span>{tournament.participants?.length || 0} / {tournament.maxParticipants || '∞'}</span>
                  </div>
                </div>

                <div className={styles.actions}>
                  <button className={styles.viewBtn} onClick={(e) => { e.stopPropagation(); setSelectedTournament(tournament); }}>View Leaderboard</button>
                  <button className={styles.endBtn} onClick={(e) => { e.stopPropagation(); handleEnd(tournament._id); }}><FaStop /> End</button>
                </div>
              </div>
            ))}
          </div>

          {selectedTournament && (
            <div className={styles.leaderboardSection}>
              <h3>Live Leaderboard - {selectedTournament.name}</h3>
              <div className={styles.leaderboardContainer}>
                {leaderboard.length === 0 ? (
                  <p className={styles.noData}>No participants yet.</p>
                ) : (
                  leaderboard.map((player) => (
                    <div key={player.user?._id || player.rank} className={styles.leaderboardItem}>
                      <div className={styles.rankBadge}>#{player.rank}</div>
                      <div className={styles.playerInfo}>
                        <div className={styles.playerAvatar}>👤</div>
                        <div>
                          <div className={styles.playerName}>{player.user?.name || player.user?.email || 'Unknown'}</div>
                          <div className={styles.playerScore}>{player.score} points</div>
                        </div>
                      </div>
                      <div className={styles.progressTrack}>
                        {/* Visualizing progress based on score relative to top score or fixed max */}
                        <div className={styles.car} style={{ left: `${Math.min(player.score / 5, 95)}%` }}>🏎️</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default LiveTournament;

