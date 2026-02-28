import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import {
  FaChessPawn, FaTrophy, FaChartLine, FaFire,
  FaCog, FaHistory, FaMedal, FaEdit, FaCamera,
  FaEnvelope, FaCalendarAlt, FaTimes, FaSignOutAlt
} from 'react-icons/fa';
import styles from './Profile.module.css';

// Helper function to construct avatar URL
const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith('http')) return avatarPath;
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
  const baseUrl = apiBaseUrl.replace('/api', '');
  return `${baseUrl}/${avatarPath}`;
};

function Profile() {
  const navigate = useNavigate();
  const { user: contextUser, userLogin, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fallback user data
  const fallbackUserData = contextUser || JSON.parse(localStorage.getItem('user')) || {
    name: '',
    username: '',
    email: '',
    avatar: null,
    rating: 1200,
    wins: 0,
    losses: 0,
    draws: 0,
    createdAt: new Date()
  };

  const [userData, setUserData] = useState(fallbackUserData);

  const fetchUserData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await authAPI.getCurrentUser();

      if (response.user) {
        setUserData(response.user);
        userLogin(response.user, token);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load user data. Showing cached data.');
      setUserData(fallbackUserData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    const handleFocus = () => fetchUserData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stats Logic
  const stats = {
    puzzlesSolved: userData.statistics?.puzzlesSolved || 0,
    accuracy: 87,
    currentStreak: 12,
    bestStreak: 28,
    totalGames: (userData.wins || 0) + (userData.losses || 0) + (userData.draws || 0),
    wins: userData.wins || 0,
    draws: userData.draws || 0,
    losses: userData.losses || 0,
    competitionsParticipated: userData.statistics?.competitionsParticipated || 0
  };

  const joinDate = userData.createdAt
    ? new Date(userData.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : 'N/A';

  const getRank = (rating) => {
    if (rating >= 2000) return 'Grandmaster';
    if (rating >= 1800) return 'Master';
    if (rating >= 1600) return 'Expert';
    if (rating >= 1400) return 'Advanced';
    return 'Novice';
  };

  const recentActivity = [
    { type: 'puzzle', title: 'Tactics Trainer: Mate in 2', result: 'Solved', time: '2 hours ago' },
    { type: 'tournament', title: 'Spring Championship', result: '3rd Place', time: '1 day ago' },
    { type: 'puzzle', title: 'Endgame: King & Pawn', result: 'Solved', time: '2 days ago' },
    { type: 'puzzle', title: 'Opening Trap', result: 'Failed', time: '3 days ago' }
  ];

  const achievements = [
    { icon: <FaTrophy />, title: 'First Blood', description: 'Won your first tournament match' },
    { icon: <FaChessPawn />, title: 'Pawn Star', description: 'Solved 100 tactical puzzles' },
    { icon: <FaFire />, title: 'On Fire', description: 'Maintained a 7-day streak' },
    { icon: <FaMedal />, title: getRank(userData.rating || 1200), description: `Reached ${getRank(userData.rating || 1200)} rank` }
  ];

  return (
    <div className={styles.container}>

      {/* --- HERO SECTION --- */}
      <div className={styles.heroBanner}></div>

      <div className={styles.contentWrapper}>

        {/* Profile Card (Overlaps Banner) */}
        <div className={styles.profileHeaderCard}>
          <div className={styles.avatarWrapper}>
            <div
              className={`${styles.avatar} ${getAvatarUrl(userData.avatar) ? styles.clickable : ''}`}
              onClick={() => getAvatarUrl(userData.avatar) && setShowAvatarModal(true)}
            >
              {getAvatarUrl(userData.avatar) ? (
                <img src={getAvatarUrl(userData.avatar)} alt="Profile" />
              ) : (
                <span className={styles.initial}>{(userData.name || 'U').charAt(0).toUpperCase()}</span>
              )}
              <div className={styles.avatarOverlay}><FaCamera /></div>
            </div>
          </div>

          <div className={styles.headerInfo}>
            <div className={styles.nameSection}>
              <h1>{userData.name || 'Chess Player'}</h1>
              <span className={styles.userHandle}>@{userData.username || 'username'}</span>
            </div>

            <div className={styles.badges}>
              <span className={styles.badgeGold}>
                <FaTrophy className={styles.badgeIcon} /> {getRank(userData.rating || 1200)}
              </span>
              <span className={styles.badgeSilver}>
                <FaChartLine className={styles.badgeIcon} /> {userData.rating || 1200} ELO
              </span>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button className={styles.editBtn} onClick={() => navigate('/profile/edit')}>
              <FaEdit /> <span>Edit</span>
            </button>
            <button
              className={styles.headerLogoutBtn}
              onClick={() => {
                if (logout) logout();
                navigate('/');
              }}
            >
              <FaSignOutAlt /> <span>Logout</span>
            </button>
          </div>
        </div>

        {/* --- STATS GRID --- */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><FaChessPawn /></div>
            <div className={styles.statData}>
              <h3>{stats.puzzlesSolved}</h3>
              <p>Puzzles</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><FaTrophy /></div>
            <div className={styles.statData}>
              <h3>{stats.competitionsParticipated}</h3>
              <p>Tournaments</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><FaChartLine /></div>
            <div className={styles.statData}>
              <h3>{stats.accuracy}%</h3>
              <p>Accuracy</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><FaFire /></div>
            <div className={styles.statData}>
              <h3>{stats.currentStreak}</h3>
              <p>Streak</p>
            </div>
          </div>
        </div>

        {/* --- TABS NAVIGATION --- */}
        <div className={styles.tabsContainer}>
          <button
            className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <FaChartLine /> Overview
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'activity' ? styles.active : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            <FaHistory /> Activity
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'achievements' ? styles.active : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            <FaMedal /> Achievements
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'settings' ? styles.active : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <FaCog /> Settings
          </button>
        </div>

        {/* --- TAB CONTENT AREA --- */}
        <div className={styles.tabContent}>

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className={styles.overviewLayout}>
              <div className={styles.contentCard}>
                <h3 className={styles.cardTitle}>Match Performance</h3>
                <div className={styles.winLossBar}>
                  <div className={styles.barSegment} style={{ flex: stats.wins || 1, background: '#4CAF50' }}></div>
                  <div className={styles.barSegment} style={{ flex: stats.draws || 1, background: '#9E9E9E' }}></div>
                  <div className={styles.barSegment} style={{ flex: stats.losses || 1, background: '#F44336' }}></div>
                </div>
                <div className={styles.statsRow}>
                  <div className={styles.statItem}>
                    <span className={styles.label}>Wins</span>
                    <span className={styles.val} style={{ color: '#4CAF50' }}>{stats.wins}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.label}>Draws</span>
                    <span className={styles.val} style={{ color: '#9E9E9E' }}>{stats.draws}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.label}>Losses</span>
                    <span className={styles.val} style={{ color: '#F44336' }}>{stats.losses}</span>
                  </div>
                </div>
              </div>

              <div className={styles.contentCard}>
                <h3 className={styles.cardTitle}>Details</h3>
                <div className={styles.detailRow}>
                  <FaEnvelope className={styles.detailIcon} />
                  <div>
                    <span className={styles.detailLabel}>Email</span>
                    <span className={styles.detailValue}>{userData.email}</span>
                  </div>
                </div>
                <div className={styles.detailRow}>
                  <FaCalendarAlt className={styles.detailIcon} />
                  <div>
                    <span className={styles.detailLabel}>Member Since</span>
                    <span className={styles.detailValue}>{joinDate}</span>
                  </div>
                </div>
                <div className={styles.detailRow}>
                  <FaFire className={styles.detailIcon} />
                  <div>
                    <span className={styles.detailLabel}>Best Streak</span>
                    <span className={styles.detailValue}>{stats.bestStreak} Days</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVITY TAB */}
          {activeTab === 'activity' && (
            <div className={styles.contentCard}>
              <h3 className={styles.cardTitle}>Recent History</h3>
              <div className={styles.activityList}>
                {recentActivity.map((item, idx) => (
                  <div key={idx} className={styles.activityItem}>
                    <div className={styles.activityIconWrapper}>
                      {item.type === 'puzzle' ? <FaChessPawn /> : <FaTrophy />}
                    </div>
                    <div className={styles.activityInfo}>
                      <h4>{item.title}</h4>
                      <span className={styles.activityTime}>{item.time}</span>
                    </div>
                    <div className={`${styles.activityResult} ${item.result === 'Solved' || item.result.includes('Place') ? styles.good : styles.bad}`}>
                      {item.result}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACHIEVEMENTS TAB */}
          {activeTab === 'achievements' && (
            <div className={styles.achievementsGrid}>
              {achievements.map((item, idx) => (
                <div key={idx} className={styles.achievementCard}>
                  <div className={styles.achieveIcon}>{item.icon}</div>
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className={styles.contentCard}>
              <h3 className={styles.cardTitle}>Account Data</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Display Name</label>
                  <input type="text" value={userData.name || ''} disabled />
                </div>
                <div className={styles.formGroup}>
                  <label>Username</label>
                  <input type="text" value={userData.username || ''} disabled />
                </div>
                <div className={styles.formGroup}>
                  <label>Email Address</label>
                  <input type="email" value={userData.email || ''} disabled />
                </div>
                <div className={styles.buttonGroup}>
                  <button className={styles.primaryBtn} onClick={() => navigate('/profile/edit')}>
                    Edit Information
                  </button>
                  <button
                    className={styles.logoutBtn}
                    onClick={() => {
                      if (logout) logout();
                      navigate('/');
                    }}
                  >
                    <FaSignOutAlt /> Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AVATAR MODAL */}
      {showAvatarModal && getAvatarUrl(userData.avatar) && (
        <div className={styles.modalOverlay} onClick={() => setShowAvatarModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setShowAvatarModal(false)}><FaTimes /></button>
            <img src={getAvatarUrl(userData.avatar)} alt="Full size" />
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;