import React, { useContext } from 'react';
import { Canvas } from '../Canvas';
import { ZoomControls } from '../ZoomControls';
import { AppContext } from '../../store/AppContext';
import { MobileToolbar } from './MobileToolbar';
import { FloatingActionButton } from './FloatingActionButton';
import { MobilePropertiesPanel } from './MobilePropertiesPanel';
import { MobileLibraryPanel } from './MobileLibraryPanel';
import { MobileLayersPanel } from './MobileLayersPanel';
import { useSafeAreaInsets } from '../../hooks/useSafeAreaInsets';

/**
 * MobileLayout provides the full-screen canvas experience for mobile devices.
 * 
 * Key Features:
 * - Full viewport canvas with no margins or padding
 * - Mobile-optimized zoom controls positioning
 * - Touch-friendly interface design
 * - Safe area inset handling for iOS devices (notch, home indicator)
 * - Android display cutout and navigation bar support
 * - Maintains all existing canvas functionality
 * 
 * Platform Support:
 * - iOS: Safari, Chrome, PWA
 * - Android: Chrome, Firefox, Samsung Internet, PWA
 */
export const MobileLayout: React.FC = () => {
    const { state, toggleMobileToolbar, setActiveMobilePanel } = useContext(AppContext);
    const { isMobileToolbarVisible, activeMobilePanel } = state;
    const safeAreaInsets = useSafeAreaInsets();

    return (
        <div 
            className="flex flex-col h-screen w-screen bg-slate-100 dark:bg-slate-900 overflow-hidden"
            style={{
                paddingTop: `${safeAreaInsets.top}px`,
                paddingLeft: `${safeAreaInsets.left}px`,
                paddingRight: `${safeAreaInsets.right}px`,
            }}
        >
            {/* Full-screen canvas container - no padding for maximum canvas area */}
            <main className="flex-1 relative">
                <Canvas />
                
                {/* Mobile-optimized zoom controls with built-in positioning and safe area support */}
                <ZoomControls />

                {/* Floating Action Button - primary entry point for mobile interactions */}
                <FloatingActionButton />
            </main>

            {/* Mobile Toolbar - slide-up overlay */}
            <MobileToolbar 
                isVisible={isMobileToolbarVisible}
                onClose={toggleMobileToolbar}
            />

            {/* Mobile Properties Panel - full-screen modal */}
            <MobilePropertiesPanel
                isVisible={activeMobilePanel === 'properties'}
                onClose={() => setActiveMobilePanel('none')}
            />

            {/* Mobile Library Panel - full-screen modal */}
            <MobileLibraryPanel
                isVisible={activeMobilePanel === 'library'}
                onClose={() => setActiveMobilePanel('none')}
            />

            {/* Mobile Layers Panel - slide-up panel */}
            <MobileLayersPanel
                isVisible={activeMobilePanel === 'layers'}
                onClose={() => setActiveMobilePanel('none')}
            />
        </div>
    );
};