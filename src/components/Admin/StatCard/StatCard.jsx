import PropTypes from 'prop-types';
import styles from './StatCard.module.css';

function StatCard({ icon: Icon, label, value, change, color }) {
  return (
    <div className={styles.statCard} style={{ borderTopColor: color }}>
      <div className={styles.statIcon} style={{ background: `${color}20`, color }}>
        <Icon />
      </div>
      <div className={styles.statInfo}>
        <h3 className={styles.statValue}>{value}</h3>
        <p className={styles.statLabel}>{label}</p>
        {change && <span className={styles.statChange}>{change}</span>}
      </div>
    </div>
  );
}

StatCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  change: PropTypes.string,
  color: PropTypes.string.isRequired,
};

export default StatCard;
