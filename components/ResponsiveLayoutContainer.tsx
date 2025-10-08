import React, { useContext } from 'react';
import { useStore } from '../store/store';

interface ResponsiveLayoutContainerProps {
    webUI: React.ReactNode;
    mobileUI: React.ReactNode;
}

/**
 * ResponsiveLayoutContainer manages the rendering of dual mobile/web UI layouts.
 * 
 * Design Principles:
 * - Maintains separate layout trees for mobile and web interfaces
 * - Ensures seamless switching between UI modes based on isMobileMode state
 * - Preserves component state during layout transitions
 * - Uses conditional rendering for optimal performance
 */
export const ResponsiveLayoutContainer: React.FC<ResponsiveLayoutContainerProps> = ({
    webUI,
    mobileUI
}) => {
    const { isMobileMode } = useStore();

    // Use conditional rendering instead of CSS display to ensure proper component lifecycle
    // This prevents issues with canvas sizing and event handling during mode switches
    return (
        <>
            {isMobileMode ? mobileUI : webUI}
        </>
    );
};