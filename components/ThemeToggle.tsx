import React, { useContext } from "react";
import { Icon } from "./Icon";
import { useStore } from "../store/store";

export const ThemeToggle: React.FC<{
  variant?: 'default' | 'mobile';
  showLabel?: boolean;
}> = ({ variant = 'default', showLabel = false }) => {
  const { theme, setTheme, isMobileMode } = useStore();
  const isDark = theme === 'dark';

  const toggle = () => {
    const next = isDark ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme-preference', next);
    if (isMobileMode && 'vibrate' in navigator) {
      (navigator as any).vibrate(10);
    }
  };

  if (variant === 'mobile') {
    return (
      <button
        onClick={toggle}
        className="flex items-center gap-3 w-full min-h-[56px] p-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        {/* Animated circle */}
        <div className="relative w-12 h-12">
          <div
            className={`absolute inset-0 rounded-full transition-colors duration-500 ${
              isDark ? 'bg-slate-700' : 'bg-amber-100'
            }`}
          />
          <div
            className={`relative z-10 transition-transform duration-500 ${
              isDark ? 'rotate-0' : 'rotate-180'
            }`}
          >
            <Icon
              name={isDark ? 'moon' : 'sun'}
              className={`w-6 h-6 transition-colors duration-300 ${
                isDark ? 'text-blue-400' : 'text-amber-600'
              }`}
            />
          </div>
        </div>

        {showLabel && (
          <div className="flex-1 text-left">
            <div className="font-medium">{isDark ? 'Dark Mode' : 'Light Mode'}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {isDark ? 'Easy on the eyes' : 'Bright and clear'}
            </div>
          </div>
        )}

        {/* Toggle switch */}
        <div
          className={`w-12 h-6 rounded-full transition-colors duration-300 ${
            isDark ? 'bg-blue-600' : 'bg-slate-300'
          } relative`}
        >
          <div
            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${
              isDark ? 'left-7' : 'left-1'
            }`}
          />
        </div>
      </button>
    );
  }

  // Desktop variant
  return (
    <button
      onClick={toggle}
      className="group relative flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Background circle */}
      <div
        className={`absolute inset-1 rounded-md transition-colors duration-500 ${
          isDark ? 'bg-slate-700' : 'bg-amber-100'
        }`}
      />
      {/* Icon */}
      <div
        className={`relative z-10 transition-all duration-500 ${
          isDark ? 'rotate-0' : 'rotate-180'
        }`}
      >
        <Icon
          name={isDark ? 'moon' : 'sun'}
          className={`w-5 h-5 transition-colors duration-300 ${
            isDark ? 'text-blue-400' : 'text-amber-600'
          }`}
        />
      </div>
      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {isDark ? 'Light mode' : 'Dark mode'}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
      </div>
    </button>
  );
};