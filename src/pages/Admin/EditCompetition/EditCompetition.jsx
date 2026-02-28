import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaTrophy,
  FaClock,
  FaUsers,
  FaSearch,
  FaPlus,
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaEdit,
  FaLock
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import styles from "./EditCompetition.module.css";
import ChessBoard from "../../../components/ChessBoard/ChessBoard";
import { competitionAPI } from "../../../services/api";

function EditCompetition() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Loading States
  const [loadingData, setLoadingData] = useState(true);
  const [loadingPuzzles, setLoadingPuzzles] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data States
  const [formData, setFormData] = useState({
    name: "",
    startTime: "",
    duration: "",
    maxParticipants: "",
    description: "",
  });

  const [puzzles, setPuzzles] = useState([]);
  const [selectedPuzzles, setSelectedPuzzles] = useState([]);
  const [previewPuzzle, setPreviewPuzzle] = useState(null);

  // View Mode: 'library' (server results) or 'selected' (local selection)
  const [viewMode, setViewMode] = useState("selected"); // Default to selected to show current config

  // Filters & Pagination
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    difficulty: "all",
    type: "all",
  });

  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    limit: 20,
    totalRecords: 0,
  });

  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    difficulties: [],
  });

  // 1. Load Competition Data
  useEffect(() => {
    loadCompetition();
  }, [id]);

  // 2. Fetch Puzzles (Only when in library mode or filters change)
  useEffect(() => {
    if (viewMode === 'library') {
      fetchPuzzles();
    }
  }, [filters, pagination.current, viewMode]);

  const loadCompetition = async () => {
    try {
      setLoadingData(true);
      const response = await competitionAPI.getById(id);

      if (response.success) {
        const comp = response.data;

        // Format date for datetime-local input
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

        setSelectedPuzzles(comp.puzzles || []);
      }
    } catch (error) {
      console.error("Failed to load:", error);
      toast.error("Could not load competition");
      navigate("/admin/competitions");
    } finally {
      setLoadingData(false);
    }
  };

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
        setPagination(prev => ({ ...prev, ...response.pagination }));
        if (response.filters) setFilterOptions(response.filters);
      }
    } catch (error) {
      toast.error("Failed to load puzzle library");
    } finally {
      setLoadingPuzzles(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handlePuzzleToggle = (puzzle) => {
    setSelectedPuzzles((prev) => {
      const isSelected = prev.some((p) => p._id === puzzle._id);
      if (isSelected) {
        return prev.filter((p) => p._id !== puzzle._id);
      } else {
        return [...prev, puzzle];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Enter competition name");
    if (selectedPuzzles.length === 0) return toast.error("Select at least one puzzle");

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        startTime: new Date(formData.startTime).toISOString(),
        duration: parseInt(formData.duration),
        maxParticipants: parseInt(formData.maxParticipants) || 0,
        puzzles: selectedPuzzles.map((p) => p._id),
      };

      await competitionAPI.updateCompetition(id, payload);
      toast.success("Competition updated successfully!");
      setTimeout(() => navigate("/admin/competitions"), 1500);
    } catch (error) {
      toast.error(error.message || "Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading Competition Details...</p>
      </div>
    );
  }

  // Determine which data to show in table
  const tableData = viewMode === 'selected' ? selectedPuzzles : puzzles;

  return (
    <div className={styles.container}>
      <Toaster position="top-center" />

      {/* --- Header --- */}
      <div className={styles.header}>
        <div>
          <h1>Edit Competition</h1>
          <p>Update details and manage puzzle selection</p>
        </div>
        <button className={styles.cancelBtn} onClick={() => navigate("/admin/competitions")}>
          <FaTimesCircle /> Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.mainLayout}>

        {/* --- Section 1: Details Form --- */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <FaEdit className={styles.iconPrimary} />
            <h3>Configuration</h3>
          </div>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label>Competition Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Start Time</label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Duration (mins)</label>
              <div className={styles.iconInput}>
                <FaClock />
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
              <label>Max Players</label>
              <div className={styles.iconInput}>
                <FaUsers />
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
              <div className={styles.iconInput}>
                <FaLock />
                <input
                  type="text"
                  placeholder="Leave empty for public"
                  value={formData.accessCode || ''}
                  onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
                />
              </div>
            </div>

            <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
              <label>Description</label>
              <textarea
                rows="2"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* --- Section 2: Puzzle Table --- */}
        <div className={`${styles.card} ${styles.tableCard}`}>

          {/* Toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              <div className={styles.viewToggle}>
                <button
                  type="button"
                  className={viewMode === 'library' ? styles.activeView : ''}
                  onClick={() => setViewMode('library')}
                >
                  Browse Library
                </button>
                <button
                  type="button"
                  className={viewMode === 'selected' ? styles.activeView : ''}
                  onClick={() => setViewMode('selected')}
                >
                  Current Selection ({selectedPuzzles.length})
                </button>
              </div>

              {viewMode === 'library' && (
                <>
                  <div className={styles.searchBox}>
                    <FaSearch />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange("search", e.target.value)}
                    />
                  </div>
                  <select
                    className={styles.filterSelect}
                    value={filters.difficulty}
                    onChange={(e) => handleFilterChange("difficulty", e.target.value)}
                  >
                    <option value="all">Diff: All</option>
                    {filterOptions.difficulties.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </>
              )}
            </div>

            <button
              type="button"
              className={styles.createBtn}
              onClick={() => navigate(`/admin/puzzles/create?returnTo=/admin/competitions/edit/${id}`)}
            >
              <FaPlus /> New Puzzle
            </button>
          </div>

          {/* Table */}
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th width="50">Status</th>
                  <th>Puzzle</th>
                  <th>Category</th>
                  <th>Difficulty</th>
                  <th>Type</th>
                  <th width="60">View</th>
                </tr>
              </thead>
              <tbody>
                {loadingPuzzles ? (
                  <tr><td colSpan="6" className={styles.centerMsg}><div className={styles.spinnerSm}></div> Loading...</td></tr>
                ) : tableData.length === 0 ? (
                  <tr><td colSpan="6" className={styles.centerMsg}>No puzzles found in this view.</td></tr>
                ) : (
                  tableData.map((puzzle) => {
                    const isSelected = selectedPuzzles.some(p => p._id === puzzle._id);
                    return (
                      <tr
                        key={puzzle._id}
                        className={isSelected ? styles.selectedRow : ''}
                        onClick={() => handlePuzzleToggle(puzzle)}
                      >
                        <td className={styles.checkCell}>
                          <div className={`${styles.checkbox} ${isSelected ? styles.checked : ''}`}>
                            {isSelected && <FaCheckCircle />}
                          </div>
                        </td>
                        <td>
                          <div className={styles.pTitle}>{puzzle.title || "Untitled"}</div>
                          <div className={styles.pId}>{puzzle._id.slice(-6)}</div>
                        </td>
                        <td><span className={styles.tag}>{puzzle.category}</span></td>
                        <td>
                          <span className={`${styles.badge} ${styles[puzzle.difficulty]}`}>
                            {puzzle.difficulty}
                          </span>
                        </td>
                        <td><span className={styles.typeText}>{puzzle.type}</span></td>
                        <td>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={(e) => { e.stopPropagation(); setPreviewPuzzle(puzzle); }}
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

          {/* Pagination (Only for Library View) */}
          {viewMode === 'library' && !loadingPuzzles && (
            <div className={styles.pagination}>
              <span>Page {pagination.current} of {Math.ceil(pagination.totalRecords / pagination.limit)}</span>
              <div className={styles.pageActions}>
                <button
                  type="button"
                  disabled={pagination.current === 1}
                  onClick={() => setPagination(p => ({ ...p, current: p.current - 1 }))}
                >
                  <FaChevronLeft />
                </button>
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

        {/* --- Sticky Footer --- */}
        <div className={styles.stickyFooter}>
          <div className={styles.footerInfo}>
            <strong>{selectedPuzzles.length} Puzzles Selected</strong>
            <span>Review your selection before saving</span>
          </div>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isSubmitting || selectedPuzzles.length === 0}
          >
            {isSubmitting ? <FaSpinner className={styles.spin} /> : "Update Competition"}
          </button>
        </div>

      </form>

      {/* Preview Modal */}
      {previewPuzzle && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHead}>
              <h4>{previewPuzzle.title}</h4>
              <button onClick={() => setPreviewPuzzle(null)}><FaTimesCircle /></button>
            </div>
            <div className={styles.boardWrap}>
              <div style={{ pointerEvents: 'none' }}>
                <ChessBoard fen={previewPuzzle.fen} puzzleType={previewPuzzle.type} interactive={false} />
              </div>
            </div>
            <div className={styles.modalFoot}>
              <span className={`${styles.badge} ${styles[previewPuzzle.difficulty]}`}>
                {previewPuzzle.difficulty}
              </span>
              <button
                className={styles.toggleBtn}
                onClick={() => { handlePuzzleToggle(previewPuzzle); setPreviewPuzzle(null); }}
              >
                {selectedPuzzles.some(p => p._id === previewPuzzle._id) ? "Remove" : "Select"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditCompetition;