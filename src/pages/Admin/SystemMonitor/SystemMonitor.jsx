import styles from './SystemMonitor.module.css';

function SystemMonitor() {
  const systemHealth = [
    { name: 'API Server', status: 'Healthy', uptime: '99.9%', responseTime: '45ms' },
    { name: 'Database', status: 'Healthy', uptime: '99.8%', responseTime: '12ms' },
    { name: 'WebSocket', status: 'Healthy', uptime: '99.7%', responseTime: '8ms' },
    { name: 'Cache Server', status: 'Warning', uptime: '98.5%', responseTime: '120ms' },
  ];

  const logs = [
    { time: '10:45:23', level: 'INFO', message: 'User login successful - user@example.com' },
    { time: '10:44:15', level: 'INFO', message: 'Competition started - Spring Championship' },
    { time: '10:43:02', level: 'WARNING', message: 'High memory usage detected - 85%' },
    { time: '10:42:30', level: 'ERROR', message: 'Failed to connect to cache server' },
    { time: '10:41:18', level: 'INFO', message: 'Puzzle created - Checkmate in 3' },
  ];

  return (
    <div className={styles.monitor}>
      <div className={styles.header}>
        <h2>System Monitoring</h2>
        <p>Monitor system health and performance</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>🔌 Active Connections</h3>
          <p className={styles.bigNumber}>1,234</p>
        </div>
        <div className={styles.statCard}>
          <h3>💾 Memory Usage</h3>
          <p className={styles.bigNumber}>65%</p>
        </div>
        <div className={styles.statCard}>
          <h3>⚡ CPU Usage</h3>
          <p className={styles.bigNumber}>42%</p>
        </div>
        <div className={styles.statCard}>
          <h3>📡 Network</h3>
          <p className={styles.bigNumber}>125 MB/s</p>
        </div>
      </div>

      <div className={styles.healthSection}>
        <h3>Service Health</h3>
        <div className={styles.healthGrid}>
          {systemHealth.map((service, index) => (
            <div key={index} className={styles.healthCard}>
              <div className={styles.healthHeader}>
                <h4>{service.name}</h4>
                <span className={`${styles.statusBadge} ${styles[service.status.toLowerCase()]}`}>
                  {service.status}
                </span>
              </div>
              <div className={styles.healthStats}>
                <div>
                  <span>Uptime:</span>
                  <strong>{service.uptime}</strong>
                </div>
                <div>
                  <span>Response:</span>
                  <strong>{service.responseTime}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.logsSection}>
        <h3>System Logs</h3>
        <div className={styles.logsContainer}>
          {logs.map((log, index) => (
            <div key={index} className={`${styles.logEntry} ${styles[log.level.toLowerCase()]}`}>
              <span className={styles.logTime}>{log.time}</span>
              <span className={styles.logLevel}>{log.level}</span>
              <span className={styles.logMessage}>{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SystemMonitor;
