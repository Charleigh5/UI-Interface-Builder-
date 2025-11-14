import { useState, useEffect, useCallback } from 'react';

const MOBILE_BREAKPOINT = 768;

/**
 * useMobileDetection hook detects viewport changes and determines mobile mode.
 * 
 * Features:
 * - Detects viewport width below 768px as mobile
 * - Handles window resize events with debouncing
 * - Handles orientation changes
 * - Provides smooth transitions between mobile/web modes
 * - Preserves state during mode switches
 */
export const useMobileDetection = () => {
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth < MOBILE_BREAKPOINT;
        }
        return false;
    });

    const checkMobileMode = useCallback(() => {
        if (typeof window !== 'undefined') {
            const newIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
            if (newIsMobile !== isMobile) {
                setIsMobile(newIsMobile);
            }
        }
    }, [isMobile]);

    useEffect(() => {
        let resizeTimeout: NodeJS.Timeout;

        // Debounced resize handler to improve performance
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                checkMobileMode();
            }, 150);
        };

        // Immediate orientation change handler
        const handleOrientationChange = () => {
            // Small delay to allow browser to update dimensions
            setTimeout(() => {
                checkMobileMode();
            }, 100);
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleOrientationChange);
        
        // Initial check
        checkMobileMode();

        return () => {
            clearTimeout(resizeTimeout);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleOrientationChange);
        };
    }, [checkMobileMode]);

    return isMobile;
};