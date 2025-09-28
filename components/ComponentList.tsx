
import React, { useState, useContext, useMemo } from 'react';
import { WireframeComponent } from '../library/types';
import { Icon } from './Icon';
import { AppContext } from '../store/AppContext';

const ComponentItem: React.FC<{
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
            setLabelText(component.label); // Revert if empty
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
            className={`flex items-center gap-2 pr-2 rounded-lg cursor-pointer transition-colors group/item ${
                isSelected ? 'bg-blue-600/20 dark:bg-blue-600/30' : isEffectivelySelected ? 'bg-blue-100/50 dark:bg-blue-600/10' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            style={{ paddingLeft: `${0.5 + level * 1.25}rem` }}
        >
            <Icon name={getIconName(component.type)} className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
            <div className="flex-1 min-w-0" onDoubleClick={() => !component.isLocked && setIsEditing(true)}>
                {isEditing ? (
                    <input
                        type="text"
                        value={labelText}
                        onChange={e => setLabelText(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className="w-full text-sm bg-white border border-blue-300 rounded px-1 py-0.5 dark:bg-slate-600 dark:border-blue-500 dark:text-slate-100"
                        autoFocus
                        onClick={e => e.stopPropagation()}
                    />
                ) : (
                    <p className="text-sm truncate font-medium text-slate-700 dark:text-slate-200">{component.label}</p>
                )}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                 <button
                    onClick={(e) => { e.stopPropagation(); onToggleLock(); }}
                    title={component.isLocked ? "Unlock Component" : "Lock Component"}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600"
                >
                    <Icon name={component.isLocked ? "lock" : "unlock"} className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    title="Delete Component"
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600"
                >
                    <Icon name="trash" className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                </button>
            </div>
        </div>
    );
});

export const ComponentList: React.FC = () => {
    const { state, dispatch, selectComponent, toggleLock, allEffectivelySelectedIds } = useContext(AppContext);
    const { components, selectedComponentIds } = state;

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
                    <ComponentItem
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

    return (
        <div>
            <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-2 flex items-center gap-2">
                <Icon name="layers" className="w-4 h-4" />
                Layers
            </h3>
            <div className="flex flex-col gap-1">
                {renderComponentTree(topLevelComponentIds, 0)}
            </div>
        </div>
    );
};
