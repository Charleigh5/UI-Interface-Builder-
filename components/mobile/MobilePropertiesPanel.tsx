import React, { useContext, useEffect, useCallback, useRef, useState } from 'react';
import { Icon } from '../Icon';
import { AppContext } from '../../store/AppContext';

export const MobilePropertiesPanel: React.FC<{
  isVisible: boolean;
  onClose: () => void;
}> = ({ isVisible, onClose }) => {
  const { state, updateComponent } = useContext(AppContext);
  const panelRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const selected = state.components.find(c => c.id === state.selectedComponentIds[0]);

  const [bg, setBg] = useState(selected?.properties.backgroundColor ?? '#ffffff');

  const handleUpdate = (updates: Partial<any>) => {
    if (!selected) return;
    updateComponent(selected.id, { properties: { ...selected.properties, ...updates } });
  };

  // Swipe‑down
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  }, []);
  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const dy = e.changedTouches[0].clientY - startY.current;
      if (dy > 100 && panelRef.current?.scrollTop === 0) {
        onClose();
      }
    },
    [onClose]
  );

  // Escape key
  useEffect(() => {
    if (!isVisible) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isVisible, onClose]);

  if (!isVisible || !selected) return null;

  return (
    <>
      <div
        className="backdrop backdrop-enter"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        className="fixed inset-0 z-50 bg-white dark:bg-slate-900 safe-top safe-bottom safe-left safe-right overflow-y-auto"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Properties
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{selected.label}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 touch-min rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Close"
          >
            <Icon name="x" className="w-5 h-5" />
          </button>
        </header>

        {/* Content */}
        <main className="p-4 space-y-6">
          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Width</span>
              <input
                type="number"
                value={Math.round(selected.width)}
                onChange={e => updateComponent(selected.id, { width: +e.target.value })}
                className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Height</span>
              <input
                type="number"
                value={Math.round(selected.height)}
                onChange={e => updateComponent(selected.id, { height: +e.target.value })}
                className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm"
              />
            </label>
          </div>

          {/* Background Color */}
          <div className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Background</span>
            <input
              type="color"
              value={bg}
              onChange={e => {
                setBg(e.target.value);
                handleUpdate({ backgroundColor: e.target.value });
              }}
              className="mt-1 h-12 w-full rounded-lg cursor-pointer"
            />
          </div>
        </main>
      </div>
    </>
  );
};