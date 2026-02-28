import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from "../../contexts/AuthContext"
import { authAPI } from '../../services/api';
import styles from './Login.module.css';

function Login() {
  const navigate = useNavigate();
  const { userLogin } = useAuth();   // <-- UPDATED: now using userLogin()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isOTPMode, setIsOTPMode] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [tempToken, setTempToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  // ---------------- USER LOGIN FUNCTION ----------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.login(formData.email, formData.password);

      // Save user token + user data into context
      userLogin(response.user, response.token);   // <-- UPDATED

      setSuccess('Login successful! Redirecting...');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // ---------------- GOOGLE LOGIN ----------------
  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await authAPI.googleAuth(credentialResponse.credential);

      // Save user token + user data into context
      userLogin(response.user, response.token);

      setSuccess('Login successful! Redirecting...');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err.message || 'Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google login failed. Please try again.');
  };

  // missing function to handle forgot password
  const handleForgotPassword = () => {
    handleSendOTP({ preventDefault: () => { } });
  };

  // ---------------- SEND OTP ----------------
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!formData.email) {
      setError('Email is required');
      setLoading(false);
      return;
    }

    try {
      await authAPI.sendOTP(formData.email);
      setSuccess('OTP sent to your email! Please check your inbox.');
      setIsOTPMode(true);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ---------------- VERIFY OTP ----------------
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!formData.email || !formData.otp) {
      setError('Email and OTP are required');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.verifyOTP(formData.email, formData.otp);

      // Save temporary token to reset password
      setTempToken(response.token);

      setIsResetMode(true);
      setIsOTPMode(false);
      setSuccess('OTP verified! Please set your new password.');
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ---------------- RESET PASSWORD ----------------
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await authAPI.resetPassword(formData.newPassword, tempToken);
      setSuccess('Password reset successful! Please login with your new password.');

      setTimeout(() => {
        setIsResetMode(false);
        setTempToken(null);
        setFormData(prev => ({
          ...prev,
          password: '',
          otp: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftSection}>
        <div className={styles.decorCircle}></div>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>♟♔</span>
        </div>

        <div className={styles.formContainer}>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Sign in to access your launcher, games, videos, and weblooms.</p>

          {error && (
            <div className={styles.errorBox}>{error}</div>
          )}

          {success && (
            <div className={styles.successBox}>{success}</div>
          )}

          <form
            onSubmit={
              isResetMode
                ? handleResetPassword
                : isOTPMode
                  ? handleVerifyOTP
                  : handleLogin
            }
            className={styles.form}
          >
            <input
              type="email"
              name="email"
              placeholder="Email address"
              className={styles.input}
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={isOTPMode || isResetMode}
            />

            {isResetMode ? (
              <>
                <div className={styles.passwordContainer}>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    placeholder="New Password"
                    className={styles.input}
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    required
                  />
                  <span
                    className={styles.eyeIcon}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? '👁️' : '👁'}
                  </span>
                </div>

                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm New Password"
                  className={styles.input}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </>
            ) : isOTPMode ? (
              <input
                type="text"
                name="otp"
                placeholder="Enter OTP"
                className={styles.input}
                value={formData.otp}
                onChange={handleInputChange}
                required
              />
            ) : (
              <input
                type="password"
                name="password"
                placeholder="Password"
                className={styles.input}
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            )}

            {!isOTPMode && !isResetMode && (
              <div className={styles.rememberRow}>
                <label className={styles.checkbox}>
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className={styles.forgotLink}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button type="submit" className={styles.loginBtn} disabled={loading}>
              {loading
                ? "Please wait..."
                : isResetMode
                  ? "Reset Password"
                  : isOTPMode
                    ? "Verify OTP"
                    : "Log in"}
            </button>

            {!isOTPMode && !isResetMode && (
              <>
                <div className={styles.divider}>
                  <span>or continue with</span>
                </div>

                <div className={styles.googleBtnContainer}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="outline"
                    size="large"
                    width="100%"
                    text="signin_with"
                    ux_mode="popup"
                    use_fedcm_for_prompt={false}
                  />
                </div>
              </>
            )}
          </form>
        </div>
      </div>

      <div className={styles.rightSection}>
        <img
          src="https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=800&q=80"
          alt="Chess Board"
          className={styles.chessImage}
        />
      </div>
    </div>
  );
}

export default Login;
