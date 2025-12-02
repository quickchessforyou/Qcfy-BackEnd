

import { Chess, validateFen as rawValidateFen } from "chess.js/dist/esm/chess.js";



import PuzzleModel from "../models/PuzzleSchema.js";










const debugLog = (...args) => {
  if (process.env.NODE_ENV !== "production") {
    console.debug("[PuzzleController]", ...args);
  }
};

const runFenValidation = (fen) => {
  const validators = [
    rawValidateFen,
    Chess?.validateFen,
    Chess?.validate_fen,
  ].filter((fn) => typeof fn === "function");

  for (const validator of validators) {
    const result = validator(fen);
    debugLog("FEN validator result:", result);
    if (result && typeof result.ok === "boolean") {
      return result;
    }
    if (result && typeof result.valid === "boolean") {
      return { ok: result.valid, error: result.error || result.message };
    }
  }

  return { ok: true };
};

export const validateFen = (fen) => {
  const response = { valid: false, message: "Invalid FEN format" };

  try {
    debugLog("Raw FEN received:", fen);

    const cleanedFen =
      typeof fen === "string" ? fen.replace(/\s+/g, " ").trim() : "";

    debugLog("Cleaned FEN:", cleanedFen);

    if (!cleanedFen) {
      return { valid: false, message: "FEN must be a non-empty string" };
    }

    const validation = runFenValidation(cleanedFen);
    if (!validation.ok) {
      debugLog("FEN validation failed:", validation);
      return {
        valid: false,
        message: validation.error || "Invalid FEN format",
      };
    }

    const chess = new Chess();
    try {
      chess.load(cleanedFen);
    } catch (loadError) {
      debugLog("Chess.load threw:", loadError?.message);
      return { valid: false, message: loadError.message || response.message };
    }

    return { valid: true, fen: cleanedFen };
  } catch (error) {
    debugLog("validateFen unexpected error:", error);
    return response;
  }
};






export const validateSolutionMoves = (fen, moves = []) => {
  try {
    if (!Array.isArray(moves) || moves.length === 0) {
      return { valid: false, message: "solutionMoves must be a non-empty array" };
    }

    const cleanedFen =
      typeof fen === "string" ? fen.replace(/\s+/g, " ").trim() : "";

    if (!cleanedFen) {
      return {
        valid: false,
        message: "FEN must be provided to validate moves",
      };
    }

    const chess = new Chess();

    debugLog("validateSolutionMoves - cleaned FEN:", cleanedFen);
    debugLog("validateSolutionMoves - moves:", moves);

    const fenLoaded = chess.load(cleanedFen);

    if (fenLoaded === false) {
      return { valid: false, message: "Invalid FEN format" };
    }

    // Validate each move
    for (const move of moves) {
      const applied = chess.move(move, { sloppy: true });

      if (!applied) {
        return { valid: false, message: `Invalid move in solution: ${move}` };
      }
    }

    return { valid: true };

  } catch (error) {
    return { valid: false, message: "Invalid solution format" };
  }
};


  
  const createPuzzle = async (req, res) => {
    try {
      const { title, fen, difficulty, solutionMoves, description } = req.body;
  
      // --- REQUIRED FIELDS CHECK ---
      const missingFields = [];
      if (!title) missingFields.push("title");
      if (!fen) missingFields.push("fen");
      if (!difficulty) missingFields.push("difficulty");
      if (!solutionMoves) missingFields.push("solutionMoves");
      if (!description) missingFields.push("description");
  
      if (missingFields.length > 0) {
        return res.status(400).json({
          message: `Missing required fields: ${missingFields.join(", ")}`,
        });
      }
  
      // --- DIFFICULTY VALIDATION ---
      const allowedDifficulties = ["easy", "medium", "hard"];
      if (!allowedDifficulties.includes(difficulty)) {
        return res.status(400).json({
          message: "Difficulty must be one of: easy, medium, hard",
        });
      }
  
      // --- FEN VALIDATION ---
      const fenResult = validateFen(fen);
      if (!fenResult.valid) {
        return res.status(400).json({
          message: `FEN Error: ${fenResult.message}`,
        });
      }
  
      // --- SOLUTION MOVES VALIDATION ---
      const moveResult = validateSolutionMoves(fen, solutionMoves);
      if (!moveResult.valid) {
        return res.status(400).json({
          message: `Solution Error: ${moveResult.message}`,
        });
      }
  
      // --- CREATE PUZZLE ---
      const puzzle = await PuzzleModel.create({
        title,
        fen,
        difficulty,
        solutionMoves,
        description,
        createdBy: req.admin._id,
      });
  
      return res.status(201).json({
        message: "Puzzle created successfully",
        puzzle,
      });
  
    } catch (error) {
      console.error("Error creating puzzle:", error);
  
      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  };
  
  
  const getPuzzles = async (_req, res) => {
    try {
      const puzzles = await PuzzleModel.find().sort({ createdAt: -1 });
      res.status(200).json(puzzles);
    } catch (error) {
      console.error("Error fetching puzzles:", error);
      res.status(500).json({ message: "Failed to fetch puzzles" });
    }
  };
  
  const getPuzzleById = async (req, res) => {
    try {
      const { id } = req.params;
      const puzzle = await PuzzleModel.findById(id);
  
      if (!puzzle) {
        return res.status(404).json({ message: "Puzzle not found" });
      }
  
      res.status(200).json(puzzle);
    } catch (error) {
      console.error("Error fetching puzzle:", error);
      res.status(500).json({ message: "Failed to fetch puzzle" });
    }
  };
  
  const updatePuzzle = async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
  
      const puzzle = await PuzzleModel.findById(id);
      if (!puzzle) {
        return res.status(404).json({ message: "Puzzle not found" });
      }
  
      const fenToValidate = updates.fen || puzzle.fen;
  
      if (updates.fen) {
        const fenValidation = validateFen(updates.fen);
        if (!fenValidation.valid) {
          return res.status(400).json({ message: fenValidation.message });
        }
      }
  
      if (updates.solutionMoves) {
        const solutionValidation = validateSolutionMoves(
          fenToValidate,
          updates.solutionMoves
        );
        if (!solutionValidation.valid) {
          return res.status(400).json({ message: solutionValidation.message });
        }
      }
  
      Object.assign(puzzle, updates);
      await puzzle.save();
  
      res.status(200).json({ message: "Puzzle updated successfully", puzzle });
    } catch (error) {
      console.error("Error updating puzzle:", error);
      res.status(500).json({ message: "Failed to update puzzle" });
    }
  };
  
  const deletePuzzle = async (req, res) => {
    try {
      const { id } = req.params;
      const puzzle = await PuzzleModel.findByIdAndDelete(id);
  
      if (!puzzle) {
        return res.status(404).json({ message: "Puzzle not found" });
      }
  
      res.status(200).json({ message: "Puzzle deleted successfully" });
    } catch (error) {
      console.error("Error deleting puzzle:", error);
      res.status(500).json({ message: "Failed to delete puzzle" });
    }
  };


  export { createPuzzle, getPuzzles, getPuzzleById, updatePuzzle, deletePuzzle }