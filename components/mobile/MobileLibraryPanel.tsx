import React, { useContext, useEffect, useCallback, useRef, useState } from 'react';
import { Icon } from '../Icon';
import { libraryItems } from '../../library/definitions';
import { AppContext } from '../../store/AppContext';

export const MobileLibraryPanel: React.FC<{
  isVisible: boolean;
  onClose: () => void;
}> = ({ isVisible, onClose }) => {
  const { addLibraryComponent } = useContext(AppContext);
  const panelRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const [search, setSearch] = useState('');

  const filtered = Object.entries(libraryItems).filter(([, item]) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

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
        className="fixed inset-0 z-50 bg-white dark:bg-slate-900 safe-top safe-bottom safe-left safe-right overflow-y-auto"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Component Library
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Tap to add to canvas</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 touch-min rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Close"
          >
            <Icon name="x" className="w-5 h-5" />
          </button>
        </header>

        {/* Search */}
        <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            <Icon name="component" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search components..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Grid */}
        <main className="p-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Icon name="component" className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-lg font-medium text-slate-600 dark:text-slate-400">No components found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filtered.map(([name, item]) => (
                <button
                  key={name}
                  onClick={() => {
                    const rect = document.querySelector('canvas')?.getBoundingClientRect();
                    const cx = (rect?.width ?? window.innerWidth) / 2;
                    const cy = (rect?.height ?? window.innerHeight) / 2;
                    addLibraryComponent(name, { x: cx - item.width / 2, y: cy - item.height / 2 });
                    onClose();
                  }}
                  className="flex flex-col items-center p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-500 dark:hover:border-blue-500"
                >
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                    <Icon name={item.icon} className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 text-center">{item.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.width} × {item.height}</p>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
};