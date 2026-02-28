import { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
  FaChartLine, FaPuzzlePiece, FaFolder, FaChess, FaTrophy,
  FaList, FaPlus, FaCircle, FaHistory, FaMedal, FaUsers,
  FaUserGraduate, FaUserShield, FaChartBar, FaDesktop,
  FaCog, FaHome, FaBars, FaTimes, FaBell, FaUser, FaSignOutAlt
} from 'react-icons/fa';
import logo from '../../assets/QuickChessForYou-Logo.svg';
import styles from './AdminLayout.module.css';

function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Remove admin-specific items
    localStorage.removeItem('admin');
    //localStorage.removeItem('adminUser');
    // Remove token if it's an admin token (you might want to check this more carefully)
    // For now, we'll remove it to ensure clean logout
    const adminToken = localStorage.getItem('atoken');
    if (adminToken) {
      localStorage.removeItem('atoken');
    }
    navigate('/admin/login');
  };

  const menuItems = [
    { path: '/admin/', icon: FaChartLine, label: 'Dashboard', exact: true },
    {
      label: 'Puzzle Management',
      icon: FaPuzzlePiece,
      submenu: [
        // { path: '/admin/puzzle-library', icon: FaFolder, label: 'Puzzle Library' },
        { path: '/admin/categories', icon: FaFolder, label: 'Categories' },
        { path: '/admin/puzzles', icon: FaChess, label: 'Puzzles' },
      ]
    },
    {
      label: 'Competition',
      icon: FaTrophy,
      submenu: [
        { path: '/admin/competitions', icon: FaList, label: 'All Competitions' },
        // { path: '/admin/competitions/create', icon: FaPlus, label: 'Create Competition' },
        { path: '/admin/competitions/live', icon: FaCircle, label: 'Live Tournaments' },
        { path: '/admin/competitions/history', icon: FaHistory, label: 'History' },
      ]
    },
    { path: '/admin/leaderboard', icon: FaMedal, label: 'Leaderboard' },
    {
      label: 'User Management',
      icon: FaUsers,
      submenu: [
        { path: '/admin/students', icon: FaUserGraduate, label: 'Students' },
        { path: '/admin/admins', icon: FaUserShield, label: 'Admins' },
      ]
    },
    { path: '/admin/reports', icon: FaChartBar, label: 'Reports' },
    { path: '/admin/monitoring', icon: FaDesktop, label: 'System Monitor' },
    { path: '/admin/settings', icon: FaCog, label: 'Settings' },
  ];

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className={styles.adminLayout}>
      <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.sidebarHeader}>
          {!sidebarCollapsed && (
            <div className={styles.brandLogo}>
              {/* <img src={logo} alt="QuickChess4You" /> */}
              <span>Admin Panel</span>
            </div>
          )}
          <button
            className={styles.toggleBtn}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <FaBars /> : <FaTimes />}
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {menuItems.map((item, index) => (
            item.submenu ? (
              <div key={index} className={styles.menuGroup}>
                {!sidebarCollapsed && (
                  <div className={styles.menuGroupLabel}>
                    <item.icon />
                    <span>{item.label}</span>
                  </div>
                )}
                {item.submenu.map((subItem) => (
                  <Link
                    key={subItem.path}
                    to={subItem.path}
                    className={`${styles.menuItem} ${isActive(subItem.path) ? styles.active : ''}`}
                    title={sidebarCollapsed ? subItem.label : ''}
                  >
                    <span className={styles.menuIcon}><subItem.icon /></span>
                    {!sidebarCollapsed && <span>{subItem.label}</span>}
                  </Link>
                ))}
              </div>
            ) : (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.menuItem} ${isActive(item.path, item.exact) ? styles.active : ''}`}
                title={sidebarCollapsed ? item.label : ''}
              >
                <span className={styles.menuIcon}><item.icon /></span>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            )
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link to="/" className={styles.menuItem}>
            <span className={styles.menuIcon}><FaHome /></span>
            {!sidebarCollapsed && <span>Back to Site</span>}
          </Link>
          <button
            className={`${styles.menuItem} ${styles.logoutMenuItem}`}
            onClick={() => setShowLogoutConfirm(true)}
            title={sidebarCollapsed ? "Logout" : ""}
          >
            <span className={styles.menuIcon}><FaSignOutAlt /></span>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className={styles.mainContent}>
        {/* Header removed as per new design */}


        <main className={styles.content}>
          <Outlet />
        </main>
      </div>

      {showLogoutConfirm && (
        <div className={styles.modal} onClick={() => setShowLogoutConfirm(false)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmHeader}>
              <FaSignOutAlt className={styles.logoutIcon} />
              <h3>Confirm Logout</h3>
            </div>
            <div className={styles.confirmBody}>
              <p>Are you sure you want to logout from the admin panel?</p>
            </div>
            <div className={styles.confirmActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleLogout}
              >
                <FaSignOutAlt /> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLayout;
