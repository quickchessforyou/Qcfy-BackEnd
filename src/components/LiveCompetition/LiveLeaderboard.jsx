import React, { useState, useEffect } from 'react';
import { useLiveCompetition } from '../../contexts/LiveCompetitionContext';
import './LiveLeaderboard.css';

const LiveLeaderboard = () => {
  const { 
    leaderboard, 
    lastUpdate, 
    refreshLeaderboard, 
    getCurrentUserRank,
    isConnected 
  } = useLiveCompetition();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [highlightUpdate, setHighlightUpdate] = useState(false);

  // Get current user info
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserRank = getCurrentUserRank();

  // Highlight leaderboard when it updates
  useEffect(() => {
    if (lastUpdate) {
      setHighlightUpdate(true);
      const timer = setTimeout(() => {
        setHighlightUpdate(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdate]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    refreshLeaderboard();
    
    // Reset refreshing state after a delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get rank display with medal icons
  const getRankDisplay = (rank) => {
    switch (rank) {
      case 1:
        return <span className="rank gold">🥇 #{rank}</span>;
      case 2:
        return <span className="rank silver">🥈 #{rank}</span>;
      case 3:
        return <span className="rank bronze">🥉 #{rank}</span>;
      default:
        return <span className="rank">#{rank}</span>;
    }
  };

  return (
    <div className={`live-leaderboard ${highlightUpdate ? 'updated' : ''}`}>
      <div className="leaderboard-header">
        <div className="header-left">
          <h3>🏆 Live Leaderboard</h3>
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '🟢 Live' : '🔴 Offline'}
            </span>
          </div>
        </div>
        
        <div className="header-right">
          {lastUpdate && (
            <span className="last-update">
              Updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <button 
            className={`refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh leaderboard"
          >
            🔄
          </button>
        </div>
      </div>

      {currentUserRank && (
        <div className="user-rank-display">
          <span className="your-rank">
            Your Rank: {getRankDisplay(currentUserRank)}
          </span>
        </div>
      )}

      <div className="leaderboard-table">
        <div className="table-header">
          <span className="col-rank">Rank</span>
          <span className="col-player">Player</span>
          <span className="col-score">Score</span>
          <span className="col-puzzles">Puzzles</span>
          <span className="col-time">Time</span>
        </div>
        
        <div className="table-body">
          {leaderboard.length > 0 ? (
            leaderboard.map((participant) => (
              <div 
                key={participant.userId}
                className={`table-row ${
                  participant.userId === currentUser.id ? 'current-user' : ''
                } ${participant.rank <= 3 ? 'top-three' : ''}`}
              >
                <span className="col-rank">
                  {getRankDisplay(participant.rank)}
                </span>
                <span className="col-player">
                  <div className="player-info">
                    {participant.avatar && (
                      <img 
                        src={participant.avatar} 
                        alt={participant.username}
                        className="player-avatar"
                      />
                    )}
                    <div className="player-details">
                      <span className="username">{participant.username}</span>
                      {participant.name && participant.name !== participant.username && (
                        <span className="full-name">{participant.name}</span>
                      )}
                    </div>
                  </div>
                </span>
                <span className="col-score">
                  <span className="score-value">{participant.score}</span>
                  <span className="score-label">pts</span>
                </span>
                <span className="col-puzzles">
                  {participant.puzzlesSolved}
                </span>
                <span className="col-time">
                  {formatTime(participant.timeSpent)}
                </span>
              </div>
            ))
          ) : (
            <div className="no-participants">
              <div className="empty-state">
                <span className="empty-icon">👥</span>
                <p>No participants yet</p>
                <small>Be the first to solve a puzzle!</small>
              </div>
            </div>
          )}
        </div>
      </div>

      {leaderboard.length > 10 && (
        <div className="leaderboard-footer">
          <small>Showing top {Math.min(leaderboard.length, 50)} participants</small>
        </div>
      )}
    </div>
  );
};

export default LiveLeaderboard;