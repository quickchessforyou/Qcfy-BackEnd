import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import styles from './Settings.module.css';

function Settings() {
  const { user } = useAuth();
  const { boardTheme, setBoardTheme, pieceSet, setPieceSet, boardThemes, pieceSets } = useTheme();
  
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    tournaments: true,
    achievements: true
  });

  const handleNotificationChange = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Settings</h1>
        <p>Manage your account preferences and customization</p>
      </div>

      <div className={styles.content}>
        {/* Board Customization */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Board Customization</h2>
          
          <div className={styles.settingGroup}>
            <label className={styles.label}>Board Theme</label>
            <div className={styles.themeGrid}>
              {Object.entries(boardThemes).map(([key, theme]) => (
                <button
                  key={key}
                  className={`${styles.themeOption} ${boardTheme === key ? styles.active : ''}`}
                  onClick={() => setBoardTheme(key)}
                >
                  <div className={styles.themePreview}>
                    <div style={{ backgroundColor: theme.light }} />
                    <div style={{ backgroundColor: theme.dark }} />
                  </div>
                  <span>{theme.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.settingGroup}>
            <label className={styles.label}>Piece Set</label>
            <div className={styles.pieceGrid}>
              {Object.entries(pieceSets).map(([key, set]) => (
                <button
                  key={key}
                  className={`${styles.pieceOption} ${pieceSet === key ? styles.active : ''}`}
                  onClick={() => setPieceSet(key)}
                >
                  {set.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Notifications</h2>
          
          <div className={styles.settingGroup}>
            <div className={styles.toggleItem}>
              <div>
                <div className={styles.toggleLabel}>Email Notifications</div>
                <div className={styles.toggleDesc}>Receive updates via email</div>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={notifications.email}
                  onChange={() => handleNotificationChange('email')}
                />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div className={styles.toggleItem}>
              <div>
                <div className={styles.toggleLabel}>Push Notifications</div>
                <div className={styles.toggleDesc}>Get browser notifications</div>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={notifications.push}
                  onChange={() => handleNotificationChange('push')}
                />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div className={styles.toggleItem}>
              <div>
                <div className={styles.toggleLabel}>Tournament Updates</div>
                <div className={styles.toggleDesc}>Notifications about tournaments</div>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={notifications.tournaments}
                  onChange={() => handleNotificationChange('tournaments')}
                />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div className={styles.toggleItem}>
              <div>
                <div className={styles.toggleLabel}>Achievement Alerts</div>
                <div className={styles.toggleDesc}>Get notified of new achievements</div>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={notifications.achievements}
                  onChange={() => handleNotificationChange('achievements')}
                />
                <span className={styles.slider}></span>
              </label>
            </div>
          </div>
        </section>

        {/* Account */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Account</h2>
          
          <div className={styles.settingGroup}>
            <button className={styles.dangerBtn}>
              Delete Account
            </button>
            <p className={styles.dangerText}>
              Once you delete your account, there is no going back. Please be certain.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Settings;
