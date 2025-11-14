import React, { useContext } from 'react';
import { Icon } from '../Icon';
import { AppContext } from '../../store/AppContext';
import { useSafeAreaInsets } from '../../hooks/useSafeAreaInsets';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

export const FloatingActionButton: React.FC = () => {
  const { state, toggleMobileToolbar, setActiveMobilePanel } = useContext(AppContext);
  const insets = useSafeAreaInsets();
  const { triggerHapticFeedback } = useHapticFeedback(true);

  const hasSelection = state.selectedComponentIds.length > 0;
  const icon = hasSelection ? 'settings' : 'plus';
  const label = hasSelection ? 'Open properties panel' : 'Open toolbar';

  const handleClick = () => {
    triggerHapticFeedback('light');
    if (hasSelection) {
      setActiveMobilePanel('properties');
    } else {
      toggleMobileToolbar();
    }
  };

  return (
    <button
      onClick={handleClick}
      className="fixed z-30 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white shadow-lg active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
      style={{
        bottom: `calc(1.5rem + ${insets.bottom}px)`,
        right: `calc(1.5rem + ${insets.right}px)`,
      }}
      aria-label={label}
    >
      <Icon name={icon} className="w-6 h-6" />
    </button>
  );
};