import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    FaTrophy,
    FaChessBoard,
    FaUser,
    FaCog,
    FaBars,
    FaTimes,
    FaGraduationCap,
    FaChalkboardTeacher,
    FaTags,
    FaEnvelope,
    FaInfoCircle,
    FaSignInAlt,
    FaUserPlus,
    FaSignOutAlt,
    FaSun,
    FaMoon
} from 'react-icons/fa';
import LoginModal from '../../components/LoginModal/LoginModal';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import styles from './MainLayout.module.css';
import logo from '../../assets/QuickChessForYou-Logo.svg';

const MainLayout = () => {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const { user, isAuthenticated, logout } = useAuth(); // Assuming logout is available in AuthContext
    const { darkMode, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();

    // Open login modal when a route explicitly asks for it (e.g. from Dashboard)
    useEffect(() => {
        if (location.state?.openLogin) {
            setIsLoginModalOpen(true);

            // Clear the state so modal doesn't keep auto-opening on refresh/back
            navigate(location.pathname, { replace: true });
        }
    }, [location, navigate]);

    // Navigation items - "Home" is now implied by the Logo
    const navItems = [
        // { path: '/puzzles', label: 'Puzzles', icon: <FaChessBoard /> },
        { path: '/', label: 'Tournaments', icon: <FaTrophy /> },
        { path: '/courses', label: 'Courses', icon: <FaGraduationCap /> },
        { path: '/coaching', label: 'Coaching', icon: <FaChalkboardTeacher /> },
        { path: '/pricing', label: 'Pricing', icon: <FaTags /> },
        { path: '/about', label: 'About Us', icon: <FaInfoCircle /> },
        { path: '/contact', label: 'Contact', icon: <FaEnvelope /> },
    ];

    // User interaction items (Profile, Settings) - Only show if authenticated
    const userItems = [
        { path: '/profile', label: 'Profile', icon: <FaUser /> },
        { path: '/settings', label: 'Settings', icon: <FaCog /> },
    ];

    const handleLogout = () => {
        if (logout) logout();
    };

    return (
        <div className={styles.container}>
            {/* Sidebar - Now the Main Interaction Point */}
            <aside className={`${styles.sidebar} ${isSidebarCollapsed ? styles.collapsed : ''}`}>

                {/* Logo Section */}
                <div className={styles.logoSection}>
                    <Link to="/" className={styles.logoLink} title="Home">
                        <img src={logo} alt="Quick Chess For You" className={styles.logoImg} />
                        {/* {!isSidebarCollapsed && <span className={styles.logoText}>QCFY</span>} */}
                    </Link>
                    <button
                        className={styles.toggleBtn}
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                    >
                        {isSidebarCollapsed ? <FaBars /> : <FaTimes />}
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className={styles.navLinks}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `${styles.navItem} ${isActive ? styles.active : ''}`
                            }
                            title={item.label}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            {!isSidebarCollapsed && <span className={styles.navLabel}>{item.label}</span>}
                        </NavLink>
                    ))}

                    {isAuthenticated && <div className={styles.separator} />}

                    {isAuthenticated && userItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `${styles.navItem} ${isActive ? styles.active : ''}`
                            }
                            title={item.label}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            {!isSidebarCollapsed && <span className={styles.navLabel}>{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer Section: User Profile or Login */}
                <div className={styles.sidebarFooter}>
                    {/* Theme Toggle in Footer */}
                    <button
                        className={styles.themeToggleBtn}
                        onClick={toggleTheme}
                        title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {darkMode ? <FaSun /> : <FaMoon />}
                        {!isSidebarCollapsed && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
                    </button>

                    <div className={styles.separator} style={{ margin: '10px 0' }} />

                    {isAuthenticated ? (
                        <div className={styles.userProfile}>
                            <div className={styles.avatar}>
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="User" />
                                ) : (
                                    <span>{user?.username?.[0]?.toUpperCase() || 'U'}</span>
                                )}
                            </div>
                            {!isSidebarCollapsed && (
                                <div className={styles.userDetails}>
                                    <div className={styles.userName}>
                                        {user?.name || user?.username || 'Player'}
                                    </div>
                                    <button onClick={handleLogout} className={styles.logoutBtn} title="Logout">
                                        <FaSignOutAlt /> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={styles.authButtons}>
                            {!isSidebarCollapsed ? (
                                <>
                                    <button className={styles.loginBtn} onClick={() => setIsLoginModalOpen(true)}>
                                        Login
                                    </button>
                                    <button className={styles.signupBtn} onClick={() => setIsLoginModalOpen(true)}>
                                        Sign Up
                                    </button>
                                </>
                            ) : (
                                <button className={styles.iconBtn} onClick={() => setIsLoginModalOpen(true)} title="Login">
                                    <FaSignInAlt />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className={`${styles.mainContent} ${isSidebarCollapsed ? styles.expanded : ''}`}>
                <Outlet />
            </main>

            {/* Mobile Bottom Navigation (Optional fallback for very small screens) */}
            <nav className={styles.bottomNav}>
                <NavLink to="/" className={styles.mobileNavItem}><FaChessBoard /><span>Home</span></NavLink>
                <NavLink to="/puzzle" className={styles.mobileNavItem}><FaChessBoard /><span>Play</span></NavLink>
                <button className={styles.mobileNavItem} onClick={() => setIsLoginModalOpen(true)}><FaUser /><span>Acc</span></button>
            </nav>

            {/* Login Modal */}
            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
            />
        </div>
    );
};

export default MainLayout;
