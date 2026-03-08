import { FaClock } from "react-icons/fa";
import styles from "../PuzzlePage.module.css";

const GameTimer = ({ isReviewMode, timeLeft, score, solvedCount, attemptedCount, remainingCount }) => {
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
    };

    return (
        <div className={styles.timerCard}>
            <div className={styles.statCard}>
                <div className={styles.timerDisplay} style={{ alignItems: 'center', marginBottom: '1.5rem', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                        <FaClock className={styles.timerIcon} style={{ marginBottom: 0 }} />
                        <div className={styles.statLabel} style={{ marginBottom: 0 }}>Time Left</div>
                    </div>
                    <div className={styles.timerBadge} style={{ fontSize: '3rem' }}>
                        {isReviewMode ? "∞" : formatTime(timeLeft)}
                    </div>
                </div>

                <div className={styles.statsRow}>
                    <div className={styles.statItem}>
                        <div className={styles.statLabel}>Score</div>
                        <span className={`${styles.statValue} ${styles.highlight}`}>
                            {Math.round(score)}
                        </span>
                    </div>
                    <div className={styles.statItem}>
                        <div className={styles.statLabel}>Solved</div>
                        <span className={styles.statValue}>{solvedCount}</span>
                    </div>
                    {attemptedCount !== undefined && remainingCount !== undefined && (
                        <>
                            <div className={styles.statItem}>
                                <div className={styles.statLabel}>Attempted</div>
                                <span className={styles.statValue}>{attemptedCount}</span>
                            </div>
                            <div className={styles.statItem}>
                                <div className={styles.statLabel}>Remaining</div>
                                <span className={styles.statValue}>{remainingCount}</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GameTimer;
