
import React, { useContext } from 'react';
import { AppContext } from '../store/AppContext';
import { Icon } from './Icon';

export const ZoomControls: React.FC = () => {
    const { state, setViewTransform } = useContext(AppContext);
    const { zoom } = state;

    const handleZoom = (direction: 'in' | 'out') => {
        const zoomFactor = 1.2;
        const newZoom = direction === 'in' ? zoom * zoomFactor : zoom / zoomFactor;
        const clampedZoom = Math.max(0.1, Math.min(newZoom, 4));
        setViewTransform({ zoom: clampedZoom });
    };

    const handleReset = () => {
        setViewTransform({ zoom: 1, pan: { x: 0, y: 0 } });
    };

    return (
        <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-sm p-1 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
            <button
                onClick={() => handleZoom('out')}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Zoom Out"
            >
                <Icon name="zoom-out" className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <button
                onClick={handleReset}
                className="px-3 h-8 text-sm font-semibold text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Reset View"
            >
                {Math.round(zoom * 100)}%
            </button>
            <button
                onClick={() => handleZoom('in')}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Zoom In"
            >
                <Icon name="zoom-in" className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
        </div>
    );
};
