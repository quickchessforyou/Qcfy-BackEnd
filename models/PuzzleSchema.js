import mongoose from "mongoose";

const PuzzleSchema = new mongoose.Schema({
  title: String,
  fen: { type: String, required: true },
  difficulty: { type: String, enum: ["easy", "medium", "hard"] },
  solutionMoves: [String], 
  // ["e4", "Nf6", ...]
  description: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  
  // Source tracking
  source: { 
    type: String, 
    enum: ["manual", "lichess"], 
    default: "manual" 
  },
  
  // Lichess-specific fields
  lichessId: { type: String, unique: true, sparse: true },
  rating: { type: Number }, // Lichess puzzle rating
  themes: [String], // Lichess themes like "fork", "mate", "pin"
  popularity: { type: Number }, // Lichess popularity score
  
  // Category (for both manual and lichess)
  category: { 
    type: String,
    required: true,
    default: "Tactics"
  },

  createdAt: { type: Date, default: Date.now }
});

// Index for faster queries
PuzzleSchema.index({ source: 1, category: 1, rating: 1 });
PuzzleSchema.index({ lichessId: 1 });

const PuzzleModel = mongoose.model("Puzzle", PuzzleSchema);

export default PuzzleModel;
