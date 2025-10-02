import React, { useState, useContext, useMemo, useRef, useCallback, useEffect } from 'react';
import { WireframeComponent } from '../../library/types';
import { Icon } from '../Icon';
import { AppContext } from '../../store/AppContext';

interface MobileLayersPanelProps {
    isVisible: boolean;
    onClose: () => void;
}

const MobileComponentItem: React.FC<{
    component: WireframeComponent;
    isSelected: boolean;
    isEffectivelySelected: boolean;
    onSelect: (e: React.MouseEvent<HTMLDivElement>) => void;
    onUpdate: (updates: Partial<WireframeComponent>) => void;
    onDelete: () => void;
    onToggleLock: () => void;
    level: number;
}> = React.memo(({ component, isSelected, isEffectivelySelected, onSelect, onUpdate, onDelete, onToggleLock, level }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [labelText, setLabelText] = useState(component.label);

    const handleSave = () => {
        if (labelText.trim() === '') {
            setLabelText(component.label);
        } else {
            onUpdate({ label: labelText });
        }
        setIsEditing(false);
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') {
            setLabelText(component.label);
            setIsEditing(false);
        }
    };

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
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors min-h-[56px] ${
                isSelected 
                    ? 'bg-blue-600/20 dark:bg-blue-600/30 border-2 border-blue-500' 
                    : isEffectivelySelected 
                        ? 'bg-blue-100/50 dark:bg-blue-600/10 border-2 border-blue-300 dark:border-blue-700' 
                        : 'bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
            style={{ marginLeft: `${level * 1.5}rem` }}
        >
            <Icon 
                name={getIconName(component.type)} 
                className="w-6 h-6 text-slate-600 dark:text-slate-400 flex-shrink-0" 
            />
            <div className="flex-1 min-w-0" onDoubleClick={() => !component.isLocked && setIsEditing(true)}>
                {isEditing ? (
                    <input
                        type="text"
                        value={labelText}
                        onChange={e => setLabelText(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className="w-full text-base bg-white border-2 border-blue-500 rounded-lg px-3 py-2 dark:bg-slate-700 dark:border-blue-500 dark:text-slate-100"
                        autoFocus
                        onClick={e => e.stopPropagation()}
                    />
                ) : (
                    <p className="text-base truncate font-medium text-slate-900 dark:text-slate-100">
                        {component.label}
                    </p>
                )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleLock(); }}
                    title={component.isLocked ? "Unlock Component" : "Lock Component"}
                    className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                >
                    <Icon 
                        name={component.isLocked ? "lock" : "unlock"} 
                        className="w-5 h-5 text-slate-600 dark:text-slate-400" 
                    />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    title="Delete Component"
                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                >
                    <Icon 
                        name="trash" 
                        className="w-5 h-5 text-red-600 dark:text-red-400" 
                    />
                </button>
            </div>
        </div>
    );
});

/**
 * MobileLayersPanel provides a slide-up panel interface for managing component layers on mobile devices.
 * 
 * Design Features:
 * - Slide-up panel covering bottom 70% of screen
 * - Touch-friendly list items with large tap targets (56px minimum)
 * - Hierarchical component display with indentation
 * - Swipe-down-to-dismiss functionality
 * - Touch-optimized controls for lock/delete
 * - Double-tap to rename components
 */
export const MobileLayersPanel: React.FC<MobileLayersPanelProps> = ({ isVisible, onClose }) => {
    const { state, dispatch, selectComponent, toggleLock, allEffectivelySelectedIds } = useContext(AppContext);
    const { components, selectedComponentIds } = state;
    
    // Swipe gesture handling
    const touchStartY = useRef<number>(0);
    const panelRef = useRef<HTMLDivElement>(null);

    const handleUpdate = (id: string) => (updates: Partial<WireframeComponent>) => {
        dispatch({ type: 'UPDATE_COMPONENT', payload: { id, updates } });
    };
    
    const handleDelete = (id: string) => () => {
        dispatch({ type: 'DELETE_COMPONENT', payload: id });
    };
    
    const handleSelect = (id: string) => (e: React.MouseEvent<HTMLDivElement>) => {
        selectComponent(id, e.shiftKey);
    };
    
    const handleToggleLock = (id: string) => () => {
        toggleLock(id);
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
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
    
    const componentsById = useMemo(() => new Map(components.map(c => [c.id, c])), [components]);
    
    const renderComponentTree = (componentIds: string[], level: number): React.ReactNode[] => {
        return componentIds.map(id => {
            const component = componentsById.get(id);
            if (!component) return null;
            
            const children = (component.type === 'group' && component.childIds)
                ? renderComponentTree(component.childIds, level + 1)
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
    
    const topLevelComponentIds = useMemo(() => components
        .filter(c => !c.groupId)
        .map(c => c.id)
        .reverse(), [components]);

    if (!isVisible) return null;

    return (
        <>
            {/* Semi-transparent backdrop */}
            <div 
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
                onClick={handleBackdropClick}
            />
            
            {/* Slide-up panel covering bottom 70% */}
            <div 
                ref={panelRef}
                className={`
                    fixed bottom-0 left-0 right-0 z-50
                    bg-white dark:bg-slate-900
                    rounded-t-2xl shadow-2xl
                    transform transition-transform duration-300 ease-in-out
                    ${isVisible ? 'translate-y-0' : 'translate-y-full'}
                    flex flex-col
                    overflow-hidden
                `}
                style={{ height: '70vh' }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Header */}
                <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700">
                    {/* Swipe handle indicator */}
                    <div className="flex justify-center py-3">
                        <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                    </div>
                    
                    <div className="flex items-center justify-between px-4 pb-4">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <Icon name="layers" className="w-6 h-6" />
                                Layers
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                {components.length} {components.length === 1 ? 'component' : 'components'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            aria-label="Close layers panel"
                        >
                            <Icon name="x" className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </button>
                    </div>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-4 py-4">
                    {components.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4">
                            <Icon name="layers" className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                            <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
                                No components yet
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                                Add components from the library or draw on the canvas
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 max-w-2xl mx-auto">
                            {renderComponentTree(topLevelComponentIds, 0)}
                        </div>
                    )}
                    
                    {/* Safe area padding for devices with home indicators */}
                    <div className="h-8" />
                </div>
            </div>
        </>
    );
};
