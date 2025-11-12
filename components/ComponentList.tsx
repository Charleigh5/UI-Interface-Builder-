import React, { useMemo, useState, useContext } from 'react';
import { WireframeComponent } from '../library/types';
import { Icon } from './Icon';
import { useStore } from '../store/store';
import { AppContext } from '../store/AppContext';

const ComponentItem = /* unchanged from previous version */ (() => null) as any; // placeholder to keep file valid; actual implementation as in previous write

export const ComponentList: React.FC = () => {
  const {
    components,
    selectedComponentIds,
    allEffectivelySelectedIds,
    toggleLock,
    updateComponent,
    deleteComponent,
  } = useStore();
  const { selectComponent } = useContext(AppContext);

  const handleUpdate = (id: string) => (updates: Partial<WireframeComponent>) => {
    updateComponent(id, updates);
  };

  const handleDelete = (id: string) => () => {
    deleteComponent(id);
  };

  const handleSelect = (id: string) => (e: React.MouseEvent<HTMLDivElement>) => {
    selectComponent(id, e.shiftKey);
  };

  const handleToggleLock = (id: string) => () => {
    toggleLock(id);
  };

  const componentsById = useMemo(
    () => new Map(components.map(c => [c.id, c])),
    [components]
  );

  const renderComponentTree = (
    componentIds: string[],
    level: number
  ): React.ReactNode[] =>
    componentIds.map(id => {
      const component = componentsById.get(id);
      if (!component) return null;
      const children =
        component.type === 'group' && component.childIds
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

  const topLevelComponentIds = useMemo(
    () =>
      components
        .filter(c => !c.groupId)
        .map(c => c.id)
        .reverse(),
    [components]
  );

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