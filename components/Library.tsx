
import React from 'react';
import { libraryItems } from '../library/definitions';
import { Icon, IconName } from './Icon';

const LibraryItem: React.FC<{ name: string; item: typeof libraryItems[string]; isCollapsed: boolean; }> = ({ name, item, isCollapsed }) => {
    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('library-item-name', name);
        e.dataTransfer.setData('library-item-data', JSON.stringify({ width: item.width, height: item.height }));
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            className={`relative group/tooltip flex items-center p-2 rounded-lg cursor-grab active:cursor-grabbing transition-colors ${
                isCollapsed ? 'justify-center' : ''
            } hover:bg-slate-200 dark:hover:bg-slate-700`}
            title={isCollapsed ? item.name : `Drag to add ${item.name}`}
        >
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-md bg-slate-200 dark:bg-slate-700/50">
                <Icon name={item.icon as IconName} className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
             <div className={`flex-grow overflow-hidden transition-all duration-200 ease-in-out ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100 ml-3'}`}>
                <div className="font-semibold text-sm whitespace-nowrap">{item.name}</div>
            </div>

            {isCollapsed && (
                <div className="absolute left-full ml-3 p-2 min-w-[150px] rounded-md shadow-lg bg-slate-900 text-white ring-1 ring-slate-700
                                invisible opacity-0 translate-x-[-10px] group-hover/tooltip:visible group-hover/tooltip:opacity-100 group-hover/tooltip:translate-x-0 
                                transition-all duration-200 z-50 pointer-events-none">
                    <div className="font-semibold text-sm">{item.name}</div>
                    <div className="absolute top-1/2 -left-1 w-2 h-2 bg-slate-900 transform -translate-y-1/2 rotate-45 ring-1 ring-slate-700"></div>
                </div>
            )}
        </div>
    );
};

export const Library: React.FC<{isCollapsed: boolean}> = ({ isCollapsed }) => {
    return (
        <div>
            <div className={`transition-all duration-300 overflow-hidden ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-10 opacity-100 mb-2'}`}>
                <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 flex items-center gap-2">
                    <Icon name="library" className="w-4 h-4" />
                    Library
                </h3>
            </div>
            <div className="flex flex-col gap-1">
                {Object.entries(libraryItems).map(([name, item]) => (
                    <LibraryItem key={name} name={name} item={item} isCollapsed={isCollapsed} />
                ))}
            </div>
        </div>
    );
};