import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

export const useMobileDetection = () => {
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth < MOBILE_BREAKPOINT;
        }
        return false;
    });

    useEffect(() => {
        const handleResize = () => {
            const newIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
            if (newIsMobile !== isMobile) {
                setIsMobile(newIsMobile);
            }
        };

        window.addEventListener('resize', handleResize);
        
        // Initial check
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [isMobile]);

    return isMobile;
};