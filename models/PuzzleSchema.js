import mongoose from "mongoose";

const PuzzleSchema = new mongoose.Schema({
  title: String,
  fen: String,
  difficulty: { type: String, enum: ["easy", "medium", "hard"] },
  solutionMoves: [String], // ["e4", "Nf6", ...]
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  createdAt: { type: Date, default: Date.now }
});


const PuzzleModel = mongoose.model("Puzzle", PuzzleSchema);

export default PuzzleModel;
