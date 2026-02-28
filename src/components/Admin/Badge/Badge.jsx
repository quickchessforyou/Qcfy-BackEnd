import PropTypes from 'prop-types';
import styles from './Badge.module.css';

function Badge({ children, variant = 'default', icon: Icon }) {
  return (
    <span className={`${styles.badge} ${styles[variant]}`}>
      {Icon && <Icon className={styles.icon} />}
      {children}
    </span>
  );
}

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['default', 'success', 'warning', 'danger', 'info', 'live']),
  icon: PropTypes.elementType,
};

export default Badge;
