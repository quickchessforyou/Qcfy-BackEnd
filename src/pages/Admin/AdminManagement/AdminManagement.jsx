import { FaUserShield, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import styles from './AdminManagement.module.css';

function AdminManagement() {
  const admins = [
    { id: 1, name: 'John Admin', email: 'john@admin.com', role: 'Super Admin', status: 'Active', joined: '2024-01-10' },
    { id: 2, name: 'Sarah Manager', email: 'sarah@admin.com', role: 'Manager', status: 'Active', joined: '2024-02-15' },
    { id: 3, name: 'Mike Moderator', email: 'mike@admin.com', role: 'Moderator', status: 'Active', joined: '2024-03-20' },
  ];

  return (
    <div className={styles.adminManagement}>
      <div className={styles.header}>
        <div>
          <h2><FaUserShield /> Admin Management</h2>
          <p>Manage admin users and permissions</p>
        </div>
        <button className={styles.addBtn}>
          <FaPlus /> Add Admin
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map(admin => (
              <tr key={admin.id}>
                <td>
                  <div className={styles.adminInfo}>
                    <div className={styles.avatar}><FaUserShield /></div>
                    <span>{admin.name}</span>
                  </div>
                </td>
                <td>{admin.email}</td>
                <td>
                  <span className={styles.roleBadge}>{admin.role}</span>
                </td>
                <td>
                  <span className={`${styles.badge} ${styles.active}`}>
                    {admin.status}
                  </span>
                </td>
                <td>{admin.joined}</td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.actionBtn} title="Edit">
                      <FaEdit />
                    </button>
                    <button className={`${styles.actionBtn} ${styles.delete}`} title="Delete">
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminManagement;
