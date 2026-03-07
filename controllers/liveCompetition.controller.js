import CompetitionModel from "../models/CompetitionSchema.js";
import ParticipantModel from "../models/ParticipantSchema.js";
import PuzzleSolutionModel from "../models/PuzzleSolutionSchema.js";
import PuzzleAttemptModel from "../models/PuzzleAttemptSchema.js";
import PuzzleModel from "../models/PuzzleSchema.js";
import UserModel from "../models/UserSchema.js";
import CompetitionRankingModel from "../models/CompetitionRankingSchema.js";
import { io } from "../index.js";
import redis from "../config/redis.js";

import { scheduleCompetitionEnd, getCurrentLeaderboard, handleCompetitionEnd, addParticipantToLeaderboard, getIO, leaderboardKey, redisScore } from "../utils/socketHandlers.js";
import { validatePuzzleSolution } from "../services/puzzleValidationService.js";

// Participate in live competition (REST API validation)
export const participateInCompetition = async (req, res) => {
  try {
    const { competitionId } = req.params;
    const { username, accessCode } = req.body;
    const userId = req.user._id;

    // Fetch competition with minimal fields
    const competition = await CompetitionModel.findById(competitionId)
      .select(
        "name description startTime endTime duration status accessCode maxParticipants puzzles chapters"
      )
      .lean();

    if (!competition) {
      return res.status(404).json({
        success: false,
        error: "Competition not found",
      });
    }

    const now = new Date();

    if (competition.status === "ENDED" || now > competition.endTime) {
      return res.status(400).json({
        success: false,
        error: "Competition has ended",
      });
    }

    // Access code validation
    if (competition.accessCode && competition.accessCode.trim() !== "") {
      if (!accessCode || accessCode.trim() !== competition.accessCode.trim()) {
        return res.status(403).json({
          success: false,
          error: "Invalid access code",
          requireCode: true,
        });
      }
    }

    // Run queries in parallel
    const [participantCount, existingParticipant] = await Promise.all([
      ParticipantModel.countDocuments({ competitionId }),
      ParticipantModel.findOne({ competitionId, userId }).lean(),
    ]);

    // Max participant validation
    if (
      competition.maxParticipants &&
      participantCount >= competition.maxParticipants
    ) {
      return res.status(400).json({
        success: false,
        error: "Competition is full",
      });
    }

    // If already participating
    if (existingParticipant) {
      if (existingParticipant.submittedAt) {
        return res.status(400).json({
          success: false,
          message: "You have already submitted this competition",
        });
      }

      return res.json({
        success: true,
        message: "Already participating",
        competition: {
          id: competition._id,
          name: competition.name,
          description: competition.description,
          startTime: competition.startTime,
          endTime: competition.endTime,
          duration: competition.duration,
          status: competition.status,
          participantCount,
        },
      });
    }

    // Create participant
    const participant = await ParticipantModel.create({
      competitionId,
      userId,
      username: username || req.user.username || req.user.name,
      status: "JOINED",
      joinedAt: new Date(),
      score: 0,
      puzzlesSolved: 0,
      timeSpent: 0,
    });

    // Send response immediately
    res.json({
      success: true,
      competition: {
        id: competition._id,
        name: competition.name,
        description: competition.description,
        startTime: competition.startTime,
        endTime: competition.endTime,
        duration: competition.duration,
        puzzles: competition.puzzles,
        chapters: competition.chapters || [],
        maxScore: (competition.puzzles?.length || 0) * 10,
        status: competition.status,
        participantCount: participantCount + 1,
      },
    });

    // Run Redis + Socket operations in background
    setImmediate(async () => {
      try {
        if (competition.status === "LIVE") {
          await addParticipantToLeaderboard(competition._id, participant);
        }

        const roomName = `competition_${competitionId}`;

        io.to(roomName).emit("participantJoined", {
          username: participant.username,
          userId: participant.userId.toString(),
        });

        const leaderboard = await getCurrentLeaderboard(competitionId);

        io.to(roomName).emit("leaderboardUpdate", leaderboard);
      } catch (err) {
        console.error("Background event error:", err);
      }
    });
  } catch (error) {
    console.error("Participation error:", error);

    res.status(500).json({
      success: false,
      error: "Server error during participation",
    });
  }
};

// Submit entire competition (early submission)
export const submitCompetition = async (req, res) => {
  try {
    const { competitionId } = req.params;
    const userId = req.user._id;

    // console.log('Competition submission request:', { competitionId, userId });

    // Validate competition exists and is active
    const competition = await CompetitionModel.findById(competitionId);
    if (!competition) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found'
      });
    }

    // Check if competition is live (handle both lowercase and uppercase)
    if (competition.status !== 'live' && competition.status !== 'LIVE') {
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
    participant.status = "SUBMITTED";
    await participant.save();

    // Notify all participants via Socket.IO
    const roomName = `competition_${competitionId}`;

    // Async leaderboard broadcast
    getCurrentLeaderboard(competitionId).then(updatedLeaderboard => {
      io.to(roomName).emit('leaderboardUpdate', updatedLeaderboard);
    }).catch(err => console.error('Submit leaderboard error:', err));

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
      // Use setTimeout to avoid blocking the response
      setTimeout(() => {
        handleCompetitionEnd(io, competitionId);
      }, 100);
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

    /* =============================
       1️⃣ Validate competition
    ============================= */

    const competition = await CompetitionModel
      .findById(competitionId)
      .select("status endTime")
      .lean();

    if (!competition || new Date() > competition.endTime) {

      return res.status(400).json({
        success: false,
        message: "Competition ended"
      });

    }

    /* =============================
       2️⃣ Validate participant
    ============================= */

    const participant = await ParticipantModel.findOne({
      competitionId,
      userId
    });

    if (!participant) {

      return res.status(404).json({
        success: false,
        message: "Participant not found"
      });

    }

    if (participant.status === "SUBMITTED") {

      return res.status(400).json({
        success: false,
        message: "Competition already submitted"
      });

    }

    /* =============================
       3️⃣ Puzzle validation
    ============================= */

    const puzzle = await PuzzleModel
      .findById(puzzleId)
      .select("difficulty solutionMoves alternativeSolutions");

    if (!puzzle) {

      return res.status(404).json({
        success: false,
        message: "Puzzle not found"
      });

    }

    const isCorrect =
      validatePuzzleSolution(puzzle, solution);

    /* =============================
       4️⃣ Correct solution
    ============================= */

    if (isCorrect) {

      const scoreEarned = 10;

      const updatedParticipant =
        await ParticipantModel.findOneAndUpdate(

          { competitionId, userId },

          {
            $inc: {
              score: scoreEarned,
              puzzlesSolved: 1,
              timeSpent: timeSpent
            },

            lastActivity: new Date(),
            status: "PLAYING"
          },

          { new: true }

        );

      /* =============================
         5️⃣ Redis leaderboard update
      ============================= */

      await redis.zadd(

        leaderboardKey(competitionId),

        redisScore(updatedParticipant),

        userId.toString()

      );

      /* =============================
         6️⃣ Broadcast leaderboard
      ============================= */

      const leaderboard =
        await getCurrentLeaderboard(competitionId);

      getIO()
        .to(`competition_${competitionId}`)
        .emit("leaderboardUpdate", leaderboard);

      /* =============================
         7️⃣ Response
      ============================= */

      return res.json({

        success: true,

        isCorrect: true,

        scoreEarned,

        totalScore: updatedParticipant.score,

        puzzlesSolved: updatedParticipant.puzzlesSolved

      });

    }

    /* =============================
       8️⃣ Incorrect solution
    ============================= */

    await ParticipantModel.findOneAndUpdate(

      { competitionId, userId },

      {
        $inc: { timeSpent: timeSpent },

        lastActivity: new Date()
      }

    );

    res.json({

      success: false,

      isCorrect: false,

      scoreEarned: 0,

      message: "Incorrect solution"

    });

  } catch (error) {

    console.error("Puzzle submission error:", error);

    res.status(500).json({

      success: false,

      message: "Server error"

    });

  }

};

// Get live leaderboard
export const getLiveLeaderboard = async (req, res) => {
  try {
    const { competitionId } = req.params;
    const userId = req.user?._id;

    // Fetch competition with minimal fields
    const competition = await CompetitionModel.findById(competitionId)
      .select("name status startTime endTime")
      .lean();

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: "Competition not found",
      });
    }

    // Fetch leaderboard centrally (handles LIVE, ENDED, and LEGACY transparently)
    const leaderboard = await getCurrentLeaderboard(competitionId);

    const participant = userId
      ? await ParticipantModel.findOne({ competitionId, userId }).select("status").lean()
      : null;

    const participantState = participant ? participant.status : "NOT_JOINED";

    res.json({
      success: true,
      competition: {
        id: competition._id,
        name: competition.name,
        status: competition.status,
        startTime: competition.startTime,
        endTime: competition.endTime,
      },
      competitionState: competition.status,
      participantState,
      leaderboard,
      serverTime: Date.now(),
    });
  } catch (error) {
    console.error("Error fetching live leaderboard:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch leaderboard",
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

    // Get user's puzzle attempts (includes solved, failed, and in-progress)
    const puzzleAttempts = await PuzzleAttemptModel.find({
      competitionId,
      userId
    }).select('puzzleId status scoreEarned timeSpent completedAt boardPosition moveHistory isLocked');

    console.log('Found puzzle attempts for user:', userId, puzzleAttempts.length);
    puzzleAttempts.forEach(attempt => {
      console.log('Attempt:', {
        puzzleId: attempt.puzzleId,
        status: attempt.status,
        isLocked: attempt.isLocked
      });
    });

    // Create attempts map for quick lookup
    const attemptsMap = new Map();
    puzzleAttempts.forEach(attempt => {
      attemptsMap.set(attempt.puzzleId.toString(), {
        status: attempt.status,
        scoreEarned: attempt.scoreEarned || 0,
        timeSpent: attempt.timeSpent || 0,
        completedAt: attempt.completedAt,
        boardPosition: attempt.boardPosition,
        moveHistory: attempt.moveHistory || [],
        isLocked: attempt.isLocked
      });
    });

    // Get user's solved puzzles (for backward compatibility)
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

    // Prepare puzzles with solved status and attempt data
    const puzzlesWithStatus = competition.puzzles.map(puzzle => {
      const puzzleId = puzzle._id.toString();
      const attemptData = attemptsMap.get(puzzleId);
      const solvedData = solvedMap.get(puzzleId);

      // Determine puzzle status
      let status = 'unsolved';
      let isSolved = false;
      let isFailed = false;
      let isLocked = false;

      if (attemptData) {
        status = attemptData.status;
        isSolved = attemptData.status === 'solved';
        isFailed = attemptData.status === 'failed';
        isLocked = attemptData.isLocked || isSolved || isFailed;
      } else if (solvedData) {
        // Backward compatibility for old solved puzzles
        status = 'solved';
        isSolved = true;
        isLocked = true;
      }

      return {
        _id: puzzle._id,
        title: puzzle.title,
        description: puzzle.description,
        difficulty: puzzle.difficulty,
        category: puzzle.category,
        type: puzzle.type,
        fen: puzzle.fen,
        solutionMoves: puzzle.solutionMoves,
        alternativeSolutions: puzzle.alternativeSolutions || [],
        firstMoveBy: puzzle.firstMoveBy || 'human',
        kidsConfig: puzzle.kidsConfig,
        level: puzzle.level,
        rating: puzzle.rating,

        // Status information
        status,
        isSolved,
        isFailed,
        isLocked,

        // Attempt data
        solvedData: attemptData || solvedData || null,
        boardPosition: attemptData?.boardPosition || null,
        moveHistory: attemptData?.moveHistory || []
      };
    });

    console.log('Final puzzles with status:', puzzlesWithStatus.map(p => ({
      id: p._id,
      status: p.status,
      isSolved: p.isSolved,
      isFailed: p.isFailed,
      isLocked: p.isLocked
    })));

    res.json({
      success: true,
      competition: {
        id: competition._id,
        name: competition.name,
        status: competition.status,
        startTime: competition.startTime,
        endTime: competition.endTime,
        totalPuzzles: competition.puzzles.length,
        chapters: competition.chapters || []
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

    if (competition.status === 'LIVE') {
      return res.status(400).json({
        success: false,
        message: 'Competition is already live'
      });
    }

    if (competition.status === 'ENDED') {
      return res.status(400).json({
        success: false,
        message: 'Competition has already ended'
      });
    }

    // Update competition status
    competition.status = 'LIVE';
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

// getLobbyState function continues below...
export const getLobbyState = async (req, res) => {

  try {

    const { competitionId } = req.params;
    const userId = req.user._id;

    /* ===============================
       1️⃣ Competition (light query)
    =============================== */

    const competition = await CompetitionModel
      .findById(competitionId)
      .select("name startTime endTime duration puzzles accessCode status")
      .lean();

    if (!competition) {

      return res.status(404).json({
        success: false,
        message: "Competition not found"
      });

    }

    /* ===============================
       2️⃣ Participant state
    =============================== */

    const participant = await ParticipantModel
      .findOne({
        competitionId,
        userId
      })
      .select("status")
      .lean();

    let participantState = "NOT_JOINED";

    if (participant) {

      participantState = participant.status || "JOINED";

    }

    /* ===============================
       3️⃣ Competition state
    =============================== */

    const now = Date.now();

    let competitionState =
      competition.status?.toUpperCase() || "UPCOMING";

    if (
      competitionState === "UPCOMING" &&
      now >= new Date(competition.startTime).getTime()
    ) {

      competitionState = "LIVE";

    }

    if (now > new Date(competition.endTime).getTime()) {

      competitionState = "ENDED";

    }

    /* ===============================
       4️⃣ Fast leaderboard (Redis)
    =============================== */

    const leaderboard =
      await getCurrentLeaderboard(competitionId);

    /* ===============================
       5️⃣ Response
    =============================== */

    res.json({

      success: true,

      competition: {

        id: competition._id,
        name: competition.name,

        startTime: competition.startTime,
        endTime: competition.endTime,

        duration: competition.duration,

        totalPuzzles: Array.isArray(competition.puzzles)
          ? competition.puzzles.length
          : 0,

        requiresAccessCode:
          !!(competition.accessCode &&
            competition.accessCode.trim() !== "")

      },

      competitionState,

      participantState,

      leaderboard,

      serverTime: now

    });

  } catch (err) {

    console.error("Lobby state error:", err);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

};

// Helper function to calculate score
// All puzzles are worth 10 points - winner determined by time taken
const calculateScore = (difficulty, timeSpent) => {
  return 10; // Fixed score for all puzzles
};

// Check for active participation
export const getActiveParticipation = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find participant record where:
    // 1. User is the current user
    // 2. Not submitted yet
    const participations = await ParticipantModel.find({
      userId,
      isSubmitted: false
    }).populate('competitionId');

    // Filter for active/upcoming competitions
    const now = new Date();
    const activeParticipation = participations.find(p => {
      const comp = p.competitionId;
      if (!comp) return false;

      // Allow if LIVE OR UPCOMING (near start)
      // Check status strings case-insensitively
      const status = comp.status?.toUpperCase();

      const isLive = status === 'LIVE';
      const isUpcoming = status === 'UPCOMING';

      // If live, standard check
      if (isLive) {
        return new Date(comp.endTime) > now;
      }

      // If upcoming, always allow rejoining/waiting if within sensible range (or just all joined upcoming)
      // The user wants "popup logic that tournanment is running or about to start"
      if (isUpcoming) {
        return true;
      }

      return false;
    });

    if (activeParticipation) {
      return res.json({
        success: true,
        hasActiveParticipation: true,
        competition: {
          id: activeParticipation.competitionId._id,
          name: activeParticipation.competitionId.name,
          endTime: activeParticipation.competitionId.endTime
        }
      });
    }

    return res.json({
      success: true,
      hasActiveParticipation: false
    });

  } catch (error) {
    console.error('Check active participation error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export default {
  participateInCompetition,
  submitPuzzleSolution,
  getLiveLeaderboard,
  getCompetitionPuzzles,
  startCompetition,
  submitCompetition,
  getActiveParticipation
};