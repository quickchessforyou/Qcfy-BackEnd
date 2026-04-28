# Chess Puzzle Import JSON Format

To import puzzles effectively, please use the following JSON structure. The file should contain an **array of puzzle objects**.

## JSON Structure

```json
[
  {
    "title": "Puzzle Title",
    "fen": "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
    "difficulty": "medium",
    "category": "Tactics",
    "solutionMoves": ["f3e5", "d7d5"],
    "description": "Optional description of the puzzle",
    "type": "normal",
    "level": 1,
    "rating": 400,
    "alternativeSolutions": [["f3g5", "d7d6"]]
  }
]
```

## Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **title** | String | Yes | A short title for the puzzle. |
| **fen** | String | Yes | The FEN string representing the board state. |
| **difficulty** | String | No (if rating provided) | Difficulty level: `"easy"`, `"medium"`, or `"hard"`. Auto-calculated from rating if missing. |
| **category** | String | Yes | The puzzle category (e.g., `"Tactics"`, `"Endgame"`). |
| **solutionMoves** | Array<String> | Yes (for normal) | Array of correct moves in UCI/SAN format (e.g., `"e2e4"`). |
| **description** | String | No | Additional context or instructions for the puzzle. |
| **type** | String | No | `"normal"` or `"kids"`. Defaults to `"normal"`. |
| **level** | Number | No | Level of the puzzle (1-7). Auto-calculated from rating if missing. |
| **rating** | Number | Yes | Rating of the puzzle (e.g., 1200). Used to calculate level/difficulty. |
| **alternativeSolutions** | Array<Array<String>> | No | List of alternative correct move sequences. |

### For "kids" Type Puzzles

If `type` is set to `"kids"`, the following `kidsConfig` object is also required:

```json
{
  "title": "Kids Puzzle",
  "type": "kids",
  "fen": "8/8/8/8/8/8/8/8/4K3 w - - 0 1",
  "kidsConfig": {
    "piece": "n",
    "startSquare": "e1",
    "targets": [
      { "square": "e4", "item": "pizza" },
      { "square": "h8", "item": "chocolate" }
    ]
  },
  // ... other fields
}
```

| Field | Type | Description |
|-------|------|-------------|
| **kidsConfig.piece** | String | Piece identifier (e.g., `"n"` for Knight). |
| **kidsConfig.startSquare** | String | Starting square (e.g., `"e1"`). |
| **kidsConfig.targets** | Array | List of targets to collect. |
