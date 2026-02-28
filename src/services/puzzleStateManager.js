/**
 * PuzzleStateManager - Manages puzzle states in localStorage
 * Handles persistence of puzzle status, board positions, and attempt history
 */

class PuzzleStateManager {
  constructor() {
    this.storagePrefix = 'competition_';
  }

  /**
   * Get storage key for a competition
   */
  getStorageKey(competitionId) {
    return `${this.storagePrefix}${competitionId}_state`;
  }

  /**
   * Get all puzzle states for a competition
   */
  getCompetitionState(competitionId) {
    try {
      const key = this.getStorageKey(competitionId);
      const stored = localStorage.getItem(key);
      
      if (!stored) {
        return {
          puzzleStates: {},
          participantData: {
            score: 0,
            puzzlesSolved: 0,
            totalTimeSpent: 0
          }
        };
      }

      return JSON.parse(stored);
    } catch (error) {
      console.error('Error loading competition state:', error);
      return {
        puzzleStates: {},
        participantData: {
          score: 0,
          puzzlesSolved: 0,
          totalTimeSpent: 0
        }
      };
    }
  }

  /**
   * Save competition state to localStorage
   */
  saveCompetitionState(competitionId, state) {
    try {
      const key = this.getStorageKey(competitionId);
      localStorage.setItem(key, JSON.stringify(state));
      return true;
    } catch (error) {
      console.error('Error saving competition state:', error);
      return false;
    }
  }

  /**
   * Get puzzle state for a specific puzzle
   */
  getPuzzleState(competitionId, puzzleId) {
    const competitionState = this.getCompetitionState(competitionId);
    return competitionState.puzzleStates[puzzleId] || {
      status: 'unsolved',
      boardPosition: null,
      moveHistory: [],
      timeSpent: 0,
      lastUpdated: null,
      isLocked: false,
      scoreEarned: 0
    };
  }

  /**
   * Save puzzle state
   */
  savePuzzleState(competitionId, puzzleId, puzzleState) {
    const competitionState = this.getCompetitionState(competitionId);
    
    competitionState.puzzleStates[puzzleId] = {
      ...puzzleState,
      lastUpdated: Date.now()
    };

    return this.saveCompetitionState(competitionId, competitionState);
  }

  /**
   * Mark puzzle as solved
   */
  markPuzzleSolved(competitionId, puzzleId, scoreEarned, timeSpent, finalBoardPosition = null) {
    const puzzleState = this.getPuzzleState(competitionId, puzzleId);
    
    const updatedState = {
      ...puzzleState,
      status: 'solved',
      isLocked: true,
      scoreEarned,
      timeSpent,
      solvedAt: Date.now()
    };

    if (finalBoardPosition) {
      updatedState.boardPosition = finalBoardPosition;
    }

    return this.savePuzzleState(competitionId, puzzleId, updatedState);
  }

  /**
   * Mark puzzle as failed
   */
  markPuzzleFailed(competitionId, puzzleId, timeSpent, finalBoardPosition = null) {
    const puzzleState = this.getPuzzleState(competitionId, puzzleId);
    
    const updatedState = {
      ...puzzleState,
      status: 'failed',
      isLocked: true,
      timeSpent,
      failedAt: Date.now()
    };

    if (finalBoardPosition) {
      updatedState.boardPosition = finalBoardPosition;
    }

    return this.savePuzzleState(competitionId, puzzleId, updatedState);
  }

  /**
   * Save board position for a puzzle
   */
  saveBoardPosition(competitionId, puzzleId, boardPosition, moveHistory = []) {
    const puzzleState = this.getPuzzleState(competitionId, puzzleId);
    
    const updatedState = {
      ...puzzleState,
      boardPosition,
      moveHistory: [...moveHistory],
      status: puzzleState.status === 'unsolved' ? 'in_progress' : puzzleState.status
    };

    return this.savePuzzleState(competitionId, puzzleId, updatedState);
  }

  /**
   * Get board position for a puzzle
   */
  getBoardPosition(competitionId, puzzleId) {
    const puzzleState = this.getPuzzleState(competitionId, puzzleId);
    return {
      boardPosition: puzzleState.boardPosition,
      moveHistory: puzzleState.moveHistory || []
    };
  }

  /**
   * Check if puzzle is locked (solved or failed)
   */
  isPuzzleLocked(competitionId, puzzleId) {
    const puzzleState = this.getPuzzleState(competitionId, puzzleId);
    return puzzleState.isLocked || puzzleState.status === 'solved' || puzzleState.status === 'failed';
  }

  /**
   * Get all puzzle states for UI rendering
   */
  getAllPuzzleStates(competitionId) {
    const competitionState = this.getCompetitionState(competitionId);
    return competitionState.puzzleStates;
  }

  /**
   * Update participant data
   */
  updateParticipantData(competitionId, participantData) {
    const competitionState = this.getCompetitionState(competitionId);
    
    competitionState.participantData = {
      ...competitionState.participantData,
      ...participantData
    };

    return this.saveCompetitionState(competitionId, competitionState);
  }

  /**
   * Clear all data for a competition (cleanup)
   */
  clearCompetitionState(competitionId) {
    try {
      const key = this.getStorageKey(competitionId);
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error clearing competition state:', error);
      return false;
    }
  }

  /**
   * Get solved puzzles count from localStorage
   */
  getSolvedPuzzlesCount(competitionId) {
    const competitionState = this.getCompetitionState(competitionId);
    return Object.values(competitionState.puzzleStates)
      .filter(state => state.status === 'solved').length;
  }

  /**
   * Get failed puzzles count from localStorage
   */
  getFailedPuzzlesCount(competitionId) {
    const competitionState = this.getCompetitionState(competitionId);
    return Object.values(competitionState.puzzleStates)
      .filter(state => state.status === 'failed').length;
  }
}

// Create singleton instance
const puzzleStateManager = new PuzzleStateManager();

export default puzzleStateManager;