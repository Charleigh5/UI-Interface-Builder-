import React, { useContext, useRef, useCallback, useEffect } from 'react';
import { Tool } from '../../library/types';
import { Icon } from '../Icon';
import { AppContext } from '../../store/AppContext';

interface MobileToolDefinition {
    id: Tool;
    name: string;
    icon: React.ComponentProps<typeof Icon>['name'];
    description: string;
    isPrimary: boolean; // Primary tools are always visible, secondary tools are in expandable section
}

const mobileTools: MobileToolDefinition[] = [
    { id: 'select', name: 'Select', icon: 'cursor', description: 'Select & move elements', isPrimary: true },
    { id: 'pen', name: 'Pen', icon: 'pen', description: 'Freehand drawing', isPrimary: true },
    { id: 'rectangle', name: 'Rectangle', icon: 'rectangle', description: 'Draw rectangles', isPrimary: true },
    { id: 'circle', name: 'Circle', icon: 'circle', description: 'Draw circles', isPrimary: true },
    { id: 'text', name: 'Text', icon: 'text', description: 'Add text elements', isPrimary: true },
    { id: 'button', name: 'Button', icon: 'button', description: 'Create buttons', isPrimary: false },
    { id: 'input', name: 'Input', icon: 'input', description: 'Input fields', isPrimary: false },
    { id: 'image', name: 'Image', icon: 'image', description: 'Image placeholders', isPrimary: false },
];

interface MobileToolbarProps {
    isVisible: boolean;
    onClose: () => void;
}

/**
 * MobileToolbar provides a slide-up toolbar interface optimized for mobile devices.
 * 
 * Design Features:
 * - Slide-up animation from bottom of screen (300ms ease-in-out)
 * - Semi-transparent backdrop with blur effect
 * - Touch-optimized buttons with minimum 44px height
 * - Primary tools always visible, secondary tools in expandable section
 * - Swipe-down and tap-outside-to-dismiss functionality
 */
export const MobileToolbar: React.FC<MobileToolbarProps> = ({ isVisible, onClose }) => {
    const { 
        state, 
        dispatch, 
        setDrawingSetting, 
        setActiveMobilePanel,
        groupComponents,
        duplicateComponents,
        bringToFront,
        sendToBack
    } = useContext(AppContext);
    const { currentTool, theme, drawingSettings } = state;

    const primaryTools = mobileTools.filter(tool => tool.isPrimary);
    const secondaryTools = mobileTools.filter(tool => !tool.isPrimary);
    
    // State for expandable sections
    const [showSecondaryTools, setShowSecondaryTools] = React.useState(false);
    const [showAdvancedActions, setShowAdvancedActions] = React.useState(false);
    
    // Swipe gesture handling
    const touchStartY = useRef<number>(0);
    const toolbarRef = useRef<HTMLDivElement>(null);

    const handleToolSelect = (toolId: Tool) => {
        dispatch({ type: 'SET_TOOL', payload: toolId });
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Swipe down gesture to close toolbar
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        // Prevent scrolling when swiping down from the top of the toolbar
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - touchStartY.current;
        
        if (deltaY > 0 && toolbarRef.current?.scrollTop === 0) {
            e.preventDefault();
        }
    }, []);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        const currentY = e.changedTouches[0].clientY;
        const deltaY = currentY - touchStartY.current;
        const swipeThreshold = 100; // Minimum swipe distance to trigger close
        
        // Close toolbar if swiped down more than threshold and at top of scroll
        if (deltaY > swipeThreshold && toolbarRef.current?.scrollTop === 0) {
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

    if (!isVisible) return null;

    return (
        <>
            {/* Semi-transparent backdrop with blur effect */}
            <div 
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                onClick={handleBackdropClick}
            />
            
            {/* Slide-up toolbar container */}
            <div 
                ref={toolbarRef}
                className={`
                    fixed bottom-0 left-0 right-0 z-50
                    bg-slate-50 dark:bg-slate-800 
                    border-t border-slate-200 dark:border-slate-700
                    rounded-t-xl shadow-2xl
                    transform transition-transform duration-300 ease-in-out
                    ${isVisible ? 'translate-y-0' : 'translate-y-full'}
                    max-h-[60vh] overflow-y-auto
                `}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Handle bar for visual indication and swipe gesture */}
                <div className="flex justify-center py-2">
                    <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                </div>

                {/* Toolbar content */}
                <div className="px-4 pb-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                            Tools
                        </h3>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                            aria-label="Close toolbar"
                        >
                            <Icon name="x" className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                        </button>
                    </div>

                    {/* Primary tools row - always visible */}
                    <div className="mb-6">
                        <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
                            Drawing Tools
                        </h4>
                        <div className="grid grid-cols-5 gap-3">
                            {primaryTools.map(tool => (
                                <button
                                    key={tool.id}
                                    onClick={() => handleToolSelect(tool.id)}
                                    className={`
                                        flex flex-col items-center justify-center
                                        min-h-[44px] p-3 rounded-lg
                                        transition-all duration-200
                                        ${currentTool === tool.id 
                                            ? 'bg-blue-600 text-white shadow-md' 
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                        }
                                    `}
                                    aria-label={`${tool.name} - ${tool.description}`}
                                >
                                    <Icon 
                                        name={tool.icon} 
                                        className={`w-6 h-6 mb-1 ${
                                            currentTool === tool.id ? 'text-white' : 'text-blue-600 dark:text-blue-400'
                                        }`} 
                                    />
                                    <span className="text-xs font-medium">{tool.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions - context-sensitive shortcuts */}
                    {state.selectedComponentIds.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
                                Quick Actions
                            </h4>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => {
                                        onClose();
                                        setActiveMobilePanel('properties');
                                    }}
                                    className="flex flex-col items-center justify-center min-h-[44px] p-3 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                    aria-label="Edit properties"
                                >
                                    <Icon name="settings" className="w-6 h-6 mb-1 text-green-600 dark:text-green-400" />
                                    <span className="text-xs font-medium">Properties</span>
                                </button>
                                
                                <button
                                    onClick={() => {
                                        onClose();
                                        setActiveMobilePanel('layers');
                                    }}
                                    className="flex flex-col items-center justify-center min-h-[44px] p-3 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                    aria-label="View layers"
                                >
                                    <Icon name="layers" className="w-6 h-6 mb-1 text-purple-600 dark:text-purple-400" />
                                    <span className="text-xs font-medium">Layers</span>
                                </button>

                                <button
                                    onClick={() => {
                                        onClose();
                                        setActiveMobilePanel('library');
                                    }}
                                    className="flex flex-col items-center justify-center min-h-[44px] p-3 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                    aria-label="Component library"
                                >
                                    <Icon name="grid" className="w-6 h-6 mb-1 text-orange-600 dark:text-orange-400" />
                                    <span className="text-xs font-medium">Library</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Secondary tools - expandable section */}
                    <div className="mb-6">
                        <button
                            onClick={() => setShowSecondaryTools(!showSecondaryTools)}
                            className="flex items-center justify-between w-full mb-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                More Tools ({secondaryTools.length})
                            </h4>
                            <Icon 
                                name={showSecondaryTools ? "chevron-up" : "chevron-down"} 
                                className="w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform duration-200" 
                            />
                        </button>
                        
                        <div className={`
                            grid grid-cols-4 gap-3 transition-all duration-300 ease-in-out overflow-hidden
                            ${showSecondaryTools ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                        `}>
                            {secondaryTools.map(tool => (
                                <button
                                    key={tool.id}
                                    onClick={() => handleToolSelect(tool.id)}
                                    className={`
                                        flex flex-col items-center justify-center
                                        min-h-[44px] p-3 rounded-lg
                                        transition-all duration-200
                                        ${currentTool === tool.id 
                                            ? 'bg-blue-600 text-white shadow-md' 
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                        }
                                    `}
                                    aria-label={`${tool.name} - ${tool.description}`}
                                >
                                    <Icon 
                                        name={tool.icon} 
                                        className={`w-6 h-6 mb-1 ${
                                            currentTool === tool.id ? 'text-white' : 'text-blue-600 dark:text-blue-400'
                                        }`} 
                                    />
                                    <span className="text-xs font-medium">{tool.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Advanced Actions - collapsible section */}
                    {state.selectedComponentIds.length > 0 && (
                        <div className="mb-6">
                            <button
                                onClick={() => setShowAdvancedActions(!showAdvancedActions)}
                                className="flex items-center justify-between w-full mb-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                    Advanced Actions
                                </h4>
                                <Icon 
                                    name={showAdvancedActions ? "chevron-up" : "chevron-down"} 
                                    className="w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform duration-200" 
                                />
                            </button>
                            
                            <div className={`
                                grid grid-cols-3 gap-3 transition-all duration-300 ease-in-out overflow-hidden
                                ${showAdvancedActions ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                            `}>
                                {state.selectedComponentIds.length >= 2 && (
                                    <button
                                        onClick={() => {
                                            groupComponents();
                                            onClose();
                                        }}
                                        className="flex flex-col items-center justify-center min-h-[44px] p-3 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                        aria-label="Group selected components"
                                    >
                                        <Icon name="group" className="w-6 h-6 mb-1 text-indigo-600 dark:text-indigo-400" />
                                        <span className="text-xs font-medium">Group</span>
                                    </button>
                                )}
                                
                                <button
                                    onClick={() => {
                                        duplicateComponents();
                                        onClose();
                                    }}
                                    className="flex flex-col items-center justify-center min-h-[44px] p-3 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                    aria-label="Duplicate selected components"
                                >
                                    <Icon name="copy" className="w-6 h-6 mb-1 text-cyan-600 dark:text-cyan-400" />
                                    <span className="text-xs font-medium">Duplicate</span>
                                </button>

                                <button
                                    onClick={() => {
                                        bringToFront();
                                        onClose();
                                    }}
                                    className="flex flex-col items-center justify-center min-h-[44px] p-3 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                    aria-label="Bring to front"
                                >
                                    <Icon name="bring-to-front" className="w-6 h-6 mb-1 text-amber-600 dark:text-amber-400" />
                                    <span className="text-xs font-medium">To Front</span>
                                </button>

                                <button
                                    onClick={() => {
                                        sendToBack();
                                        onClose();
                                    }}
                                    className="flex flex-col items-center justify-center min-h-[44px] p-3 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                    aria-label="Send to back"
                                >
                                    <Icon name="send-to-back" className="w-6 h-6 mb-1 text-rose-600 dark:text-rose-400" />
                                    <span className="text-xs font-medium">To Back</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Context-sensitive tool options */}
                    {(currentTool === 'pen' || currentTool === 'rectangle' || currentTool === 'circle') && (
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                            <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
                                Tool Options
                            </h4>
                            <div className="space-y-4">
                                {currentTool === 'pen' && (
                                    <>
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    Width
                                                </label>
                                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                                    {drawingSettings.penWidth}px
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="1"
                                                max="20"
                                                step="1"
                                                value={drawingSettings.penWidth}
                                                onChange={(e) => setDrawingSetting('penWidth', parseInt(e.target.value, 10))}
                                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    Opacity
                                                </label>
                                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                                    {Math.round(drawingSettings.penOpacity * 100)}%
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0.1"
                                                max="1"
                                                step="0.1"
                                                value={drawingSettings.penOpacity}
                                                onChange={(e) => setDrawingSetting('penOpacity', parseFloat(e.target.value))}
                                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>
                                    </>
                                )}
                                {(currentTool === 'rectangle' || currentTool === 'circle') && (
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Fill Shape
                                        </label>
                                        <input
                                            type="checkbox"
                                            checked={drawingSettings.shapeFill}
                                            onChange={(e) => setDrawingSetting('shapeFill', e.target.checked)}
                                            className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Safe area padding for devices with home indicators */}
                    <div className="h-4" />
                </div>
            </div>
        </>
    );
};