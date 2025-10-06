

import React, { useContext, useEffect } from 'react';
import { AppContext } from './store/AppContext';
import { useMobileDetection } from './hooks/useMobileDetection';
import { ResponsiveLayoutContainer } from './components/ResponsiveLayoutContainer';
import { WebLayout } from './components/web/WebLayout';
import { MobileLayout } from './components/mobile/MobileLayout';
import { getPerformanceMonitor } from './utils/performanceMonitor';

function AppContent() {
    const { 
        state, 
        duplicateComponents, 
        setMobileMode,
        dispatch,
        groupComponents,
        ungroupComponents,
        bringToFront,
        sendToBack
    } = useContext(AppContext);
    const isMobile = useMobileDetection();

    // Load user's theme preference on mount
    useEffect(() => {
        try {
            const savedTheme = localStorage.getItem('theme-preference');
            if (savedTheme === 'dark' || savedTheme === 'light') {
                dispatch({ type: 'SET_THEME', payload: savedTheme });
            } else {
                // Check system preference
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                dispatch({ type: 'SET_THEME', payload: prefersDark ? 'dark' : 'light' });
            }
        } catch (error) {
            console.debug('Could not load theme preference:', error);
        }
    }, [dispatch]);

    // Theme management - applies to both mobile and web UI
    useEffect(() => {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(state.theme);
        
        // Add smooth transition class for theme changes
        document.documentElement.style.setProperty('color-scheme', state.theme);
    }, [state.theme]);

    // Mobile mode detection and state synchronization
    // Ensures canvas state is preserved when switching between mobile/web UI modes
    useEffect(() => {
        setMobileMode(isMobile);
    }, [isMobile, setMobileMode]);

    // Handle orientation changes for mobile devices
    // Ensures proper layout recalculation on orientation change
    useEffect(() => {
        const handleOrientationChange = () => {
            // Force a re-render to recalculate canvas dimensions
            window.dispatchEvent(new Event('resize'));
        };

        window.addEventListener('orientationchange', handleOrientationChange);
        return () => {
            window.removeEventListener('orientationchange', handleOrientationChange);
        };
    }, []);

    // Performance monitoring for mobile UI
    // Ensures 60fps animations and optimizes for battery efficiency
    useEffect(() => {
        if (!isMobile) return;

        const monitor = getPerformanceMonitor({
            enableLogging: process.env.NODE_ENV === 'development',
        });

        monitor.start();

        // Apply optimizations every 5 seconds
        const interval = setInterval(() => {
            monitor.applyOptimizations();
        }, 5000);

        return () => {
            clearInterval(interval);
            monitor.stop();
        };
    }, [isMobile]);

    // Global keyboard shortcuts - work in both mobile and web UI
    // Supports mobile devices with external keyboards
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isMod = e.metaKey || e.ctrlKey;
            const key = e.key.toLowerCase();

            // Prevent default for all our shortcuts
            const shouldPreventDefault = () => {
                if (isMod && key === 'd') return true;
                if (isMod && key === 'g') return true;
                if (isMod && e.shiftKey && key === 'g') return true;
                if (isMod && key === ']') return true;
                if (isMod && key === '[') return true;
                if (key === 'delete' || key === 'backspace') return state.selectedComponentIds.length > 0;
                return false;
            };

            if (shouldPreventDefault()) {
                e.preventDefault();
            }

            // Duplicate: Cmd/Ctrl + D
            if (isMod && key === 'd') {
                duplicateComponents();
            }
            
            // Group: Cmd/Ctrl + G
            if (isMod && !e.shiftKey && key === 'g') {
                if (state.selectedComponentIds.length >= 2) {
                    groupComponents();
                }
            }
            
            // Ungroup: Cmd/Ctrl + Shift + G
            if (isMod && e.shiftKey && key === 'g') {
                if (state.selectedComponentIds.length === 1) {
                    const component = state.components.find(c => c.id === state.selectedComponentIds[0]);
                    if (component?.type === 'group') {
                        ungroupComponents();
                    }
                }
            }
            
            // Bring to Front: Cmd/Ctrl + ]
            if (isMod && key === ']') {
                if (state.selectedComponentIds.length > 0) {
                    bringToFront();
                }
            }
            
            // Send to Back: Cmd/Ctrl + [
            if (isMod && key === '[') {
                if (state.selectedComponentIds.length > 0) {
                    sendToBack();
                }
            }
            
            // Delete: Delete or Backspace
            if ((key === 'delete' || key === 'backspace') && state.selectedComponentIds.length > 0) {
                // Only delete if not focused on an input element
                const activeElement = document.activeElement;
                const isInputFocused = activeElement?.tagName === 'INPUT' || 
                                      activeElement?.tagName === 'TEXTAREA' ||
                                      activeElement?.getAttribute('contenteditable') === 'true';
                
                if (!isInputFocused) {
                    state.selectedComponentIds.forEach(id => {
                        dispatch({ type: 'DELETE_COMPONENT', payload: id });
                    });
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [
        duplicateComponents, 
        groupComponents, 
        ungroupComponents, 
        bringToFront, 
        sendToBack, 
        dispatch,
        state.selectedComponentIds,
        state.components
    ]);

    return (
        <ResponsiveLayoutContainer
            webUI={<WebLayout />}
            mobileUI={<MobileLayout />}
        />
    );
}

export default function App() {
    return <AppContent />;
}