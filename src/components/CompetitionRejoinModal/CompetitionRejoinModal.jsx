import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChess, FaRunning, FaTrophy } from 'react-icons/fa';
import './CompetitionRejoinModal.css';

const CompetitionRejoinModal = ({ competition, onClose }) => {
    const navigate = useNavigate();

    if (!competition) return null;

    const handleRejoin = () => {
        navigate(`/competition/${competition.id}/lobby`);
        onClose();
    };

    return (
        <div className="rejoin-modal-overlay">
            <div className="rejoin-modal-content">
                <div className="rejoin-header">
                    <FaChess className="pulse-icon" />
                    <h3>Tournament in Progress!</h3>
                </div>

                <div className="rejoin-body">
                    <p className="highlight-text">
                        Wait! You have an active game in <strong>{competition.name}</strong>.
                    </p>

                    <div className="sportsmanship-note">
                        <FaTrophy className="note-icon" />
                        <p>
                            True sportsmanship means finishing what you start!
                            Rejoin now to complete your puzzles and aim for the top due.
                        </p>
                    </div>
                </div>

                <div className="rejoin-actions">
                    <button className="btn-dismiss" onClick={onClose}>
                        Maybe Later
                    </button>
                    <button className="btn-rejoin" onClick={handleRejoin}>
                        <FaRunning /> Rejoin Tournament
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CompetitionRejoinModal;
