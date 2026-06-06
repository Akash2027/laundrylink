import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-6 right-6 z-50 p-3 rounded-full shadow-lg transition-all hover:scale-110"
      style={{ 
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        color: isDark ? '#f1f5f9' : '#1e293b',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
};

export default ThemeToggle;