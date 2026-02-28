import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import styles from './IconButton.module.css';

function IconButton({ 
  icon: Icon, 
  onClick, 
  to, 
  variant = 'default',
  title,
  className = '' 
}) {
  const buttonClass = `${styles.iconButton} ${styles[variant]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={buttonClass} title={title}>
        <Icon />
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={buttonClass} title={title} type="button">
      <Icon />
    </button>
  );
}

IconButton.propTypes = {
  icon: PropTypes.elementType.isRequired,
  onClick: PropTypes.func,
  to: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'primary', 'danger', 'success']),
  title: PropTypes.string,
  className: PropTypes.string,
};

export default IconButton;
