import React, { useContext, useRef, useCallback, useEffect, useState } from 'react';
import { libraryItems } from '../../library/definitions';
import { Icon, IconName } from '../Icon';
import { AppContext } from '../../store/AppContext';

interface MobileLibraryPanelProps {
    isVisible: boolean;
    onClose: () => void;
}

/**
 * MobileLibraryPanel provides a full-screen modal interface for browsing and adding library components on mobile devices.
 * 
 * Design Features:
 * - Full-screen modal with header and close button
 * - Grid layout optimized for touch selection
 * - Touch-friendly component cards with large tap targets
 * - Tap-to-add functionality (replaces drag-and-drop for mobile)
 * - Swipe-down-to-dismiss functionality
 * - Search and filter capabilities
 */
export const MobileLibraryPanel: React.FC<MobileLibraryPanelProps> = ({ isVisible, onClose }) => {
    const { addLibraryComponent, state } = useContext(AppContext);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Swipe gesture handling
    const touchStartY = useRef<number>(0);
    const panelRef = useRef<HTMLDivElement>(null);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleAddComponent = (name: string) => {
        // Calculate center position of canvas
        const canvasElement = document.querySelector('canvas');
        const canvasWidth = canvasElement ? canvasElement.clientWidth : window.innerWidth;
        const canvasHeight = canvasElement ? canvasElement.clientHeight : window.innerHeight;
        
        // Account for zoom and pan
        const centerX = (canvasWidth / 2 - state.pan.x) / state.zoom;
        const centerY = (canvasHeight / 2 - state.pan.y) / state.zoom;
        
        // Get item dimensions to center it properly
        const item = libraryItems[name];
        const x = centerX - (item.width / 2);
        const y = centerY - (item.height / 2);
        
        addLibraryComponent(name, { x, y });
        onClose();
    };

    // Swipe down gesture to close panel
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - touchStartY.current;
        
        if (deltaY > 0 && panelRef.current?.scrollTop === 0) {
            e.preventDefault();
        }
    }, []);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        const currentY = e.changedTouches[0].clientY;
        const deltaY = currentY - touchStartY.current;
        const swipeThreshold = 100;
        
        if (deltaY > swipeThreshold && panelRef.current?.scrollTop === 0) {
            onClose();
        }
    }, [onClose]);

    // Keyboard support - close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isVisible) {
                onClose();
            }
        };

        if (isVisible) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isVisible, onClose]);

    // Filter library items based on search query
    const filteredItems = Object.entries(libraryItems).filter(([name, item]) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isVisible) return null;

    return (
        <>
            {/* Semi-transparent backdrop */}
            <div 
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
                onClick={handleBackdropClick}
            />
            
            {/* Full-screen modal panel */}
            <div 
                ref={panelRef}
                className={`
                    fixed inset-0 z-50
                    bg-white dark:bg-slate-900
                    transform transition-transform duration-300 ease-in-out
                    ${isVisible ? 'translate-y-0' : 'translate-y-full'}
                    flex flex-col
                    overflow-hidden
                `}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Header */}
                <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    {/* Swipe handle indicator */}
                    <div className="flex justify-center py-3">
                        <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                    </div>
                    
                    <div className="px-4 pb-4">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                                    Component Library
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    Tap to add to canvas
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                aria-label="Close library panel"
                            >
                                <Icon name="x" className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                            </button>
                        </div>

                        {/* Search bar */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search components..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-3 pl-10 text-base border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <Icon 
                                name="component" 
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" 
                            />
                        </div>
                    </div>
                </div>

                {/* Scrollable content - Grid of library items */}
                <div className="flex-1 overflow-y-auto px-4 py-6">
                    {filteredItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4">
                            <Icon name="component" className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                            <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
                                No components found
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                                Try a different search term
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                            {filteredItems.map(([name, item]) => (
                                <button
                                    key={name}
                                    onClick={() => handleAddComponent(name)}
                                    className="flex flex-col items-center p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all duration-200 active:scale-95 min-h-[120px]"
                                >
                                    {/* Icon */}
                                    <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                                        <Icon 
                                            name={item.icon as IconName} 
                                            className="w-7 h-7 text-blue-600 dark:text-blue-400" 
                                        />
                                    </div>
                                    
                                    {/* Name */}
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 text-center">
                                        {item.name}
                                    </h3>
                                    
                                    {/* Dimensions */}
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        {item.width} × {item.height}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                    
                    {/* Safe area padding for devices with home indicators */}
                    <div className="h-8" />
                </div>
            </div>
        </>
    );
};
