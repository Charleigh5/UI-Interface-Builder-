import React, { useRef, useContext } from 'react';
import { Tool } from '../library/types';
import { Icon } from './Icon';
import { Library } from './Library';
import { useStore } from '../store/store'; // Corrected import path

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

const ToolItem: React.FC<{ tool: ToolDefinition; isActive: boolean; onClick: () => void; isCollapsed: boolean }> = ({ tool, isActive, onClick, isCollapsed }) => {
    return (
        <div
            onClick={onClick}
            title={isCollapsed ? `${tool.name} - ${tool.description}`: ''}
            className={`relative group/tooltip flex items-center p-2 rounded-lg cursor-pointer transition-all ${
                isActive ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }} // Apply conditional styling here
        >
            <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-md ${isActive ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>
                <Icon name={tool.icon} className={`w-5 h-5 ${isActive ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
            </div>
            <div className={`flex-grow overflow-hidden transition-all duration-200 ease-in-out ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100 ml-3'}`}>
                <div className="font-semibold text-sm whitespace-nowrap">{tool.name}</div>
                <div className={`text-xs whitespace-nowrap ${isActive ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>{tool.description}</div>
            </div>

            {isCollapsed && (
                <div className="absolute left-full ml-3 p-2 min-w-[180px] rounded-md shadow-lg bg-slate-900 text-white ring-1 ring-slate-700
                                invisible opacity-0 translate-x-[-10px] group-hover/tooltip:visible group-hover/tooltip:opacity-100 group-hover/tooltip:translate-x-0 
                                transition-all duration-200 z-50 pointer-events-none">
                    <div className="font-semibold">{tool.name}</div>
                    <div className="text-xs text-slate-100">{tool.description}</div>
                    <div className="absolute top-1/2 -left-1 w-2 h-2 bg-slate-900 transform -translate-y-1/2 rotate-45 ring-1 ring-slate-700"></div>
                </div>
            )}
        </div>
    );
};


export const Toolbar: React.FC = () => {
    const {
        isLeftSidebarVisible,
        theme,
        currentTool,
        drawingSettings,
        components,
        selectedComponentIds,
        isConvertingImage,
        isGeneratingTheme,
        isAnalyzing,
        allEffectivelySelectedIds, // Correctly destructured from useStore
        setTool,
        setTheme,
        groupComponents,
        generateTheme,
        analyzeSketch,
        setDrawingSetting,
        convertImageToComponent,
    } = useStore();
    const isCollapsed = !isLeftSidebarVisible;

    const themeFileInputRef = useRef<HTMLInputElement>(null);
    const imageToComponentInputRef = useRef<HTMLInputElement>(null);


    const handleThemeButtonClick = () => {
        themeFileInputRef.current?.click();
    };

    const handleThemeFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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

    const handleImageToComponentClick = () => {
        imageToComponentInputRef.current?.click();
    };

    const handleImageToComponentFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (reader.result) {
                    convertImageToComponent(reader.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
        event.target.value = '';
    };

    const handleThemeToggle = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
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
    
    const hasLockedSelection = components.some(c => allEffectivelySelectedIds.has(c.id) && c.isLocked);

    return (
        <aside className={`w-full h-full bg-slate-50 border-r border-slate-200 flex flex-col shadow-sm dark:bg-slate-800 dark:border-slate-700 transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-4'}`}>
            <div className={`flex items-center gap-3 mb-6 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon name="logo" className="w-6 h-6 text-white" />
                    </div>
                     <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0' : 'w-auto'}`}>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 whitespace-nowrap">AI Wireframer</h1>
                    </div>
                </div>
                <div className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0' : 'w-auto'}`}>
                    <button
                        onClick={handleThemeToggle}
                        className="relative w-10 h-10 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-yellow-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                        aria-label={theme === 'light' ? 'Activate dark mode' : 'Activate light mode'}
                    >
                        <div className="relative w-6 h-6">
                            <Icon 
                                name="sun" 
                                className={`absolute inset-0 w-6 h-6 transition-all duration-300 ease-in-out ${
                                    theme === 'dark' ? 'opacity-0 transform -rotate-90 scale-50' : 'opacity-100 transform rotate-0 scale-100'
                                }`} 
                            />
                            <Icon 
                                name="moon" 
                                className={`absolute inset-0 w-6 h-6 transition-all duration-300 ease-in-out ${
                                    theme === 'light' ? 'opacity-0 transform rotate-90 scale-50' : 'opacity-100 transform rotate-0 scale-100'
                                }`} 
                            />
                        </div>
                    </button>
                 </div>
            </div>

            <div className="flex-1 flex flex-col gap-6 overflow-y-auto overflow-x-hidden">
                <div>
                    <div className={`transition-all duration-300 overflow-hidden ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-10 opacity-100 mb-2'}`}>
                        <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">Tools</h3>
                    </div>
                    <div className="flex flex-col gap-1">
                        {tools.map(tool => (
                            <ToolItem
                                key={tool.id}
                                tool={tool}
                                isActive={currentTool === tool.id}
                                onClick={() => setTool(tool.id)}
                                isCollapsed={isCollapsed}
                            />
                        ))}
                    </div>
                </div>

                <div className={`flex-1 flex flex-col gap-6 overflow-hidden transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                    <Library isCollapsed={isCollapsed}/>

                    {(currentTool === 'pen' || currentTool === 'rectangle' || currentTool === 'circle') && (
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                            <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-2">Tool Options</h3>
                            <div className="flex flex-col gap-4 px-2">
                                {currentTool === 'pen' && (
                                    <>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center justify-between">
                                                <label htmlFor="penWidth" className="text-sm font-medium text-slate-700 dark:text-slate-300">Width</label>
                                                <span className="text-sm text-slate-500 dark:text-slate-400">{drawingSettings.penWidth}px</span>
                                            </div>
                                            <input
                                                id="penWidth"
                                                type="range"
                                                min="1"
                                                max="20"
                                                step="1"
                                                value={drawingSettings.penWidth}
                                                onChange={(e) => setDrawingSetting('penWidth', parseInt(e.target.value, 10))}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center justify-between">
                                                <label htmlFor="penOpacity" className="text-sm font-medium text-slate-700 dark:text-slate-300">Opacity</label>
                                                <span className="text-sm text-slate-500 dark:text-slate-400">{Math.round(drawingSettings.penOpacity * 100)}%</span>
                                            </div>
                                            <input
                                                id="penOpacity"
                                                type="range"
                                                min="0.1"
                                                max="1"
                                                step="0.1"
                                                value={drawingSettings.penOpacity}
                                                onChange={(e) => setDrawingSetting('penOpacity', parseFloat(e.target.value))}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                                            />
                                        </div>
                                    </>
                                )}
                                {(currentTool === 'rectangle' || currentTool === 'circle') && (
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="shapeFill" className="text-sm font-medium text-slate-700 dark:text-slate-300">Fill Shape</label>
                                        <input
                                            id="shapeFill"
                                            type="checkbox"
                                            checked={drawingSettings.shapeFill}
                                            onChange={(e) => setDrawingSetting('shapeFill', e.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:focus:ring-blue-600 dark:ring-offset-slate-800"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="mt-auto pt-6">
                        <button
                            onClick={groupComponents}
                            disabled={selectedComponentIds.length < 2 || hasLockedSelection}
                            title={hasLockedSelection ? "Cannot group locked items" : "Group selected items"}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 mb-2 bg-slate-600 text-white rounded-lg font-semibold shadow-md hover:bg-slate-700 transition-shadow disabled:opacity-50 disabled:bg-slate-300 disabled:cursor-not-allowed dark:bg-slate-700 dark:hover:bg-slate-600 dark:disabled:bg-slate-600"
                        >
                            <Icon name="group" className="w-5 h-5" />
                            Group Selection
                        </button>
                         <button
                            onClick={handleImageToComponentClick}
                            disabled={isConvertingImage}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 mb-2 bg-indigo-600 text-white rounded-lg font-semibold shadow-md hover:bg-indigo-700 transition-shadow disabled:opacity-50 disabled:bg-slate-300 disabled:cursor-not-allowed dark:disabled:bg-slate-600"
                        >
                            {isConvertingImage ? (
                                <>
                                    <Icon name="loader" className="w-5 h-5 animate-spin" />
                                    Converting...
                                </>
                            ) : (
                                <>
                                    <Icon name="upload" className="w-5 h-5" />
                                    Image to Component
                                </>
                            )}
                        </button>
                        <input type="file" ref={imageToComponentInputRef} onChange={handleImageToComponentFileChange} accept="image/*" className="hidden" />
                         <button
                            onClick={handleThemeButtonClick}
                            disabled={isGeneratingTheme}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 mb-2 bg-purple-600 text-white rounded-lg font-semibold shadow-md hover:bg-purple-700 transition-shadow disabled:opacity-50 disabled:bg-slate-300 disabled:cursor-not-allowed dark:disabled:bg-slate-600"
                        >
                            {isGeneratingTheme ? (
                                 <>
                                    <Icon name="loader" className="w-5 h-5 animate-spin" />
                                    Generating...
                                 </>
                            ) : (
                                 <>
                                    <Icon name="palette" className="w-5 h-5" />
                                    Generate Theme
                                 </>
                            )}
                        </button>
                        <input type="file" ref={themeFileInputRef} onChange={handleThemeFileChange} accept="image/*" className="hidden" />
                         <button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed dark:disabled:bg-slate-600"
                        >
                            {isAnalyzing ? (
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
                    </div>
                </div>
            </div>
        </aside>
    );
};