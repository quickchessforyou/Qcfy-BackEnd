import PropTypes from 'prop-types';
import styles from './PageHeader.module.css';

function PageHeader({ icon: Icon, title, subtitle, action }) {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.headerContent}>
        <h2 className={styles.title}>
          {Icon && <Icon className={styles.icon} />}
          {title}
        </h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {action && <div className={styles.headerAction}>{action}</div>}
    </div>
  );
}

PageHeader.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  action: PropTypes.node,
};

export default PageHeader;
