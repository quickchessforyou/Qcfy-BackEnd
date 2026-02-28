import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import styles from './Button.module.css';

function Button({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  icon: Icon,
  onClick,
  to,
  type = 'button',
  disabled = false,
  className = ''
}) {
  const buttonClass = `${styles.button} ${styles[variant]} ${styles[size]} ${className}`;
  
  const content = (
    <>
      {Icon && <Icon className={styles.icon} />}
      <span>{children}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={buttonClass}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={buttonClass}
    >
      {content}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'success', 'outline']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  icon: PropTypes.elementType,
  onClick: PropTypes.func,
  to: PropTypes.string,
  type: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default Button;
