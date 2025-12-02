import express from "express";
import { createPuzzle, getPuzzles, getPuzzleById, updatePuzzle, deletePuzzle } from "../controllers/puzzle.controller.js";
import  isAdmin  from "../middleware/admin.middleware.js";
const router = express.Router();


router.post("/create-puzzle", isAdmin, createPuzzle);
router.get("/get-puzzles", getPuzzles);
router.get("/get-puzzle/:id", isAdmin, getPuzzleById);
router.put("/update-puzzle/:id", isAdmin, updatePuzzle);
router.delete("/delete-puzzle/:id", isAdmin, deletePuzzle);

export default router;