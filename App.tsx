
import React, { useContext, useEffect } from 'react';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { RightSidebar } from './components/RightSidebar';
import { AppContext } from './store/AppContext';

export default function App() {
    const { state } = useContext(AppContext);

    useEffect(() => {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(state.theme);
    }, [state.theme]);

    return (
        <div className="flex h-screen w-screen bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200">
            <Toolbar />
            <main className="flex-1 flex items-center justify-center p-4">
                <Canvas />
            </main>
            <RightSidebar />
        </div>
    );
}
