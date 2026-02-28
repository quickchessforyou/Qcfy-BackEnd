import { useEffect, useState, useRef } from 'react';
import { FaEye, FaEdit, FaTrash, FaChess, FaFilter, FaLayerGroup, FaUpload, FaDownload } from 'react-icons/fa';
import { useSearchParams } from 'react-router-dom';
import { PageHeader, SearchBar, FilterSelect, Button, DataTable, Badge, IconButton } from '../../../components/Admin';
import { adminAPI, categoryAPI } from '../../../services/api';
import ChessBoard from '../../../components/ChessBoard/ChessBoard';
import styles from './PuzzleList.module.css';

function PuzzleList() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState(initialCategory);
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [showPreview, setShowPreview] = useState(false);
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [puzzles, setPuzzles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryOptions, setCategoryOptions] = useState([{ value: 'all', label: 'All Categories' }]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const handlePreview = (puzzle) => {
    setSelectedPuzzle(puzzle);
    setShowPreview(true);
  };

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [deleteSelectedConfirm, setDeleteSelectedConfirm] = useState(false);
  const [selectedPuzzles, setSelectedPuzzles] = useState([]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // Select all in current view
      setSelectedPuzzles(paginatedPuzzles.map(p => p._id));
    } else {
      setSelectedPuzzles([]);
    }
  };

  const handleSelectPuzzle = (id) => {
    setSelectedPuzzles(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleDelete = (puzzle) => {
    setDeleteConfirm(puzzle);
  };



  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target.result);

        if (!Array.isArray(json)) {
          alert('Invalid JSON: Root must be an array of puzzles.');
          return;
        }

        if (confirm(`Ready to import ${json.length} puzzles?`)) {
          setIsLoading(true);
          const response = await adminAPI.bulkCreatePuzzles(json);
          setIsLoading(false);

          alert(response.message || 'Import successful!');
          if (response.results?.failed > 0) {
            console.error('Import errors:', response.results.errors);
            alert(`Import finished with ${response.results.failed} errors. Check console for details.`);
          }
          // Refresh list
          window.location.reload();
        }
      } catch (err) {
        console.error('Import error:', err);
        alert('Failed to parse JSON file: ' + err.message);
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  const handleExport = async () => {
    try {
      setIsLoading(true);
      const data = await adminAPI.exportPuzzles();
      if (!data || data.length === 0) {
        alert("No puzzles to export.");
        setIsLoading(false);
        return;
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `puzzles_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsLoading(false);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export puzzles.");
      setIsLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm?._id) return;
    try {
      await adminAPI.deletePuzzle(deleteConfirm._id);
      setPuzzles((prev) => prev.filter((p) => p._id !== deleteConfirm._id));
      alert(`Puzzle "${deleteConfirm.title}" deleted successfully!`);
    } catch (err) {
      console.error('Failed to delete puzzle:', err);
      alert(err.message || 'Failed to delete puzzle');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const confirmDeleteAll = async () => {
    try {
      setIsLoading(true);
      const result = await adminAPI.deleteAllPuzzles();
      setPuzzles([]);
      setCurrentPage(1);
      alert(result.message || 'All puzzles deleted successfully!');
    } catch (err) {
      console.error('Failed to delete all puzzles:', err);
      alert(err.message || 'Failed to delete all puzzles');
    } finally {
      setDeleteAllConfirm(false);
      setIsLoading(false);
    }
  };

  const confirmDeleteSelected = async () => {
    try {
      setIsLoading(true);
      const result = await adminAPI.deleteMultiplePuzzles(selectedPuzzles);
      setPuzzles(prev => prev.filter(p => !selectedPuzzles.includes(p._id)));
      setSelectedPuzzles([]);
      alert(result.message || 'Selected puzzles deleted successfully!');
    } catch (err) {
      console.error('Failed to delete selected puzzles:', err);
      alert(err.message || 'Failed to delete selected puzzles');
    } finally {
      setDeleteSelectedConfirm(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchPuzzlesAndCategories = async () => {
      setIsLoading(true);
      setError('');
      try {
        const [puzzlesData, categoriesData] = await Promise.all([
          adminAPI.getPuzzles(),
          categoryAPI.getAll(false).catch(() => []) // Fallback to empty if categories fail
        ]);

        if (!Array.isArray(puzzlesData)) {
          throw new Error('Unexpected response format from server');
        }

        if (!isMounted) return;

        // Sort by createdAt (oldest to newest) to maintain order consistency
        const sortedData = [...puzzlesData].sort((a, b) => {
          const dateA = new Date(a.createdAt || a.updatedAt || 0);
          const dateB = new Date(b.createdAt || b.updatedAt || 0);
          return dateA - dateB;
        });

        const normalized = sortedData.map((puzzle, index) => ({
          ...puzzle,
          // Generate 6-digit ID based on index
          id: (index + 1).toString().padStart(6, '0'),
          title: puzzle.title || `Puzzle #${index + 1}`,
          difficulty: puzzle.difficulty || 'Unknown',
          category: puzzle.category || 'General',
          createdAt: puzzle.createdAt || puzzle.updatedAt || '',
        }));

        setPuzzles(normalized);

        // Process categories for the dropdown
        if (categoriesData && Array.isArray(categoriesData.data)) {
          const catOptions = categoriesData.data.map(cat => ({
            value: cat.name.toLowerCase(),
            label: cat.name
          }));
          setCategoryOptions([{ value: 'all', label: 'All Categories' }, ...catOptions]);
        } else if (Array.isArray(categoriesData)) {
          const catOptions = categoriesData.map(cat => ({
            value: cat.name.toLowerCase(),
            label: cat.name
          }));
          setCategoryOptions([{ value: 'all', label: 'All Categories' }, ...catOptions]);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        if (isMounted) {
          setError(err.message || 'Unable to load puzzles');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchPuzzlesAndCategories();

    return () => {
      isMounted = false;
    };
  }, []);



  const difficultyOptions = [
    { value: 'all', label: 'All Difficulties' },
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
    { value: 'expert', label: 'Expert' },
  ];

  // Filter puzzles based on search term, category, and difficulty
  const filteredPuzzles = puzzles.filter((puzzle) => {
    // Search filter (by title)
    const matchesSearch = puzzle.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    // Category filter
    const matchesCategory =
      filterCategory === 'all' ||
      (puzzle.category || '').toLowerCase() === filterCategory.toLowerCase();

    // Difficulty filter
    const matchesDifficulty =
      filterDifficulty === 'all' ||
      (puzzle.difficulty || '').toLowerCase() === filterDifficulty.toLowerCase();

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterDifficulty]);

  // Get current page items
  const paginatedPuzzles = filteredPuzzles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const columns = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={paginatedPuzzles.length > 0 && selectedPuzzles.length === paginatedPuzzles.length}
          onChange={handleSelectAll}
        />
      ),
      width: '40px',
      render: (_, row) => (
        <input
          type="checkbox"
          checked={selectedPuzzles.includes(row._id)}
          onChange={() => handleSelectPuzzle(row._id)}
        />
      )
    },
    { key: 'id', label: 'ID', width: '80px', render: (id) => `#${id}` },
    { key: 'title', label: 'Title' },
    {
      key: 'difficulty',
      label: 'Difficulty',
      render: (difficulty) => {
        const normalized = (difficulty || '').toString();
        const label =
          normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
        const variantMap = {
          easy: 'success',
          Easy: 'success',
          medium: 'warning',
          Medium: 'warning',
          hard: 'danger',
          Hard: 'danger',
          expert: 'info',
          Expert: 'info',
        };
        const variant = variantMap[normalized] || 'secondary';
        return <Badge variant={variant}>{label || 'Unknown'}</Badge>;
      },
    },
    { key: 'category', label: 'Category' },
    {
      key: 'createdAt',
      label: 'Created At',
      render: (createdAt) =>
        createdAt ? new Date(createdAt).toLocaleString() : '—',
    },
  ];

  return (
    <div className={styles.puzzleList}>
      <PageHeader
        icon={FaChess}
        title="Puzzle Management"
        subtitle="Manage all chess puzzles"
        action={
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <Button
              variant="secondary"
              icon={FaUpload}
              onClick={() => fileInputRef.current.click()}
            >
              Import JSON
            </Button>
            <Button
              variant="secondary"
              icon={FaDownload}
              onClick={handleExport}
            >
              Export JSON
            </Button>
            <Button to="/admin/puzzles/create" icon={FaChess}>
              Create Puzzle
            </Button>
            {selectedPuzzles.length > 0 && (
              <Button
                variant="danger"
                icon={FaTrash}
                onClick={() => setDeleteSelectedConfirm(true)}
              >
                Delete Selected
              </Button>
            )}
            <Button
              variant="danger"
              icon={FaTrash}
              onClick={() => setDeleteAllConfirm(true)}
              disabled={puzzles.length === 0}
            >
              Delete All
            </Button>
          </div>
        }
      />

      <div className={styles.filters}>
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search puzzles by title..."
        />
        <FilterSelect
          value={filterCategory}
          onChange={setFilterCategory}
          options={categoryOptions}
          icon={FaLayerGroup}
          label="Category"
        />
        <FilterSelect
          value={filterDifficulty}
          onChange={setFilterDifficulty}
          options={difficultyOptions}
          icon={FaFilter}
          label="Difficulty"
        />
      </div>

      {isLoading && <p>Loading puzzles...</p>}
      {error && <p className={styles.errorText}>{error}</p>}

      <DataTable
        columns={columns}
        data={paginatedPuzzles}
        actions={(puzzle) => (
          <>
            <IconButton
              icon={FaEye}
              onClick={() => handlePreview(puzzle)}
              title="Preview"
              variant="primary"
            />
            <IconButton
              icon={FaEdit}
              to={`/admin/puzzles/edit/${puzzle._id}`}
              title="Edit"
              variant="primary"
            />
            <IconButton
              icon={FaTrash}
              onClick={() => handleDelete(puzzle)}
              title="Delete"
              variant="danger"
            />
          </>
        )}
        emptyMessage="No puzzles found"
      />

      {/* Pagination Controls */}
      {filteredPuzzles.length > ITEMS_PER_PAGE && (
        <>
          <div className={styles.paginationInfo}>
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredPuzzles.length)} of{' '}
            {filteredPuzzles.length} entries
          </div>
          <div className={styles.paginationContainer}>
            <button
              className={styles.pageBtn}
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              title="First Page"
            >
              «
            </button>
            <button
              className={styles.pageBtn}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              title="Previous Page"
            >
              ‹
            </button>

            {(() => {
              const totalPages = Math.ceil(filteredPuzzles.length / ITEMS_PER_PAGE);
              const visiblePages = [];
              const addPage = (i) => visiblePages.push(
                <button
                  key={i}
                  className={`${styles.pageBtn} ${currentPage === i ? styles.activePage : ''}`}
                  onClick={() => setCurrentPage(i)}
                >
                  {i}
                </button>
              );
              const addEllipsis = (key) => visiblePages.push(<span key={key} style={{ padding: '0 4px', color: '#888' }}>...</span>);

              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) addPage(i);
              } else {
                addPage(1);
                if (currentPage > 3) addEllipsis('e1');

                const start = Math.max(2, currentPage - 1);
                const end = Math.min(totalPages - 1, currentPage + 1);

                for (let i = start; i <= end; i++) addPage(i);

                if (currentPage < totalPages - 2) addEllipsis('e2');
                addPage(totalPages);
              }
              return visiblePages;
            })()}

            <button
              className={styles.pageBtn}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(filteredPuzzles.length / ITEMS_PER_PAGE)))}
              disabled={currentPage === Math.ceil(filteredPuzzles.length / ITEMS_PER_PAGE)}
              title="Next Page"
            >
              ›
            </button>
            <button
              className={styles.pageBtn}
              onClick={() => setCurrentPage(Math.ceil(filteredPuzzles.length / ITEMS_PER_PAGE))}
              disabled={currentPage === Math.ceil(filteredPuzzles.length / ITEMS_PER_PAGE)}
              title="Last Page"
            >
              »
            </button>
          </div>
        </>
      )}

      {showPreview && selectedPuzzle && (
        <div className={styles.modal} onClick={() => setShowPreview(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{selectedPuzzle.title}</h3>
              <button onClick={() => setShowPreview(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.chessboardPreview}>
                <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
                  <ChessBoard
                    fen={selectedPuzzle.fen}
                    interactive={false}
                    puzzleType={selectedPuzzle.puzzleType || 'normal'}
                    kidsConfig={selectedPuzzle.kidsConfig}
                  />
                </div>
              </div>
              <div className={styles.puzzleDetails}>
                <p><strong>Difficulty:</strong> {selectedPuzzle.difficulty}</p>
                <p><strong>Category:</strong> {selectedPuzzle.category}</p>
                <p><strong>Created:</strong> {selectedPuzzle.createdAt ? new Date(selectedPuzzle.createdAt).toLocaleString() : '—'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className={styles.modal} onClick={() => setDeleteConfirm(null)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmHeader}>
              <FaTrash className={styles.dangerIcon} />
              <h3>Delete Puzzle</h3>
            </div>
            <div className={styles.confirmBody}>
              <p>Are you sure you want to delete <strong>"{deleteConfirm.title}"</strong>?</p>
              <p className={styles.warningText}>This action cannot be undone.</p>
            </div>
            <div className={styles.confirmActions}>
              <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button variant="danger" icon={FaTrash} onClick={confirmDelete}>
                Delete Puzzle
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteAllConfirm && (
        <div className={styles.modal} onClick={() => setDeleteAllConfirm(false)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmHeader}>
              <FaTrash className={styles.dangerIcon} />
              <h3>Delete All Puzzles</h3>
            </div>
            <div className={styles.confirmBody}>
              <p>Are you sure you want to delete <strong>ALL {puzzles.length} puzzles</strong>?</p>
              <p className={styles.warningText}>This action cannot be undone. All puzzle data will be permanently removed.</p>
            </div>
            <div className={styles.confirmActions}>
              <Button variant="secondary" onClick={() => setDeleteAllConfirm(false)}>
                Cancel
              </Button>
              <Button variant="danger" icon={FaTrash} onClick={confirmDeleteAll}>
                Delete All Puzzles
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteSelectedConfirm && (
        <div className={styles.modal} onClick={() => setDeleteSelectedConfirm(false)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmHeader}>
              <FaTrash className={styles.dangerIcon} />
              <h3>Delete Selected Puzzles</h3>
            </div>
            <div className={styles.confirmBody}>
              <p>Are you sure you want to delete <strong>{selectedPuzzles.length}</strong> selected puzzles?</p>
              <p className={styles.warningText}>This action cannot be undone.</p>
            </div>
            <div className={styles.confirmActions}>
              <Button variant="secondary" onClick={() => setDeleteSelectedConfirm(false)}>
                Cancel
              </Button>
              <Button variant="danger" icon={FaTrash} onClick={confirmDeleteSelected}>
                Delete Selected
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PuzzleList;
