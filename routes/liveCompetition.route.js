import express from 'express';
import {
  participateInCompetition,
  submitCompetition,
  submitPuzzleSolution,
  getLiveLeaderboard,
  getCompetitionPuzzles,
  startCompetition,
  getLobbyState
} from '../controllers/liveCompetition.controller.js';
import isUser from '../middleware/user.middleware.js';
import isAdmin from '../middleware/admin.middleware.js';

const router = express.Router();

// User routes for live competitions
router.post('/:competitionId/participate', isUser, participateInCompetition);
router.post('/:competitionId/submit', isUser, submitCompetition);
router.post('/:competitionId/puzzles/:puzzleId/submit', isUser, submitPuzzleSolution);
router.get('/:competitionId/leaderboard', getLiveLeaderboard);
router.get('/:competitionId/puzzles', isUser, getCompetitionPuzzles);
router.get(
  "/:competitionId/lobby-state",
  isUser,
  getLobbyState
);


// Admin routes
router.post('/:competitionId/start', isAdmin, startCompetition);

// Debug routes (remove in production)




export default router;