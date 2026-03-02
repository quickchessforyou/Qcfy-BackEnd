import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaTrophy,
  FaClock,
  FaUsers,
  FaPlus,
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaLock,
  FaBookOpen,
  FaTrash,
  FaSearch
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import styles from "./CreateCompetition.module.css";
import ChessBoard from "../../../components/ChessBoard/ChessBoard";
import { competitionAPI } from "../../../services/api";

// Generate unique id
const genId = () => Math.random().toString(36).slice(2, 9);

// Chapter accent colors (cycles through these)
const CHAPTER_COLORS = [
  "#d97706", // gold
  "#7c3aed", // purple
  "#0891b2", // cyan
  "#16a34a", // green
  "#db2777", // pink
  "#ea580c", // orange
];

function EditCompetition() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    startTime: "",
    duration: "60",
    maxParticipants: "",
    description: "",
  });

  // Puzzle State
  const [puzzles, setPuzzles] = useState([]);
  const [loadingPuzzles, setLoadingPuzzles] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewPuzzle, setPreviewPuzzle] = useState(null);

  // Chapter State
  const [chapters, setChapters] = useState([]); // [{ id, name, puzzleIds: [] }]
  const [activeChapterId, setActiveChapterId] = useState(null);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [newChapterName, setNewChapterName] = useState("");
  const chapterInputRef = useRef(null);

  // View State
  const [viewMode, setViewMode] = useState("library"); // 'library' or 'selected'

  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    difficulty: "all",
    type: "all",
    level: "all",
    rating: "all",
  });

  // Pagination
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    limit: 10,
    totalRecords: 0,
  });

  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    difficulties: [],
    types: [],
    levels: [],
    ratings: [],
  });

  useEffect(() => {
    if (viewMode === 'library') {
      fetchPuzzles();
    }
  }, [filters, pagination.current, viewMode]);

  // 1. Load Existing Competition Data
  useEffect(() => {
    loadCompetition();
  }, [id]);

  const loadCompetition = async () => {
    try {
      setLoadingData(true);
      const response = await competitionAPI.getById(id);

      if (response.success) {
        const comp = response.data;

        // Format date for datetime-local input (using local time)
        let formattedDate = "";
        if (comp.startTime) {
          const d = new Date(comp.startTime);
          const pad = (n) => (n < 10 ? "0" + n : n);
          formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        }

        setFormData({
          name: comp.name || "",
          startTime: formattedDate,
          duration: comp.duration?.toString() || "",
          maxParticipants: comp.maxParticipants?.toString() || "",
          description: comp.description || "",
          accessCode: comp.accessCode || "",
        });

        // Load chapters if they exist, else initialize an empty array or fallback logic
        if (comp.chapters && comp.chapters.length > 0) {
          setChapters(comp.chapters);
          setActiveChapterId(comp.chapters[0].id);
        } else {
          // Legacy competitions migrate by slapping all 'puzzles' into chapter 1 implicitly?
          // Safer to just create a single Chapter array.
          const legacyChapter = { id: crypto.randomUUID(), name: "Chapter 1", puzzleIds: comp.puzzles || [] };
          setChapters([legacyChapter]);
          setActiveChapterId(legacyChapter.id);
        }
      }
    } catch (error) {
      console.error("Failed to load:", error);
      toast.error("Could not load competition");
      navigate("/admin/competitions");
    } finally {
      setLoadingData(false);
    }
  };

  // 2. Fetch Puzzles logic (same as create)
  useEffect(() => {
    if (showChapterModal && chapterInputRef.current) {
      setTimeout(() => chapterInputRef.current?.focus(), 50);
    }
  }, [showChapterModal]);

  const fetchPuzzles = async () => {
    setLoadingPuzzles(true);
    try {
      const params = {
        ...filters,
        page: pagination.current,
        limit: pagination.limit,
      };
      const response = await competitionAPI.getPuzzlesForCompetition(params);
      if (response.success) {
        setPuzzles(response.data);
        setPagination((prev) => ({ ...prev, ...response.pagination }));
        if (response.filters) setFilterOptions(response.filters);
      }
    } catch (error) {
      toast.error("Failed to load puzzles");
    } finally {
      setLoadingPuzzles(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  // --- Chapter helpers ---
  const getChapterForPuzzle = (puzzleId) => {
    return chapters.find(ch => ch.puzzleIds.includes(puzzleId)) || null;
  };

  const getChapterColor = (chapterId) => {
    const idx = chapters.findIndex(ch => ch.id === chapterId);
    return CHAPTER_COLORS[idx % CHAPTER_COLORS.length];
  };

  // All puzzles that are assigned to any chapter (flat)
  const allAssignedPuzzleIds = chapters.flatMap(ch => ch.puzzleIds);
  const selectedPuzzles = puzzles.filter(p => allAssignedPuzzleIds.includes(p._id));

  // --- Chapter CRUD ---
  const handleAddChapter = () => {
    const name = newChapterName.trim();
    if (!name) {
      toast.error("Please enter a chapter name");
      return;
    }
    const newChapter = { id: genId(), name, puzzleIds: [] };
    setChapters(prev => [...prev, newChapter]);
    setActiveChapterId(newChapter.id);
    setNewChapterName("");
    setShowChapterModal(false);
    toast.success(`Chapter "${name}" created!`);
  };

  const handleDeleteChapter = (chapterId, e) => {
    e.stopPropagation();
    setChapters(prev => prev.filter(ch => ch.id !== chapterId));
    if (activeChapterId === chapterId) {
      const remaining = chapters.filter(ch => ch.id !== chapterId);
      setActiveChapterId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // --- Puzzle toggle in active chapter ---
  const handlePuzzleToggle = (puzzle) => {
    if (chapters.length === 0) {
      toast.error("Please create a chapter first before selecting puzzles!");
      return;
    }
    if (!activeChapterId) {
      toast.error("Please select a chapter first!");
      return;
    }

    const puzzleId = puzzle._id;
    const ownerChapter = getChapterForPuzzle(puzzleId);

    if (ownerChapter && ownerChapter.id !== activeChapterId) {
      // Already in another chapter – do nothing (it's disabled)
      return;
    }

    setChapters(prev => prev.map(ch => {
      if (ch.id !== activeChapterId) return ch;
      const alreadyIn = ch.puzzleIds.includes(puzzleId);
      return {
        ...ch,
        puzzleIds: alreadyIn
          ? ch.puzzleIds.filter(id => id !== puzzleId)
          : [...ch.puzzleIds, puzzleId]
      };
    }));
  };

  const handleSelectAllPage = () => {
    if (chapters.length === 0 || !activeChapterId) {
      toast.error("Please create / select a chapter first!");
      return;
    }
    const currentPagePuzzles = viewMode === 'library' ? puzzles : selectedPuzzles;
    // Only consider puzzles that are free or in the active chapter
    const eligible = currentPagePuzzles.filter(p => {
      const owner = getChapterForPuzzle(p._id);
      return !owner || owner.id === activeChapterId;
    });

    const activeChapter = chapters.find(ch => ch.id === activeChapterId);
    const allSelected = eligible.length > 0 && eligible.every(p => activeChapter.puzzleIds.includes(p._id));

    setChapters(prev => prev.map(ch => {
      if (ch.id !== activeChapterId) return ch;
      if (allSelected) {
        return { ...ch, puzzleIds: ch.puzzleIds.filter(id => !eligible.some(p => p._id === id)) };
      } else {
        const toAdd = eligible.filter(p => !ch.puzzleIds.includes(p._id)).map(p => p._id);
        return { ...ch, puzzleIds: [...ch.puzzleIds, ...toAdd] };
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Enter competition name");

    const allPuzzles = chapters.flatMap(c => c.puzzleIds);
    if (allPuzzles.length === 0) return toast.error("Assign at least one puzzle to a chapter");

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        startTime: new Date(formData.startTime).toISOString(),
        duration: parseInt(formData.duration),
        maxParticipants: parseInt(formData.maxParticipants) || 0,
        puzzles: allPuzzles,
        chapters: chapters.map(c => ({
          id: c.id,
          name: c.name,
          puzzleIds: c.puzzleIds
        }))
      };

      await competitionAPI.updateCompetition(id, payload);
      toast.success("Competition updated!");
      setTimeout(() => navigate("/admin/competitions"), 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update competition");
    } finally {
      setIsSubmitting(false);
    }
  };

  const tableData = viewMode === 'selected' ? selectedPuzzles : puzzles;

  // Check select-all state
  const getSelectAllState = () => {
    const currentPagePuzzles = viewMode === 'library' ? puzzles : selectedPuzzles;
    const eligible = currentPagePuzzles.filter(p => {
      const owner = getChapterForPuzzle(p._id);
      return !owner || owner.id === activeChapterId;
    });
    const activeChapter = chapters.find(ch => ch.id === activeChapterId);
    if (!activeChapter || eligible.length === 0) return false;
    return eligible.every(p => activeChapter.puzzleIds.includes(p._id));
  };

  return (
    <div className={styles.container}>
      <Toaster position="top-center" />

      {/* --- Top Header --- */}
      <div className={styles.header}>
        <div>
          <h1>Edit Competition</h1>
          <p>Update competition parameters and manage puzzle chapters.</p>
        </div>
        <button className={styles.cancelBtn} onClick={() => navigate(-1)}>
          <FaTimesCircle /> Cancel Edit
        </button>
      </div>

      {loadingData ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Loading competition data...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.mainLayout}>

          {/* --- Section 1: Basic Details --- */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <FaTrophy className={styles.iconGold} />
              <h3>Basic Details</h3>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label>Competition Name</label>
                <input
                  type="text"
                  placeholder="e.g. Winter Blitz 2024"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Duration (mins)</label>
                <div className={styles.inputIconWrapper}>
                  <FaClock className={styles.inputIcon} />
                  <input
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Max Players (Optional)</label>
                <div className={styles.inputIconWrapper}>
                  <FaUsers className={styles.inputIcon} />
                  <input
                    type="number"
                    placeholder="Unlimited"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Access Code (Optional)</label>
                <div className={styles.inputIconWrapper}>
                  <FaLock className={styles.inputIcon} />
                  <input
                    type="text"
                    placeholder="e.g. 1234 (Leave empty for public)"
                    value={formData.accessCode || ''}
                    onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
                  />
                </div>
              </div>

              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label>Description</label>
                <textarea
                  rows="2"
                  placeholder="Rules and details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* --- Section 2: Chapters + Puzzle Management --- */}
          <div className={`${styles.card} ${styles.tableCard}`}>

            {/* Chapter Bar */}
            <div className={styles.chapterSection}>
              <div className={styles.chapterSectionHeader}>
                <div className={styles.chapterSectionLeft}>
                  <FaBookOpen className={styles.chapterSectionIcon} />
                  <span className={styles.chapterSectionTitle}>Chapters</span>
                  <span className={styles.chapterSectionHint}>
                    {chapters.length === 0
                      ? "Create chapters to organize your puzzles"
                      : `${chapters.length} chapter${chapters.length !== 1 ? 's' : ''} · ${allAssignedPuzzleIds.length} puzzle${allAssignedPuzzleIds.length !== 1 ? 's' : ''} assigned`}
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.addChapterBtn}
                  onClick={() => setShowChapterModal(true)}
                >
                  <FaPlus /> Add Chapter
                </button>
              </div>

              {/* Chapter Bubbles */}
              {chapters.length > 0 && (
                <div className={styles.chapterBubbleBar}>
                  {chapters.map((ch, idx) => {
                    const color = CHAPTER_COLORS[idx % CHAPTER_COLORS.length];
                    const isActive = activeChapterId === ch.id;
                    return (
                      <div
                        key={ch.id}
                        className={`${styles.chapterBubble} ${isActive ? styles.chapterBubbleActive : ''}`}
                        style={isActive ? { '--ch-color': color, borderColor: color } : { '--ch-color': color }}
                        onClick={() => setActiveChapterId(ch.id)}
                      >
                        <span
                          className={styles.chapterDotIndicator}
                          style={{ background: color }}
                        />
                        <span className={styles.chapterBubbleName}>{ch.name}</span>
                        <span
                          className={styles.chapterBubbleCount}
                          style={isActive ? { background: color } : {}}
                        >
                          {ch.puzzleIds.length}
                        </span>
                        <button
                          type="button"
                          className={styles.chapterDeleteBtn}
                          onClick={(e) => handleDeleteChapter(ch.id, e)}
                          title="Delete chapter"
                        >
                          <FaTimesCircle />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Instruction banner when no chapter selected */}
              {chapters.length > 0 && !activeChapterId && (
                <div className={styles.chapterInstruction}>
                  👆 Click a chapter bubble above to select it, then pick puzzles below
                </div>
              )}
            </div>

            {/* Toolbar */}
            <div className={styles.toolbar}>
              <div className={styles.toolbarLeft}>
                <div className={styles.searchBox}>
                  <FaSearch />
                  <input
                    type="text"
                    placeholder="Search puzzles..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                  />
                </div>

                <div className={styles.filters}>
                  <select
                    value={filters.difficulty}
                    onChange={(e) => handleFilterChange("difficulty", e.target.value)}
                  >
                    <option value="all">Difficulty: All</option>
                    {filterOptions.difficulties.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>

                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange("category", e.target.value)}
                  >
                    <option value="all">Category: All</option>
                    {filterOptions.categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>

                  <select
                    value={filters.level}
                    onChange={(e) => handleFilterChange("level", e.target.value)}
                  >
                    <option value="all">Level: All</option>
                    {filterOptions.levels?.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>

                  <select
                    value={filters.rating}
                    onChange={(e) => handleFilterChange("rating", e.target.value)}
                  >
                    <option value="all">Rating: All</option>
                    {filterOptions.ratings?.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className={styles.toolbarRight}>
                <div className={styles.viewToggle}>
                  <button
                    type="button"
                    className={viewMode === 'library' ? styles.activeView : ''}
                    onClick={() => setViewMode('library')}
                  >
                    Library
                  </button>
                  <button
                    type="button"
                    className={viewMode === 'selected' ? styles.activeView : ''}
                    onClick={() => setViewMode('selected')}
                  >
                    Assigned ({allAssignedPuzzleIds.length})
                  </button>
                </div>

                <button
                  type="button"
                  className={styles.createBtn}
                  onClick={() => navigate("/admin/puzzles/create?returnTo=/admin/competitions/create")}
                >
                  <FaPlus /> New Puzzle
                </button>
              </div>
            </div>

            {/* Active chapter indicator strip */}
            {activeChapterId && (() => {
              const ch = chapters.find(c => c.id === activeChapterId);
              const color = getChapterColor(activeChapterId);
              return (
                <div className={styles.activeChapterStrip} style={{ borderLeftColor: color }}>
                  <span className={styles.activeChapterDot} style={{ background: color }} />
                  <span>Adding puzzles to: <strong>{ch?.name}</strong></span>
                </div>
              );
            })()}

            {/* Data Table */}
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th width="50">
                      <button
                        type="button"
                        className={styles.selectAllBtn}
                        onClick={handleSelectAllPage}
                        title="Select all eligible puzzles on this page"
                        disabled={!activeChapterId}
                      >
                        {getSelectAllState() ? <FaCheckCircle /> : <div className={styles.emptyCheckbox} />}
                      </button>
                    </th>
                    <th>Puzzle Title / ID</th>
                    <th>Category</th>
                    <th>Difficulty</th>
                    <th>Type</th>
                    <th width="100">Chapter</th>
                    <th width="80">Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingPuzzles ? (
                    <tr>
                      <td colSpan="7" className={styles.loadingCell}>
                        <div className={styles.spinner} /> Loading library...
                      </td>
                    </tr>
                  ) : tableData.length === 0 ? (
                    <tr>
                      <td colSpan="7" className={styles.emptyCell}>
                        {viewMode === 'selected'
                          ? "No puzzles assigned to any chapter yet."
                          : "No puzzles found matching filters."}
                      </td>
                    </tr>
                  ) : (
                    tableData.map((puzzle) => {
                      const ownerChapter = getChapterForPuzzle(puzzle._id);
                      const isInActiveChapter = ownerChapter && ownerChapter.id === activeChapterId;
                      const isInOtherChapter = ownerChapter && ownerChapter.id !== activeChapterId;
                      const isSelected = !!ownerChapter;
                      const chapterColor = ownerChapter ? getChapterColor(ownerChapter.id) : null;

                      return (
                        <tr
                          key={puzzle._id}
                          className={`
                            ${isInActiveChapter ? styles.selectedRow : ''}
                            ${isInOtherChapter ? styles.disabledRow : ''}
                          `}
                          onClick={() => !isInOtherChapter && handlePuzzleToggle(puzzle)}
                          style={{ cursor: isInOtherChapter ? 'not-allowed' : 'pointer' }}
                        >
                          <td className={styles.checkCell}>
                            <div className={`${styles.checkbox} ${isInActiveChapter ? styles.checked : ''}`}
                              style={isInActiveChapter ? { borderColor: chapterColor, color: chapterColor } : {}}>
                              {isInActiveChapter && <FaCheckCircle />}
                            </div>
                          </td>
                          <td>
                            <div className={styles.puzzleTitle}>
                              {puzzle.title || "Untitled Puzzle"}
                            </div>
                            <div className={styles.puzzleId}>ID: {puzzle._id.slice(-6)}</div>
                          </td>
                          <td><span className={styles.tag}>{puzzle.category}</span></td>
                          <td>
                            <span className={`${styles.difficultyBadge} ${styles[puzzle.difficulty]}`}>
                              {puzzle.difficulty}
                            </span>
                          </td>
                          <td><span className={styles.typeText}>{puzzle.type}</span></td>
                          <td>
                            {ownerChapter ? (
                              <span
                                className={styles.chapterPill}
                                style={{ background: chapterColor + '20', color: chapterColor, borderColor: chapterColor + '60' }}
                              >
                                {ownerChapter.name}
                              </span>
                            ) : (
                              <span className={styles.unassignedText}>—</span>
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              className={styles.previewIconBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewPuzzle(puzzle);
                              }}
                            >
                              <FaEye />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {viewMode === 'library' && !loadingPuzzles && (
              <div className={styles.pagination}>
                <span>Showing {tableData.length} of {pagination.totalRecords}</span>
                <div className={styles.pageControls}>
                  <button
                    type="button"
                    disabled={pagination.current === 1}
                    onClick={() => setPagination(p => ({ ...p, current: p.current - 1 }))}
                  >
                    <FaChevronLeft />
                  </button>
                  {(() => {
                    const totalPages = Math.max(1, Math.ceil(pagination.totalRecords / pagination.limit));
                    const pages = [];
                    if (totalPages <= 5) {
                      for (let i = 1; i <= totalPages; i++) pages.push(i);
                    } else {
                      if (pagination.current <= 3) {
                        pages.push(1, 2, 3, 4, '...', totalPages);
                      } else if (pagination.current >= totalPages - 2) {
                        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                      } else {
                        pages.push(1, '...', pagination.current - 1, pagination.current, pagination.current + 1, '...', totalPages);
                      }
                    }

                    return pages.map((page, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`${styles.pageNumberBtn} ${page === pagination.current ? styles.activePage : ''} ${page === '...' ? styles.ellipsis : ''}`}
                        disabled={page === '...'}
                        onClick={() => page !== '...' && setPagination(p => ({ ...p, current: page }))}
                      >
                        {page}
                      </button>
                    ));
                  })()}
                  <button
                    type="button"
                    disabled={pagination.current >= Math.ceil(pagination.totalRecords / pagination.limit)}
                    onClick={() => setPagination(p => ({ ...p, current: p.current + 1 }))}
                  >
                    <FaChevronRight />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* --- Footer --- */}
          <div className={styles.stickyFooter}>
            <div className={styles.footerInfo}>
              <span className={styles.selectionCount}>
                {allAssignedPuzzleIds.length} Puzzles · {chapters.length} Chapters
              </span>
              <small>Organize puzzles into chapters for a structured competition</small>
            </div>
            <div className={styles.footerActions}>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isSubmitting || allAssignedPuzzleIds.length === 0}
              >
                <FaSave /> {isSubmitting ? "Saving Updates..." : "Save Competition Updates"}
              </button>
            </div>
          </div>

        </form>
      )}

      {/* --- Chapter Name Modal --- */}
      {showChapterModal && (
        <div className={styles.modalOverlay} onClick={() => setShowChapterModal(false)}>
          <div className={styles.chapterModalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.chapterModalHeader}>
              <FaBookOpen className={styles.chapterModalIcon} />
              <h4>New Chapter</h4>
            </div>
            <p className={styles.chapterModalDesc}>
              Give this chapter a descriptive name so students can navigate your puzzles easily.
            </p>
            <input
              ref={chapterInputRef}
              type="text"
              className={styles.chapterNameInput}
              placeholder="e.g. Opening Tactics, Endgame Practice..."
              value={newChapterName}
              onChange={e => setNewChapterName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddChapter()}
              maxLength={40}
            />
            <div className={styles.chapterModalActions}>
              <button
                type="button"
                className={styles.chapterModalCancel}
                onClick={() => { setShowChapterModal(false); setNewChapterName(""); }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.chapterModalCreate}
                onClick={handleAddChapter}
                disabled={!newChapterName.trim()}
              >
                <FaPlus /> Create Chapter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Preview Modal --- */}
      {previewPuzzle && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h4>{previewPuzzle.title}</h4>
              <button onClick={() => setPreviewPuzzle(null)}><FaTimesCircle /></button>
            </div>
            <div className={styles.boardContainer}>
              <div style={{ pointerEvents: 'none' }}>
                <ChessBoard
                  fen={previewPuzzle.fen}
                  puzzleType={previewPuzzle.type}
                  interactive={false}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <span className={`${styles.difficultyBadge} ${styles[previewPuzzle.difficulty]}`}>
                {previewPuzzle.difficulty}
              </span>
              <button
                className={styles.modalSelectBtn}
                onClick={() => {
                  handlePuzzleToggle(previewPuzzle);
                  setPreviewPuzzle(null);
                }}
                disabled={(() => {
                  const owner = getChapterForPuzzle(previewPuzzle._id);
                  return owner && owner.id !== activeChapterId;
                })()}
              >
                {getChapterForPuzzle(previewPuzzle._id)?.id === activeChapterId ? "Remove from Chapter" : "Add to Chapter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditCompetition;