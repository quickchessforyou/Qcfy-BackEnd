import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import styles from './LoginModal.module.css';
import { FaFacebookF } from 'react-icons/fa';
import { FaInstagram } from 'react-icons/fa';

function LoginModal({ isOpen, onClose, initialMode = 'login' }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [isOTPMode, setIsOTPMode] = useState(false);
  const [isSignupOTPMode, setIsSignupOTPMode] = useState(false); // New: for signup OTP
  const [isResetMode, setIsResetMode] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [tempToken, setTempToken] = useState(null);
  const [tempSignupData, setTempSignupData] = useState(null); // New: store signup data temporarily
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    otp: '',
    newPassword: ''
  });

  // Sync modal mode with initialMode prop when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsSignUp(initialMode === 'signup');
      // Reset other states when modal opens
      setIsOTPMode(false);
      setIsSignupOTPMode(false);
      setIsResetMode(false);
      setTempSignupData(null);
      setError('');
      setSuccess('');
    }
  }, [isOpen, initialMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleSendSignupOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.username) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    if (!/\d/.test(formData.password)) {
      setError('Password must contain at least one number');
      setLoading(false);
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      setError('Password must contain at least one special character');
      setLoading(false);
      return;
    }

    try {
      // Store signup data temporarily
      setTempSignupData({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        username: formData.username,
      });

      // Send OTP for signup verification
      await authAPI.sendSignupOTP({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        username: formData.username,
      });

      setSuccess('OTP sent to your email! Please check your inbox.');
      setIsSignupOTPMode(true);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySignupOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!formData.email || !formData.otp) {
      setError('Email and OTP are required');
      setLoading(false);
      return;
    }

    if (!tempSignupData) {
      setError('Signup data not found. Please try again.');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.verifySignupOTP(
        formData.email,
        formData.otp,
        tempSignupData
      );

      // Use context to store token, user data, and optional admin token (atoken)
      login(response.user, response.token, response.atoken);

      setSuccess('Registration successful! Redirecting...');
      setTimeout(() => {
        onClose();
        navigate('/');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!formData.email || !formData.password) {
      setError('Email/Username and password are required');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.login(formData.email, formData.password);

      // Use context to store token, user data, and optional admin token (atoken)
      login(response.user, response.token, response.atoken);

      setSuccess('Login successful! Redirecting...');
      setTimeout(() => {
        onClose();
        navigate('/');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

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

      // Instead of logging in directly, switch to reset password mode
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

  const handleSubmit = (e) => {
    if (isSignupOTPMode) {
      handleVerifySignupOTP(e);
    } else if (isOTPMode) {
      handleVerifyOTP(e);
    } else if (isResetMode) {
      handleResetPassword(e);
    } else if (isSignUp) {
      handleSendSignupOTP(e);
    } else {
      handleLogin(e);
    }
  };

  // Google OAuth handlers
  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await authAPI.googleAuth(credentialResponse.credential);
      login(response.user, response.token, response.atoken);
      setSuccess('Login successful! Redirecting...');
      setTimeout(() => {
        onClose();
        navigate('/');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google login failed. Please try again.');
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      setError('Please enter your email first');
      return;
    }
    handleSendOTP(e);
  };

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

    if (!formData.newPassword) {
      setError('Password is required');
      setLoading(false);
      return;
    }

    try {
      await authAPI.resetPassword(formData.newPassword, tempToken);
      setSuccess('Password reset successful! Please login with your new password.');

      // Reset all states after success
      setTimeout(() => {
        setIsResetMode(false);
        setShowNewPassword(false);
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

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>×</button>

        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <div className={styles.logo}>
              <span className={styles.logoIcon}>♔</span>
            </div>
            <h2 className={styles.title}>
              {isSignupOTPMode
                ? 'Verify Your Email'
                : isSignUp
                  ? 'Create Account'
                  : 'Welcome Back'}
            </h2>
            <p className={styles.subtitle}>
              {isSignupOTPMode
                ? 'Enter the OTP sent to your email to complete registration'
                : isSignUp
                  ? 'Join thousands of chess players worldwide'
                  : 'Sign in to continue your chess journey'}
            </p>
          </div>

          {error && (
            <div className={styles.errorMessage} style={{
              padding: '12px',
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              color: '#dc2626',
              marginBottom: '16px',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div className={styles.successMessage} style={{
              padding: '12px',
              background: '#d1fae5',
              border: '1px solid #86efac',
              borderRadius: '8px',
              color: '#059669',
              marginBottom: '16px',
              fontSize: '0.875rem'
            }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            {isSignUp && !isOTPMode && !isSignupOTPMode && (
              <>
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  className={styles.input}
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  className={styles.input}
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </>
            )}

            <input
              type={isSignUp ? "email" : "text"}
              name="email"
              placeholder={isSignUp ? "Email address" : "Email or Username"}
              className={styles.input}
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={isOTPMode || isResetMode || isSignupOTPMode}
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
                    minLength={6}
                  />
                  <span
                    className={styles.eyeIcon}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? '👁️' : '👁'}
                  </span>
                </div>
                <div className={styles.passwordContainer} style={{ marginTop: '16px' }}>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm New Password"
                    className={styles.input}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                  />
                </div>
              </>
            ) : isOTPMode || isSignupOTPMode ? (
              <input
                type="text"
                name="otp"
                placeholder="Enter 6-digit OTP"
                className={styles.input}
                value={formData.otp}
                onChange={handleInputChange}
                maxLength={6}
                required
              />
            ) : (
              <>
                {!isSignUp && (
                  <div className={styles.passwordContainer}>
                    <input
                      type="password"
                      name="password"
                      placeholder="Password"
                      className={styles.input}
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                )}

                {isSignUp && !isSignupOTPMode && (
                  <>
                    <div className={styles.passwordContainer}>
                      <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        className={styles.input}
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className={styles.passwordContainer}>
                      <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        className={styles.input}
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {!isSignUp && !isOTPMode && !isResetMode && !isSignupOTPMode && (
              <div className={styles.rememberRow}>
                <label className={styles.checkbox}>
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className={styles.forgotLink}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading
                ? 'Please wait...'
                : isResetMode
                  ? 'Reset Password'
                  : isSignupOTPMode
                    ? 'Verify OTP & Create Account'
                    : isOTPMode
                      ? 'Verify OTP'
                      : isSignUp
                        ? 'Send OTP'
                        : 'Log In'}
            </button>

            {(isOTPMode || isResetMode || isSignupOTPMode) && (
              <button
                type="button"
                onClick={() => {
                  setIsOTPMode(false);
                  setIsResetMode(false);
                  setIsSignupOTPMode(false);
                  setFormData(prev => ({ ...prev, otp: '' }));
                  setTempSignupData(null);
                  setError('');
                  setSuccess('');
                }}
                className={styles.switchBtn}
                style={{ marginTop: '8px', fontSize: '0.875rem' }}
              >
                {isSignupOTPMode ? 'Back to Sign Up' : 'Back to Login'}
              </button>
            )}

            {!isOTPMode && !isResetMode && !isSignupOTPMode && (
              <>
                <div className={styles.divider}>
                  <span className={styles.dividerText}>or continue with</span>
                </div>

                <div className={styles.googleBtnContainer}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="outline"
                    size="large"
                    width="100%"
                    text={isSignUp ? 'signup_with' : 'signin_with'}
                    ux_mode="popup"
                    use_fedcm_for_prompt={false}
                  />
                </div>
              </>
            )}

            <p className={styles.switchText}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                className={styles.switchBtn}
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? 'Log In' : 'Sign Up'}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginModal;