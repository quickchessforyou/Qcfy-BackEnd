import React from "react";
import { FaClock } from "react-icons/fa";
import styles from "../CompetitionLobby.module.css";

const CompetitionTimer = ({ competitionState, timeLeft }) => {
    if (competitionState !== "UPCOMING" && competitionState !== "LIVE") {
        return null;
    }

    return (
        <div className={styles.countdownDisplay}>
            <span className={styles.timerLabel}>
                {competitionState === "LIVE" ? "Ends in:" : "Starts in:"}
            </span>
            <div className={styles.timerValue}>
                <FaClock className={styles.timerIcon} /> {timeLeft || "--:--:--"}
            </div>
        </div>
    );
};

export default CompetitionTimer;
