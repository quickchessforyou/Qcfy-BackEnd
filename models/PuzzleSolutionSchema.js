import mongoose from "mongoose";

const PuzzleSolutionSchema = new mongoose.Schema({
  competitionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Competition', 
    required: true 
  },
  puzzleId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Puzzle', 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  solution: { 
    type: mongoose.Schema.Types.Mixed, 
    required: true 
  },
  timeSpent: { 
    type: Number, 
    required: true 
  }, // in seconds
  scoreEarned: { 
    type: Number, 
    required: true 
  },
  isCorrect: { 
    type: Boolean, 
    required: true 
  },
  solvedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Compound index for unique solution per puzzle per user per competition
PuzzleSolutionSchema.index({ 
  competitionId: 1, 
  puzzleId: 1, 
  userId: 1 
}, { unique: true });

// Index for competition queries
PuzzleSolutionSchema.index({ competitionId: 1, solvedAt: 1 });

const PuzzleSolutionModel = mongoose.model("PuzzleSolution", PuzzleSolutionSchema);

export default PuzzleSolutionModel;