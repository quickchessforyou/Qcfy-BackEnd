import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './TopHeader.module.css';
import logo from '../../assets/QuickChessForYou-Logo.svg';

function TopHeader({ onLoginClick }) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className={styles.topHeader}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          <img src={logo} alt="Quick Chess For You" className={styles.logoImg} />
          <span className={styles.logoText}>Quick Chess For You</span>
        </Link>

        <nav className={styles.nav}>
          <Link to="/about" className={styles.navLink}>About Us</Link>
          <Link to="/courses" className={styles.navLink}>Courses</Link>
          <Link to="/coaching" className={styles.navLink}>Coaching</Link>
          <Link to="/pricing" className={styles.navLink}>Pricing</Link>
          <Link to="/gallery" className={styles.navLink}>Gallery</Link>
          <Link to="/contact" className={styles.navLink}>Contact</Link>
        </nav>


        <div className={styles.actions}>
          {isAuthenticated ? (
            <div
              className={styles.userInfo}
              onClick={() => navigate("/dashboard")}
              style={{ cursor: "pointer" }}
            >
              <div className={styles.avatar}>
                {user?.avatar ? (
                  <img src={user.avatar} alt="User" />
                ) : (
                  <span>{user?.username?.[0]?.toUpperCase() || "U"}</span>
                )}
              </div>

              <span className={styles.username}>
                {user?.name || user?.username || "Player"}
              </span>
            </div>
          ) : (
            <>
              <button className={styles.loginBtn} onClick={onLoginClick}>
                Login
              </button>
              <button className={styles.signupBtn} onClick={onLoginClick}>
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopHeader;
