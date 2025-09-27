
import React from 'react';
import { libraryItems } from '../library/definitions';
import { Icon, IconName } from './Icon';

const LibraryItem: React.FC<{ name: string; item: typeof libraryItems[string] }> = ({ name, item }) => {
    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('library-item-name', name);
        e.dataTransfer.setData('library-item-data', JSON.stringify({ width: item.width, height: item.height }));
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            className="flex items-center gap-3 p-2 rounded-lg cursor-grab active:cursor-grabbing hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title={`Drag to add ${item.name}`}
        >
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-slate-200 dark:bg-slate-700/50">
                <Icon name={item.icon as IconName} className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
                <div className="font-semibold text-sm">{item.name}</div>
            </div>
        </div>
    );
};

export const Library: React.FC = () => {
    return (
        <div>
            <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-2 flex items-center gap-2">
                <Icon name="library" className="w-4 h-4" />
                Library
            </h3>
            <div className="flex flex-col gap-1">
                {Object.entries(libraryItems).map(([name, item]) => (
                    <LibraryItem key={name} name={name} item={item} />
                ))}
            </div>
        </div>
    );
};
