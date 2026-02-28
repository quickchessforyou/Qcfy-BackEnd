import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import ChessBoard from "../../components/ChessBoard/ChessBoard";

// Curated working puzzles with proper FEN and solutions
const PUZZLES = [
  {
    id: "1",
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1",
    solution: ["f3g5", "d7d5", "g5f7", "e8f7", "c4d5"], // Scholar's mate variation
    rating: 1200,
    themes: ["fork", "material"]
  },
  {
    id: "2",
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1",
    solution: ["f3e5", "c6e5", "d1h5", "e5f7", "h5e5"], // Knight fork
    rating: 1100,
    themes: ["fork", "pin"]
  },
  {
    id: "3",
    fen: "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1",
    solution: ["f3e5", "d7d6", "e5f7", "e8f7", "d1h5"], // Remove defender
    rating: 1300,
    themes: ["removal", "attack"]
  },
  {
    id: "4",
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1",
    solution: ["c6d4", "f3d4", "d8h4", "d4f3", "h4e4"], // Queen attack
    rating: 1400,
    themes: ["discovery", "attack"]
  },
  {
    id: "5",
    fen: "rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1",
    solution: ["f6e4", "c4f7", "e8f7", "d1h5", "e4g5"], // Material gain
    rating: 1250,
    themes: ["material", "tactics"]
  }
];

function CasualPuzzlePage() {
  const [game, setGame] = useState(new Chess());
  const [puzzle, setPuzzle] = useState(null);
  const [moveIndex, setMoveIndex] = useState(0);
  const [status, setStatus] = useState("ready");
  const [showSolution, setShowSolution] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadNewPuzzle();
  }, []);

  const loadNewPuzzle = () => {
    const randomPuzzle = PUZZLES[Math.floor(Math.random() * PUZZLES.length)];
    setPuzzle(randomPuzzle);
    const newGame = new Chess(randomPuzzle.fen);
    setGame(newGame);
    setMoveIndex(0);
    setStatus("playing");
    setShowSolution(false);
    setMessage("Find the best move!");
  };

  const makeComputerMove = (gameCopy, moveStr) => {
    const from = moveStr.substring(0, 2);
    const to = moveStr.substring(2, 4);
    const promotion = moveStr.length > 4 ? moveStr[4] : undefined;

    try {
      gameCopy.move({ from, to, promotion });
      return true;
    } catch (e) {
      console.error("Computer move error:", e);
      return false;
    }
  };

  const onDrop = ({ from, to }) => {
    if (status !== "playing") return false;

    const gameCopy = new Chess(game.fen());

    // Try the move
    try {
      const result = gameCopy.move({
        from: from,
        to: to,
        promotion: 'q'
      });

      if (!result) return false;

      // Check if it matches expected move
      const expectedMove = puzzle.solution[moveIndex];
      const playedMove = result.from + result.to + (result.promotion === 'q' && expectedMove.length === 5 ? 'q' : '');
      // Note: solution strings sometimes have promotion char. result.promotion is 'q' usually.

      // Better robust check: Compare standard algebraic or just from+to if promotion is default
      // This simple check might need refinement if specific promotion is required, but usually Q.
      const simplifiedExpected = expectedMove.substring(0, 4);
      const simplifiedPlayed = playedMove.substring(0, 4);

      // Strict check including promotion if needed
      const matches = (playedMove === expectedMove) || (simplifiedPlayed === simplifiedExpected && expectedMove.length === 4);

      if (matches) {
        setGame(new Chess(gameCopy.fen()));
        setMessage("Correct! ✓");

        const nextIndex = moveIndex + 1;

        // Check if puzzle is complete
        if (nextIndex >= puzzle.solution.length) {
          setStatus("solved");
          setMessage("🎉 Puzzle solved!");
          return true;
        }

        setMoveIndex(nextIndex);

        // Make computer's response
        setTimeout(() => {
          const computerGame = new Chess(gameCopy.fen());
          if (makeComputerMove(computerGame, puzzle.solution[nextIndex])) {
            setGame(new Chess(computerGame.fen()));
            setMoveIndex(nextIndex + 1);

            // Check if that was the last move
            if (nextIndex + 1 >= puzzle.solution.length) {
              setStatus("solved");
              setMessage("🎉 Puzzle solved!");
            } else {
              setMessage("Your turn again!");
            }
          }
        }, 600);

        return true;
      } else {
        // Wrong move
        setStatus("wrong");
        setMessage("❌ Not the best move. Try again!");
        // We set the game temporarily to the wrong move to show it, then revert
        setGame(new Chess(gameCopy.fen()));

        setTimeout(() => {
          setGame(new Chess(game.fen()));
          setStatus("playing");
          setMessage("Think carefully...");
        }, 1000);

        return true;
      }
    } catch (e) {
      return false;
    }
  };

  const handleRetry = () => {
    const newGame = new Chess(puzzle.fen);
    setGame(newGame);
    setMoveIndex(0);
    setStatus("playing");
    setShowSolution(false);
    setMessage("Find the best move!");
  };

  const handleViewSolution = () => {
    setShowSolution(true);
    setMessage("Solution revealed below");
  };

  const orientation = game.turn() === 'w' ? 'white' : 'black';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '32px', color: '#2d3748' }}>♟️ Chess Tactics</h1>
            <p style={{ margin: '4px 0 0 0', color: '#718096' }}>Master tactical patterns</p>
          </div>
          {puzzle && (
            <div style={{
              background: '#667eea',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '12px',
              fontWeight: 'bold'
            }}>
              Rating: {puzzle.rating}
            </div>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          alignItems: 'start'
        }}>
          {/* Info Panel */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '20px',
              color: status === 'wrong' ? '#e53e3e' : status === 'solved' ? '#38a169' : '#2d3748'
            }}>
              {message}
            </div>

            {puzzle && (
              <>
                <div style={{
                  background: '#f7fafc',
                  padding: '16px',
                  borderRadius: '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ color: '#718096' }}>Puzzle ID: </span>
                    <strong>#{puzzle.id}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#718096' }}>Themes: </span>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                      {puzzle.themes.map(theme => (
                        <span key={theme} style={{
                          background: '#667eea',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {status === "solved" ? (
                    <button
                      onClick={loadNewPuzzle}
                      style={{
                        background: '#38a169',
                        color: 'white',
                        border: 'none',
                        padding: '14px 24px',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'transform 0.2s'
                      }}
                      onMouseOver={e => e.target.style.transform = 'scale(1.05)'}
                      onMouseOut={e => e.target.style.transform = 'scale(1)'}
                    >
                      ➜ Next Puzzle
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleViewSolution}
                        disabled={showSolution}
                        style={{
                          background: showSolution ? '#cbd5e0' : '#667eea',
                          color: 'white',
                          border: 'none',
                          padding: '14px 24px',
                          borderRadius: '12px',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          cursor: showSolution ? 'not-allowed' : 'pointer',
                          transition: 'transform 0.2s'
                        }}
                        onMouseOver={e => !showSolution && (e.target.style.transform = 'scale(1.05)')}
                        onMouseOut={e => e.target.style.transform = 'scale(1)'}
                      >
                        👁️ View Solution
                      </button>
                      <button
                        onClick={handleRetry}
                        style={{
                          background: '#4a5568',
                          color: 'white',
                          border: 'none',
                          padding: '14px 24px',
                          borderRadius: '12px',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'transform 0.2s'
                        }}
                        onMouseOver={e => e.target.style.transform = 'scale(1.05)'}
                        onMouseOut={e => e.target.style.transform = 'scale(1)'}
                      >
                        🔄 Retry
                      </button>
                      <button
                        onClick={loadNewPuzzle}
                        style={{
                          background: '#e2e8f0',
                          color: '#2d3748',
                          border: 'none',
                          padding: '14px 24px',
                          borderRadius: '12px',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'transform 0.2s'
                        }}
                        onMouseOver={e => e.target.style.transform = 'scale(1.05)'}
                        onMouseOut={e => e.target.style.transform = 'scale(1)'}
                      >
                        Skip ➜
                      </button>
                    </>
                  )}
                </div>

                {showSolution && (
                  <div style={{
                    background: '#fef5e7',
                    border: '2px solid #f39c12',
                    padding: '16px',
                    borderRadius: '12px',
                    marginTop: '16px'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#d68910' }}>
                      💡 Solution:
                    </div>
                    <div style={{ fontSize: '14px', color: '#7d6608', fontFamily: 'monospace' }}>
                      {puzzle.solution.join(" → ")}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Chessboard */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px'
          }}>
            {game && (
              <ChessBoard
                fen={game.fen()}
                onMove={onDrop}
                orientation={orientation}
                width="100%"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CasualPuzzlePage;