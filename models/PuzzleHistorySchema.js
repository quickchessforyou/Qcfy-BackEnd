import mongoose from "mongoose";

const PuzzleHistorySchema = new mongoose.Schema({
  puzzleId: { type: mongoose.Schema.Types.ObjectId, ref: "Puzzle" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  isSolved: Boolean,
  usedHints: Number,
  attempts: Number,
  timeTaken: Number,

  createdAt: { type: Date, default: Date.now }
});

PuzzleHistorySchema.index({ userId: 1, isSolved: 1 });

const PuzzleHistoryModel = mongoose.model("PuzzleHistory", PuzzleHistorySchema);

export default PuzzleHistoryModel;