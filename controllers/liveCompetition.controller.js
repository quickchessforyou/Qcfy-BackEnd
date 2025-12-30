import CompetitionModel from "../models/CompetitionSchema.js";
import ParticipantModel from "../models/ParticipantSchema.js";
import PuzzleSolutionModel from "../models/PuzzleSolutionSchema.js";
import PuzzleModel from "../models/PuzzleSchema.js";
import UserModel from "../models/UserSchema.js";
import { io } from "../index.js";

import { notifyPuzzleSolved, scheduleCompetitionEnd, getCurrentLeaderboard } from "../utils/socketHandlers.js";

// Participate in live competition (REST API validation)
export const participateInCompetition = async (req, res) => {
  try {
    const { competitionId } = req.params;
    const { username } = req.body;
    const userId = req.user._id;

    console.log('Participation request:', { competitionId, userId, username });

    // Validate competition exists and is active
    const competition = await CompetitionModel.findById(competitionId);
    if (!competition) {
      return res.status(404).json({
        success: false,
        error: 'Competition not found'
      });
    }

    console.log('Competition found:', competition.name, 'Status:', competition.status);

    // Check if competition is still open for participation
    const now = new Date();
    if (now > competition.startTime) {
      console.log('Competition already started, allowing participation anyway for live competitions');
    }

    if (competition.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Competition has ended'
      });
    }

    // Check max participants
    if (competition.maxParticipants) {
      const currentParticipants = await ParticipantModel.countDocuments({ competitionId });
      if (currentParticipants >= competition.maxParticipants) {
        return res.status(400).json({
          success: false,
          error: 'Competition is full'
        });
      }
    }

    // Check if user already participated
    const existingParticipant = await ParticipantModel.findOne({
      competitionId,
      userId
    });

    if (existingParticipant) {
      // Check if participant has already submitted
      if (existingParticipant.submittedAt) {
        return res.status(400).json({
          success: false,
          message: 'You have already submitted this competition'
        });
      }
    }

    console.log('Existing participant check:', existingParticipant ? 'Found' : 'Not found');

    if (existingParticipant) {
      console.log('User already participated, returning existing data');
      return res.json({
        success: true,
        message: 'Already participating',
        competition: {
          id: competition._id,
          name: competition.name,
          title: competition.name,
          description: competition.description,
          startTime: competition.startTime,
          endTime: competition.endTime,
          duration: competition.duration,
          status: competition.status,
          participantCount: await ParticipantModel.countDocuments({ competitionId })
        }
      });
    }

    // Get user details
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log('Creating new participant for user:', user.name || user.username);

    // Create participant record
    const participant = new ParticipantModel({
      competitionId,
      userId,
      username: username || user.username || user.name,
      joinedAt: new Date(),
      score: 0,
      puzzlesSolved: 0,
      timeSpent: 0
    });

    await participant.save();
    console.log('Participant created successfully:', participant._id);

    // Populate puzzles for response
    await competition.populate('puzzles');

    // Return competition details
    res.json({
      success: true,
      competition: {
        id: competition._id,
        name: competition.name,
        title: competition.name,
        description: competition.description,
        startTime: competition.startTime,
        endTime: competition.endTime,
        duration: competition.duration,
        puzzles: competition.puzzles,
        maxScore: competition.puzzles.length * 100, // Assuming max 100 points per puzzle
        status: competition.status,
        participantCount: await ParticipantModel.countDocuments({ competitionId })
      }
    });

  } catch (error) {
    console.error('Participation error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during participation'
    });
  }
};

// Submit entire competition (early submission)
export const submitCompetition = async (req, res) => {
  try {
    const { competitionId } = req.params;
    const userId = req.user._id;

    console.log('Competition submission request:', { competitionId, userId });

    // Validate competition exists and is active
    const competition = await CompetitionModel.findById(competitionId);
    if (!competition) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found'
      });
    }

    if (competition.status !== 'live') {
      return res.status(400).json({
        success: false,
        message: 'Competition is not currently active'
      });
    }

    // Get participant record
    const participant = await ParticipantModel.findOne({
      competitionId,
      userId
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'You are not participating in this competition'
      });
    }

    // Mark participant as submitted (add submittedAt field)
    participant.submittedAt = new Date();
    participant.isActive = false; // Mark as inactive to prevent further submissions
    participant.isSubmitted = true;
    await participant.save();

    // Get updated leaderboard
    const updatedLeaderboard = await getCurrentLeaderboard(competitionId);

    // Notify all participants via Socket.IO
    const roomName = `competition_${competitionId}`;
    io.to(roomName).emit('leaderboardUpdate', updatedLeaderboard);
    io.to(roomName).emit('participantSubmitted', {
      username: participant.username,
      score: participant.score,
      puzzlesSolved: participant.puzzlesSolved,
      timeSpent: participant.timeSpent
    });

    // Check if ALL participants have submitted
    const totalParticipants = await ParticipantModel.countDocuments({ competitionId });
    const submittedParticipants = await ParticipantModel.countDocuments({
      competitionId,
      $or: [{ isSubmitted: true }, { submittedAt: { $exists: true } }]
    });

    console.log(`Competition ${competitionId} progress: ${submittedParticipants}/${totalParticipants} submitted`);

    res.json({
      success: true,
      message: 'Competition submitted successfully',
      finalScore: participant.score,
      puzzlesSolved: participant.puzzlesSolved,
      timeSpent: participant.timeSpent
    });

    // If everyone has submitted, end the competition early
    // We do this AFTER response to avoid blocking, but for UX 'competitionEnded' event will handle redirect
    if (totalParticipants > 0 && submittedParticipants >= totalParticipants) {
      console.log('All participants submitted. Ending competition early.');
      handleCompetitionEnd(io, competitionId);
    }


  } catch (error) {
    console.error('Competition submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during submission'
    });
  }
};

// Submit puzzle solution with Socket.IO notification
export const submitPuzzleSolution = async (req, res) => {
  try {
    const { competitionId, puzzleId } = req.params;
    const { solution, timeSpent } = req.body;
    const userId = req.user._id;

    console.log('Puzzle solution submission:', {
      competitionId,
      puzzleId,
      userId,
      solution,
      solutionType: typeof solution,
      isArray: Array.isArray(solution),
      timeSpent
    });

    // Validate competition is active
    const competition = await CompetitionModel.findById(competitionId);
    if (!competition || new Date() > competition.endTime) {
      return res.status(400).json({
        success: false,
        message: 'Competition has ended'
      });
    }

    if (competition.status !== 'live') {
      return res.status(400).json({
        success: false,
        message: 'Competition is not currently active'
      });
    }

    // Check if puzzle already solved by user
    const existingSolution = await PuzzleSolutionModel.findOne({
      competitionId,
      puzzleId,
      userId
    });

    if (existingSolution) {
      return res.status(400).json({
        success: false,
        message: 'Puzzle already solved'
      });
    }

    // Check if participant has already submitted the competition
    const participant = await ParticipantModel.findOne({
      competitionId,
      userId
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'You are not participating in this competition'
      });
    }

    if (participant.submittedAt) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted this competition and cannot solve more puzzles'
      });
    }

    // Get puzzle details
    const puzzle = await PuzzleModel.findById(puzzleId);
    if (!puzzle) {
      return res.status(404).json({
        success: false,
        message: 'Puzzle not found'
      });
    }

    // Validate solution
    const isCorrect = validatePuzzleSolution(puzzle, solution);

    if (!isCorrect) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect solution'
      });
    }

    // Calculate score based on difficulty and time
    const scoreEarned = calculateScore(puzzle.difficulty, timeSpent);

    // Save solution
    const puzzleSolution = new PuzzleSolutionModel({
      competitionId,
      puzzleId,
      userId,
      solution,
      timeSpent,
      scoreEarned,
      isCorrect: true,
      solvedAt: new Date()
    });

    await puzzleSolution.save();

    // Update participant stats
    const updatedParticipant = await ParticipantModel.findOneAndUpdate(
      { competitionId, userId },
      {
        $inc: {
          score: scoreEarned,
          puzzlesSolved: 1,
          timeSpent: timeSpent
        },
        lastActivity: new Date()
      },
      { new: true }
    );

    // Get total score for response
    const totalScore = updatedParticipant.score;

    // Notify Socket.IO server about the solved puzzle
    await notifyPuzzleSolved(io, competitionId, userId, scoreEarned);

    res.json({
      success: true,
      scoreEarned,
      totalScore,
      puzzlesSolved: updatedParticipant.puzzlesSolved,
      message: 'Puzzle solved successfully!'
    });

  } catch (error) {
    console.error('Puzzle submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during submission'
    });
  }
};

// Get live leaderboard
export const getLiveLeaderboard = async (req, res) => {
  try {
    const { competitionId } = req.params;

    // Validate competition exists
    const competition = await CompetitionModel.findById(competitionId);
    if (!competition) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found'
      });
    }

    // Get current leaderboard
    const leaderboard = await getCurrentLeaderboard(competitionId);

    res.json({
      success: true,
      competition: {
        id: competition._id,
        name: competition.name,
        status: competition.status,
        startTime: competition.startTime,
        endTime: competition.endTime
      },
      leaderboard,
      lastUpdate: new Date()
    });

  } catch (error) {
    console.error('Error fetching live leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard'
    });
  }
};

// Get competition puzzles for participants
export const getCompetitionPuzzles = async (req, res) => {
  try {
    const { competitionId } = req.params;
    const userId = req.user._id;

    // Validate competition and participation
    const competition = await CompetitionModel.findById(competitionId).populate('puzzles');
    if (!competition) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found'
      });
    }

    // Check if user is a participant
    const participant = await ParticipantModel.findOne({
      competitionId,
      userId
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'Not a participant in this competition'
      });
    }

    // Get user's solved puzzles
    const solvedPuzzles = await PuzzleSolutionModel.find({
      competitionId,
      userId,
      isCorrect: true
    }).select('puzzleId scoreEarned timeSpent solvedAt');

    // Create solved puzzles map for quick lookup
    const solvedMap = new Map();
    solvedPuzzles.forEach(solution => {
      solvedMap.set(solution.puzzleId.toString(), {
        scoreEarned: solution.scoreEarned,
        timeSpent: solution.timeSpent,
        solvedAt: solution.solvedAt
      });
    });

    // Prepare puzzles with solved status
    const puzzlesWithStatus = competition.puzzles.map(puzzle => ({
      _id: puzzle._id,
      title: puzzle.title,
      description: puzzle.description,
      difficulty: puzzle.difficulty,
      category: puzzle.category,
      type: puzzle.type,
      fen: puzzle.fen,
      solutionMoves: puzzle.solutionMoves,
      isSolved: solvedMap.has(puzzle._id.toString()),
      solvedData: solvedMap.get(puzzle._id.toString()) || null
    }));

    res.json({
      success: true,
      competition: {
        id: competition._id,
        name: competition.name,
        status: competition.status,
        startTime: competition.startTime,
        endTime: competition.endTime
      },
      puzzles: puzzlesWithStatus,
      participant: {
        score: participant.score,
        puzzlesSolved: participant.puzzlesSolved,
        timeSpent: participant.timeSpent,
        joinedAt: participant.joinedAt
      }
    });

  } catch (error) {
    console.error('Error fetching competition puzzles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch competition puzzles'
    });
  }
};

// Start competition (Admin only)
export const startCompetition = async (req, res) => {
  try {
    const { competitionId } = req.params;

    const competition = await CompetitionModel.findById(competitionId);
    if (!competition) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found'
      });
    }

    if (competition.status === 'live') {
      return res.status(400).json({
        success: false,
        message: 'Competition is already live'
      });
    }

    if (competition.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Competition has already ended'
      });
    }

    // Update competition status
    competition.status = 'live';
    competition.isActive = true;
    competition.startTime = new Date(); // Start now
    await competition.save();

    // Schedule competition end
    scheduleCompetitionEnd(io, competitionId, competition.endTime);

    res.json({
      success: true,
      message: 'Competition started successfully',
      competition: {
        id: competition._id,
        name: competition.name,
        status: competition.status,
        startTime: competition.startTime,
        endTime: competition.endTime
      }
    });

  } catch (error) {
    console.error('Error starting competition:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start competition'
    });
  }
};

// Helper function to validate puzzle solution
const validatePuzzleSolution = (puzzle, solution) => {
  try {
    console.log('Validating solution:', {
      puzzleSolution: puzzle.solutionMoves,
      puzzleSolutionType: typeof puzzle.solutionMoves,
      puzzleIsArray: Array.isArray(puzzle.solutionMoves),
      userSolution: solution,
      userSolutionType: typeof solution,
      userIsArray: Array.isArray(solution)
    });

    // Normalize both solutions to arrays for comparison
    let puzzleMoves = puzzle.solutionMoves;
    let userMoves = solution;

    // Convert to arrays if they're strings
    if (typeof puzzleMoves === 'string') {
      try {
        puzzleMoves = JSON.parse(puzzleMoves);
      } catch (e) {
        puzzleMoves = [puzzleMoves];
      }
    }

    if (typeof userMoves === 'string') {
      try {
        userMoves = JSON.parse(userMoves);
      } catch (e) {
        userMoves = [userMoves];
      }
    }

    // Ensure both are arrays
    if (!Array.isArray(puzzleMoves)) puzzleMoves = [puzzleMoves];
    if (!Array.isArray(userMoves)) userMoves = [userMoves];

    console.log('Normalized for comparison:', {
      puzzleMoves,
      userMoves,
      match: JSON.stringify(puzzleMoves) === JSON.stringify(userMoves)
    });

    return JSON.stringify(puzzleMoves) === JSON.stringify(userMoves);
  } catch (error) {
    console.error('Solution validation error:', error);
    return false;
  }
};

// Helper function to calculate score
const calculateScore = (difficulty, timeSpent) => {
  const baseScore = {
    'easy': 100,
    'medium': 200,
    'hard': 300
  }[difficulty] || 100;

  // Time bonus: faster solutions get more points (max 60 seconds for full bonus)
  const maxTimeForBonus = 60;
  const timeBonus = Math.max(0, maxTimeForBonus - timeSpent) * 2; // 2 points per second under 60s

  return Math.round(baseScore + timeBonus);
};

export default {
  participateInCompetition,
  submitPuzzleSolution,
  getLiveLeaderboard,
  getCompetitionPuzzles,
  startCompetition
};