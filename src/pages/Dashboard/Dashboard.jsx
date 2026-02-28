import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { competitionAPI } from "../../services/api";
import PageHeader from "../../components/PageHeader/PageHeader";
import styles from "./Dashboard.module.css";
import { useAuth } from "../../contexts/AuthContext";
import {
  FaCalendarAlt,
  FaClock,
  FaPuzzlePiece,
  FaUserFriends,
  FaTrophy,
  FaChevronRight,
  FaChartBar,
  FaEye
} from "react-icons/fa";

function Dashboard() {
  const navigate = useNavigate();
  const { isUserAuthenticated } = useAuth();

  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [filteredCompetitions, setFilteredCompetitions] = useState([]);

  // Fetch Competitions
  const fetchCompetitions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await competitionAPI.getAll();
      if (response.success && Array.isArray(response.data)) {
        const formattedCompetitions = response.data.map((comp) => {
          const startDate = new Date(comp.startTime);
          const endDate = new Date(comp.endTime);
          const now = new Date();

          let status = "Upcoming";
          if (now < startDate) status = "Upcoming";
          else if (now >= startDate && now <= endDate) status = "Live";
          else status = "Ended";

          const durationMs = endDate - startDate;
          const durationMins = Math.floor(durationMs / 60000);
          const durationText =
            durationMins > 60
              ? `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`
              : `${durationMins}m`;

          return {
            id: comp._id,
            _id: comp._id,
            title: comp.name || comp.title || "Untitled Competition",
            dateDisplay: formatDateRange(comp.startTime),
            startDate: comp.startTime,
            endDate: comp.endTime,
            participants: comp.participants?.length || 0,
            maxPlayers: comp.maxPlayers || 100,
            status,
            puzzlesCount: comp.puzzles?.length || 0,
            durationText,
          };
        });

        const sorted = formattedCompetitions.sort((a, b) => {
          const statusOrder = { Live: 1, Upcoming: 2, Ended: 3 };
          if (statusOrder[a.status] !== statusOrder[b.status]) {
            return statusOrder[a.status] - statusOrder[b.status];
          }
          return new Date(a.startDate) - new Date(b.startDate);
        });

        setCompetitions(sorted);
      } else {
        setCompetitions([]);
      }
    } catch (err) {
      console.error("Failed to fetch competitions:", err);
      setError("Failed to load competitions.");
      setCompetitions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions, activeTab]);

  useEffect(() => {
    if (activeTab === "All") {
      setFilteredCompetitions(competitions);
    } else {
      setFilteredCompetitions(
        competitions.filter((c) => c.status.toLowerCase() === activeTab.toLowerCase())
      );
    }
  }, [activeTab, competitions]);

  const formatDateRange = (startDate) => {
    if (!startDate) return "TBA";
    const start = new Date(startDate);
    return start.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleParticipate = (competition) => {
    if (!isUserAuthenticated) {
      navigate("/", { state: { openLogin: true } });
      return;
    }
    if (competition.status === "Ended") {
      navigate(`/leaderboard/${competition._id}`);
    } else {
      navigate(`/competition/${competition._id}/lobby`);
    }
  };

  const handleViewPuzzles = (e, competition) => {
    e.stopPropagation();
    if (!isUserAuthenticated) {
      navigate("/", { state: { openLogin: true } });
      return;
    }
    navigate(`/competition/${competition._id}/puzzle`, { state: { reviewMode: true } });
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <PageHeader
          title="Puzzle Arena"
          subtitle="Compete in real-time chess puzzle battles"
          icon={<FaTrophy />}
        />

        {/* Filter Tabs */}
        <div className={styles.tabsContainer}>
          <div className={styles.filterTabs}>
            {["All", "Live", "Upcoming", "Ended"].map((tab) => (
              <button
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading Arena...</p>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <p>{error}</p>
            <button onClick={fetchCompetitions} className={styles.retryBtn}>Retry</button>
          </div>
        ) : filteredCompetitions.length === 0 ? (
          <div className={styles.emptyState}>
            <FaTrophy className={styles.emptyIcon} />
            <h3>No Competitions Found</h3>
            <p>There are no tournaments in this category right now.</p>
          </div>
        ) : (
          <div className={styles.tournamentList}>
            {filteredCompetitions.map((comp) => (
              <div
                key={comp.id}
                className={`${styles.card} ${styles[comp.status.toLowerCase()]}`}
                onClick={() => handleParticipate(comp)}
              >
                <div className={styles.cardMain}>
                  {/* Header: Status + Title */}
                  <div className={styles.cardHeader}>
                    <span className={`${styles.statusBadge} ${styles[`badge${comp.status}`]}`}>
                      {comp.status === 'Live' && <span className={styles.liveDot}></span>}
                      {comp.status}
                    </span>
                    <h3 className={styles.cardTitle}>{comp.title}</h3>
                  </div>

                  {/* Metadata Grid */}
                  <div className={styles.metaGrid}>
                    <div className={styles.metaItem}>
                      <FaCalendarAlt className={styles.metaIcon} />
                      <span>{comp.dateDisplay}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <FaClock className={styles.metaIcon} />
                      <span>{comp.durationText}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <FaPuzzlePiece className={styles.metaIcon} />
                      <span>{comp.puzzlesCount} Puzzles</span>
                    </div>
                    <div className={styles.metaItem}>
                      <FaUserFriends className={styles.metaIcon} />
                      <span>{comp.participants} Players</span>
                    </div>
                  </div>
                </div>

                {/* Footer / Actions */}
                <div className={styles.cardFooter}>
                  {comp.status === "Ended" ? (
                    <div className={styles.actionGroup}>
                      <button
                        className={`${styles.actionBtn} ${styles.outlineBtn}`}
                        onClick={(e) => handleViewPuzzles(e, comp)}
                      >
                        <FaEye /> Puzzles
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.primaryBtn}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/leaderboard/${comp._id}`);
                        }}
                      >
                        <FaChartBar /> Results
                      </button>
                    </div>
                  ) : (
                    <button className={`${styles.actionBtn} ${styles.primaryBtn} ${styles.fullWidthBtn}`}>
                      {comp.status === 'Live' ? 'Join Now' : 'Enter Lobby'} <FaChevronRight />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;