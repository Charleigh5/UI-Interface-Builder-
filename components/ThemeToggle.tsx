import React, { useContext } from "react";
import { Icon } from "./Icon";
import { AppContext } from "../store/AppContext";

interface ThemeToggleProps {
  variant?: "default" | "mobile";
  showLabel?: boolean;
}

/**
 * ThemeToggle component provides a smooth, animated toggle between light and dark modes.
 *
 * Features:
 * - Smooth transition animations
 * - Icon morphing between sun and moon
 * - Accessible with keyboard support
 * - Mobile and desktop variants
 * - Tooltip on hover (desktop only)
 * - Haptic feedback on mobile
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = "default",
  showLabel = false,
}) => {
  const { state, dispatch } = useContext(AppContext);
  const { theme, isMobileMode } = state;
  const isDark = theme === "dark";

  const handleToggle = () => {
    const newTheme = isDark ? "light" : "dark";
    dispatch({ type: "SET_THEME", payload: newTheme });

    // Haptic feedback on mobile
    if (isMobileMode && "vibrate" in navigator) {
      navigator.vibrate(10);
    }

    // Store preference in localStorage
    try {
      localStorage.setItem("theme-preference", newTheme);
    } catch (error) {
      console.debug("Could not save theme preference:", error);
    }
  };

  if (variant === "mobile") {
    return (
      <button
        onClick={handleToggle}
        className="flex items-center justify-center gap-3 w-full min-h-[56px] p-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 active:scale-98 touch-manipulation"
        aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      >
        <div className="relative w-12 h-12 flex items-center justify-center">
          {/* Animated background circle */}
          <div
            className={`absolute inset-0 rounded-full transition-all duration-500 ${
              isDark ? "bg-slate-700 scale-100" : "bg-amber-100 scale-100"
            }`}
          />

          {/* Icon with rotation animation */}
          <div
            className={`relative z-10 transition-transform duration-500 ${
              isDark ? "rotate-0" : "rotate-180"
            }`}
          >
            <Icon
              name={isDark ? "moon" : "sun"}
              className={`w-6 h-6 transition-colors duration-300 ${
                isDark ? "text-blue-400" : "text-amber-600"
              }`}
            />
          </div>
        </div>

        {showLabel && (
          <div className="flex-1 text-left">
            <div className="text-base font-medium text-slate-900 dark:text-slate-100">
              {isDark ? "Dark Mode" : "Light Mode"}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {isDark ? "Easy on the eyes" : "Bright and clear"}
            </div>
          </div>
        )}

        {/* Toggle indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`w-12 h-6 rounded-full transition-colors duration-300 relative ${
              isDark ? "bg-blue-600" : "bg-slate-300"
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${
                isDark ? "left-7" : "left-1"
              }`}
            />
          </div>
        </div>
      </button>
    );
  }

  // Default desktop variant
  return (
    <button
      onClick={handleToggle}
      className="relative group flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {/* Animated background */}
      <div
        className={`absolute inset-1 rounded-md transition-all duration-500 ${
          isDark ? "bg-slate-700 opacity-100" : "bg-amber-100 opacity-100"
        }`}
      />

      {/* Icon with smooth transition */}
      <div
        className={`relative z-10 transition-all duration-500 ${
          isDark ? "rotate-0 scale-100" : "rotate-180 scale-100"
        }`}
      >
        <Icon
          name={isDark ? "moon" : "sun"}
          className={`w-5 h-5 transition-colors duration-300 ${
            isDark ? "text-blue-400" : "text-amber-600"
          }`}
        />
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
        {isDark ? "Light mode" : "Dark mode"}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
      </div>
    </button>
  );
};
