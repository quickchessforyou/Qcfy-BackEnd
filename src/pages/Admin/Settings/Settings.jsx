import styles from './Settings.module.css';

function Settings() {
  return (
    <div className={styles.settings}>
      <div className={styles.header}>
        <h2>Settings</h2>
        <p>Configure system settings and preferences</p>
      </div>

      <div className={styles.sections}>
        <div className={styles.section}>
          <h3>🔐 System Settings</h3>
          <div className={styles.formGroup}>
            <label>JWT Token Expiry (hours)</label>
            <input type="number" defaultValue="24" />
          </div>
          <div className={styles.formGroup}>
            <label>Session Timeout (minutes)</label>
            <input type="number" defaultValue="30" />
          </div>
          <div className={styles.formGroup}>
            <label>Max Login Attempts</label>
            <input type="number" defaultValue="5" />
          </div>
          <button className={styles.saveBtn}>Save Changes</button>
        </div>

        <div className={styles.section}>
          <h3>🏆 Scoring Settings</h3>
          <div className={styles.formGroup}>
            <label>Points per Puzzle (Easy)</label>
            <input type="number" defaultValue="10" />
          </div>
          <div className={styles.formGroup}>
            <label>Points per Puzzle (Medium)</label>
            <input type="number" defaultValue="20" />
          </div>
          <div className={styles.formGroup}>
            <label>Points per Puzzle (Hard)</label>
            <input type="number" defaultValue="30" />
          </div>
          <div className={styles.formGroup}>
            <label>Points per Puzzle (Expert)</label>
            <input type="number" defaultValue="50" />
          </div>
          <button className={styles.saveBtn}>Save Changes</button>
        </div>

        <div className={styles.section}>
          <h3>🎨 Branding</h3>
          <div className={styles.formGroup}>
            <label>Platform Name</label>
            <input type="text" defaultValue="Chess Puzzle Platform" />
          </div>
          <div className={styles.formGroup}>
            <label>Logo Upload</label>
            <input type="file" accept="image/*" />
          </div>
          <div className={styles.formGroup}>
            <label>Theme Color</label>
            <input type="color" defaultValue="#667eea" />
          </div>
          <button className={styles.saveBtn}>Save Changes</button>
        </div>

        <div className={styles.section}>
          <h3>📧 Email Settings</h3>
          <div className={styles.formGroup}>
            <label>SMTP Server</label>
            <input type="text" placeholder="smtp.example.com" />
          </div>
          <div className={styles.formGroup}>
            <label>SMTP Port</label>
            <input type="number" defaultValue="587" />
          </div>
          <div className={styles.formGroup}>
            <label>From Email</label>
            <input type="email" placeholder="noreply@example.com" />
          </div>
          <button className={styles.saveBtn}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
