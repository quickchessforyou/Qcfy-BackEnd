import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaTrophy,
    FaCalendarAlt,
    FaClock,
    FaUsers,
    FaGamepad,
    FaSignInAlt,
    FaCheckCircle
} from "react-icons/fa";
import styles from "./Competitions.module.css";
import { competitionAPI } from "../../services/api";
import { liveCompetitionAPI } from "../../services/liveCompetitionAPI";
import CompetitionLeaderboard from "../../components/CompetitionLeaderboard/CompetitionLeaderboard"; // Import Leaderboard
import { useAuth } from "../../contexts/AuthContext";
import toast, { Toaster } from 'react-hot-toast';
import { FaTimes } from 'react-icons/fa'; // Added FaTimes for modal close

function Competitions() {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const [liveCompetitions, setLiveCompetitions] = useState([]);
    const [upcomingCompetitions, setUpcomingCompetitions] = useState([]);
    const [ENDEDCompetitions, setENDEDCompetitions] = useState([]); // State for ENDED competitions
    const [loading, setLoading] = useState(true);
    const [joiningId, setJoiningId] = useState(null);

    // Result Modal State
    const [showResultModal, setShowResultModal] = useState(false);
    const [selectedCompetitionId, setSelectedCompetitionId] = useState(null);

    useEffect(() => {
        fetchCompetitions(); // Initial load

        // Poll for updates every 5 seconds
        const interval = setInterval(() => {
            fetchCompetitions(true);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const fetchCompetitions = async (isBackground = false) => {
        try {
            if (!isBackground) setLoading(true);
            // Fetch live
            const liveRes = await competitionAPI.getCompetitions({ status: 'live', limit: 50 });
            // Fetch upcoming
            const upcomingRes = await competitionAPI.getCompetitions({ status: 'upcoming', limit: 50 });
            // Fetch ENDED
            const ENDEDRes = await competitionAPI.getCompetitions({ status: 'ENDED', limit: 50 });

            if (liveRes.success) setLiveCompetitions(liveRes.data);
            if (upcomingRes.success) setUpcomingCompetitions(upcomingRes.data);
            if (ENDEDRes.success) setENDEDCompetitions(ENDEDRes.data);
        } catch (error) {
            console.error("Failed to load competitions:", error);
            if (!isBackground) toast.error("Failed to load competitions");
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    const handleViewResults = (competitionId) => {
        setSelectedCompetitionId(competitionId);
        setShowResultModal(true);
    };

    const handleJoin = async (competition) => {
        if (!isAuthenticated) {
            // Redirect to login with return url
            navigate(`/login?returnTo=/competitions`);
            return;
        }

        try {
            setJoiningId(competition._id);
            await competitionAPI.joinCompetition(competition._id);
            toast.success("Joined successfully!");

            // Refresh list to update UI state
            fetchCompetitions();
        } catch (error) {
            console.error("Failed to join:", error);
            toast.error(error.response?.data?.message || "Failed to join competition");
        } finally {
            setJoiningId(null);
        }
    };

    const handlePlay = (competitionId) => {
        // Navigate to live competition page instead of regular puzzle page
        navigate(`/live-competition/${competitionId}`);
    };

    const isJoined = (competition) => {
        if (!user || !competition.participants) return false;
        return competition.participants.some(p => p.user?._id === user.id || p.user === user.id);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const CompetitionCard = ({ competition, status }) => {
        const joined = isJoined(competition);
        const isFull = competition.maxParticipants && competition.participants.length >= competition.maxParticipants;

        // Determine badge based on status
        let statusBadge;
        if (status === 'live') {
            statusBadge = <span className={styles.liveBadge}>LIVE</span>;
        } else if (status === 'upcoming') {
            statusBadge = <span className={styles.upcomingBadge}>UPCOMING</span>;
        } else {
            statusBadge = <span className={styles.ENDEDBadge} style={{ background: '#6c757d', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>ENDED</span>;
        }

        return (
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h3>{competition.name}</h3>
                    {statusBadge}
                </div>

                <div className={styles.cardBody}>
                    <div className={styles.infoRow}>
                        <FaCalendarAlt />
                        <span>{formatDate(competition.startTime)}</span>
                    </div>
                    <div className={styles.infoRow}>
                        <FaClock />
                        <span>{competition.duration} mins</span>
                    </div>
                    <div className={styles.infoRow}>
                        <FaUsers />
                        <span>{competition.participants?.length || 0} / {competition.maxParticipants || '∞'} Players</span>
                    </div>
                    {competition.description && (
                        <p className={styles.description}>{competition.description}</p>
                    )}
                </div>

                <div className={styles.cardFooter}>
                    {status === 'ENDED' ? (
                        <button
                            className={styles.joinBtn}
                            onClick={() => handleViewResults(competition._id)}
                            style={{ background: '#17a2b8' }}
                        >
                            <FaTrophy /> View Results
                        </button>
                    ) : joined ? (
                        status === 'live' ? (
                            <button
                                className={styles.playBtn}
                                onClick={() => handlePlay(competition._id)}
                            >
                                <FaGamepad /> Join Live Competition
                            </button>
                        ) : (
                            <button className={styles.disabledBtn} disabled>
                                <FaCheckCircle /> Registered (Starts Soon)
                            </button>
                        )
                    ) : (
                        <button
                            className={isAuthenticated ? styles.joinBtn : styles.loginBtn}
                            onClick={() => handleJoin(competition)}
                            disabled={joiningId === competition._id || (isFull && isAuthenticated)}
                        >
                            {isAuthenticated ? (
                                joiningId === competition._id ? 'Joining...' : (isFull ? 'Full' : 'Join Competition')
                            ) : (
                                <><FaSignInAlt /> Login to Join</>
                            )}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading competitions...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Toaster position="top-right" />

            {/* Leaderboard/Result Modal */}
            {showResultModal && selectedCompetitionId && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        zIndex: 1000,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '20px'
                    }}
                >
                    <div
                        style={{
                            backgroundColor: '#262421',
                            borderRadius: '8px',
                            width: '100%',
                            maxWidth: '600px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            position: 'relative',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                        }}
                    >
                        <div style={{ padding: '15px 20px', borderBottom: '1px solid #404040', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, color: '#e5e5e5', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FaTrophy style={{ color: '#ffc107' }} /> Competition Results
                            </h3>
                            <button
                                onClick={() => setShowResultModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#999',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem'
                                }}
                            >
                                <FaTimes />
                            </button>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <CompetitionLeaderboard
                                competitionId={selectedCompetitionId}
                                isLive={false}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.header}>
                <h1><FaTrophy /> Chess Competitions</h1>
                <p>Join live tournaments and compete with others!</p>
            </div>

            {liveCompetitions.length > 0 && (
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>🔴 Live Now</h2>
                    <div className={styles.grid}>
                        {liveCompetitions.map(comp => (
                            <CompetitionCard key={comp._id} competition={comp} status="live" />
                        ))}
                    </div>
                </div>
            )}

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>📅 Upcoming Events</h2>
                {upcomingCompetitions.length > 0 ? (
                    <div className={styles.grid}>
                        {upcomingCompetitions.map(comp => (
                            <CompetitionCard key={comp._id} competition={comp} status="upcoming" />
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <FaCalendarAlt />
                        <p>No upcoming competitions scheduled.</p>
                    </div>
                )}
            </div>

            {ENDEDCompetitions.length > 0 && (
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>🏆 Past Competitions</h2>
                    <div className={styles.grid}>
                        {ENDEDCompetitions.map(comp => (
                            <CompetitionCard key={comp._id} competition={comp} status="ENDED" />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Competitions;
