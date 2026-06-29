import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const ThemeToggle = ({ isFloating = true }) => {
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/login' || location.pathname === '/register') {
      document.body.classList.remove('dark');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsDark(false);
      return;
    }

    let savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Default to light theme for Customer Menu unless explicitly changed
    if (location.pathname.startsWith('/menu/') && !savedTheme) {
      savedTheme = 'light';
    }

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.body.classList.add('dark');
    } else {
      setIsDark(false);
      document.body.classList.remove('dark');
    }
  }, [location.pathname]);

  const toggleTheme = () => {
    if (isDark) {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  const style = isFloating ? {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 9999,
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--card-bg)',
    color: 'var(--text-primary)',
    boxShadow: 'var(--shadow-float)',
    border: '1px solid rgba(150, 150, 150, 0.2)',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  } : {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.75rem',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: 'var(--card-bg)',
    color: 'var(--text-primary)',
    width: '100%',
    fontWeight: 500,
    boxShadow: 'var(--shadow-soft)',
    transition: 'all 0.3s ease'
  };

  return (
    <button 
      onClick={toggleTheme} 
      style={style} 
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      {isDark ? <Sun size={24} color="#f59e0b" /> : <Moon size={24} color="#4f46e5" />}
      {!isFloating && (isDark ? 'Light Mode' : 'Dark Mode')}
    </button>
  );
};

export default ThemeToggle;
