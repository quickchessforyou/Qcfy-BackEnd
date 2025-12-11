import axios from 'axios';
import PuzzleModel from '../models/PuzzleSchema.js';

const LICHESS_API_URL = 'https://lichess.org/api/puzzle/daily';
const LICHESS_BULK_URL = 'https://database.lichess.org/lichess_db_puzzle.csv.zst';

// Map Lichess themes to our categories
const themeToCategory = {
  'mate': 'Tactics',
  'mateIn1': 'Tactics',
  'mateIn2': 'Tactics',
  'mateIn3': 'Tactics',
  'fork': 'Tactics',
  'pin': 'Tactics',
  'skewer': 'Tactics',
  'discoveredAttack': 'Tactics',
  'doubleCheck': 'Tactics',
  'sacrifice': 'Tactics',
  'endgame': 'Endgame',
  'opening': 'Opening',
  'middlegame': 'Middlegame',
  'advantage': 'Strategy',
  'crushing': 'Strategy',
  'defensiveMove': 'Strategy',
  'quietMove': 'Strategy'
};

// Map Lichess rating to our difficulty
const ratingToDifficulty = (rating) => {
  if (rating < 1500) return 'easy';
  if (rating < 2000) return 'medium';
  return 'hard';
};

// Determine category from themes
const getCategory = (themes) => {
  if (!themes || themes.length === 0) return 'Tactics';
  
  for (const theme of themes) {
    if (themeToCategory[theme]) {
      return themeToCategory[theme];
    }
  }
  return 'Tactics';
};

/**
 * Fetch puzzles from Lichess API
 * Note: Lichess provides puzzles in NDJSON format (newline-delimited JSON)
 */
export const fetchLichessPuzzles = async (count = 50) => {
  try {
    // Lichess API endpoint for bulk puzzles
    // We'll use their puzzle database API
    const response = await axios.get('https://lichess.org/api/puzzle/daily', {
      headers: {
        'Accept': 'application/x-ndjson'
      }
    });

    // For bulk import, we'll fetch from their database
    // This is a simplified version - in production, you'd want to handle the compressed format
    const bulkResponse = await axios.get(
      `https://lichess.org/api/puzzle/batch/mix?nb=${count}`,
      {
        headers: {
          'Accept': 'application/x-ndjson'
        },
        timeout: 30000
      }
    );

    // Parse NDJSON (each line is a separate JSON object)
    const lines = bulkResponse.data.split('\n').filter(line => line.trim());
    const puzzles = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return null;
      }
    }).filter(p => p !== null);

    return puzzles;
  } catch (error) {
    console.error('Error fetching from Lichess:', error.message);
    throw new Error('Failed to fetch puzzles from Lichess');
  }
};

/**
 * Import Lichess puzzles into our database
 */
export const importLichessPuzzles = async (count = 50) => {
  try {
    const lichessPuzzles = await fetchLichessPuzzles(count);
    const imported = [];
    const skipped = [];

    for (const puzzleData of lichessPuzzles) {
      try {
        const { puzzle, game } = puzzleData;
        
        // Check if puzzle already exists
        const existing = await PuzzleModel.findOne({ lichessId: puzzle.id });
        if (existing) {
          skipped.push(puzzle.id);
          continue;
        }

        // Create puzzle document
        const newPuzzle = new PuzzleModel({
          title: `Lichess Puzzle ${puzzle.id}`,
          fen: game.fen,
          solutionMoves: puzzle.solution,
          rating: puzzle.rating,
          difficulty: ratingToDifficulty(puzzle.rating),
          themes: puzzle.themes || [],
          category: getCategory(puzzle.themes),
          popularity: puzzle.plays || 0,
          source: 'lichess',
          lichessId: puzzle.id,
          description: `Rating: ${puzzle.rating} | Themes: ${(puzzle.themes || []).join(', ')}`
        });

        await newPuzzle.save();
        imported.push(newPuzzle);
      } catch (error) {
        console.error(`Error importing puzzle ${puzzleData.puzzle?.id}:`, error.message);
        skipped.push(puzzleData.puzzle?.id);
      }
    }

    return {
      success: true,
      imported: imported.length,
      skipped: skipped.length,
      puzzles: imported
    };
  } catch (error) {
    console.error('Error in importLichessPuzzles:', error);
    throw error;
  }
};

/**
 * Fetch a single daily puzzle from Lichess
 */
export const fetchDailyPuzzle = async () => {
  try {
    const response = await axios.get('https://lichess.org/api/puzzle/daily', {
      timeout: 10000
    });

    const puzzleData = response.data;
    const { puzzle, game } = puzzleData;

    // Check if already exists
    const existing = await PuzzleModel.findOne({ lichessId: puzzle.id });
    if (existing) {
      return existing;
    }

    // Create new puzzle
    const newPuzzle = new PuzzleModel({
      title: `Daily Puzzle ${puzzle.id}`,
      fen: game.fen,
      solutionMoves: puzzle.solution,
      rating: puzzle.rating,
      difficulty: ratingToDifficulty(puzzle.rating),
      themes: puzzle.themes || [],
      category: getCategory(puzzle.themes),
      popularity: puzzle.plays || 0,
      source: 'lichess',
      lichessId: puzzle.id,
      description: `Rating: ${puzzle.rating} | Themes: ${(puzzle.themes || []).join(', ')}`
    });

    await newPuzzle.save();
    return newPuzzle;
  } catch (error) {
    console.error('Error fetching daily puzzle:', error);
    throw error;
  }
};

/**
 * Fetch a random puzzle from Lichess for casual play
 * This acts as a proxy to avoid CORS issues
 */
export const fetchRandomPuzzle = async () => {
  try {
    // Import Chess dynamically
    const { Chess } = await import('chess.js');
    
    // Fetch daily puzzle as a starting point
    const response = await axios.get('https://lichess.org/api/puzzle/daily', {
      timeout: 10000
    });

    const puzzleData = response.data;
    const { puzzle, game } = puzzleData;

    // Calculate FEN from PGN
    let fen;
    let solutionMoves = puzzle.solution;
    
    if (game.pgn) {
      // Parse the PGN and play moves to get the puzzle position
      const chess = new Chess();
      const moves = game.pgn.split(' ');
      
      // Play all moves to get to the puzzle position
      for (const move of moves) {
        try {
          chess.move(move, { sloppy: true });
        } catch (e) {
          console.error('Error playing move:', move, e);
        }
      }
      
      fen = chess.fen();
      
      // Lichess solution includes the opponent's last move as first move
      // We need to play that move to get to the actual puzzle position
      // and remove it from the solution
      if (solutionMoves && solutionMoves.length > 0) {
        try {
          // Play the first move (opponent's move that creates the puzzle)
          chess.move(solutionMoves[0], { sloppy: true });
          fen = chess.fen();
          // Remove the first move from solution (it's already played)
          solutionMoves = solutionMoves.slice(1);
        } catch (e) {
          console.error('Error playing first solution move:', e);
        }
      }
    } else {
      // Fallback to starting position
      fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    }

    // Return puzzle data without saving to DB (for casual play)
    return {
      id: puzzle.id,
      fen: fen,
      solutionMoves: solutionMoves,
      rating: puzzle.rating,
      difficulty: ratingToDifficulty(puzzle.rating),
      themes: puzzle.themes || [],
      plays: puzzle.plays || 0,
      title: `Puzzle ${puzzle.id}`,
      description: `Rating: ${puzzle.rating} | Themes: ${(puzzle.themes || []).join(', ')}`
    };
  } catch (error) {
    console.error('Error fetching random puzzle:', error);
    throw error;
  }
};

export default {
  fetchLichessPuzzles,
  importLichessPuzzles,
  fetchDailyPuzzle,
  fetchRandomPuzzle
};
