import React, { useState, useEffect } from 'react';
import { useLiveCompetition } from '../../contexts/LiveCompetitionContext';
import './CompetitionTimer.css';

const CompetitionTimer = () => {
  const { competition, getTimeRemaining, isCompetitionActive } = useLiveCompetition();
  const [timeLeft, setTimeLeft] = useState(0);
  const [isWarning, setIsWarning] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  useEffect(() => {
    if (!competition) return;

    const updateTimer = () => {
      const remaining = getTimeRemaining();
      setTimeLeft(remaining);

      // Set warning states
      const minutes = Math.floor(remaining / (1000 * 60));
      setIsWarning(minutes <= 10 && minutes > 5);
      setIsCritical(minutes <= 5);
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [competition, getTimeRemaining]);

  // Format time display
  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get progress percentage
  const getProgress = () => {
    if (!competition) return 0;
    
    const start = new Date(competition.startTime).getTime();
    const end = new Date(competition.endTime).getTime();
    const now = Date.now();
    
    const total = end - start;
    const elapsed = now - start;
    
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  // Get status message
  const getStatusMessage = () => {
    if (!competition) return 'No competition';
    
    const now = new Date();
    const startTime = new Date(competition.startTime);
    const endTime = new Date(competition.endTime);
    
    if (now < startTime) {
      return 'Competition starts soon';
    } else if (now > endTime) {
      return 'Competition ended';
    } else {
      return 'Competition in progress';
    }
  };

  if (!competition) {
    return null;
  }

  const progress = getProgress();
  const statusMessage = getStatusMessage();

  return (
    <div className={`competition-timer ${isWarning ? 'warning' : ''} ${isCritical ? 'critical' : ''}`}>
      <div className="timer-header">
        <h4 className="timer-title">⏱️ {competition.name}</h4>
        <span className={`status-badge ${isCompetitionActive() ? 'active' : 'inactive'}`}>
          {statusMessage}
        </span>
      </div>

      <div className="timer-display">
        <div className="time-remaining">
          <span className="time-value">{formatTime(timeLeft)}</span>
          <span className="time-label">remaining</span>
        </div>
        
        {isCritical && (
          <div className="critical-warning">
            ⚠️ Hurry up!
          </div>
        )}
      </div>

      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="progress-text">
          {Math.round(progress)}% complete
        </div>
      </div>

      <div className="timer-details">
        <div className="detail-item">
          <span className="detail-label">Started:</span>
          <span className="detail-value">
            {new Date(competition.startTime).toLocaleTimeString()}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Ends:</span>
          <span className="detail-value">
            {new Date(competition.endTime).toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CompetitionTimer;