import { useState, useEffect } from 'react';
import { FaUserGraduate, FaEye, FaTrash, FaUser, FaFilter } from 'react-icons/fa';
import { PageHeader, SearchBar, FilterSelect, DataTable, Badge, IconButton } from '../../../components/Admin';
import { adminAPI } from '../../../services/api';
import styles from './StudentList.module.css';

function StudentList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fetch students from API
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminAPI.getAllUsers();
      if (response.success && Array.isArray(response.data)) {
        setStudents(response.data);
      } else {
        setError('Failed to load students');
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    try {
      const response = await adminAPI.deleteUser(studentId);
      if (response.success) {
        // Remove student from list
        setStudents(students.filter(s => s._id !== studentId));
        setDeleteConfirm(null);
        // Show success message (you can add a toast notification here)
        alert('Student deleted successfully');
      } else {
        alert('Failed to delete student');
      }
    } catch (err) {
      console.error('Error deleting student:', err);
      alert(err.message || 'Failed to delete student');
    }
  };

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  // Filter students based on search and status
  const filteredStudents = students.filter(student => {
    const matchesSearch =
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase());

    // For now, all students are active (you can add status logic later)
    const matchesStatus = filterStatus === 'all' || true;

    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (name, student) => (
        <div className={styles.studentInfo}>
          <div className={styles.avatar}>
            {student.avatar ? (
              <img src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:4000'}/${student.avatar}`} alt={name} />
            ) : (
              <FaUser />
            )}
          </div>
          <span>{name}</span>
        </div>
      )
    },
    { key: 'email', label: 'Email' },
    {
      key: 'username',
      label: 'Username',
      render: (username) => username || 'N/A'
    },
    {
      key: 'statistics',
      label: 'Puzzles Solved',
      render: (stats) => <strong>{stats?.puzzlesSolved || 0}</strong>
    },
    {
      key: 'statistics',
      label: 'Competitions',
      render: (stats) => <strong>{stats?.competitionsParticipated || 0}</strong>
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: (date) => new Date(date).toLocaleDateString()
    },
  ];

  if (loading) {
    return (
      <div className={styles.studentList}>
        <PageHeader
          icon={FaUserGraduate}
          title="Student Management"
          subtitle="Manage all registered students"
        />
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading students...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.studentList}>
        <PageHeader
          icon={FaUserGraduate}
          title="Student Management"
          subtitle="Manage all registered students"
        />
        <div className={styles.errorState}>
          <p>{error}</p>
          <button onClick={fetchStudents} className={styles.retryBtn}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.studentList}>
        <PageHeader
          icon={FaUserGraduate}
          title="Student Management"
          subtitle="Manage all registered students"
        />

        <div className={styles.filters}>
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search students by name or email..."
          />
          <FilterSelect
            value={filterStatus}
            onChange={setFilterStatus}
            options={statusOptions}
            icon={FaFilter}
            label="Status"
          />
        </div>

        <DataTable
          columns={columns}
          data={filteredStudents}
          actions={(student) => (
            <>
              <IconButton
                icon={FaEye}
                to={`/admin/students/${student._id}`}
                title="View Details"
                variant="primary"
              />
              <IconButton
                icon={FaTrash}
                onClick={() => setDeleteConfirm(student)}
                title="Delete Student"
                variant="danger"
              />
            </>
          )}
          emptyMessage="No students found"
        />
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Confirm Delete</h3>
            <p>
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
              This action cannot be undone.
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className={styles.deleteBtn}
                onClick={() => handleDeleteStudent(deleteConfirm._id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default StudentList;
