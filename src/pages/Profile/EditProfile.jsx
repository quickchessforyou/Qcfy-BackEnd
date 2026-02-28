import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import styles from './EditProfile.module.css';

// Helper function to construct avatar URL
const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith('http')) return avatarPath;
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
  const baseUrl = apiBaseUrl.replace('/api', '');
  return `${baseUrl}/${avatarPath}`;
};

function EditProfile() {
  const navigate = useNavigate();
  const { user: contextUser, userLogin } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    username: ''
  });

  // Initialize form with user data
  useEffect(() => {
    if (contextUser) {
      setFormData({
        name: contextUser.name || '',
        username: contextUser.username || ''
      });
      if (contextUser.avatar) {
        setAvatarPreview(getAvatarUrl(contextUser.avatar));
      }
    }
  }, [contextUser]);

  // Handle avatar file selection
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedAvatar(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const updateData = {};
      if (formData.name && formData.name.trim()) {
        updateData.name = formData.name.trim();
      }
      if (formData.username && formData.username.trim()) {
        updateData.username = formData.username.trim();
      }

      // Validate required fields
      if (!updateData.name && !updateData.username && !selectedAvatar) {
        setError('Please make at least one change to save');
        setLoading(false);
        return;
      }

      const response = await authAPI.updateUser(updateData, selectedAvatar);
      
      if (response.user) {
        // Update user in context and localStorage
        const updatedUser = response.user;
        userLogin(updatedUser, localStorage.getItem('token'));
        
        // Navigate back to profile page
        navigate('/profile');
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/profile');
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1>Edit Profile</h1>
          <p>Update your profile information</p>
        </div>

        <div className={styles.card}>
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Avatar Section */}
            <div className={styles.avatarSection}>
              <label className={styles.avatarLabel}>Profile Picture</label>
              <div className={styles.avatarContainer}>
                <div className={styles.avatar}>
                  {avatarPreview || getAvatarUrl(contextUser?.avatar) ? (
                    <img 
                      src={avatarPreview || getAvatarUrl(contextUser?.avatar)} 
                      alt={contextUser?.name || 'User'} 
                    />
                  ) : (
                    <span className={styles.avatarPlaceholder}>
                      {(contextUser?.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <label htmlFor="avatar-upload" className={styles.avatarUploadBtn}>
                  📷 Change Photo
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleAvatarChange}
                  />
                </label>
                {selectedAvatar && (
                  <p className={styles.avatarHint}>New photo selected</p>
                )}
              </div>
            </div>

            {/* Name Field */}
            <div className={styles.formGroup}>
              <label htmlFor="name">Display Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your display name"
                required
              />
            </div>

            {/* Username Field */}
            <div className={styles.formGroup}>
              <label htmlFor="username">Username *</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter your username"
                required
              />
            </div>

            {/* Email Field (Read-only) */}
            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={contextUser?.email || ''}
                disabled
                className={styles.disabledInput}
              />
              <small className={styles.hint}>Email cannot be changed</small>
            </div>

            {/* Action Buttons */}
            <div className={styles.buttonGroup}>
              <button
                type="button"
                onClick={handleCancel}
                className={styles.cancelBtn}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.saveBtn}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditProfile;

