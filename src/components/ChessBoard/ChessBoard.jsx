import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { useTheme } from '../../contexts/ThemeContext';
import styles from './ChessBoard.module.css';

// Import chess piece SVGs (retained from original logic)
import whitePawn1 from '../../assets/pieces/whitepawn.svg';
import whiteKnight1 from '../../assets/pieces/whiteknight.svg';
import whiteBishop1 from '../../assets/pieces/whitebishop.svg';
import whiteRook1 from '../../assets/pieces/whiterook.svg';
import whiteQueen1 from '../../assets/pieces/whitequeen.svg';
import whiteKing1 from '../../assets/pieces/whiteking.svg';
import blackPawn1 from '../../assets/pieces/blackpawn.svg';
import blackKnight1 from '../../assets/pieces/blackknight.svg';
import blackBishop1 from '../../assets/pieces/blackbishop.svg';
import blackRook1 from '../../assets/pieces/blackrook.svg';
import blackQueen1 from '../../assets/pieces/blackqueen.svg';
import blackKing1 from '../../assets/pieces/blackking.svg';

import whitePawn2 from '../../assets/pieces2/whitepawn.svg';
import whiteKnight2 from '../../assets/pieces2/whiteknight.svg';
import whiteBishop2 from '../../assets/pieces2/whitebishop.svg';
import whiteRook2 from '../../assets/pieces2/whiterook.svg';
import whiteQueen2 from '../../assets/pieces2/whitequeen.svg';
import whiteKing2 from '../../assets/pieces2/whiteking.svg';
import blackPawn2 from '../../assets/pieces2/blackpawn.svg';
import blackKnight2 from '../../assets/pieces2/blackknight.svg';
import blackBishop2 from '../../assets/pieces2/blackbishop.svg';
import blackRook2 from '../../assets/pieces2/blackrook.svg';
import blackQueen2 from '../../assets/pieces2/blackqueen.svg';
import blackKing2 from '../../assets/pieces2/blackking.svg';

import whitePawn3 from '../../assets/pieces3/whitepawn.svg';
import whiteKnight3 from '../../assets/pieces3/whiteknight.svg';
import whiteBishop3 from '../../assets/pieces3/whitebishop.svg';
import whiteRook3 from '../../assets/pieces3/whiterook.svg';
import whiteQueen3 from '../../assets/pieces3/whitequeen.svg';
import whiteKing3 from '../../assets/pieces3/whiteking.svg';
import blackPawn3 from '../../assets/pieces3/blackpawn.svg';
import blackKnight3 from '../../assets/pieces3/blackknight.svg';
import blackBishop3 from '../../assets/pieces3/blackbishop.svg';
import blackRook3 from '../../assets/pieces3/blackrook.svg';
import blackQueen3 from '../../assets/pieces3/blackqueen.svg';
import blackKing3 from '../../assets/pieces3/blackking.svg';

const pieceImageSets = {
  set1: { 'p': blackPawn1, 'n': blackKnight1, 'b': blackBishop1, 'r': blackRook1, 'q': blackQueen1, 'k': blackKing1, 'P': whitePawn1, 'N': whiteKnight1, 'B': whiteBishop1, 'R': whiteRook1, 'Q': whiteQueen1, 'K': whiteKing1 },
  set2: { 'p': blackPawn2, 'n': blackKnight2, 'b': blackBishop2, 'r': blackRook2, 'q': blackQueen2, 'k': blackKing2, 'P': whitePawn2, 'N': whiteKnight2, 'B': whiteBishop2, 'R': whiteRook2, 'Q': whiteQueen2, 'K': whiteKing2 },
  set3: { 'p': blackPawn3, 'n': blackKnight3, 'b': blackBishop3, 'r': blackRook3, 'q': blackQueen3, 'k': blackKing3, 'P': whitePawn3, 'N': whiteKnight3, 'B': whiteBishop3, 'R': whiteRook3, 'Q': whiteQueen3, 'K': whiteKing3 }
};

function normalizeSAN(san) {
  if (!san) return '';
  return san.replace(/[\+#\s]+$/g, '').trim();
}

// Simple Audio Synthesis for Sounds
const playSound = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'move') {
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'capture') {
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.3);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'solved') {
      // Happy chord
      [440, 554, 659].forEach((freq, i) => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = freq;
        gain2.gain.setValueAtTime(0.2, now + i * 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc2.start(now + i * 0.05);
        osc2.stop(now + 0.5);
      });
    }
  } catch (e) {
    console.error("Audio error", e);
  }
}


function ChessBoard({ fen, solution = [], alternativeSolutions = [], onPuzzleSolved, onWrongMove, onBoardStateChange, savedBoardState, puzzleType = 'normal', kidsConfig = null, interactive = true, showSolution = false }) {
  const { currentBoardColors, pieceSet } = useTheme();
  const [game, setGame] = useState(new Chess(fen));

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const pieceImages = pieceSet === 'modern' ? pieceImageSets.set2 : pieceSet === 'elegant' ? pieceImageSets.set3 : pieceImageSets.set1;

  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null); // { from, to }
  const [moveHistory, setMoveHistory] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [solutionIndex, setSolutionIndex] = useState(0);
  const [initialFen, setInitialFen] = useState(fen);
  const [userColor, setUserColor] = useState('w');
  const [computerFirstMovePlayed, setComputerFirstMovePlayed] = useState(false);

  const [normalizedSolution, setNormalizedSolution] = useState([]);
  const [allNormalizedPaths, setAllNormalizedPaths] = useState([]);
  const [validPathIndices, setValidPathIndices] = useState([]);

  // Promotion State
  const [promotionPending, setPromotionPending] = useState(null); // { from, to, color }
  const [capturedTargets, setCapturedTargets] = useState([]); // Array of captured squares
  const [kidsTargets, setKidsTargets] = useState([]); // Initial targets from config

  // Custom Drag State
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPiece, setDraggedPiece] = useState(null);
  const [dragOverSquare, setDragOverSquare] = useState(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 }); // Offset from mouse to piece top-left in logical pixels
  const [draggedPieceImage, setDraggedPieceImage] = useState(null);
  const boardRef = useRef(null);
  const wrapperRef = useRef(null);
  const mouseHandlersRef = useRef({});
  const dragStateRef = useRef({ draggedPiece: null, possibleMoves: [] });
  const dragTimeoutRef = useRef(null);
  const isMouseDownRef = useRef(false);

  // Re-initialize when FEN or solution changes
  useEffect(() => {
    const newGame = new Chess(fen);
    setGame(newGame);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setLastMove(null);
    setMoveHistory([]);
    setFeedback(null);
    setSolutionIndex(0);
    setInitialFen(fen);
    setPromotionPending(null);

    // For normal puzzles, computer ALWAYS plays first.
    // So the user always plays the OPPOSITE side of the FEN's turn-to-move.
    if (puzzleType === 'normal') {
      const turn = newGame.turn();
      setUserColor(turn === 'w' ? 'b' : 'w');
    }

    // Initialize Kids Mode stuff
    setCapturedTargets([]);
    if (puzzleType === 'kids' && kidsConfig) {
      setKidsTargets(kidsConfig.targets || []);
    } else {
      setKidsTargets([]);
    }

    // Normalize solution moves to SAN (only for normal)
    if (puzzleType === 'normal') {
      const normalizePath = (path) => {
        try {
          const tempGame = new Chess(fen);
          const sanMoves = [];
          if (Array.isArray(path)) {
            for (const move of path) {
              let result = null;
              try { result = tempGame.move(move); } catch (e) {
                // Try sloppy parsing for coordinates (e2e4)
                if (typeof move === 'string' && (move.length === 4 || move.length === 5)) {
                  const from = move.substring(0, 2);
                  const to = move.substring(2, 4);
                  const promotion = move.length === 5 ? move[4] : undefined;
                  try { result = tempGame.move({ from, to, promotion }); } catch (e2) { }
                }
              }
              if (result) sanMoves.push(result.san);
              else break;
            }
          }
          return sanMoves;
        } catch (error) { return []; }
      };

      const mainPath = normalizePath(solution);
      const altPaths = (alternativeSolutions || []).map(normalizePath).filter(p => p.length > 0);
      const allPaths = [mainPath, ...altPaths].filter(p => p.length > 0);

      setNormalizedSolution(mainPath);
      setAllNormalizedPaths(allPaths);
      setValidPathIndices(allPaths.map((_, i) => i));
    }

    // Reset computer first move flag so auto-play fires again
    setComputerFirstMovePlayed(false);
  }, [fen, solution, alternativeSolutions, puzzleType, kidsConfig]);

  const onBoardStateChangeRef = useRef(onBoardStateChange);
  useEffect(() => {
    onBoardStateChangeRef.current = onBoardStateChange;
  }, [onBoardStateChange]);

  // Auto-play first solution move for normal puzzles (computer ALWAYS plays first)
  useEffect(() => {
    // Only auto-play if we haven't played yet and the board is in its initial state
    const isInitialState = !savedBoardState || savedBoardState.fen === initialFen;

    if (puzzleType === 'normal' && !computerFirstMovePlayed && isInitialState && normalizedSolution.length > 0) {

      const timer = setTimeout(() => {
        try {
          const firstSolutionMove = normalizedSolution[0];
          if (!firstSolutionMove) return;

          const tempGame = new Chess(initialFen);
          const result = tempGame.move(firstSolutionMove);

          if (result) {
            playSound(result.san.includes('x') ? 'capture' : 'move');
            setMoveHistory([result.san]);
            setLastMove({ from: result.from, to: result.to });
            setGame(new Chess(tempGame.fen()));
            setSolutionIndex(1); // User starts from index 1 (second move)
            setComputerFirstMovePlayed(true);

            if (onBoardStateChangeRef.current) {
              onBoardStateChangeRef.current(tempGame.fen(), [result.san]);
            }
          } else {
            console.warn('Auto-play move failed. FEN:', initialFen, 'Move:', firstSolutionMove);
            setComputerFirstMovePlayed(true);
          }
        } catch (e) {
          console.error('Failed to auto-play first solution move:', e);
          setComputerFirstMovePlayed(true);
        }
      }, 800);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computerFirstMovePlayed, puzzleType, savedBoardState, normalizedSolution, initialFen]);

  // Restore saved board state if available
  useEffect(() => {
    if (savedBoardState && savedBoardState.fen) {
      try {
        const restoredGame = new Chess(savedBoardState.fen);
        setGame(restoredGame);
        if (savedBoardState.moveHistory) {
          setMoveHistory(savedBoardState.moveHistory);
        }
      } catch (error) {
        console.error('Failed to restore board state:', error);
      }
    }
  }, [savedBoardState]);

  // Auto-play solution logic
  useEffect(() => {
    if (showSolution && puzzleType === 'normal') {
      const playNext = () => {
        if (solutionIndex >= normalizedSolution.length) {
          // Finished solution
          if (onPuzzleSolved && feedback !== 'solved') {
            setFeedback('solved');
            if (onPuzzleSolved) onPuzzleSolved();
          }
          return;
        }

        const nextMove = normalizedSolution[solutionIndex];
        // Ensure move is valid in current state
        let result = null;
        try {
          result = game.move(nextMove);
        } catch (e) { console.error(e); }

        if (result) {
          playSound(result.san.includes('x') ? 'capture' : 'move');
          setMoveHistory(prev => [...prev, result.san]);
          setLastMove({ from: result.from, to: result.to });
          setGame(new Chess(game.fen()));
          setSolutionIndex(prev => prev + 1);
        }
      };

      const timer = setTimeout(playNext, 800);
      return () => clearTimeout(timer);
    }
  }, [showSolution, solutionIndex, normalizedSolution, game, puzzleType, feedback]);

  // Cleanup effect for mouse event listeners
  useEffect(() => {
    return () => {
      // Clean up body listeners if they exist
      document.removeEventListener('mousemove', mouseHandlersRef.current.move);
      document.removeEventListener('mouseup', mouseHandlersRef.current.up);
      if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
    };
  }, []);

  // Board scaling logic
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    // Only scale if a specific width prop is likely controlling the container
    // or if we simply want it to fit.
    const updateScale = () => {
      if (containerRef.current) {
        const parentWidth = containerRef.current.parentElement?.offsetWidth || containerRef.current.offsetWidth;
        // Base width of the board is roughly 8 * 70px + borders/padding ~ 600px.
        // Let's assume the "natural" size is around 600px wide.
        const naturalWidth = 600;

        // If parent is smaller than natural width, scale down.
        // If parent is larger, we can keep it 1 or scale up? Let's cap at 1 for crispness unless needed.
        if (parentWidth && parentWidth < naturalWidth) {
          setScale(parentWidth / naturalWidth);
        } else {
          setScale(1);
        }
      }
    };

    updateScale();
    const resizeObserver = new ResizeObserver(updateScale);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current.parentElement || document.body);
    }
    window.addEventListener('resize', updateScale);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);


  const getFileRank = (row, col) => {
    return `${files[col]}${ranks[row]}`;
  };

  const getSquare = (file, rank) => {
    return `${file}${rank}`;
  };

  const getPiece = (square) => {
    return game.get(square);
  };

  const getPieceImage = (piece) => {
    if (!piece) return null;
    return pieceImages[piece.color === 'w' ? piece.type.toUpperCase() : piece.type];
  };

  const getSquareStyle = (row, col) => {
    const isDark = (row + col) % 2 === 1;
    // const backgroundColor = isDark ? '#B58863' : '#F0D9B5'; // Default
    const backgroundColor = isDark ? (currentBoardColors?.dark || '#B58863') : (currentBoardColors?.light || '#F0D9B5');

    const isSelected = selectedSquare && selectedSquare.row === row && selectedSquare.col === col;
    const isLastMove = lastMove && (
      (lastMove.from.row === row && lastMove.from.col === col) ||
      (lastMove.to.row === row && lastMove.to.col === col)
    );
    const isPossibleMove = possibleMoves.some(m => m.row === row && m.col === col);
    const inCheck = game.inCheck() && game.turn() === game.get(getFileRank(row, col))?.color && game.get(getFileRank(row, col))?.type === 'k';
    const isDragOver = dragOverSquare && dragOverSquare.row === row && dragOverSquare.col === col;

    // Kids Mode
    const squareSan = getFileRank(row, col);
    const isCapturedTarget = capturedTargets.includes(squareSan);
    const isTarget = kidsTargets.some(t => t.square === squareSan) && !isCapturedTarget;

    const style = {
      backgroundColor: isSelected ? 'rgba(255, 255, 0, 0.5)' : backgroundColor,
      ...((isSelected || isLastMove) && {
        boxShadow: `inset 0 0 0 0px ${isDark ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.1)'}` // subtle highlight
      })
    };

    // Highlight last move
    if (isLastMove) {
      style.backgroundColor = isDark ? '#aaa23a' : '#cdcw68'; // simplistic highlight override
      // Better merge:
      // style.backgroundColor = isDark ? '#baca44' : '#f6f669'; 
      // Actually using CSS class is better, but here we do inline for dynamic colors + overrides
    }

    // In Check (King red)
    if (inCheck) {
      style.background = `radial-gradient(circle at center, #ff4d4d 0%, ${backgroundColor} 70%)`;
    }

    return style;
  };

  const resetToInitial = (delay = 600) => {
    setFeedback('wrong');
    playSound('wrong');
    setTimeout(() => {
      const resetGame = new Chess(initialFen);
      setGame(resetGame);
      setMoveHistory([]);
      setSolutionIndex(0);
      setLastMove(null);
      setSelectedSquare(null);
      setPossibleMoves([]);
      setFeedback(null);
      setCapturedTargets([]); // Reset targets
    }, delay);
  };

  const checkKidsWinCondition = (currentCaptured) => {
    // Check if all targets are captured
    // We need to know how many targets were there
    const totalTargets = kidsTargets.length;
    if (currentCaptured.length >= totalTargets) {
      return true;
    }
    return false;
  };

  const handleKidsMove = (from, to) => {
    // Allow any legal move
    // No turn check needed as we force user color usually, but game.turn() handles it

    const moveAttempt = { from, to, promotion: 'q' };
    let result = null;
    try { result = game.move(moveAttempt); } catch (e) { result = null; }

    if (!result) return;

    // STARTING NEW LOGIC FOR KIDS:
    // Check if 'to' square had a target
    // Targets are logically pieces (pawns) of opposite color so they are 'captured' by engine move
    // But we need to track them visually as Pizza/Chocolate
    const targetHit = kidsTargets.find(t => t.square === to);
    const isCapture = !!targetHit; // Physically it is a capture in engine if we put enemy pieces there

    playSound(isCapture ? 'capture' : 'move');

    const newHistory = [...moveHistory, result.san];
    setMoveHistory(newHistory);
    setLastMove({ from, to });

    // Update visually captured targets
    let newCaptured = capturedTargets;
    if (targetHit) {
      // If we haven't already captured it (should be impossible if piece is there but safe check)
      if (!capturedTargets.includes(targetHit.square)) {
        newCaptured = [...capturedTargets, targetHit.square];
        setCapturedTargets(newCaptured);
      }
    }

    // Force update board state AND keep turn on player logic
    // We want the player to keep moving until all targets captured
    // So we must hack the FEN to set turn back to userColor
    const currentFen = game.fen();
    const fenParts = currentFen.split(' ');
    fenParts[1] = userColor; // Force turn back to user
    const newFen = fenParts.join(' ');

    setGame(new Chess(newFen));
    setFeedback(null); // Clear feedback? Or keep it briefly?

    // Check win
    if (checkKidsWinCondition(newCaptured)) {
      setTimeout(() => {
        setFeedback('solved');
        playSound('solved');
        if (onPuzzleSolved) onPuzzleSolved();
      }, 300);
    }

    // No computer response in Kids Mode

    // Notify parent of board state change
    if (onBoardStateChange) {
      onBoardStateChange(game.fen(), newHistory);
    }
  };

  const handleUserMove = (from, to, promotion = null) => {
    // Branch based on Puzzle Type
    if (puzzleType === 'kids') {
      handleKidsMove(from, to);
      return;
    }

    // Normal Puzzle Logic
    if (game.turn() !== userColor) return;

    // Normal Puzzle Logic
    if (game.turn() !== userColor) return;

    // Check for promotion requirement if not supplied
    if (!promotion) {
      const piece = game.get(from);
      if (piece?.type === 'p' && (
        (piece.color === 'w' && to[1] === '8') ||
        (piece.color === 'b' && to[1] === '1')
      )) {
        // Intercept for promotion
        setPromotionPending({ from, to, color: piece.color });
        return;
      }
    }

    // Default to queen if still null (shouldn't happen with interception, but safe fallback) or use chosen piece
    const moveAttempt = { from, to, promotion: promotion || 'q' };
    let result = null;
    try {
      try {
        result = game.move(moveAttempt);
      } catch (e) {
        // If move failed (e.g. invalid promotion), try without promotion just in case, but usually strict
        try { result = game.move({ from, to }); } catch (e2) { result = null; }
      }
    } catch (e) {
      result = null;
    }

    if (!result) return; // Invalid move

    const san = result.san;
    const isCapture = san.includes('x');
    playSound(isCapture ? 'capture' : 'move');

    const newHistory = [...moveHistory, san];
    setMoveHistory(newHistory);
    setLastMove({ from, to });

    // Validate User Move against all valid paths
    const userMoveSan = normalizeSAN(san);

    // Filter valid paths: keep those where current move matches
    const nextValidIndices = validPathIndices.filter(idx => {
      const path = allNormalizedPaths[idx];
      return path && path[solutionIndex] && normalizeSAN(path[solutionIndex]) === userMoveSan;
    });

    if (nextValidIndices.length > 0) {
      setFeedback('correct');
      setValidPathIndices(nextValidIndices);

      let nextIndex = solutionIndex + 1;

      // Determine if ANY valid path is finished (or if we need to reply)
      // If user solved it (reached end of a path), we can consider it solved? 
      // Usually we want to follow the longest line if possible, OR if they played a mate we stop.

      const winningPathIndex = nextValidIndices.find(idx => nextIndex >= allNormalizedPaths[idx].length);
      const isCheckmate = game.isCheckmate();

      if (winningPathIndex !== undefined || isCheckmate) {
        setTimeout(() => {
          setFeedback('solved');
          playSound('solved');
          if (onPuzzleSolved) onPuzzleSolved();
        }, 300);
      } else {
        // Opponent Response
        // We pick the first valid path remaining to dictate the response. 
        // Ideally we should pick the longest one or the "main" one if available.
        // nextValidIndices[0] is a safe heuristic.
        const responsePathIdx = nextValidIndices[0];
        const responsePath = allNormalizedPaths[responsePathIdx];

        if (nextIndex < responsePath.length) {
          setTimeout(() => {
            const expectedBlackMove = responsePath[nextIndex];
            const blackResult = game.move(expectedBlackMove);
            if (blackResult) {
              playSound(blackResult.san.includes('x') ? 'capture' : 'move');
              setMoveHistory((prev) => [...prev, blackResult.san]);
              setLastMove({ from: blackResult.from, to: blackResult.to });
              setSolutionIndex(nextIndex + 1);
              setGame(new Chess(game.fen()));

              // Check if end of puzzle after opponent move
              if ((nextIndex + 1) >= responsePath.length || game.isCheckmate()) {
                setTimeout(() => {
                  setFeedback('solved');
                  playSound('solved');
                  if (onPuzzleSolved) onPuzzleSolved();
                }, 300);
              } else {
                setFeedback(null);
              }
            }
          }, 300);
          setSolutionIndex(nextIndex); // Update index for user's next turn (wait, this is actually set AFTER opponent move usually? No, user move increments index) 
          // Actually logic above: user moves (idx 0), we set index to 1. Opponent moves (idx 1), we set index to 2.
          // So solutionIndex tracks 'moves played so far' effectively.
        }
      }
      setGame(new Chess(game.fen()));
    } else {
      if (onWrongMove) onWrongMove();
      resetToInitial();
    }

    // Notify parent of board state change for normal puzzles too
    if (onBoardStateChange) {
      setTimeout(() => {
        onBoardStateChange(game.fen(), newHistory);
      }, 100);
    }
  };

  const handlePromotionSelect = (pieceChar) => {
    if (!promotionPending) return;
    const { from, to } = promotionPending;
    setPromotionPending(null);
    handleUserMove(from, to, pieceChar);
  };

  const handleSquareClick = (square) => {
    if (feedback === 'solved' || isDragging) return;

    // Move Logic
    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setPossibleMoves([]);
        return;
      }
      if (possibleMoves.includes(square)) {
        handleUserMove(selectedSquare, square);
        setSelectedSquare(null);
        setPossibleMoves([]);
        return;
      }
      // Switch selection logic
      const piece = getPiece(square);
      if (piece && piece.color === game.turn()) { // Allow switching if valid turn
        setSelectedSquare(square);
        const moves = game.moves({ square, verbose: true }) || [];
        setPossibleMoves(moves.map((m) => m.to));
        return;
      }
      setSelectedSquare(null);
      setPossibleMoves([]);

    } else {
      const piece = getPiece(square);
      if (!piece) return;
      if (piece.color !== game.turn()) return; // Must be moving side

      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true }) || [];
      setPossibleMoves(moves.map((m) => m.to));
    }
  };

  // Keep a ref to the latest handleUserMove to avoid stale closures in event handlers
  const handleUserMoveRef = useRef(handleUserMove);
  useEffect(() => {
    handleUserMoveRef.current = handleUserMove;
  });

  // Custom Mouse Drag Handlers using useRef to avoid circular dependency
  useEffect(() => {
    mouseHandlersRef.current.handleMouseMove = (e) => {
      if (!boardRef.current || !wrapperRef.current) return;

      const wrapperRect = wrapperRef.current.getBoundingClientRect();
      setDragPosition({
        x: (e.clientX - wrapperRect.left) / scale,
        y: (e.clientY - wrapperRect.top) / scale
      });

      const rect = boardRef.current.getBoundingClientRect();

      // Determine which square we're over
      const squareSize = rect.width / 8;
      const fileIndex = Math.floor((e.clientX - rect.left) / squareSize);
      const rankIndex = Math.floor((e.clientY - rect.top) / squareSize);

      if (fileIndex >= 0 && fileIndex < 8 && rankIndex >= 0 && rankIndex < 8) {
        const currentFiles = userColor === 'w' ? files : [...files].reverse();
        const currentRanks = userColor === 'w' ? ranks : [...ranks].reverse();
        const targetSquare = getSquare(currentFiles[fileIndex], currentRanks[rankIndex]);

        setPossibleMoves(prevMoves => {
          if (prevMoves.includes(targetSquare)) {
            setDragOverSquare(targetSquare);
          } else {
            setDragOverSquare(null);
          }
          return prevMoves;
        });
      } else {
        setDragOverSquare(null);
      }
    };

    mouseHandlersRef.current.handleMouseUp = (e) => {
      // Clear the mouse down flag
      isMouseDownRef.current = false;

      // Remove global event listeners
      document.removeEventListener('mousemove', mouseHandlersRef.current.handleMouseMove);
      document.removeEventListener('mouseup', mouseHandlersRef.current.handleMouseUp);

      // Get current drag state from ref
      const currentDraggedPiece = dragStateRef.current.draggedPiece;
      const currentPossibleMoves = dragStateRef.current.possibleMoves;

      // Determine drop target
      let targetSquare = null;
      if (boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect();
        const squareSize = rect.width / 8;
        const fileIndex = Math.floor((e.clientX - rect.left) / squareSize);
        const rankIndex = Math.floor((e.clientY - rect.top) / squareSize);

        if (fileIndex >= 0 && fileIndex < 8 && rankIndex >= 0 && rankIndex < 8) {
          const currentFiles = userColor === 'w' ? files : [...files].reverse();
          const currentRanks = userColor === 'w' ? ranks : [...ranks].reverse();
          targetSquare = getSquare(currentFiles[fileIndex], currentRanks[rankIndex]);
        }
      }

      // Reset drag state first
      setIsDragging(false);
      setDraggedPiece(null);
      setDragOverSquare(null);
      setDraggedPieceImage(null);

      // Clear ref
      dragStateRef.current = { draggedPiece: null, possibleMoves: [] };

      // Then handle the move if valid - USE REF TO GET LATEST FUNCTION
      if (currentDraggedPiece && targetSquare && targetSquare !== currentDraggedPiece && currentPossibleMoves.includes(targetSquare)) {
        if (handleUserMoveRef.current) {
          handleUserMoveRef.current(currentDraggedPiece, targetSquare);
        }
        // Clear selection after successful drag move
        setSelectedSquare(null);
        setPossibleMoves([]);
      }
    };
  }, [userColor, scale]); // Include scale to ensure coordinate conversion is correct



  const startDrag = (square, e) => {
    // Check interactivity
    if (typeof interactive !== 'undefined' && !interactive) return;

    const piece = getPiece(square);
    const moves = game.moves({ square, verbose: true }) || [];
    const movesToSquares = moves.map((m) => m.to);

    // Update ref with current drag state
    dragStateRef.current = {
      draggedPiece: square,
      possibleMoves: movesToSquares
    };

    // Start drag
    setIsDragging(true);
    setDraggedPiece(square);
    setDraggedPieceImage(pieceImages[piece.color === 'w' ? piece.type.toUpperCase() : piece.type]);
    setPossibleMoves(movesToSquares);

    // Get mouse position relative to wrapper (for visual positioning)
    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    const logicalX = (e.clientX - wrapperRect.left) / scale;
    const logicalY = (e.clientY - wrapperRect.top) / scale;
    setDragPosition({
      x: logicalX,
      y: logicalY
    });

    // Calculate offset from piece top-left (User wants drag from click position)
    // Note: e.target is the image element
    const pieceRect = e.target.getBoundingClientRect();
    const offsetX = (e.clientX - pieceRect.left) / scale;
    const offsetY = (e.clientY - pieceRect.top) / scale;
    setDragOffset({ x: offsetX, y: offsetY });

    // Add global mouse event listeners
    document.addEventListener('mousemove', mouseHandlersRef.current.handleMouseMove, { passive: false });
    document.addEventListener('mouseup', mouseHandlersRef.current.handleMouseUp, { passive: false });
  };

  const handleMouseDown = (e, square) => {
    if (typeof interactive !== 'undefined' && !interactive) return;
    if (feedback === 'solved') return;

    const piece = getPiece(square);
    if (!piece || piece.color !== game.turn()) return;

    // Only handle left mouse button
    if (e.button !== 0) return;

    isMouseDownRef.current = true;

    // Start drag after a short delay to allow for clicks
    dragTimeoutRef.current = setTimeout(() => {
      if (isMouseDownRef.current) {
        startDrag(square, e);
      }
    }, 150); // 150ms delay to distinguish click from drag

    // Add temporary mouseup listener to cancel drag if mouse is released quickly
    const quickMouseUp = () => {
      clearTimeout(dragTimeoutRef.current);
      isMouseDownRef.current = false;
      document.removeEventListener('mouseup', quickMouseUp);
    };

    document.addEventListener('mouseup', quickMouseUp, { once: true });
  };

  const isLightSquare = (fileIndex, rankIndex) => (fileIndex + rankIndex) % 2 === 0;
  const isSelected = (square) => selectedSquare === square;
  const isPossibleMove = (square) => possibleMoves.includes(square);
  const isLastMove = (square) => lastMove && (lastMove.from === square || lastMove.to === square);

  return (
    <div
      ref={containerRef}
      className={styles.boardContainer}
      style={{
        // Maintain aspect ratio space when scaled
        // Natural height ~600. If scaled 0.5, needs 300 height.
        width: scale < 1 ? '100%' : 'auto',
        height: scale < 1 ? `${610 * scale}px` : 'auto',
        padding: scale < 1 ? '0' : '24px', // Reduce padding when small
        overflow: 'hidden',
        border: scale < 1 ? 'none' : undefined, // Remove border for previews if desired
        boxShadow: scale < 1 ? 'none' : undefined
      }}
    >
      <div
        ref={wrapperRef}
        style={{
          transform: `scale(${scale})`,
          // transformOrigin: 'top center',
          width: '610px', // Force natural width context
          // height: '610px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
        {feedback && (
          <div className={`${styles.feedback} ${styles[feedback]}`}>
            {feedback === 'correct' && (puzzleType === 'kids' ? 'Yummy! 😋' : '✓ Correct!')}
            {feedback === 'wrong' && '✗ Wrong Move!'}
            {feedback === 'solved' && '🎉 Puzzle Solved!'}
          </div>
        )}

        {/* Promotion Modal Overlay */}
        {promotionPending && (
          <div className={styles.promotionOverlay}>
            <div className={styles.promotionModal}>
              <div className={styles.promotionHeader}>Choose Promotion</div>
              <div className={styles.promotionOptions}>
                {['q', 'r', 'b', 'n'].map(p => (
                  <div
                    key={p}
                    className={styles.promotionOption}
                    onClick={() => handlePromotionSelect(p)}
                  >
                    <img src={pieceImages[promotionPending.color === 'w' ? p.toUpperCase() : p]} alt={p} />
                  </div>
                ))}
              </div>
              <div className={styles.promotionCancel} onClick={() => setPromotionPending(null)}>✕</div>
            </div>
          </div>
        )}

        <div className={styles.board} ref={boardRef}>
          {(userColor === 'w' ? ranks : [...ranks].reverse()).map((rank, rankIndex) => (
            <div key={rank} className={styles.row}>
              {(userColor === 'w' ? files : [...files].reverse()).map((file, fileIndex) => {
                const square = getSquare(file, rank);
                const piece = getPiece(square);
                const isLight = isLightSquare(fileIndex, rankIndex);
                const squareColor = isLight ? currentBoardColors.light : currentBoardColors.dark;

                // Check for Kids Target -> Override rendering
                // If square is in kidsTargets AND NOT captured
                let kidsContent = null;
                if (puzzleType === 'kids') {
                  const target = kidsTargets.find(t => t.square === square);
                  if (target && !capturedTargets.includes(square)) {
                    // It might have a piece on it (e.g. enemy pawn from FEN), but we render Pizza/Chocolate
                    kidsContent = (
                      <div
                        className={styles.piece}
                        style={{ fontSize: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {target.item === 'pizza' ? '🍕' : target.item === 'chocolate' ? '🍫' : target.item === 'star' ? '⭐' : '🎯'}
                      </div>
                    );
                  }
                }

                // Hide Kings in Kids Mode if not covered by kidsContent
                if (puzzleType === 'kids' && !kidsContent && piece && piece.type === 'k') {
                  // Do not render anything for kings
                } else if (puzzleType === 'kids' && !kidsContent && piece) {
                  // Explicitly render pieces for Kids mode if not king/target (e.g. the main piece)
                  kidsContent = <img src={pieceImages[piece.color + piece.type]} alt="" className={styles.piece} />;
                }

                return (
                  <div
                    key={square}
                    className={`
    ${styles.square}
    ${isSelected(square) ? styles.selected : ''}
    ${isPossibleMove(square) ? styles.possibleMove : ''}
    ${isLastMove(square) ? styles.lastMove : ''}
    ${dragOverSquare === square ? styles.dragOver : ''}
    ${isDragging && draggedPiece === square ? styles.dragSource : ''}
  `}


                    style={{ backgroundColor: squareColor }}
                    onClick={() => handleSquareClick(square)}
                  >
                    {/* Render Kids Content OR Standard Piece */}
                    {kidsContent ? kidsContent : (
                      piece && (
                        <img
                          src={pieceImages[piece.color === 'w' ? piece.type.toUpperCase() : piece.type]}
                          alt={`${piece.color === 'w' ? 'White' : 'Black'} ${piece.type}`}
                          className={`${styles.piece} ${isDragging && draggedPiece === square ? styles.dragSourcePiece : ''}`}
                          draggable={false}
                          onMouseDown={(e) => handleMouseDown(e, square)}
                          style={{ cursor: game.turn() === piece.color && feedback !== 'solved' ? 'grab' : 'default' }}
                        />
                      )
                    )}


                    {fileIndex === 0 && (
                      <div
                        className={styles.rankLabel}
                        style={{ color: isLight ? (currentBoardColors?.dark || '#B58863') : (currentBoardColors?.light || '#F0D9B5') }}
                      >
                        {rank}
                      </div>
                    )}
                    {rankIndex === 7 && (
                      <div
                        className={styles.fileLabel}
                        style={{ color: isLight ? (currentBoardColors?.dark || '#B58863') : (currentBoardColors?.light || '#F0D9B5') }}
                      >
                        {file}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Floating dragged piece */}
        {isDragging && draggedPieceImage && (
          <img
            src={draggedPieceImage}
            alt="Dragged piece"
            className={styles.floatingPiece}
            style={{
              left: dragPosition.x - dragOffset.x,
              top: dragPosition.y - dragOffset.y,
              pointerEvents: 'none'
            }}
          />
        )}
      </div>
    </div>
  );
}

export default ChessBoard;
