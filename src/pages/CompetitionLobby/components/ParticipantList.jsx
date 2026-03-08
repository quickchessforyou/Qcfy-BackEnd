import React from "react";
import { FaUserCircle } from "react-icons/fa";
import styles from "../CompetitionLobby.module.css";

const ParticipantList = ({
    participants,
    user,
    competition,
    currentPage,
    setCurrentPage,
    itemsPerPage,
}) => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentParticipants = participants.slice(
        indexOfFirstItem,
        indexOfLastItem,
    );
    const totalPages = Math.ceil(participants.length / itemsPerPage) || 1;

    const handlePageChange = (pageNum) => {
        if (pageNum >= 1 && pageNum <= totalPages) {
            setCurrentPage(pageNum);
        }
    };

    const getStatus = (participant) => {
        if (participant.status) return participant.status;
        if (participant.isSubmitted) return "Submitted";
        return "Waiting";
    };

    const formatTime = (seconds) => {
        if (!seconds && seconds !== 0) return "--:--";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    return (
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
    );
};

export default ParticipantList;
