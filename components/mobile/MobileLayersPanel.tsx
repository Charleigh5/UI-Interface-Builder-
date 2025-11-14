import React, { useContext, useEffect, useCallback, useRef } from 'react';
import { Icon } from '../Icon';
import { AppContext } from '../../store/AppContext';

export const MobileLayersPanel: React.FC<{
  isVisible: boolean;
  onClose: () => void;
}> = ({ isVisible, onClose }) => {
  const { state, updateComponent, deleteComponent, toggleLock } = useContext(AppContext);
  const panelRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);

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

  if (!isVisible) return null;

  return (
    <>
      <div
        className="backdrop backdrop-enter"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        className="fixed inset-x-0 bottom-0 z-50 h-[70vh] bg-white dark:bg-slate-900 safe-top safe-bottom safe-left safe-right rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Icon name="layers" className="w-6 h-6" />
              Layers
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{state.components.length} components</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 touch-min rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Close"
          >
            <Icon name="x" className="w-5 h-5" />
          </button>
        </header>

        {/* List */}
        <main className="flex-1 overflow-y-auto p-4">
          {state.components.map(c => (
            <div
              key={c.id}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                state.selectedComponentIds.includes(c.id)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon name={c.type === 'group' ? 'group' : 'component'} className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{c.label}</p>
              </div>
              <button
                onClick={() => toggleLock(c.id)}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                aria-label={c.isLocked ? 'Unlock' : 'Lock'}
              >
                <Icon name={c.isLocked ? 'lock' : 'unlock'} className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              </button>
              <button
                onClick={() => deleteComponent(c.id)}
                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
                aria-label="Delete"
              >
                <Icon name="trash" className="w-4 h-4 text-red-600 dark:text-red-400" />
              </button>
            </div>
          ))}
        </main>
      </div>
    </>
  );
};