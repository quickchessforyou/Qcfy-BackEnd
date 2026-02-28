import { useTheme } from '../../contexts/ThemeContext';
import styles from './ThemeModal.module.css';

// Import piece previews
import whiteKnight1 from '../../assets/pieces/whiteknight.svg';
import whiteKnight2 from '../../assets/pieces2/whiteknight.svg';
import whiteKnight3 from '../../assets/pieces3/whiteknight.svg';

// Import icons for Light/Dark mode
import { FaSun, FaMoon, FaCheck, FaTimes } from 'react-icons/fa';

function ThemeModal({ isOpen, onClose }) {
  const {
    boardTheme,
    setBoardTheme,
    pieceSet,
    setPieceSet,
    boardThemes,
    pieceSets,
    darkMode,
    toggleTheme
  } = useTheme();

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} />
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Customize Experience</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.content}>

          {/* App Appearance Section */}
          <div className={styles.section}>
            <h3>App Appearance</h3>
            <div className={styles.modeToggleContainer}>
              <button
                className={`${styles.modeBtn} ${!darkMode ? styles.active : ''}`}
                onClick={() => !darkMode || toggleTheme()}
              >
                <FaSun className={styles.modeIcon} /> Light Mode
              </button>
              <button
                className={`${styles.modeBtn} ${darkMode ? styles.active : ''}`}
                onClick={() => darkMode || toggleTheme()}
              >
                <FaMoon className={styles.modeIcon} /> Dark Mode
              </button>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Board Theme Section */}
          <div className={styles.section}>
            <h3>Board Theme</h3>
            <div className={styles.themeGrid}>
              {Object.entries(boardThemes).map(([key, theme]) => (
                <div
                  key={key}
                  className={`${styles.themeCard} ${boardTheme === key ? styles.active : ''}`}
                  onClick={() => setBoardTheme(key)}
                >
                  <div className={styles.boardPreview}>
                    <div className={styles.square} style={{ backgroundColor: theme.light }} />
                    <div className={styles.square} style={{ backgroundColor: theme.dark }} />
                    <div className={styles.square} style={{ backgroundColor: theme.dark }} />
                    <div className={styles.square} style={{ backgroundColor: theme.light }} />
                  </div>
                  <span className={styles.themeName}>{theme.name}</span>
                  {boardTheme === key && <div className={styles.checkmark}><FaCheck /></div>}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.divider} />

          {/* Piece Set Section */}
          <div className={styles.section}>
            <h3>Piece Style</h3>
            <div className={styles.pieceGrid}>
              {/* Manual mapping for piece sets if not available in context object, or use existing logic */}
              <div
                className={`${styles.pieceCard} ${pieceSet === 'default' ? styles.active : ''}`}
                onClick={() => setPieceSet('default')}
              >
                <div className={styles.piecePreview}>
                  <img src={whiteKnight1} alt="Classic pieces" className={styles.pieceImg} />
                </div>
                <span className={styles.pieceName}>Classic</span>
                {pieceSet === 'default' && <div className={styles.checkmark}><FaCheck /></div>}
              </div>

              <div
                className={`${styles.pieceCard} ${pieceSet === 'modern' ? styles.active : ''}`}
                onClick={() => setPieceSet('modern')}
              >
                <div className={styles.piecePreview}>
                  <img src={whiteKnight2} alt="Modern pieces" className={styles.pieceImg} />
                </div>
                <span className={styles.pieceName}>Modern</span>
                {pieceSet === 'modern' && <div className={styles.checkmark}><FaCheck /></div>}
              </div>

              <div
                className={`${styles.pieceCard} ${pieceSet === 'elegant' ? styles.active : ''}`}
                onClick={() => setPieceSet('elegant')}
              >
                <div className={styles.piecePreview}>
                  <img src={whiteKnight3} alt="Elegant pieces" className={styles.pieceImg} />
                </div>
                <span className={styles.pieceName}>Elegant</span>
                {pieceSet === 'elegant' && <div className={styles.checkmark}><FaCheck /></div>}
              </div>
            </div>
          </div>
        </div>

        <button className={styles.footer} onClick={onClose}>
          Apply Changes
        </button>
      </div>
    </>
  );
}

export default ThemeModal;
