import React, { useContext, useEffect, useCallback, useRef } from 'react';
import { Icon } from '../Icon';
import { AppContext } from '../../store/AppContext';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

const tools = [
  { id: 'select' as const, name: 'Select', icon: 'cursor' },
  { id: 'pen' as const, name: 'Pen', icon: 'pen' },
  { id: 'rectangle' as const, name: 'Rectangle', icon: 'rectangle' },
  { id: 'circle' as const, name: 'Circle', icon: 'circle' },
  { id: 'text' as const, name: 'Text', icon: 'text' },
  { id: 'button' as const, name: 'Button', icon: 'button' },
  { id: 'input' as const, name: 'Input', icon: 'input' },
  { id: 'image' as const, name: 'Image', icon: 'image' },
];

export const MobileToolbar: React.FC<{
  isVisible: boolean;
  onClose: () => void;
}> = ({ isVisible, onClose }) => {
  const { state, setTool, setActiveMobilePanel } = useContext(AppContext);
  const { triggerHapticFeedback } = useHapticFeedback(true);
  const panelRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);

  const handleTool = (toolId: typeof tools[number]['id']) => {
    setTool(toolId);
    triggerHapticFeedback('light');
    onClose();
  };

  // Swipe‑down to close
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  }, []);
  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const dy = e.changedTouches[0].clientY - startY.current;
      if (dy > 100 && panelRef.current?.scrollTop === 0) {
        onClose();
        triggerHapticFeedback('light');
      }
    },
    [onClose, triggerHapticFeedback]
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
      {/* Backdrop */}
      <div
        className="backdrop backdrop-enter"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-slate-900 safe-top safe-bottom safe-left safe-right rounded-t-2xl shadow-2xl overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Handle */}
        <div className="flex justify-center py-2">
          <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
        </div>

        {/* Header */}
        <header className="flex items-center justify-between px-4 pb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Tools
          </h2>
          <button
            onClick={onClose}
            className="p-2 touch-min rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Close toolbar"
          >
            <Icon name="x" className="w-5 h-5" />
          </button>
        </header>

        {/* Primary tools */}
        <section className="px-4 pb-6">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
            Drawing Tools
          </h3>
          <div className="toolbar-grid">
            {tools.slice(0, 5).map(t => (
              <button
                key={t.id}
                onClick={() => handleTool(t.id)}
                className={`touch-min rounded-lg transition-colors ${
                  state.currentTool === t.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
                aria-label={t.name}
              >
                <Icon name={t.icon} className="w-6 h-6" />
                <span className="sr-only">{t.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Quick actions (when something is selected) */}
        {state.selectedComponentIds.length > 0 && (
          <section className="px-4 pb-6 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
              Quick Actions
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  onClose();
                  setActiveMobilePanel('properties');
                }}
                className="touch-min rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600"
                aria-label="Edit properties"
              >
                <Icon name="settings" className="w-5 h-5 text-green-600 dark:text-green-400" />
              </button>
              <button
                onClick={() => {
                  onClose();
                  setActiveMobilePanel('layers');
                }}
                className="touch-min rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600"
                aria-label="View layers"
              >
                <Icon name="layers" className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </button>
              <button
                onClick={() => {
                  onClose();
                  setActiveMobilePanel('library');
                }}
                className="touch-min rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600"
                aria-label="Component library"
              >
                <Icon name="grid" className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </button>
            </div>
          </section>
        )}

        {/* Secondary tools (expandable) */}
        <section className="px-4 pb-6 border-t border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
            More Tools
          </h3>
          <div className="toolbar-grid">
            {tools.slice(5).map(t => (
              <button
                key={t.id}
                onClick={() => handleTool(t.id)}
                className={`touch-min rounded-lg transition-colors ${
                  state.currentTool === t.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
                aria-label={t.name}
              >
                <Icon name={t.icon} className="w-6 h-6" />
                <span className="sr-only">{t.name}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </>
  );
};