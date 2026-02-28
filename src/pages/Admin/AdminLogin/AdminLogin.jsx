import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserShield, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { adminAPI } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import logo from '../../../assets/logo.png';
import styles from './AdminLogin.module.css';

function AdminLogin() {
  const navigate = useNavigate();
  const { adminLogin } = useAuth();   // <-- use AdminAuthContext

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await adminAPI.login(formData.email, formData.password);

      if (response.atoken) {
        // Store admin session using context
        adminLogin(
          { email: formData.email },  // admin info
          response.atoken             // admin JWT token
        );

        navigate('/admin/');
      } else {
        setError('Login failed: No token received');
      }

    } catch (err) {
      setError(err?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>

          {/* Logo Section */}
          <div className={styles.logoSection}>
            {/* <img src={logo} alt="QuickChess4You" className={styles.logo} /> */}
            <h1>QuickChess4You</h1>
            <p>Admin Panel</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className={styles.loginForm}>
            <h2>
              <FaUserShield /> Admin Login
            </h2>
            <p className={styles.subtitle}>Enter your credentials to access the admin panel</p>

            {error && (
              <div className={styles.errorAlert}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className={styles.formGroup}>
              <label><FaUserShield /> Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email"
                required
                autoFocus
              />
            </div>

            <div className={styles.formGroup}>
              <label><FaLock /> Password</label>
              <div className={styles.passwordInput}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={styles.loginBtn}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.spinner}></span>
                  Logging in...
                </>
              ) : (
                'Login to Admin Panel'
              )}
            </button>

            {/* <div className={styles.demoCredentials}>
              <p>Demo Credentials:</p>
              <div className={styles.credentials}>
                <span><strong>Email:</strong> From environment</span>
                <span><strong>Password:</strong> From environment</span>
              </div>
            </div> */}
          </form>


        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
