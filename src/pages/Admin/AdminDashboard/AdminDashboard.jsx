import { Link } from 'react-router-dom';
import { FaUsers, FaChess, FaTrophy, FaCircle, FaPlus, FaChartBar, FaUsersCog } from 'react-icons/fa';
import { PageHeader, Button, StatCard, Badge } from '../../../components/Admin';
import styles from './AdminDashboard.module.css';

function AdminDashboard() {
  const stats = [
    { label: 'Total Users', value: '1,234', icon: FaUsers, color: '#ff9800', change: '+12%' },
    { label: 'Total Puzzles', value: '456', icon: FaChess, color: '#ffa726', change: '+8%' },
    { label: 'Competitions', value: '23', icon: FaTrophy, color: '#ffb74d', change: '+5%' },
    { label: 'Live Tournaments', value: '3', icon: FaCircle, color: '#43e97b', change: 'Active' },
  ];

  const recentCompetitions = [
    { id: 1, name: 'Spring Championship', status: 'Live', players: 128, startTime: '2 hours ago' },
    { id: 2, name: 'Rapid Blitz', status: 'Upcoming', players: 64, startTime: 'In 3 hours' },
    { id: 3, name: 'Weekly Puzzle Rush', status: 'ENDED', players: 256, startTime: '1 day ago' },
  ];

  const recentPuzzles = [
    { id: 1, title: 'Checkmate in 3', difficulty: 'Hard', category: 'Tactics', created: '2 hours ago' },
    { id: 2, title: 'Fork the Queen', difficulty: 'Medium', category: 'Tactics', created: '5 hours ago' },
    { id: 3, title: 'Endgame Study', difficulty: 'Expert', category: 'Endgame', created: '1 day ago' },
  ];

  return (
    <div className={styles.dashboard}>
      <PageHeader
        icon={FaChartBar}
        title="Dashboard Overview"
        subtitle="Welcome back, Admin! Here's what's happening today."
      />

      <div className={styles.statsGrid}>
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            change={stat.change}
            color={stat.color}
          />
        ))}
      </div>

      <div className={styles.quickActions}>
        <Button to="/admin/puzzles/create" icon={FaPlus}>
          Create Puzzle
        </Button>
        <Button to="/admin/competitions/create" icon={FaTrophy}>
          Create Competition
        </Button>
        <Button to="/admin/students" icon={FaUsersCog}>
          Manage Users
        </Button>
        <Button to="/admin/reports" icon={FaChartBar}>
          View Reports
        </Button>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3>Recent Competitions</h3>
            <Link to="/admin/competitions">View All →</Link>
          </div>
          <div className={styles.table}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Players</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentCompetitions.map(comp => (
                  <tr key={comp.id}>
                    <td>{comp.name}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[comp.status.toLowerCase()]}`}>
                        {comp.status}
                      </span>
                    </td>
                    <td>{comp.players}</td>
                    <td>{comp.startTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3>Recent Puzzles</h3>
            <Link to="/admin/puzzles">View All →</Link>
          </div>
          <div className={styles.table}>
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Difficulty</th>
                  <th>Category</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {recentPuzzles.map(puzzle => (
                  <tr key={puzzle.id}>
                    <td>{puzzle.title}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[puzzle.difficulty.toLowerCase()]}`}>
                        {puzzle.difficulty}
                      </span>
                    </td>
                    <td>{puzzle.category}</td>
                    <td>{puzzle.created}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
