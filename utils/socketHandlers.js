import jwt from 'jsonwebtoken';
import CompetitionModel from '../models/CompetitionSchema.js';
import ParticipantModel from '../models/ParticipantSchema.js';
import CompetitionRankingModel from '../models/CompetitionRankingSchema.js';
//import { redisManager } from '../index.js';

// In-memory competition state (fallback when Redis is not available)
const competitionStates = new Map();

// Initialize competition state structure
const initializeCompetitionState = (competitionId) => {
  if (!competitionStates.has(competitionId)) {
    competitionStates.set(competitionId, {
      participants: new Map(),
      leaderboard: [],
      isActive: true,
      lastUpdate: new Date()
    });
  }
};

// Get current leaderboard from database
const getCurrentLeaderboard = async (competitionId) => {
  try {
    console.log('Getting leaderboard for competition:', competitionId);
    
    const leaderboard = await ParticipantModel.find({ competitionId })
      .sort({ score: -1, timeSpent: 1 }) // Sort by score desc, then time asc
      .limit(50) // Limit to top 50 for performance
      .select('userId username score puzzlesSolved timeSpent lastActivity')
      .populate('userId', 'name avatar')
      .lean();

    console.log('Found participants:', leaderboard.length);
    console.log('Participants data:', leaderboard);

    // Add ranking
    return leaderboard.map((participant, index) => ({
      rank: index + 1,
      userId: participant.userId._id,
      username: participant.username,
      name: participant.userId.name,
      avatar: participant.userId.avatar,
      score: participant.score,
      puzzlesSolved: participant.puzzlesSolved,
      timeSpent: participant.timeSpent,
      lastActivity: participant.lastActivity
    }));

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
};

// Notify Socket.IO about puzzle solved
const notifyPuzzleSolved = async (io, competitionId, userId, scoreEarned) => {
  try {
    // Update in-memory competition state
    const competitionState = competitionStates.get(competitionId);
    if (competitionState) {
      const participant = competitionState.participants.get(userId.toString());
      if (participant) {
        participant.lastSolvedAt = new Date();
      }
    }

    // Get updated leaderboard from database
    const updatedLeaderboard = await getCurrentLeaderboard(competitionId);
    
    // Update in-memory leaderboard
    if (competitionState) {
      competitionState.leaderboard = updatedLeaderboard;
      competitionState.lastUpdate = new Date();
    }

    // Broadcast to all participants in the competition room
    const roomName = `competition_${competitionId}`;
    io.to(roomName).emit('leaderboardUpdate', updatedLeaderboard);

    console.log(`Leaderboard updated for competition ${competitionId}`);

  } catch (error) {
    console.error('Error updating leaderboard:', error);
  }
};

// Handle competition end
const handleCompetitionEnd = async (io, competitionId) => {
  try {
    // Get final leaderboard
    const finalLeaderboard = await getCurrentLeaderboard(competitionId);
    
    // Update competition status
    await CompetitionModel.findByIdAndUpdate(competitionId, {
      status: 'completed',
      isActive: false,
      updatedAt: new Date()
    });

    // Save final rankings
    await saveFinalRankings(competitionId, finalLeaderboard);

    // Notify all participants
    const roomName = `competition_${competitionId}`;
    io.to(roomName).emit('competitionEnded', {
      finalLeaderboard,
      message: 'Competition has ended! Final results are now available.'
    });

    // Clean up in-memory state
    competitionStates.delete(competitionId);

    console.log(`Competition ${competitionId} ended successfully`);

  } catch (error) {
    console.error('Error ending competition:', error);
  }
};

// Save final rankings
const saveFinalRankings = async (competitionId, leaderboard) => {
  try {
    // Clear existing rankings for this competition
    await CompetitionRankingModel.deleteMany({ competitionId });

    const rankings = leaderboard.map(participant => ({
      competitionId,
      userId: participant.userId,
      username: participant.username,
      finalRank: participant.rank,
      finalScore: participant.score,
      puzzlesSolved: participant.puzzlesSolved,
      totalTime: participant.timeSpent,
      completedAt: new Date()
    }));

    if (rankings.length > 0) {
      await CompetitionRankingModel.insertMany(rankings);
    }
    
  } catch (error) {
    console.error('Error saving final rankings:', error);
  }
};

// Schedule competition end
const scheduleCompetitionEnd = (io, competitionId, endTime) => {
  const now = new Date();
  const timeUntilEnd = endTime.getTime() - now.getTime();
  
  if (timeUntilEnd > 0) {
    setTimeout(() => {
      handleCompetitionEnd(io, competitionId);
    }, timeUntilEnd);
    
    console.log(`Competition ${competitionId} scheduled to end in ${Math.round(timeUntilEnd / 1000)} seconds`);
  }
};

// Authenticate socket connection
const authenticateSocket = (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.userType = decoded.type;
    
    next();
  } catch (error) {
    next(new Error('Invalid authentication token'));
  }
};

// Initialize Socket.IO handlers
export const initializeSocketHandlers = (io) => {
  // Authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id, 'User ID:', socket.userId);

    // Join Competition Event
    socket.on('joinCompetition', async (data) => {
      try {
        const { competitionId, username } = data;
        const userId = socket.userId;
        
        // Validate competition exists and is active
        const competition = await CompetitionModel.findById(competitionId);
        if (!competition) {
          socket.emit('error', { message: 'Competition not found' });
          return;
        }

        if (competition.status !== 'live') {
          socket.emit('error', { message: 'Competition is not currently active' });
          return;
        }

        // Check if user is already a participant
        const participant = await ParticipantModel.findOne({
          competitionId,
          userId
        });

        if (!participant) {
          socket.emit('error', { message: 'You must join the competition first via the participate button' });
          return;
        }

        // Initialize competition state if needed
        initializeCompetitionState(competitionId);
        
        const roomName = `competition_${competitionId}`;
        
        // Join the competition room
        socket.join(roomName);
        
        // Store competition info in socket
        socket.competitionId = competitionId;
        socket.username = username;
        
        // Update competition state
        const competitionState = competitionStates.get(competitionId);
        competitionState.participants.set(userId.toString(), {
          socketId: socket.id,
          username,
          joinedAt: new Date(),
          isActive: true
        });

        // Get current leaderboard from database
        const currentLeaderboard = await getCurrentLeaderboard(competitionId);
        
        // Send current leaderboard to newly joined user
        socket.emit('leaderboardUpdate', currentLeaderboard);
        
        // Notify room about new participant (optional)
        socket.to(roomName).emit('participantJoined', {
          username,
          participantCount: competitionState.participants.size
        });

        console.log(`User ${username} joined competition ${competitionId}`);
        
      } catch (error) {
        console.error('Error joining competition:', error);
        socket.emit('error', { message: 'Failed to join competition' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      if (socket.competitionId && socket.userId) {
        const competitionState = competitionStates.get(socket.competitionId);
        if (competitionState) {
          const participant = competitionState.participants.get(socket.userId.toString());
          if (participant) {
            participant.isActive = false;
            participant.disconnectedAt = new Date();
          }
        }
      }
      console.log('User disconnected:', socket.id);
    });

    // Handle manual leaderboard refresh
    socket.on('refreshLeaderboard', async (data) => {
      try {
        const { competitionId } = data;
        
        if (socket.competitionId !== competitionId) {
          socket.emit('error', { message: 'Not joined to this competition' });
          return;
        }

        const currentLeaderboard = await getCurrentLeaderboard(competitionId);
        socket.emit('leaderboardUpdate', currentLeaderboard);
        
      } catch (error) {
        console.error('Error refreshing leaderboard:', error);
        socket.emit('error', { message: 'Failed to refresh leaderboard' });
      }
    });
  });

  // Schedule existing active competitions to end
  const scheduleExistingCompetitions = async () => {
    try {
      const activeCompetitions = await CompetitionModel.find({
        status: 'live',
        endTime: { $gt: new Date() }
      });

      activeCompetitions.forEach(competition => {
        scheduleCompetitionEnd(io, competition._id, competition.endTime);
      });

      console.log(`Scheduled ${activeCompetitions.length} active competitions to end`);
    } catch (error) {
      console.error('Error scheduling existing competitions:', error);
    }
  };

  // Schedule existing competitions
  scheduleExistingCompetitions();
};

// Export utility functions for use in controllers
export { 
  notifyPuzzleSolved, 
  handleCompetitionEnd, 
  scheduleCompetitionEnd,
  getCurrentLeaderboard 
};