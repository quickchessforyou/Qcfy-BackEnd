import styles from './Leaderboard.module.css';

function Leaderboard() {
  const leaderboard = [
    { rank: 1, name: 'Alice Johnson', avatar: '👩', score: 2450, competitions: 45, wins: 32 },
    { rank: 2, name: 'Bob Smith', avatar: '👨', score: 2380, competitions: 42, wins: 28 },
    { rank: 3, name: 'Charlie Brown', avatar: '👦', score: 2310, competitions: 38, wins: 25 },
    { rank: 4, name: 'Diana Prince', avatar: '👩', score: 2250, competitions: 40, wins: 24 },
    { rank: 5, name: 'Eve Wilson', avatar: '👧', score: 2180, competitions: 35, wins: 22 },
    { rank: 6, name: 'Frank Miller', avatar: '👨', score: 2120, competitions: 33, wins: 20 },
    { rank: 7, name: 'Grace Lee', avatar: '👩', score: 2050, competitions: 30, wins: 18 },
    { rank: 8, name: 'Henry Ford', avatar: '👨', score: 1980, competitions: 28, wins: 16 },
  ];

  return (
    <div className={styles.leaderboard}>
      <div className={styles.header}>
        <h2>Global Leaderboard</h2>
        <p>Top performers across all competitions</p>
      </div>

      <div className={styles.filters}>
        <select className={styles.filterSelect}>
          <option>All Time</option>
          <option>This Month</option>
          <option>This Week</option>
        </select>
        <button className={styles.exportBtn}>📥 Export</button>
      </div>

      <div className={styles.podium}>
        {leaderboard.slice(0, 3).map((player, index) => (
          <div key={player.rank} className={`${styles.podiumPlace} ${styles[`place${index + 1}`]}`}>
            <div className={styles.medal}>{['🥇', '🥈', '🥉'][index]}</div>
            <div className={styles.podiumAvatar}>{player.avatar}</div>
            <h3>{player.name}</h3>
            <p className={styles.podiumScore}>{player.score} pts</p>
          </div>
        ))}
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Score</th>
              <th>Competitions</th>
              <th>Wins</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map(player => (
              <tr key={player.rank}>
                <td><strong>#{player.rank}</strong></td>
                <td>
                  <div className={styles.playerInfo}>
                    <span className={styles.avatar}>{player.avatar}</span>
                    <span>{player.name}</span>
                  </div>
                </td>
                <td><strong>{player.score}</strong></td>
                <td>{player.competitions}</td>
                <td>{player.wins}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Leaderboard;
