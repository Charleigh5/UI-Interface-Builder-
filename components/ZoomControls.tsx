
import React, { useContext, useCallback, useMemo, useEffect } from 'react';
import { AppContext } from '../store/AppContext';
import { Icon } from './Icon';

/**
 * ZoomControls component with dual mobile/web UI support
 * 
 * Industry Best Practices Implemented:
 * - WCAG 2.1 AA compliance with 48px minimum touch targets for mobile
 * - iOS HIG and Material Design guidelines adherence
 * - Performance optimization with memoization and useCallback
 * - Responsive design with mobile-first approach
 * - Safe area inset support for mobile devices
 * - Accessibility enhancements with proper ARIA labels
 * - TypeScript strict mode compliance
 */
export const ZoomControls: React.FC = () => {
    const { state, setViewTransform } = useContext(AppContext);
    const { zoom, isMobileMode } = state;

    // Performance optimization: Memoize zoom factor calculation
    const zoomFactor = useMemo(() => 1.2, []);
    const minZoom = useMemo(() => 0.1, []);
    const maxZoom = useMemo(() => 4, []);

    // Performance optimization: Memoize zoom percentage calculation
    const zoomPercentage = useMemo(() => Math.round(zoom * 100), [zoom]);

    // Haptic feedback for mobile interactions (following industry best practices)
    const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'selection' = 'light') => {
        if (!isMobileMode || typeof navigator === 'undefined') return;
        
        try {
            // Modern Vibration API with pattern support
            if ('vibrate' in navigator) {
                const patterns = {
                    light: [10],
                    medium: [20],
                    selection: [5, 5, 5]
                };
                
                navigator.vibrate(patterns[type]);
            }
        } catch (error) {
            // Silently fail if haptic feedback is not supported (graceful degradation)
            console.debug('Haptic feedback not supported:', error);
        }
    }, [isMobileMode]);

    // Performance optimization: Memoized zoom handler with useCallback and error handling
    const handleZoom = useCallback((direction: 'in' | 'out') => {
        try {
            const newZoom = direction === 'in' ? zoom * zoomFactor : zoom / zoomFactor;
            const clampedZoom = Math.max(minZoom, Math.min(newZoom, maxZoom));
            
            // Only update if zoom actually changes (performance optimization)
            if (Math.abs(clampedZoom - zoom) > 0.001) { // Use epsilon for floating point comparison
                setViewTransform({ zoom: clampedZoom });
                // Trigger haptic feedback for mobile users
                triggerHapticFeedback('light');
            }
        } catch (error) {
            console.error('Error in zoom handler:', error);
            // Graceful degradation: attempt to reset to safe state
            try {
                setViewTransform({ zoom: 1 });
            } catch (resetError) {
                console.error('Failed to reset zoom:', resetError);
            }
        }
    }, [zoom, zoomFactor, minZoom, maxZoom, setViewTransform, triggerHapticFeedback]);

    // Performance optimization: Memoized reset handler with error handling
    const handleReset = useCallback(() => {
        try {
            // Only reset if not already at default values (performance optimization)
            const isAtDefault = Math.abs(zoom - 1) < 0.001 && 
                               Math.abs(state.pan.x) < 0.001 && 
                               Math.abs(state.pan.y) < 0.001;
            
            if (!isAtDefault) {
                setViewTransform({ zoom: 1, pan: { x: 0, y: 0 } });
                // Trigger distinctive haptic feedback for reset action
                triggerHapticFeedback('selection');
            }
        } catch (error) {
            console.error('Error in reset handler:', error);
            // Graceful degradation: still attempt reset even if error occurs
            try {
                setViewTransform({ zoom: 1, pan: { x: 0, y: 0 } });
            } catch (resetError) {
                console.error('Failed to reset view:', resetError);
            }
        }
    }, [zoom, state.pan.x, state.pan.y, setViewTransform, triggerHapticFeedback]);

    // Keyboard accessibility: Support for keyboard shortcuts (industry best practice)
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Only handle keyboard shortcuts when zoom controls are relevant
            if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
                return; // Don't interfere with form inputs
            }

            // Standard zoom keyboard shortcuts (following industry conventions)
            if ((event.metaKey || event.ctrlKey) && !event.shiftKey && !event.altKey) {
                switch (event.key) {
                    case '=':
                    case '+':
                        event.preventDefault();
                        handleZoom('in');
                        break;
                    case '-':
                        event.preventDefault();
                        handleZoom('out');
                        break;
                    case '0':
                        event.preventDefault();
                        handleReset();
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleZoom, handleReset]);

    // Performance monitoring: Track component render performance (development only)
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            const startTime = performance.now();
            return () => {
                const endTime = performance.now();
                const renderTime = endTime - startTime;
                if (renderTime > 16) { // Flag renders longer than 16ms (60fps threshold)
                    console.debug(`ZoomControls render took ${renderTime.toFixed(2)}ms`);
                }
            };
        }
    });

    // Responsive design: Mobile-aware styling classes
    const containerClasses = useMemo(() => {
        const baseClasses = "flex items-center shadow-lg border transition-all duration-200 ease-in-out";
        const backgroundClasses = "bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-md";
        const borderClasses = "border-slate-200 dark:border-slate-700";
        
        if (isMobileMode) {
            // Mobile UI: Bottom-left positioning with safe area insets and larger spacing
            return `fixed bottom-4 left-4 ${baseClasses} ${backgroundClasses} ${borderClasses} gap-2 p-2 rounded-xl z-20
                    pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))]`;
        } else {
            // Web UI: Bottom-right positioning with compact design (preserve existing behavior)
            return `absolute bottom-4 right-4 ${baseClasses} ${backgroundClasses} ${borderClasses} gap-1 p-1 rounded-lg`;
        }
    }, [isMobileMode]);

    // Responsive design: Mobile-aware button styling with disabled states
    const getButtonClasses = useCallback((disabled: boolean = false) => {
        const baseClasses = "flex items-center justify-center rounded-lg transition-all duration-150 ease-in-out";
        const focusClasses = "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800";
        
        // Conditional styling based on disabled state
        const interactionClasses = disabled 
            ? "opacity-50 cursor-not-allowed" 
            : "hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 cursor-pointer";
        
        if (isMobileMode) {
            // Mobile UI: 48px minimum touch targets (WCAG 2.1 AA + Material Design compliance)
            return `${baseClasses} ${interactionClasses} ${focusClasses} w-12 h-12 touch-manipulation`;
        } else {
            // Web UI: Compact 32px buttons for desktop precision
            return `${baseClasses} ${interactionClasses} ${focusClasses} w-8 h-8`;
        }
    }, [isMobileMode]);

    // Responsive design: Mobile-aware reset button styling
    const resetButtonClasses = useMemo(() => {
        const baseClasses = "flex items-center justify-center rounded-lg transition-all duration-150 ease-in-out font-semibold";
        const hoverClasses = "hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95";
        const focusClasses = "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800";
        const textClasses = "text-slate-700 dark:text-slate-200";
        
        if (isMobileMode) {
            // Mobile UI: Larger reset button with minimum 48px height
            return `${baseClasses} ${hoverClasses} ${focusClasses} ${textClasses} px-4 h-12 text-base touch-manipulation`;
        } else {
            // Web UI: Compact reset button
            return `${baseClasses} ${hoverClasses} ${focusClasses} ${textClasses} px-3 h-8 text-sm`;
        }
    }, [isMobileMode]);

    // Responsive design: Mobile-aware icon sizing
    const iconClasses = useMemo(() => {
        const baseClasses = "text-slate-600 dark:text-slate-300";
        
        if (isMobileMode) {
            // Mobile UI: Larger icons for better visibility and touch interaction
            return `${baseClasses} w-6 h-6`;
        } else {
            // Web UI: Standard icon size
            return `${baseClasses} w-5 h-5`;
        }
    }, [isMobileMode]);

    // Accessibility: Enhanced ARIA labels for mobile context
    const getAriaLabel = useCallback((action: string) => {
        const zoomLevel = `Current zoom: ${zoomPercentage}%`;
        switch (action) {
            case 'zoom-out':
                return `Zoom out. ${zoomLevel}. Minimum zoom: ${minZoom * 100}%`;
            case 'zoom-in':
                return `Zoom in. ${zoomLevel}. Maximum zoom: ${maxZoom * 100}%`;
            case 'reset':
                return `Reset zoom to 100%. ${zoomLevel}`;
            default:
                return action;
        }
    }, [zoomPercentage, minZoom, maxZoom]);

    return (
        <div 
            className={containerClasses}
            role="toolbar"
            aria-label="Zoom controls"
            aria-orientation="horizontal"
        >
            {/* Zoom Out Button */}
            <button
                onClick={() => handleZoom('out')}
                className={getButtonClasses(zoom <= minZoom)}
                disabled={zoom <= minZoom}
                aria-label={getAriaLabel('zoom-out')}
                title={isMobileMode ? undefined : "Zoom Out"} // Remove title on mobile to prevent tooltip conflicts
            >
                <Icon 
                    name="zoom-out" 
                    className={iconClasses}
                    aria-hidden="true"
                />
            </button>

            {/* Reset/Zoom Percentage Button */}
            <button
                onClick={handleReset}
                className={resetButtonClasses}
                aria-label={getAriaLabel('reset')}
                title={isMobileMode ? undefined : "Reset View"}
            >
                <span aria-hidden="true">{zoomPercentage}%</span>
            </button>

            {/* Zoom In Button */}
            <button
                onClick={() => handleZoom('in')}
                className={getButtonClasses(zoom >= maxZoom)}
                disabled={zoom >= maxZoom}
                aria-label={getAriaLabel('zoom-in')}
                title={isMobileMode ? undefined : "Zoom In"}
            >
                <Icon 
                    name="zoom-in" 
                    className={iconClasses}
                    aria-hidden="true"
                />
            </button>
        </div>
    );
};
