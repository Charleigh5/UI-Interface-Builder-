import React, { useState, useContext } from 'react';
import { WireframeComponent } from '../library/types';
import { Icon } from './Icon';
import { AppContext } from '../store/AppContext';

const ComponentItem: React.FC<{
    component: WireframeComponent;
    isSelected: boolean;
    onSelect: () => void;
    onUpdate: (updates: Partial<WireframeComponent>) => void;
    onDelete: () => void;
    onToggleLock: () => void;
}> = React.memo(({ component, isSelected, onSelect, onUpdate, onDelete, onToggleLock }) => {
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
            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                isSelected ? 'bg-blue-100 dark:bg-blue-600/20' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
        >
            <Icon name={getIconName(component.type)} className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
            <div className="flex-1 min-w-0" onDoubleClick={() => setIsEditing(true)}>
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
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                 <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600" title="Rename">
                    <Icon name="edit" className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </button>
                 <button 
                    onClick={(e) => { e.stopPropagation(); onToggleLock(); }} 
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600"
                    title={component.isLocked ? 'Unlock' : 'Lock'}
                >
                    <Icon name={component.isLocked ? 'lock' : 'unlock'} className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(); }} 
                    className="p-1 rounded hover:bg-red-100 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-red-500/20"
                    disabled={component.isLocked}
                    title={component.isLocked ? "Unlock to delete" : "Delete"}
                >
                    <Icon name="trash" className="w-4 h-4 text-red-500" />
                </button>
            </div>
        </div>
    );
});
ComponentItem.displayName = 'ComponentItem';

export const ComponentList: React.FC = () => {
    const { state, dispatch, selectComponent, toggleLock } = useContext(AppContext);
    const { components, selectedComponentIds } = state;

    const handleUpdateComponent = (id: string, updates: Partial<WireframeComponent>) => {
        dispatch({ type: 'UPDATE_COMPONENT', payload: { id, updates } });
    };

    const handleDeleteComponent = (id: string) => {
        dispatch({ type: 'DELETE_COMPONENT', payload: id });
    };

    const renderComponent = (component: WireframeComponent, level = 0) => {
        const isSelected = selectedComponentIds.includes(component.id);
        const isChildOfSelectedGroup = component.groupId ? selectedComponentIds.includes(component.groupId) : false;
        
        return (
            <div key={component.id} style={{ paddingLeft: `${level * 16}px` }}>
                <div className="group">
                   <ComponentItem
                       component={component}
                       isSelected={isSelected || isChildOfSelectedGroup}
                       onSelect={() => selectComponent(component.id, false)}
                       onUpdate={(updates) => handleUpdateComponent(component.id, updates)}
                       onDelete={() => handleDeleteComponent(component.id)}
                       onToggleLock={() => toggleLock(component.id)}
                   />
               </div>
               {component.type === 'group' && component.childIds && (
                   <div className="border-l border-slate-200 ml-3 dark:border-slate-600">
                       {[...components.filter(c => component.childIds?.includes(c.id))].reverse().map(child => {
                           return child && renderComponent(child, level + 1);
                       })}
                   </div>
               )}
            </div>
        );
    };

    const topLevelComponents = [...components.filter(c => !c.groupId)].reverse();

    return (
        <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2 dark:text-slate-500">Layers</h3>
            <div className="flex flex-col gap-1">
                {components.length > 0 ? (
                    topLevelComponents.map(component => renderComponent(component))
                ) : (
                    <div className="text-center py-4">
                        <Icon name="layers" className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">No components yet.</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Draw on the canvas to start.</p>
                    </div>
                )}
            </div>
        </div>
    );
};