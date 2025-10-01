import React, { useState, useContext, useRef, useCallback, useEffect, useMemo } from 'react';
import { WireframeComponent } from '../../library/types';
import { Icon } from '../Icon';
import { AppContext } from '../../store/AppContext';

interface MobileLayersPanelProps {
    isVisible: boolean;
    onClose: () => void;
}

/**
 * MobileLayersPanel provides a slide-up panel interface for managing component layers.
 * 
 * Architecture Features:
 * - Slide-up panel covering bottom 70% of screen for optimal mobile UX
 * - Touch-friendly list items with large touch targets (minimum 44px)
 * - Swipe gestures for reordering components (future enhancement)
 * - Hierarchical display of grouped components with proper indentation
 * - Touch-optimized controls for selection, locking, and deletion
 * - Inline editing with mobile-friendly input handling
 * - Maintains complete feature parity with desktop ComponentList
 */
export const MobileLayersPanel: React.FC<MobileLayersPanelProps> = ({ isVisible, onClose }) => {
    const { state, dispatch, selectComponent, toggleLock, allEffectivelySelectedIds } = useContext(AppContext);
    const { components, selectedComponentIds } = state;
    
    // Swipe gesture handling
    const touchStartY = useRef<number>(0);
    const panelRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Component management handlers
    const handleUpdate = useCallback((id: string) => (updates: Partial<WireframeComponent>) => {
        dispatch({ type: 'UPDATE_COMPONENT', payload: { id, updates } });
    }, [dispatch]);

    const handleDelete = useCallback((id: string) => () => {
        dispatch({ type: 'DELETE_COMPONENT', payload: id });
    }, [dispatch]);

    const handleSelect = useCallback((id: string) => (e: React.MouseEvent<HTMLDivElement>) => {
        selectComponent(id, e.shiftKey);
    }, [selectComponent]);

    const handleToggleLock = useCallback((id: string) => () => {
        toggleLock(id);
    }, [toggleLock]);

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
        const swipeThreshold = 100;
        
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
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isVisible, onClose]);

    // Backdrop click handler
    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }, [onClose]);

    // Component tree structure
    const componentsById = useMemo(() => new Map(components.map(c => [c.id, c])), [components]);
    
    const topLevelComponentIds = useMemo(() => components
        .filter(c => !c.groupId)
        .map(c => c.id)
        .reverse(), [components]);

    if (!isVisible) return null;

    return (
        <>
            {/* Semi-transparent backdrop */}
            <div 
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                onClick={handleBackdropClick}
                aria-hidden="true"
            />
            
            {/* Slide-up panel covering bottom 70% of screen */}
            <div 
                ref={panelRef}
                className={`
                    fixed bottom-0 left-0 right-0 z-50
                    bg-slate-50 dark:bg-slate-800 
                    border-t border-slate-200 dark:border-slate-700
                    rounded-t-xl shadow-2xl
                    transform transition-transform duration-300 ease-in-out
                    ${isVisible ? 'translate-y-0' : 'translate-y-full'}
                    h-[70vh] overflow-y-auto
                `}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                role="dialog"
                aria-modal="true"
                aria-labelledby="layers-title"
            >
                {/* Handle bar for visual indication and swipe gesture */}
                <div className="flex justify-center py-3 sticky top-0 bg-slate-50 dark:bg-slate-800 z-10">
                    <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                </div>

                {/* Header */}
                <div className="sticky top-8 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 pb-4 z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Icon name="layers" className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            <div>
                                <h1 id="layers-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                    Layers
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {components.length} component{components.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                            aria-label="Close layers panel"
                        >
                            <Icon name="x" className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </button>
                    </div>
                </div>

                {/* Layers content */}
                <div className="px-6 py-4">
                    {components.length === 0 ? (
                        <div className="text-center py-12">
                            <Icon name="layers" className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                                No components yet
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400">
                                Start drawing or add components from the library
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {renderComponentTree(
                                topLevelComponentIds,
                                0,
                                componentsById,
                                selectedComponentIds,
                                allEffectivelySelectedIds,
                                handleSelect,
                                handleUpdate,
                                handleDelete,
                                handleToggleLock
                            )}
                        </div>
                    )}

                    {/* Safe area padding for devices with home indicators */}
                    <div className="h-8" />
                </div>
            </div>
        </>
    );
};

// Recursive component tree renderer
const renderComponentTree = (
    componentIds: string[],
    level: number,
    componentsById: Map<string, WireframeComponent>,
    selectedComponentIds: string[],
    allEffectivelySelectedIds: Set<string>,
    handleSelect: (id: string) => (e: React.MouseEvent<HTMLDivElement>) => void,
    handleUpdate: (id: string) => (updates: Partial<WireframeComponent>) => void,
    handleDelete: (id: string) => () => void,
    handleToggleLock: (id: string) => () => void
): React.ReactNode[] => {
    return componentIds.map(id => {
        const component = componentsById.get(id);
        if (!component) return null;
        
        const children = (component.type === 'group' && component.childIds)
            ? renderComponentTree(
                component.childIds,
                level + 1,
                componentsById,
                selectedComponentIds,
                allEffectivelySelectedIds,
                handleSelect,
                handleUpdate,
                handleDelete,
                handleToggleLock
            )
            : null;
        
        return (
            <React.Fragment key={id}>
                <MobileComponentItem
                    component={component}
                    isSelected={selectedComponentIds.includes(id)}
                    isEffectivelySelected={allEffectivelySelectedIds.has(id)}
                    onSelect={handleSelect(id)}
                    onUpdate={handleUpdate(id)}
                    onDelete={handleDelete(id)}
                    onToggleLock={handleToggleLock(id)}
                    level={level}
                />
                {children}
            </React.Fragment>
        );
    });
};

// Mobile-optimized component item with touch-friendly controls
interface MobileComponentItemProps {
    component: WireframeComponent;
    isSelected: boolean;
    isEffectivelySelected: boolean;
    onSelect: (e: React.MouseEvent<HTMLDivElement>) => void;
    onUpdate: (updates: Partial<WireframeComponent>) => void;
    onDelete: () => void;
    onToggleLock: () => void;
    level: number;
}

const MobileComponentItem: React.FC<MobileComponentItemProps> = React.memo(({
    component,
    isSelected,
    isEffectivelySelected,
    onSelect,
    onUpdate,
    onDelete,
    onToggleLock,
    level
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [labelText, setLabelText] = useState(component.label);

    const handleSave = useCallback(() => {
        if (labelText.trim() === '') {
            setLabelText(component.label); // Revert if empty
        } else {
            onUpdate({ label: labelText });
        }
        setIsEditing(false);
    }, [labelText, component.label, onUpdate]);
    
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') {
            setLabelText(component.label);
            setIsEditing(false);
        }
    }, [handleSave, component.label]);

    const getIconName = (type: WireframeComponent['type']): React.ComponentProps<typeof Icon>['name'] => {
        switch (type) {
            case 'rectangle': return 'rectangle';
            case 'circle': return 'circle';
            case 'button': return 'button';
            case 'input': return 'input';
            case 'text': return 'text';
            case 'image': return 'image';
            case 'group': return 'group';
            default: return 'component';
        }
    };

    return (
        <div
            onClick={onSelect}
            className={`
                flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all
                min-h-[56px] touch-manipulation
                ${isSelected 
                    ? 'bg-blue-600/20 dark:bg-blue-600/30 border-2 border-blue-500/50' 
                    : isEffectivelySelected 
                        ? 'bg-blue-100/50 dark:bg-blue-600/10 border-2 border-blue-300/30' 
                        : 'bg-white dark:bg-slate-700 border-2 border-transparent hover:bg-slate-50 dark:hover:bg-slate-600'
                }
            `}
            style={{ marginLeft: `${level * 1.5}rem` }}
        >
            {/* Component icon and info */}
            <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                    ${isSelected 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                    }
                `}>
                    <Icon name={getIconName(component.type)} className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0" onDoubleClick={() => !component.isLocked && setIsEditing(true)}>
                    {isEditing ? (
                        <input
                            type="text"
                            value={labelText}
                            onChange={e => setLabelText(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={handleKeyDown}
                            className="w-full px-3 py-2 text-base border-2 border-blue-500 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
                            autoFocus
                            onClick={e => e.stopPropagation()}
                        />
                    ) : (
                        <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                                {component.label}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">
                                {component.type}
                                {component.isLocked && (
                                    <span className="ml-2 inline-flex items-center">
                                        <Icon name="lock" className="w-3 h-3 text-amber-500" />
                                    </span>
                                )}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleLock(); }}
                    className={`
                        w-10 h-10 flex items-center justify-center rounded-lg transition-colors
                        ${component.isLocked 
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' 
                            : 'bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-500'
                        }
                    `}
                    aria-label={component.isLocked ? "Unlock component" : "Lock component"}
                >
                    <Icon name={component.isLocked ? "lock" : "unlock"} className="w-5 h-5" />
                </button>
                
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    aria-label="Delete component"
                >
                    <Icon name="trash" className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
});