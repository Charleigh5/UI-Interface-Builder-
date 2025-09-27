import React, { useRef, useContext } from 'react';
import { Tool } from '../library/types';
import { Icon } from './Icon';
import { Library } from './Library';
import { AppContext } from '../store/AppContext';

interface ToolDefinition {
    id: Tool;
    name: string;
    icon: React.ComponentProps<typeof Icon>['name'];
    description: string;
}

const tools: ToolDefinition[] = [
    { id: 'select', name: 'Select', icon: 'cursor', description: 'Select & move elements' },
    { id: 'pen', name: 'Pen', icon: 'pen', description: 'Freehand drawing' },
    { id: 'rectangle', name: 'Rectangle', icon: 'rectangle', description: 'Draw rectangles' },
    { id: 'circle', name: 'circle', icon: 'circle', description: 'Draw circles' },
    { id: 'text', name: 'Text', icon: 'text', description: 'Add text elements' },
    { id: 'button', name: 'Button', icon: 'button', description: 'Create buttons' },
    { id: 'input', name: 'Input', icon: 'input', description: 'Input fields' },
    { id: 'image', name: 'Image', icon: 'image', description: 'Image placeholders' },
];

const ToolItem: React.FC<{ tool: ToolDefinition; isActive: boolean; onClick: () => void }> = ({ tool, isActive, onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                isActive ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
        >
            <div className={`flex items-center justify-center w-8 h-8 rounded-md ${isActive ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>
                <Icon name={tool.icon} className={`w-5 h-5 ${isActive ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
            </div>
            <div>
                <div className="font-semibold text-sm">{tool.name}</div>
                <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>{tool.description}</div>
            </div>
        </div>
    );
};

export const Toolbar: React.FC = () => {
    const { state, dispatch, groupComponents, generateTheme, analyzeSketch } = useContext(AppContext);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleThemeButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                generateTheme(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
        event.target.value = '';
    };

    const handleThemeToggle = () => {
        dispatch({ type: 'SET_THEME', payload: state.theme === 'light' ? 'dark' : 'light' });
    };

    const handleAnalyze = () => {
        const analyzeEvent = new CustomEvent('requestCanvasData', {
            detail: {
                callback: (data: { imageDataUrl?: string, drawnPaths: any[] }) => {
                    if (data.imageDataUrl && data.drawnPaths.length > 0) {
                        analyzeSketch(data.imageDataUrl);
                    } else {
                         alert("Please draw something on the canvas before analyzing.");
                    }
                }
            }
        });
        window.dispatchEvent(analyzeEvent);
    };
    
    return (
        <aside className="w-72 bg-slate-50 border-r border-slate-200 h-full flex flex-col p-4 shadow-sm dark:bg-slate-800 dark:border-slate-700">
            <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Icon name="logo" className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">AI Wireframer</h1>
                </div>
                 <button
                    onClick={handleThemeToggle}
                    className="relative w-10 h-10 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-yellow-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    aria-label={state.theme === 'light' ? 'Activate dark mode' : 'Activate light mode'}
                >
                    <div className="relative w-6 h-6">
                        <Icon 
                            name="sun" 
                            className={`absolute inset-0 w-6 h-6 transition-all duration-300 ease-in-out ${
                                state.theme === 'dark' ? 'opacity-0 transform -rotate-90 scale-50' : 'opacity-100 transform rotate-0 scale-100'
                            }`} 
                        />
                        <Icon 
                            name="moon" 
                            className={`absolute inset-0 w-6 h-6 transition-all duration-300 ease-in-out ${
                                state.theme === 'light' ? 'opacity-0 transform rotate-90 scale-50' : 'opacity-100 transform rotate-0 scale-100'
                            }`} 
                        />
                    </div>
                </button>
            </div>

            <div className="flex-1 flex flex-col gap-6">
                <div>
                    <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-2">Tools</h3>
                    <div className="flex flex-col gap-1">
                        {tools.map(tool => (
                            <ToolItem
                                key={tool.id}
                                tool={tool}
                                isActive={state.currentTool === tool.id}
                                onClick={() => dispatch({ type: 'SET_TOOL', payload: tool.id })}
                            />
                        ))}
                    </div>
                </div>

                <Library />

                <div className="mt-auto">
                    <button
                        onClick={groupComponents}
                        disabled={state.selectedComponentIds.length < 2}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 mb-2 bg-slate-600 text-white rounded-lg font-semibold shadow-md hover:bg-slate-700 transition-shadow disabled:opacity-50 disabled:bg-slate-300 disabled:cursor-not-allowed dark:bg-slate-700 dark:hover:bg-slate-600 dark:disabled:bg-slate-600"
                    >
                        <Icon name="group" className="w-5 h-5" />
                        Group Selection
                    </button>
                     <button
                        onClick={handleThemeButtonClick}
                        disabled={state.isGeneratingTheme}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 mb-2 bg-purple-600 text-white rounded-lg font-semibold shadow-md hover:bg-purple-700 transition-shadow disabled:opacity-50 disabled:bg-slate-300 disabled:cursor-not-allowed dark:disabled:bg-slate-600"
                    >
                        {state.isGeneratingTheme ? (
                             <>
                                <Icon name="loader" className="w-5 h-5 animate-spin" />
                                Generating Theme...
                             </>
                        ) : (
                             <>
                                <Icon name="palette" className="w-5 h-5" />
                                Generate Theme
                             </>
                        )}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                     <button
                        onClick={handleAnalyze}
                        disabled={state.isAnalyzing}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed dark:disabled:bg-slate-600"
                    >
                        {state.isAnalyzing ? (
                             <>
                                <Icon name="loader" className="w-5 h-5 animate-spin" />
                                Analyzing...
                             </>
                        ) : (
                             <>
                                <Icon name="sparkles" className="w-5 h-5" />
                                Analyze Sketch
                             </>
                        )}
                    </button>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">Draw a sketch or drag from the library!</p>
                </div>
            </div>
        </aside>
    );
};