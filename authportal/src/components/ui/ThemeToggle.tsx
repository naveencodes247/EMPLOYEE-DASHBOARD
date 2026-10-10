import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode (currently ${theme} mode)`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`relative inline-flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--border-subtle)]
        bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)]
        transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]
        active:scale-95 ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-[#D4AF37] transition-transform duration-200 rotate-0" aria-hidden="true" />
      ) : (
        <Moon className="w-4 h-4 text-[#575A65] transition-transform duration-200 rotate-0" aria-hidden="true" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
};
