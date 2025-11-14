import React, { useContext, useCallback, useEffect } from 'react';
import { AppContext } from '../store/AppContext';
import { Icon } from './Icon';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useHapticFeedback } from './hooks/useHapticFeedback';

export const ZoomControls: React.FC = () => {
  const { state, setViewTransform } = useContext(AppContext);
  const { zoom } = state;
  const { xl } = useBreakpoint();
  const isMobile = !xl;
  const { triggerHapticFeedback } = useHapticFeedback(isMobile);

  const handleZoom = useCallback(
    (dir: 'in' | 'out') => {
      const factor = 1.2;
      const newZoom = dir === 'in' ? zoom * factor : zoom / factor;
      const clamped = Math.max(0.1, Math.min(newZoom, 4));
      if (Math.abs(clamped - zoom) > 0.001) {
        setViewTransform({ zoom: clamped });
        triggerHapticFeedback('light');
      }
    },
    [zoom, setViewTransform, triggerHapticFeedback]
  );

  const handleReset = useCallback(() => {
    setViewTransform({ zoom: 1, pan: { x: 0, y: 0 } });
    triggerHapticFeedback('selection');
  }, [setViewTransform, triggerHapticFeedback]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        switch (e.key) {
          case '=':
          case '+':
            e.preventDefault();
            handleZoom('in');
            break;
          case '-':
            e.preventDefault();
            handleZoom('out');
            break;
          case '0':
            e.preventDefault();
            handleReset();
            break;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleZoom, handleReset]);

  const btnClass = isMobile
    ? 'touch-min rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 active:scale-95'
    : 'w-8 h-8 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600';

  const containerClass = isMobile
    ? `fixed bottom-4 left-4 z-20 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl p-2 gap-2 flex items-center shadow-lg safe-bottom safe-left`
    : `absolute bottom-4 right-4 z-10 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-md rounded-lg p-1 gap-1 flex items-center shadow`;

  return (
    <div className={containerClass} role="toolbar" aria-label="Zoom controls">
      <button
        onClick={() => handleZoom('out')}
        disabled={zoom <= 0.1}
        className={btnClass}
        aria-label="Zoom out"
        title="Zoom out"
      >
        <Icon name="zoom-out" className={isMobile ? 'w-6 h-6' : 'w-5 h-5'} />
      </button>

      <button
        onClick={handleReset}
        className={`font-medium ${btnClass}`}
        aria-label="Reset zoom to 100%"
        title="Reset zoom"
      >
        <span className="text-sm">{Math.round(zoom * 100)}%</span>
      </button>

      <button
        onClick={() => handleZoom('in')}
        disabled={zoom >= 4}
        className={btnClass}
        aria-label="Zoom in"
        title="Zoom in"
      >
        <Icon name="zoom-in" className={isMobile ? 'w-6 h-6' : 'w-5 h-5'} />
      </button>
    </div>
  );
};