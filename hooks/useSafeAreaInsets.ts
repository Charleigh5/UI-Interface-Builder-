import { useState, useEffect } from 'react';

export interface SafeAreaInsets {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

/**
 * useSafeAreaInsets hook detects and provides safe area insets for mobile devices.
 * 
 * Features:
 * - Detects safe area insets using CSS environment variables
 * - Handles notch and home indicator areas on iOS devices
 * - Handles display cutouts and navigation bars on Android devices
 * - Updates on orientation changes
 * - Returns zero insets for desktop or when not needed
 * 
 * Supports:
 * - iOS: Notch, Dynamic Island, home indicator
 * - Android: Display cutouts, navigation bars, status bars
 * 
 * Usage:
 * const insets = useSafeAreaInsets();
 * style={{ paddingBottom: `${insets.bottom}px` }}
 */
export const useSafeAreaInsets = (): SafeAreaInsets => {
    const [insets, setInsets] = useState<SafeAreaInsets>({
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
    });

    useEffect(() => {
        const updateInsets = () => {
            // Check if safe area environment variables are supported
            if (typeof window === 'undefined' || !CSS.supports('padding-top: env(safe-area-inset-top)')) {
                return;
            }

            // Get computed style from a temporary element
            const testElement = document.createElement('div');
            testElement.style.position = 'fixed';
            testElement.style.top = '0';
            testElement.style.left = '0';
            testElement.style.width = '0';
            testElement.style.height = '0';
            testElement.style.paddingTop = 'env(safe-area-inset-top)';
            testElement.style.paddingRight = 'env(safe-area-inset-right)';
            testElement.style.paddingBottom = 'env(safe-area-inset-bottom)';
            testElement.style.paddingLeft = 'env(safe-area-inset-left)';
            
            document.body.appendChild(testElement);
            const computedStyle = window.getComputedStyle(testElement);
            
            const newInsets: SafeAreaInsets = {
                top: parseInt(computedStyle.paddingTop, 10) || 0,
                right: parseInt(computedStyle.paddingRight, 10) || 0,
                bottom: parseInt(computedStyle.paddingBottom, 10) || 0,
                left: parseInt(computedStyle.paddingLeft, 10) || 0,
            };
            
            document.body.removeChild(testElement);
            
            setInsets(newInsets);
        };

        // Initial check
        updateInsets();

        // Update on orientation change
        const handleOrientationChange = () => {
            setTimeout(updateInsets, 100);
        };

        window.addEventListener('orientationchange', handleOrientationChange);
        window.addEventListener('resize', updateInsets);

        return () => {
            window.removeEventListener('orientationchange', handleOrientationChange);
            window.removeEventListener('resize', updateInsets);
        };
    }, []);

    return insets;
};
