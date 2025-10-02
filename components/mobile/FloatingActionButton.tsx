import React, { useContext } from 'react';
import { Icon } from '../Icon';
import { AppContext } from '../../store/AppContext';
import { useSafeAreaInsets } from '../../hooks/useSafeAreaInsets';

/**
 * FloatingActionButton serves as the primary entry point for mobile interactions.
 * 
 * Features:
 * - Positioned in bottom-right corner with safe area insets
 * - Context-sensitive functionality (toolbar toggle by default, properties when component selected)
 * - Visual indicator badge for active selections or notifications
 * - Touch-optimized size (56px) following Material Design guidelines
 * - Respects iOS safe areas (notch, home indicator)
 */
export const FloatingActionButton: React.FC = () => {
    const { state, toggleMobileToolbar, setActiveMobilePanel } = useContext(AppContext);
    const { selectedComponentIds, isMobileToolbarVisible } = state;
    const safeAreaInsets = useSafeAreaInsets();

    const hasSelection = selectedComponentIds.length > 0;

    const handleFABClick = () => {
        if (hasSelection && !isMobileToolbarVisible) {
            // If components are selected and toolbar is closed, show properties panel
            setActiveMobilePanel('properties');
        } else {
            // Default action: toggle mobile toolbar
            toggleMobileToolbar();
        }
    };

    const getIcon = () => {
        if (isMobileToolbarVisible) return 'x';
        if (hasSelection) return 'settings';
        return 'plus';
    };

    const getAriaLabel = () => {
        if (isMobileToolbarVisible) return 'Close toolbar';
        if (hasSelection) return 'Open properties panel';
        return 'Open toolbar';
    };

    return (
        <button
            onClick={handleFABClick}
            className={`
                fixed z-30
                w-14 h-14 rounded-full shadow-lg
                flex items-center justify-center
                transition-all duration-300 ease-in-out
                ${isMobileToolbarVisible 
                    ? 'bg-slate-600 dark:bg-slate-700 rotate-0' 
                    : hasSelection
                        ? 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600'
                        : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600'
                }
                hover:shadow-xl active:scale-95
                focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800
            `}
            style={{
                bottom: `${24 + safeAreaInsets.bottom}px`,
                right: `${24 + safeAreaInsets.right}px`,
            }}
            aria-label={getAriaLabel()}
        >
            <Icon 
                name={getIcon()} 
                className={`w-6 h-6 text-white transition-transform duration-200 ${
                    isMobileToolbarVisible ? 'rotate-0' : 'rotate-0'
                }`} 
            />
            
            {/* Selection count badge */}
            {hasSelection && selectedComponentIds.length > 1 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                        {selectedComponentIds.length > 9 ? '9+' : selectedComponentIds.length}
                    </span>
                </div>
            )}
        </button>
    );
};