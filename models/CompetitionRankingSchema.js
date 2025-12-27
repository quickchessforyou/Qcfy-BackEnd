import mongoose from "mongoose";

const CompetitionRankingSchema = new mongoose.Schema({
  competitionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Competition', 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  username: { 
    type: String, 
    required: true 
  },
  finalRank: { 
    type: Number, 
    required: true 
  },
  finalScore: { 
    type: Number, 
    required: true 
  },
  puzzlesSolved: { 
    type: Number, 
    required: true 
  },
  totalTime: { 
    type: Number, 
    required: true 
  }, // in seconds
  completedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Compound index for unique ranking per competition
CompetitionRankingSchema.index({ competitionId: 1, userId: 1 }, { unique: true });

// Index for ranking queries
CompetitionRankingSchema.index({ competitionId: 1, finalRank: 1 });

const CompetitionRankingModel = mongoose.model("CompetitionRanking", CompetitionRankingSchema);

export default CompetitionRankingModel;