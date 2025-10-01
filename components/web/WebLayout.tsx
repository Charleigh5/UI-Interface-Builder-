import React, { useContext } from 'react';
import { Canvas } from '../Canvas';
import { Toolbar } from '../Toolbar';
import { RightSidebar } from '../RightSidebar';
import { ZoomControls } from '../ZoomControls';
import { Icon } from '../Icon';
import { AppContext } from '../../store/AppContext';

/**
 * WebLayout preserves the existing desktop three-panel layout.
 * 
 * Structure:
 * - Left sidebar: Collapsible toolbar with tools and library
 * - Center: Canvas with zoom controls
 * - Right sidebar: Properties, layers, and code panels
 * 
 * This component maintains all existing desktop functionality unchanged.
 */
export const WebLayout: React.FC = () => {
    const { state, toggleRightSidebar, toggleLeftSidebar } = useContext(AppContext);

    return (
        <div className="flex h-screen w-screen bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200 overflow-hidden">
            {/* Left Sidebar - Toolbar */}
            <div className={`relative flex-shrink-0 transition-all duration-300 ease-in-out ${state.isLeftSidebarVisible ? 'w-72' : 'w-[72px]'}`}>
                <div className="w-full h-full overflow-hidden">
                    <Toolbar />
                </div>
                <button
                    onClick={toggleLeftSidebar}
                    className="absolute top-4 -right-[15px] z-20 w-8 h-8 flex items-center justify-center bg-slate-50 dark:bg-slate-800 border border-l-0 border-slate-200 dark:border-slate-700 rounded-r-md hover:bg-slate-100 dark:hover:bg-slate-600"
                    title={state.isLeftSidebarVisible ? "Collapse Toolbar" : "Expand Toolbar"}
                    aria-label={state.isLeftSidebarVisible ? "Collapse Toolbar" : "Expand Toolbar"}
                >
                    <Icon name={state.isLeftSidebarVisible ? "chevron-left" : "chevron-right"} className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
            </div>

            {/* Center - Canvas */}
            <main className="flex-1 flex items-center justify-center p-4 relative">
                <Canvas />
                <ZoomControls />
            </main>

            {/* Right Sidebar - Properties/Layers/Code */}
            <div className={`relative flex-shrink-0 transition-all duration-300 ease-in-out ${state.isRightSidebarVisible ? 'w-80' : 'w-0'}`}>
                <div className="w-80 h-full overflow-hidden">
                    <RightSidebar />
                </div>
                <button
                    onClick={toggleRightSidebar}
                    className="absolute top-4 -left-[15px] z-20 w-8 h-8 flex items-center justify-center bg-slate-50 dark:bg-slate-800 border border-r-0 border-slate-200 dark:border-slate-700 rounded-l-md hover:bg-slate-100 dark:hover:bg-slate-600"
                    title={state.isRightSidebarVisible ? "Collapse Panel" : "Expand Panel"}
                    aria-label={state.isRightSidebarVisible ? "Collapse Panel" : "Expand Panel"}
                >
                    <Icon name={state.isRightSidebarVisible ? "chevron-right" : "chevron-left"} className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
            </div>
        </div>
    );
};