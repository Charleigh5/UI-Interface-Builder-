

import React, { useContext, useEffect } from 'react';
import { AppContext } from './store/AppContext';
import { useMobileDetection } from './hooks/useMobileDetection';
import { ResponsiveLayoutContainer } from './components/ResponsiveLayoutContainer';
import { WebLayout } from './components/web/WebLayout';
import { MobileLayout } from './components/mobile/MobileLayout';

export default function App() {
    const { state, duplicateComponents, setMobileMode } = useContext(AppContext);
    const isMobile = useMobileDetection();

    // Theme management - applies to both mobile and web UI
    useEffect(() => {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(state.theme);
    }, [state.theme]);

    // Mobile mode detection and state synchronization
    useEffect(() => {
        setMobileMode(isMobile);
    }, [isMobile, setMobileMode]);

    // Global keyboard shortcuts - work in both mobile and web UI
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                duplicateComponents();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [duplicateComponents]);

    return (
        <ResponsiveLayoutContainer
            webUI={<WebLayout />}
            mobileUI={<MobileLayout />}
        />
    );
}