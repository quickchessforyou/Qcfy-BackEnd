import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFolder, FaPlus, FaEdit, FaTrash, FaTimes, FaSave, FaSearch, FaChess, FaTrophy, FaGraduationCap, FaChalkboardTeacher, FaTags, FaInfoCircle, FaEnvelope } from 'react-icons/fa';
import * as FaIcons from 'react-icons/fa';
import { PageHeader, Button } from '../../../components/Admin';
import { categoryAPI } from '../../../services/api';
import toast, { Toaster } from 'react-hot-toast';
import styles from './CategoryList.module.css';

function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    icon: 'FaChess'
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [searchTerm, categories]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryAPI.getAll(false);
      setCategories(data);
      setFilteredCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category = null, e = null) => {
    if (e) e.stopPropagation();
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        title: category.title,
        description: category.description,
        icon: category.icon || 'FaChess'
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        title: '',
        description: '',
        icon: 'FaChess'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      title: '',
      description: '',
      icon: 'FaChess'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingCategory) {
        await categoryAPI.updateCategory(editingCategory._id, formData);
        toast.success('Category updated successfully!');
      } else {
        await categoryAPI.createCategory(formData);
        toast.success('Category created successfully!');
      }

      handleCloseModal();
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(error.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id, name, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await categoryAPI.deleteCategory(id);
      toast.success('Category deleted successfully!');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(error.message || 'Failed to delete category');
    }
  };

  const handleCardClick = (categoryName) => {
    navigate(`/admin/puzzles?category=${categoryName}`);
  };

  // Helper to render dynamic icon
  const renderIcon = (iconName) => {
    const IconComponent = FaIcons[iconName] || FaChess;
    return <IconComponent />;
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading categories...</p>
      </div>
    );
  }

  return (
    <div className={styles.categoryList}>
      <Toaster position="top-center" />

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <FaFolder className={styles.headerIcon} />
          <div>
            <h1 className={styles.title}>Category Management</h1>
            <p className={styles.subtitle}>Manage categories and view puzzles</p>
          </div>
        </div>
        <Button icon={FaPlus} onClick={() => handleOpenModal()}>
          Create Category
        </Button>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {categories.length === 0 && !loading ? (
        <div className={styles.emptyState}>
          <FaFolder className={styles.emptyIcon} />
          <h3>No Categories Yet</h3>
          <p>Create your first category to start organizing puzzles</p>
          <Button icon={FaPlus} onClick={() => handleOpenModal()}>
            Create Category
          </Button>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredCategories.map((category) => (
            <div
              key={category._id}
              className={styles.card}
              onClick={() => handleCardClick(category.name)}
            >
              <div className={styles.cardHeader}>
                <div className={styles.iconWrapper}>
                  {renderIcon(category.icon)}
                </div>
                <div className={styles.cardActions}>
                  <button
                    className={styles.iconBtn}
                    onClick={(e) => handleOpenModal(category, e)}
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  <button
                    className={`${styles.iconBtn} ${styles.deleteBtn}`}
                    onClick={(e) => handleDelete(category._id, category.name, e)}
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{category.name}</h3>
              </div>

              <div className={styles.cardFooter}>
                <span className={styles.puzzleCount}>
                  <FaChess /> {category.totalPuzzles || 0} Puzzles
                </span>
                <span className={styles.arrow}>→</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredCategories.length === 0 && searchTerm && (
        <div className={styles.noResults}>
          <p>No categories found matching "{searchTerm}"</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{editingCategory ? 'Edit Category' : 'Create New Category'}</h2>
              <button className={styles.closeBtn} onClick={handleCloseModal}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Category Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value, title: e.target.value })}
                  placeholder="e.g., Tactics"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Icon (React Icons Name)</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="e.g., FaTrophy"
                />
                <small>Enter a valid React Icon name (e.g. FaChess, FaBolt)</small>
              </div>

              <div className={styles.modalActions}>
                <Button
                  type="button"
                  variant="secondary"
                  icon={FaTimes}
                  onClick={handleCloseModal}
                >
                  Cancel
                </Button>
                <Button type="submit" icon={FaSave}>
                  {editingCategory ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryList;
