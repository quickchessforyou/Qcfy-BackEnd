import PropTypes from 'prop-types';
import { FaFilter } from 'react-icons/fa';
import styles from './FilterSelect.module.css';

function FilterSelect({ value, onChange, options, label, icon: Icon, className = '' }) {
  return (
    <div className={`${styles.filterSelect} ${className}`}>
      {Icon && <Icon className={styles.filterIcon} />}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={styles.select}
        aria-label={label}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

FilterSelect.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  label: PropTypes.string,
  icon: PropTypes.elementType,
  className: PropTypes.string,
};

export default FilterSelect;
