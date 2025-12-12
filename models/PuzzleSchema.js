import mongoose from "mongoose";

const PuzzleSchema = new mongoose.Schema({
  title: String,
  fen: { type: String, required: true },
  difficulty: { type: String, enum: ["easy", "medium", "hard"] },
  solutionMoves: [String],
  // ["e4", "Nf6", ...]
  description: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },

  // Puzzle type
  type: {
    type: String,
    enum: ["normal", "kids"],
    default: "normal"
  },

  // Kids mode configuration
  kidsConfig: {
    piece: String, // e.g., "n" for knight, "r" for rook
    startSquare: String, // e.g., "e4"
    targets: [{
      square: String,
      item: { type: String, enum: ["pizza", "chocolate"] }
    }]
  },

  // Source tracking
  source: {
    type: String,
    enum: ["manual"],
    default: "manual"
  },

  // Category
  category: {
    type: String,
    required: true,
    default: "Tactics"
  },

  createdAt: { type: Date, default: Date.now }
});

// Index for faster queries
PuzzleSchema.index({ type: 1, category: 1 });

const PuzzleModel = mongoose.model("Puzzle", PuzzleSchema);

export default PuzzleModel;
