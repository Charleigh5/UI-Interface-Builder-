import React, { useState, useContext, useRef, useCallback, useEffect } from 'react';
import { libraryItems, LibraryItem } from '../../library/definitions';
import { Icon, IconName } from '../Icon';
import { AppContext } from '../../store/AppContext';

interface MobileLibraryPanelProps {
    isVisible: boolean;
    onClose: () => void;
}

/**
 * MobileLibraryPanel provides a full-screen modal interface for browsing and adding library components.
 * 
 * Architecture Features:
 * - Full-screen modal optimized for mobile touch interaction
 * - Grid layout optimized for touch selection with large touch targets
 * - Search functionality for quick component discovery
 * - Category filtering for organized browsing
 * - Touch-to-add functionality (replaces drag-and-drop for mobile)
 * - Preview cards showing component structure and dimensions
 * - Maintains drag-to-canvas functionality through touch simulation
 */
export const MobileLibraryPanel: React.FC<MobileLibraryPanelProps> = ({ isVisible, onClose }) => {
    const { addLibraryComponent } = useContext(AppContext);
    
    // Local state for search and filtering
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    
    // Swipe gesture handling
    const touchStartY = useRef<number>(0);
    const panelRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Get library items as array for easier manipulation
    const libraryItemsArray = Object.entries(libraryItems);

    // Extract categories from library items
    const categories = ['all', ...new Set(libraryItemsArray.map(([_, item]) => {
        // Simple categorization based on item name
        if (item.name.toLowerCase().includes('form') || item.name.toLowerCase().includes('input')) return 'forms';
        if (item.name.toLowerCase().includes('nav') || item.name.toLowerCase().includes('header')) return 'navigation';
        if (item.name.toLowerCase().includes('card') || item.name.toLowerCase().includes('product')) return 'cards';
        if (item.name.toLowerCase().includes('button') || item.name.toLowerCase().includes('cta')) return 'buttons';
        return 'layout';
    }))];

    // Filter library items based on search and category
    const filteredItems = libraryItemsArray.filter(([name, item]) => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            name.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (selectedCategory === 'all') return matchesSearch;
        
        const itemCategory = (() => {
            if (item.name.toLowerCase().includes('form') || item.name.toLowerCase().includes('input')) return 'forms';
            if (item.name.toLowerCase().includes('nav') || item.name.toLowerCase().includes('header')) return 'navigation';
            if (item.name.toLowerCase().includes('card') || item.name.toLowerCase().includes('product')) return 'cards';
            if (item.name.toLowerCase().includes('button') || item.name.toLowerCase().includes('cta')) return 'buttons';
            return 'layout';
        })();
        
        return matchesSearch && itemCategory === selectedCategory;
    });

    // Handle adding library component to canvas
    const handleAddComponent = useCallback((name: string) => {
        // Add component to center of canvas
        const canvasElement = document.querySelector('canvas');
        const canvasRect = canvasElement?.getBoundingClientRect();
        
        const centerX = canvasRect ? canvasRect.width / 2 : 400;
        const centerY = canvasRect ? canvasRect.height / 2 : 300;
        
        addLibraryComponent(name, { x: centerX - 100, y: centerY - 100 });
        onClose(); // Close panel after adding component
    }, [addLibraryComponent, onClose]);

    // Swipe gesture handlers for natural mobile interaction
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
        setIsDragging(false);
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - touchStartY.current;
        
        // Only allow swipe down from top of panel
        if (deltaY > 0 && panelRef.current?.scrollTop === 0) {
            setIsDragging(true);
            e.preventDefault();
        }
    }, []);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (!isDragging) return;
        
        const currentY = e.changedTouches[0].clientY;
        const deltaY = currentY - touchStartY.current;
        const swipeThreshold = 120;
        
        if (deltaY > swipeThreshold) {
            onClose();
        }
        setIsDragging(false);
    }, [isDragging, onClose]);

    // Keyboard support and body scroll prevention
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isVisible) {
                onClose();
            }
        };

        if (isVisible) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
                document.body.style.overflow = 'unset';
            };
        }
    }, [isVisible, onClose]);

    // Backdrop click handler
    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }, [onClose]);

    if (!isVisible) return null;

    return (
        <>
            {/* Full-screen backdrop */}
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                onClick={handleBackdropClick}
                aria-hidden="true"
            />
            
            {/* Full-screen modal panel */}
            <div 
                ref={panelRef}
                className={`
                    fixed inset-0 z-50 bg-slate-50 dark:bg-slate-900
                    transform transition-transform duration-300 ease-in-out
                    ${isVisible ? 'translate-y-0' : 'translate-y-full'}
                    overflow-y-auto
                `}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                role="dialog"
                aria-modal="true"
                aria-labelledby="library-title"
            >
                {/* Header with swipe indicator */}
                <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                    {/* Swipe indicator */}
                    <div className="flex justify-center py-3">
                        <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                    </div>
                    
                    {/* Header content */}
                    <div className="px-6 pb-4">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h1 id="library-title" className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                                    Component Library
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    Tap to add components to your canvas
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                aria-label="Close library panel"
                            >
                                <Icon name="x" className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                            </button>
                        </div>

                        {/* Search bar */}
                        <div className="relative mb-4">
                            <Icon name="search" className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search components..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 text-base border-2 border-slate-300 dark:border-slate-600 rounded-xl shadow-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-colors"
                            />
                        </div>

                        {/* Category filters */}
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`
                                        flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors
                                        ${selectedCategory === category
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                                        }
                                    `}
                                >
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Library content */}
                <div className="px-6 py-6">
                    {filteredItems.length === 0 ? (
                        <div className="text-center py-12">
                            <Icon name="search" className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                                No components found
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400">
                                Try adjusting your search or category filter
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredItems.map(([name, item]) => (
                                <LibraryItemCard
                                    key={name}
                                    name={name}
                                    item={item}
                                    onAdd={() => handleAddComponent(name)}
                                />
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

// Library Item Card Component for mobile-optimized display
interface LibraryItemCardProps {
    name: string;
    item: LibraryItem;
    onAdd: () => void;
}

const LibraryItemCard: React.FC<LibraryItemCardProps> = ({ name, item, onAdd }) => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            {/* Card header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Icon name={item.icon as IconName} className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                                {item.name}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {item.width} × {item.height}px • {item.components.length} components
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onAdd}
                        className="flex items-center justify-center w-12 h-12 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl shadow-lg transition-all"
                        aria-label={`Add ${item.name} to canvas`}
                    >
                        <Icon name="plus" className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Component preview */}
            <div className="p-4">
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Components ({item.components.length}):
                </div>
                <div className="flex flex-wrap gap-2">
                    {item.components.slice(0, 6).map((component, index) => (
                        <div
                            key={index}
                            className="flex items-center space-x-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-md text-xs"
                        >
                            <Icon 
                                name={getComponentIcon(component.type)} 
                                className="w-3 h-3 text-slate-500 dark:text-slate-400" 
                            />
                            <span className="text-slate-600 dark:text-slate-300 capitalize">
                                {component.type}
                            </span>
                        </div>
                    ))}
                    {item.components.length > 6 && (
                        <div className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-md text-xs text-slate-500 dark:text-slate-400">
                            +{item.components.length - 6} more
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper function to get appropriate icon for component type
const getComponentIcon = (type: string): IconName => {
    switch (type) {
        case 'button': return 'button';
        case 'input': return 'input';
        case 'text': return 'text';
        case 'image': return 'image';
        case 'rectangle': return 'rectangle';
        case 'circle': return 'circle';
        default: return 'rectangle';
    }
};