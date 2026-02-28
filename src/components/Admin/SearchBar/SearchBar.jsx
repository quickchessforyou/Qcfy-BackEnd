import PropTypes from 'prop-types';
import { FaSearch } from 'react-icons/fa';
import styles from './SearchBar.module.css';

function SearchBar({ value, onChange, placeholder = 'Search...', className = '' }) {
  return (
    <div className={`${styles.searchBar} ${className}`}>
      <FaSearch className={styles.searchIcon} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={styles.searchInput}
      />
    </div>
  );
}

SearchBar.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
};

export default SearchBar;
