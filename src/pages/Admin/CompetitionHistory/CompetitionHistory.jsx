import { FaHistory, FaTrophy, FaUsers, FaClock, FaEye } from 'react-icons/fa';
import styles from './CompetitionHistory.module.css';

function CompetitionHistory() {
  const history = [
    { id: 1, name: 'Spring Championship 2024', date: '2024-03-15', players: 256, winner: 'Alice Johnson', duration: '3 hours' },
    { id: 2, name: 'Rapid Blitz Tournament', date: '2024-02-28', players: 128, winner: 'Bob Smith', duration: '1 hour' },
    { id: 3, name: 'Weekly Puzzle Rush', date: '2024-02-20', players: 180, winner: 'Charlie Brown', duration: '2 hours' },
    { id: 4, name: 'Beginner Championship', date: '2024-02-10', players: 95, winner: 'Diana Prince', duration: '1.5 hours' },
    { id: 5, name: 'Master Challenge', date: '2024-01-30', players: 64, winner: 'Eve Wilson', duration: '4 hours' },
  ];

  return (
    <div className={styles.history}>
      <div className={styles.header}>
        <div>
          <h2><FaHistory /> Competition History</h2>
          <p>View past competitions and results</p>
        </div>
        <button className={styles.exportBtn}>
          Export History
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Competition Name</th>
              <th>Date</th>
              <th>Players</th>
              <th>Winner</th>
              <th>Duration</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {history.map(comp => (
              <tr key={comp.id}>
                <td>
                  <div className={styles.compName}>
                    <FaTrophy className={styles.icon} />
                    {comp.name}
                  </div>
                </td>
                <td>{comp.date}</td>
                <td>
                  <div className={styles.players}>
                    <FaUsers className={styles.icon} />
                    {comp.players}
                  </div>
                </td>
                <td><strong>{comp.winner}</strong></td>
                <td>
                  <div className={styles.duration}>
                    <FaClock className={styles.icon} />
                    {comp.duration}
                  </div>
                </td>
                <td>
                  <button className={styles.viewBtn}>
                    <FaEye /> View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CompetitionHistory;
