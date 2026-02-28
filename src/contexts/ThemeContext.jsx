import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [boardTheme, setBoardTheme] = useState(() => {
    return localStorage.getItem('boardTheme') || 'classic';
  });

  const [pieceSet, setPieceSet] = useState(() => {
    return localStorage.getItem('pieceSet') || 'default';
  });

  useEffect(() => {
    localStorage.setItem('boardTheme', boardTheme);
  }, [boardTheme]);

  useEffect(() => {
    localStorage.setItem('pieceSet', pieceSet);
  }, [pieceSet]);

  const [darkMode, setDarkMode] = useState(() => {
    // Check local storage or system preference
    const stored = localStorage.getItem('appTheme');
    if (stored) return stored === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const themeName = darkMode ? 'dark' : 'light';
    localStorage.setItem('appTheme', themeName);
    document.documentElement.setAttribute('data-theme', themeName);
  }, [darkMode]);

  const toggleLoginTheme = () => {
    setDarkMode(prev => !prev);
  }

  const boardThemes = {
    classic: {
      name: 'Classic',
      light: '#f0d9b5',
      dark: '#b58863'
    },
    wooden: {
      name: 'Wooden',
      light: '#f0e6d2',
      dark: '#8b7355'
    },
    blue: {
      name: 'Blue',
      light: '#e8eef7',
      dark: '#7fa3d1'
    },
    green: {
      name: 'Green',
      light: '#ffffdd',
      dark: '#86a666'
    },
    marble: {
      name: 'Marble',
      light: '#e8e8e8',
      dark: '#9e9e9e'
    },
    tournament: {
      name: 'Tournament',
      light: '#ffffff',
      dark: '#769656'
    }
  };

  const pieceSets = {
    default: {
      name: 'Classic',
      folder: 'pieces'
    },
    modern: {
      name: 'Modern',
      folder: 'pieces2'
    },
    elegant: {
      name: 'Elegant',
      folder: 'pieces3'
    }
  };

  const value = {
    boardTheme,
    setBoardTheme,
    pieceSet,
    setPieceSet,
    boardThemes,
    pieceSets,
    currentBoardColors: boardThemes[boardTheme],
    darkMode,
    toggleTheme: toggleLoginTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
