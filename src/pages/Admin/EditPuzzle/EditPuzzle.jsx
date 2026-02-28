// ... imports (assumed same as CreatePuzzle but with edits)
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Chess } from 'chess.js';
import toast, { Toaster } from 'react-hot-toast';
import { FaChess, FaSave, FaTimes, FaLayerGroup, FaSignal, FaLightbulb, FaTrash } from 'react-icons/fa';
import { PageHeader, Button } from '../../../components/Admin';
import { adminAPI, categoryAPI } from '../../../services/api';
import styles from '../CreatePuzzle/CreatePuzzle.module.css'; // Reuse styles from CreatePuzzle

// Import chess pieces
import whitePawn from '../../../assets/pieces/whitepawn.svg';
import whiteKnight from '../../../assets/pieces/whiteknight.svg';
import whiteBishop from '../../../assets/pieces/whitebishop.svg';
import whiteRook from '../../../assets/pieces/whiterook.svg';
import whiteQueen from '../../../assets/pieces/whitequeen.svg';
import whiteKing from '../../../assets/pieces/whiteking.svg';
import blackPawn from '../../../assets/pieces/blackpawn.svg';
import blackKnight from '../../../assets/pieces/blackknight.svg';
import blackBishop from '../../../assets/pieces/blackbishop.svg';
import blackRook from '../../../assets/pieces/blackrook.svg';
import blackQueen from '../../../assets/pieces/blackqueen.svg';
import blackKing from '../../../assets/pieces/blackking.svg';

const LEVEL_RANGES = {
  1: { easy: [300, 450], medium: [450, 600], hard: [600, 750] },
  2: { easy: [750, 900], medium: [900, 1050], hard: [1050, 1200] },
  3: { easy: [1200, 1350], medium: [1350, 1500], hard: [1500, 1650] },
  4: { easy: [1650, 1800], medium: [1800, 1950], hard: [1950, 2100] },
  5: { easy: [2100, 2250], medium: [2250, 2400], hard: [2400, 2550] },
  6: { easy: [2550, 2700], medium: [2700, 2850], hard: [2850, 3000] },
  7: { easy: [3000, 3160], medium: [3160, 3330], hard: [3330, 3500] }
};

function EditPuzzle() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // 'normal' or 'kids'
  const [puzzleType, setPuzzleType] = useState('normal');

  const [formData, setFormData] = useState({
    title: '',
    fen: '',
    correctMove: '',
    alternativeSolutions: [],
    difficulty: 'Medium',
    category: 'Tactics',
    description: '',
    hints: '',
    level: 1,
    rating: 400
  });

  // Kids Mode State
  const [kidsState, setKidsState] = useState({
    pieceType: 'n', // Default Knight
    pieceColor: 'w',
    startSquare: null,
    targets: [], // { square: 'e5', item: 'pizza' }
    targetType: 'pizza' // Current target type to place
  });

  // Manual Board Editor State (Normal Mode)
  const [setupMode, setSetupMode] = useState('fen'); // 'fen' | 'manual'
  const [editorState, setEditorState] = useState({}); // { 'e4': { type: 'p', color: 'w' } }

  const [fenError, setFenError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  // First Move control: 'human' (default) or 'computer'
  const [firstMoveBy, setFirstMoveBy] = useState('human');

  // Convert description/hints from backend into our form shape
  const hydrateFormFromPuzzle = (puzzle) => {
    const description = puzzle.description || '';
    let mainDesc = description;
    let hints = '';

    // Simple split: if description contains double newline, treat last part as hints
    const parts = description.split('\n\n');
    if (parts.length > 1) {
      mainDesc = parts.slice(0, -1).join('\n\n');
      hints = parts[parts.length - 1];
    }

    const difficultyNormalized = (puzzle.difficulty || 'medium').toLowerCase();
    const difficultyLabelMap = {
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
    };

    setPuzzleType(puzzle.type || 'normal');
    if (puzzle.type === 'kids' && puzzle.kidsConfig) {
      setKidsState({
        pieceType: puzzle.kidsConfig.piece || 'n',
        pieceColor: puzzle.fen.split(' ')[1] || 'w', // Infer turn color from FEN or default
        startSquare: puzzle.kidsConfig.startSquare,
        targets: puzzle.kidsConfig.targets || [],
        targetType: 'pizza'
      });
    }

    setFormData({
      title: puzzle.title || '',
      fen: puzzle.fen || '',
      correctMove: Array.isArray(puzzle.solutionMoves)
        ? puzzle.solutionMoves.join(', ')
        : '',
      alternativeSolutions: Array.isArray(puzzle.alternativeSolutions)
        ? puzzle.alternativeSolutions.map(sol => sol.join(', '))
        : [],
      difficulty: difficultyLabelMap[difficultyNormalized] || 'Medium',
      category: puzzle.category || 'Tactics',
      description: mainDesc,
      hints,
      level: puzzle.level || 1,
      rating: puzzle.rating || 400
    });

    // Populate editorState from FEN if possible, in case user switches to manual
    try {
      const chess = new Chess(puzzle.fen);
      const newEditorState = {};
      chess.board().forEach((row, r) => {
        row.forEach((sq, c) => {
          if (sq) {
            const squareName = `${String.fromCharCode(97 + c)}${8 - r}`;
            newEditorState[squareName] = { type: sq.type, color: sq.color };
          }
        });
      });
      setEditorState(newEditorState);
    } catch (e) { console.warn("Could not hydrate editor from FEN", e); }

    // Hydrate first move settings
    setFirstMoveBy(puzzle.firstMoveBy === 'computer' ? 'computer' : 'human');
  };

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        const data = await categoryAPI.getAll(false);
        if (isMounted) {
          setCategories(data);
          setLoadingCategories(false);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        if (isMounted) {
          setLoadingCategories(false);
        }
      }
    };

    const fetchPuzzle = async () => {
      setIsLoading(true);
      setApiError('');
      try {
        const puzzle = await adminAPI.getPuzzleById(id);
        if (!isMounted) return;
        hydrateFormFromPuzzle(puzzle);
      } catch (error) {
        const errorMsg = error.message || 'Unable to load puzzle details';
        if (isMounted) {
          setApiError(errorMsg);
          toast.error(errorMsg);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (id) {
      fetchCategories();
      fetchPuzzle();
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  const validateFEN = (fen) => {
    try {
      new Chess(fen);
      setFenError('');
      return true;
    } catch (error) {
      setFenError('Invalid FEN notation');
      return false;
    }
  };

  const handleFENChange = (value) => {
    setFormData({ ...formData, fen: value });
    validateFEN(value);
  };

  // Logic to determine Level and Difficulty from Rating
  const determineLevelAndDifficulty = (rating) => {
    const r = Number(rating);
    for (const [lvl, ranges] of Object.entries(LEVEL_RANGES)) {
      if (r >= ranges.easy[0] && r <= ranges.hard[1]) {
        // EditPuzzle uses Capitalized difficulty in state
        if (r <= ranges.easy[1]) return { level: Number(lvl), difficulty: 'Easy' };
        if (r <= ranges.medium[1]) return { level: Number(lvl), difficulty: 'Medium' };
        return { level: Number(lvl), difficulty: 'Hard' };
      }
    }
    // Fallback if out of bounds
    if (r < 300) return { level: 1, difficulty: 'Easy' };
    if (r > 3500) return { level: 7, difficulty: 'Hard' };
    return { level: 1, difficulty: 'Medium' };
  };

  const handleRatingChange = (newRating) => {
    const { level, difficulty } = determineLevelAndDifficulty(newRating);
    setFormData(prev => ({
      ...prev,
      rating: newRating,
      level: level,
      difficulty: difficulty
    }));
  };


  const parseSolutionMoves = (raw) =>
    raw
      .split(/[\n,]/)
      .map((m) => m.trim())
      .filter(Boolean);

  const handleAddAlternative = () => {
    setFormData(prev => ({
      ...prev,
      alternativeSolutions: [...prev.alternativeSolutions, ""]
    }));
  };

  const handleRemoveAlternative = (index) => {
    setFormData(prev => ({
      ...prev,
      alternativeSolutions: prev.alternativeSolutions.filter((_, i) => i !== index)
    }));
  };

  const handleAlternativeChange = (index, value) => {
    const newAlts = [...formData.alternativeSolutions];
    newAlts[index] = value;
    setFormData(prev => ({ ...prev, alternativeSolutions: newAlts }));
  };

  // Drag and Drop Logic for Kids Mode & Manual Editor
  const handlePaletteDragStart = (e, type, value, color) => {
    e.dataTransfer.setData('type', type);
    e.dataTransfer.setData('value', value);
    if (color) e.dataTransfer.setData('color', color);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleBoardDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleBoardDrop = (e, square) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('type');
    const value = e.dataTransfer.getData('value');
    const color = e.dataTransfer.getData('color');

    if (!type || !value) return;

    if (puzzleType === 'kids') {
      if (type === 'piece') {
        setKidsState(prev => ({ ...prev, pieceType: value, pieceColor: color || kidsState.pieceColor, startSquare: square }));
      } else if (type === 'target') {
        const existingIndex = kidsState.targets.findIndex(t => t.square === square);
        if (existingIndex === -1) {
          setKidsState(prev => ({ ...prev, targets: [...prev.targets, { square, item: value }] }));
        } else {
          const newTargets = [...kidsState.targets];
          newTargets[existingIndex].item = value;
          setKidsState(prev => ({ ...prev, targets: newTargets }));
        }
      }
    } else if (setupMode === 'manual') {
      // Normal Mode Manual Setup
      if (type === 'piece') {
        const newEditorState = { ...editorState, [square]: { type: value, color } };
        setEditorState(newEditorState);
        updateFenFromEditor(newEditorState);
      } else if (type === 'trash') {
        const newEditorState = { ...editorState };
        delete newEditorState[square];
        setEditorState(newEditorState);
        updateFenFromEditor(newEditorState);
      }
    }
  };

  const handleSquareClick = (square) => {
    if (puzzleType === 'kids') {
      // Toggle logic for kids
      if (kidsState.startSquare === square) {
        setKidsState(prev => ({ ...prev, startSquare: null }));
        return;
      }
      const existingTargetIndex = kidsState.targets.findIndex(t => t.square === square);
      if (existingTargetIndex !== -1) {
        setKidsState(prev => ({
          ...prev,
          targets: prev.targets.filter((_, i) => i !== existingTargetIndex)
        }));
        return;
      }
      if (!kidsState.startSquare) {
        setKidsState(prev => ({ ...prev, startSquare: square }));
        return;
      }
      setKidsState(prev => ({
        ...prev,
        targets: [...prev.targets, { square, item: prev.targetType }]
      }));
    } else if (setupMode === 'manual') {
      // Click to remove or select? For now simple click removal if piece exists?
      // Or specific behavior. Lichess allows click to select/place.
      // Let's implement click-to-delete for now if something is there, or handled by trash.
      // Actually, just leaving it as drag-drop is safer.
      const newEditorState = { ...editorState };
      if (newEditorState[square]) {
        delete newEditorState[square];
        setEditorState(newEditorState);
        updateFenFromEditor(newEditorState);
      }
    }
  };

  const updateFenFromEditor = (state) => {
    const chess = new Chess();
    chess.clear();
    Object.entries(state).forEach(([sq, piece]) => {
      try {
        chess.put({ type: piece.type, color: piece.color }, sq);
      } catch (e) { }
    });
    setFormData(prev => ({ ...prev, fen: chess.fen() }));
  };

  const clearEditor = () => {
    setEditorState({});
    updateFenFromEditor({});
  };

  // Generate FEN for Kids Mode (Reuse from CreatePuzzle)
  useEffect(() => {
    if (puzzleType === 'kids') {
      const chess = new Chess();
      chess.clear();
      if (kidsState.startSquare) chess.put({ type: kidsState.pieceType, color: kidsState.pieceColor }, kidsState.startSquare);
      const targetColor = kidsState.pieceColor === 'w' ? 'b' : 'w';
      kidsState.targets.forEach(t => chess.put({ type: 'p', color: targetColor }, t.square));

      // Kings
      const corners = ['h8', 'a1', 'h1', 'a8'];
      const usedSquares = [kidsState.startSquare, ...kidsState.targets.map(t => t.square)].filter(Boolean);
      let whiteKingPos = corners.find(c => !usedSquares.includes(c));
      // ... (simplification of king placement logic, assumed correct if copied or we can fallback to simple)
      if (!whiteKingPos) whiteKingPos = 'e1'; // Fallback
      if (whiteKingPos) chess.put({ type: 'k', color: 'w' }, whiteKingPos);
      let blackKingPos = corners.find(c => !usedSquares.includes(c));
      if (!blackKingPos) blackKingPos = 'e8'; // Fallback
      if (blackKingPos) chess.put({ type: 'k', color: 'b' }, blackKingPos);

      const fenParts = chess.fen().split(' ');
      fenParts[1] = kidsState.pieceColor;
      setFormData(prev => ({ ...prev, fen: fenParts.join(' ') }));
    }
  }, [kidsState, puzzleType]);

  const difficultyMap = {
    Easy: 'easy',
    Medium: 'medium',
    Hard: 'hard',
    Expert: 'hard',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (puzzleType === 'normal') {
      if (!validateFEN(formData.fen)) {
        setApiError('Please enter a valid FEN notation before saving.'); return;
      }
      const solutionMoves = parseSolutionMoves(formData.correctMove);
      if (!solutionMoves.length) {
        setApiError('Add at least one solution move (comma separated).'); return;
      }

      const alternativeSolutions = formData.alternativeSolutions
        .map(sol => parseSolutionMoves(sol))
        .filter(sol => sol.length > 0);

      const payload = {
        title: formData.title.trim(),
        fen: formData.fen.trim(),
        difficulty: difficultyMap[formData.difficulty] || 'medium',
        category: formData.category,
        solutionMoves,
        alternativeSolutions,
        description: [formData.description.trim(), formData.hints.trim()].filter(Boolean).join('\n\n'),
        type: 'normal',
        level: Number(formData.level),
        rating: Number(formData.rating),
        initialMove: undefined,
        firstMoveBy
      };
      submitPayload(payload);
    } else {
      // Kids
      if (!kidsState.startSquare || kidsState.targets.length === 0) {
        setApiError('Please configure the board properly.'); return;
      }
      const payload = {
        title: formData.title.trim(),
        fen: formData.fen.trim(),
        difficulty: formData.difficulty.toLowerCase(),
        category: formData.category,
        description: [formData.description.trim(), formData.hints.trim()].filter(Boolean).join('\n\n'),
        type: 'kids',
        kidsConfig: {
          piece: kidsState.pieceType,
        },
        level: Number(formData.level),
        rating: Number(formData.rating)
      };
      submitPayload(payload);
    }
  };

  const submitPayload = async (payload) => {
    setIsSubmitting(true);
    try {
      await adminAPI.updatePuzzle(id, payload);
      toast.success('Puzzle updated successfully!');
      setTimeout(() => navigate('/admin/puzzles'), 1500);
    } catch (error) {
      setApiError(error.message || 'Failed to update puzzle.');
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderChessBoard = () => {
    let board = [];
    if (setupMode === 'manual' && puzzleType === 'normal') {
      board = Array(8).fill(null).map(() => Array(8).fill(null));
    } else {
      try {
        const chess = new Chess(formData.fen);
        board = chess.board();
      } catch (e) {
        if (puzzleType === 'kids' || (puzzleType === 'normal' && setupMode === 'manual')) {
          board = Array(8).fill(null).map(() => Array(8).fill(null));
        } else {
          return (
            <div className={styles.boardError}>
              <FaChess />
              <p>Invalid FEN - Board cannot be displayed</p>
            </div>
          );
        }
      }
    }
    const previewUserColor = (() => {
      try {
        const chess = new Chess(formData.fen);
        const turn = chess.turn();
        // Computer always plays first - user plays the OPPOSITE side
        return puzzleType === 'normal' ? (turn === 'w' ? 'b' : 'w') : turn;
      } catch (e) { return 'w'; }
    })();

    const ranks = previewUserColor === 'w' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
    const files = previewUserColor === 'w' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];

    return (
      <div className={`${styles.chessboard} ${puzzleType === 'kids' || setupMode === 'manual' ? styles.interactiveBoard : ''}`}>
        {ranks.map((rank, rankIndex) => (
          <div key={rank} className={styles.row}>
            {files.map((file, fileIndex) => {
              const squareName = `${file}${rank}`;
              const r = 8 - parseInt(rank);
              const c = file.charCodeAt(0) - 97;

              const sq = board[r] ? board[r][c] : null;
              const isLight = (r + c) % 2 === 0;
              let content = null;
              if (puzzleType === 'kids') {
                const target = kidsState.targets.find(t => t.square === squareName);
                if (target) content = <span style={{ fontSize: '32px' }}>{target.item === 'pizza' ? '🍕' : '🍫'}</span>;
                else if (kidsState.startSquare === squareName) content = <img src={getPieceImage(kidsState.pieceType, kidsState.pieceColor)} className={styles.piece} alt="piece" />;
              } else if (setupMode === 'manual') {
                const piece = editorState[squareName];
                if (piece) content = <img src={getPieceImage(piece.type, piece.color)} className={styles.piece} alt={`${piece.color}${piece.type}`} />;
                else if (sq) content = <img src={getPieceImage(sq.type, sq.color)} className={styles.piece} alt={`${sq.color}${sq.type}`} />; // Fallback if switching modes
              } else if (sq) {
                content = <img src={getPieceImage(sq.type, sq.color)} className={styles.piece} alt={`${sq.color}${sq.type}`} />;
              }
              return (
                <div
                  key={c}
                  className={`${styles.square} ${isLight ? styles.light : styles.dark}`}
                  onClick={() => { if (setupMode === 'manual' || puzzleType === 'kids') handleSquareClick(squareName); }}
                  onDragOver={handleBoardDragOver}
                  onDrop={(e) => handleBoardDrop(e, squareName)}
                >
                  {content}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const getPieceImage = (type, color) => {
    const pieceMap = {
      p: { w: whitePawn, b: blackPawn },
      n: { w: whiteKnight, b: blackKnight },
      b: { w: whiteBishop, b: blackBishop },
      r: { w: whiteRook, b: blackRook },
      q: { w: whiteQueen, b: blackQueen },
      k: { w: whiteKing, b: blackKing },
    };
    return pieceMap[type]?.[color] || null;
  };

  return (
    <div className={styles.createPuzzle}>
      {/* Re-using createPuzzle styles wrapper for layout consistency */}
      <Toaster position="top-center" />
      <PageHeader icon={FaChess} title={`Edit Puzzle #${id}`} subtitle="Update puzzle details" />

      <div className={styles.content}>
        <div className={styles.formSection}>
          <div className={styles.modeSelector}>
            <button type="button" className={`${styles.modeBtn} ${puzzleType === 'normal' ? styles.active : ''}`} onClick={() => setPuzzleType('normal')}>Normal Puzzle</button>
            <button type="button" className={`${styles.modeBtn} ${puzzleType === 'kids' ? styles.active : ''}`} onClick={() => setPuzzleType('kids')}>Kids Puzzle 🍕</button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div className={styles.formGroup}>
              <label>Puzzle Title *</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            </div>

            {/* CONTROLS */}
            {puzzleType === 'kids' ? (
              <div className={styles.kidsControls}>
                <div className={styles.controlGroup}>
                  <label>1. Select Player Piece</label>
                  <div className={styles.colorToggle} style={{ marginBottom: '10px' }}>
                    <div className={`${styles.colorBtn} ${styles.white} ${kidsState.pieceColor === 'w' ? styles.selected : ''}`} onClick={() => setKidsState({ ...kidsState, pieceColor: 'w' })} />
                    <div className={`${styles.colorBtn} ${styles.black} ${kidsState.pieceColor === 'b' ? styles.selected : ''}`} onClick={() => setKidsState({ ...kidsState, pieceColor: 'b' })} />
                  </div>
                  <div className={styles.piecePalette}>
                    {['n', 'b', 'r', 'q', 'k', 'p'].map(p => (
                      <div key={p} draggable onDragStart={(e) => handlePaletteDragStart(e, 'piece', p)}
                        className={`${styles.pieceOption} ${kidsState.pieceType === p ? styles.selected : ''}`}
                        onClick={() => setKidsState(prev => ({ ...prev, pieceType: p }))}>
                        <img src={getPieceImage(p, kidsState.pieceColor)} alt={p} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className={styles.controlGroup}>
                  <label>2. Select Targets</label>
                  <div className={styles.targetPalette}>
                    <div draggable onDragStart={(e) => handlePaletteDragStart(e, 'target', 'pizza')}
                      className={`${styles.targetOption} ${kidsState.targetType === 'pizza' ? styles.selected : ''}`}
                      onClick={() => setKidsState(prev => ({ ...prev, targetType: 'pizza' }))}>🍕</div>
                    <div draggable onDragStart={(e) => handlePaletteDragStart(e, 'target', 'chocolate')}
                      className={`${styles.targetOption} ${kidsState.targetType === 'chocolate' ? styles.selected : ''}`}
                      onClick={() => setKidsState(prev => ({ ...prev, targetType: 'chocolate' }))}>🍫</div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.setupToggle}>
                  <label>Setup Method:</label>
                  <div className={styles.toggleBtns}>
                    <button type="button" className={setupMode === 'fen' ? styles.active : ''} onClick={() => setSetupMode('fen')}>FEN String</button>
                    <button type="button" className={setupMode === 'manual' ? styles.active : ''} onClick={() => { setSetupMode('manual'); if (!Object.keys(editorState).length) setEditorState({}); }}>Board Editor</button>
                  </div>
                </div>
                {setupMode === 'fen' && (
                  <div className={styles.formGroup}>
                    <label>FEN Position *</label>
                    <textarea rows="2" value={formData.fen} onChange={(e) => handleFENChange(e.target.value)} required={setupMode === 'fen'} />
                  </div>
                )}
                {setupMode === 'manual' && (
                  <div className={styles.editorPalette}>
                    <p>Drag pieces to board. Drag Trash to remove.</p>
                    <div className={styles.paletteRow}>
                      {['k', 'q', 'r', 'b', 'n', 'p'].map(p => (<div key={`w${p}`} className={styles.pieceOption} draggable onDragStart={(e) => handlePaletteDragStart(e, 'piece', p, 'w')}><img src={getPieceImage(p, 'w')} alt="" /></div>))}
                    </div>
                    <div className={styles.paletteRow}>
                      {['k', 'q', 'r', 'b', 'n', 'p'].map(p => (<div key={`b${p}`} className={styles.pieceOption} draggable onDragStart={(e) => handlePaletteDragStart(e, 'piece', p, 'b')}><img src={getPieceImage(p, 'b')} alt="" /></div>))}
                      <div className={styles.trashOption} draggable onDragStart={(e) => handlePaletteDragStart(e, 'trash', 'trash', null)}><FaTrash /></div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button type="button" onClick={clearEditor} className={styles.clearBtn}>Clear Board</button>
                    </div>
                    <div className={styles.generatedFen}><small>FEN: {formData.fen}</small></div>
                  </div>
                )}
                <div className={styles.formGroup}>
                  <label>Correct Move(s) *</label>
                  <input type="text" value={formData.correctMove} onChange={(e) => setFormData((prev) => ({ ...prev, correctMove: e.target.value }))} required />
                  <div style={{ marginTop: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '0.9em', color: '#666', fontWeight: '500' }}>Alternative Solutions (Optional)</label>
                      <button
                        type="button"
                        onClick={handleAddAlternative}
                        style={{ fontSize: '0.85em', background: '#e2e8f0', border: 'none', color: '#2d3748', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }}
                      >
                        + Add Alternative
                      </button>
                    </div>
                    {formData.alternativeSolutions.map((sol, index) => (
                      <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <input
                          type="text"
                          value={sol}
                          onChange={(e) => handleAlternativeChange(index, e.target.value)}
                          placeholder="e.g., Qf7#"
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveAlternative(index)}
                          style={{ background: '#feb2b2', color: '#c53030', border: 'none', borderRadius: '4px', padding: '0 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </>
            )}

            <div className={styles.formGroup}>
              <label>Category *</label>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required>
                {categories.map((cat) => <option key={cat._id} value={cat.name}>{cat.title}</option>)}
              </select>
            </div>
            {/* Reordered: Rating -> Level -> Difficulty */}
            <div className={styles.formGroup} style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ color: '#2d3748', fontWeight: '600' }}>Rating (300 - 3500) *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <input
                    type="number"
                    min="300"
                    max="3500"
                    required
                    value={formData.rating}
                    onChange={(e) => handleRatingChange(e.target.value)}
                    style={{ border: '2px solid #4a5568', fontSize: '1.1em' }}
                  />
                  <small style={{ color: '#4a5568' }}>
                    Entering rating automatically selects the appropriate Level and Difficulty.
                  </small>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.9em' }}>Level (Auto)</label>
                  <select
                    required
                    value={formData.level}
                    disabled
                    style={{ background: '#edf2f7', cursor: 'not-allowed' }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(l => (
                      <option key={l} value={l}>Level {l}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.9em' }}>Difficulty (Auto)</label>
                  <select
                    required
                    value={formData.difficulty}
                    disabled
                    style={{ background: '#edf2f7', cursor: 'not-allowed' }}
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '10px', fontSize: '0.85em', color: '#718096', fontStyle: 'italic' }}>
                Current Range: {LEVEL_RANGES[formData.level]?.[formData.difficulty.toLowerCase()]
                  ? `${LEVEL_RANGES[formData.level][formData.difficulty.toLowerCase()][0]} - ${LEVEL_RANGES[formData.level][formData.difficulty.toLowerCase()][1]}`
                  : 'N/A'}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>

            <div className={styles.actions}>
              <Button type="button" variant="secondary" icon={FaTimes} onClick={() => navigate('/admin/puzzles')}>Cancel</Button>
              <Button type="submit" icon={FaSave} disabled={isSubmitting}>Update Puzzle</Button>
            </div>
          </form>
        </div>

        <div className={styles.previewSection}>
          <div className={styles.previewHeader}>
            <h3>Live Preview</h3>
            <span className={styles.previewBadge}>{formData.difficulty} | Lvl {formData.level} ({formData.rating})</span>
          </div>
          <div className={styles.boardContainer}>{renderChessBoard()}</div>
          <div className={styles.previewInfo}>
            <div><strong>Type:</strong> {puzzleType === 'kids' ? 'Kids' : 'Normal'}</div>
          </div>
        </div>
      </div >
    </div >
  );
}

export default EditPuzzle;
