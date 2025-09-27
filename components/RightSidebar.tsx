import React, { useState, useContext } from 'react';
import { Alignment, ComponentProperties, LayoutSuggestionType } from '../library/types';
import { ComponentList } from './ComponentList';
import { PropertiesPanel } from './PropertiesPanel';
import { CodePanel } from './CodePanel';
import { Icon } from './Icon';
import { AppContext } from '../store/AppContext';

type ActiveTab = 'layers' | 'code';

const StylePreview: React.FC<{ style: Partial<ComponentProperties>; onClick: () => void }> = ({ style, onClick }) => {
    const previewStyle: React.CSSProperties = {
        backgroundColor: style.backgroundColor || '#ffffff',
        borderColor: style.borderColor || '#cccccc',
        borderWidth: style.borderWidth ? `${style.borderWidth}px` : '1px',
        borderRadius: style.borderRadius ? `${style.borderRadius}px` : '4px',
        borderStyle: 'solid',
        color: style.textColor || '#000000',
        fontWeight: style.fontWeight || 'normal',
    };
    return (
        <div 
            onClick={onClick} 
            className="h-16 flex items-center justify-center text-center p-2 cursor-pointer transition-transform hover:scale-105 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-md"
            style={previewStyle}
        >
            <span className="text-xs font-medium" style={{ color: style.textColor }}>Style</span>
        </div>
    );
};

export const RightSidebar: React.FC = () => {
    const { state, dispatch, bringToFront, sendToBack, alignComponents, generateContent, generateStyles, applyStyle, generateLayout } = useContext(AppContext);
    const { components, selectedComponentIds, styleSuggestions, isGeneratingStyles, isGeneratingLayout } = state;
    
    const selectedComponent = selectedComponentIds.length === 1 ? components.find(c => c.id === selectedComponentIds[0]) || null : null;

    const [activeTab, setActiveTab] = useState<ActiveTab>('layers');
    const [contentPrompt, setContentPrompt] = useState('');
    const [isGeneratingContent, setIsGeneratingContent] = useState(false);
    const [stylePrompt, setStylePrompt] = useState('');

    const handleGenerateContentClick = async () => {
        setIsGeneratingContent(true);
        await generateContent(contentPrompt);
        setIsGeneratingContent(false);
        setContentPrompt('');
    };
    
    const handleGenerateStylesClick = async () => {
        await generateStyles(stylePrompt);
    };

    const handleStylePresetClick = (preset: string) => {
        setStylePrompt(preset);
        generateStyles(preset);
    };

    const handleGenerateLayoutClick = async (layoutType: LayoutSuggestionType) => {
        await generateLayout(layoutType);
    };

    const onClearStyles = () => {
        dispatch({ type: 'CLEAR_STYLE_SUGGESTIONS' });
    };

    const alignmentTools: { name: string; type: Alignment; icon: React.ComponentProps<typeof Icon>['name'] }[] = [
        { name: 'Align Left', type: 'left', icon: 'align-left' },
        { name: 'Align Center', type: 'center-horizontal', icon: 'align-center-horizontal' },
        { name: 'Align Right', type: 'right', icon: 'align-right' },
        { name: 'Align Top', type: 'top', icon: 'align-top' },
        { name: 'Align Middle', type: 'center-vertical', icon: 'align-center-vertical' },
        { name: 'Align Bottom', type: 'bottom', icon: 'align-bottom' },
    ];

    return (
        <aside className="w-80 bg-slate-50 border-l border-slate-200 h-full flex flex-col shadow-sm dark:bg-slate-800 dark:border-slate-700">
            <div className="flex p-2 bg-slate-100 border-b border-slate-200 dark:bg-slate-900/50 dark:border-slate-700">
                <button
                    onClick={() => setActiveTab('layers')}
                    className={`flex-1 py-2 text-sm font-semibold flex items-center justify-center gap-2 rounded-md transition-colors ${
                        activeTab === 'layers' ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-slate-100' : 'text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700/50'
                    }`}
                >
                    <Icon name="layers" className="w-4 h-4" />
                    Design
                </button>
                <button
                    onClick={() => setActiveTab('code')}
                    className={`flex-1 py-2 text-sm font-semibold flex items-center justify-center gap-2 rounded-md transition-colors ${
                        activeTab === 'code' ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-slate-100' : 'text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700/50'
                    }`}
                >
                    <Icon name="code" className="w-4 h-4" />
                    Code
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {activeTab === 'layers' && (
                    <div className="p-4 flex flex-col gap-4">
                        <ComponentList />
                        
                        {selectedComponent && <PropertiesPanel component={selectedComponent} />}

                        {selectedComponentIds.length > 1 && (
                             <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                                <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-2">Arrange & Align</h3>
                                <div className="px-2">
                                     <div className="grid grid-cols-6 gap-2 mb-3">
                                        {alignmentTools.map(tool => (
                                            <button key={tool.type} title={tool.name} onClick={() => alignComponents(tool.type)} className="p-2 rounded-md bg-white hover:bg-slate-100 border border-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:border-slate-600">
                                                <Icon name={tool.icon} className="w-5 h-5 text-slate-600 dark:text-slate-300 mx-auto" />
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={bringToFront} className="flex items-center justify-center gap-2 text-sm py-2 px-3 rounded-md bg-white hover:bg-slate-100 border border-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:border-slate-600">
                                            <Icon name="bring-to-front" className="w-4 h-4" /> Bring to Front
                                        </button>
                                        <button onClick={sendToBack} className="flex items-center justify-center gap-2 text-sm py-2 px-3 rounded-md bg-white hover:bg-slate-100 border border-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:border-slate-600">
                                            <Icon name="send-to-back" className="w-4 h-4" /> Send to Back
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedComponentIds.length > 0 && (
                            <>
                             <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                                <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-2">Layout Suggestions</h3>
                                <div className="px-2 grid grid-cols-3 gap-2">
                                    <button onClick={() => handleGenerateLayoutClick('vertical-stack')} disabled={isGeneratingLayout} className="text-xs py-2 px-2 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors disabled:opacity-50 dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600">Vertical</button>
                                    <button onClick={() => handleGenerateLayoutClick('horizontal-list')} disabled={isGeneratingLayout} className="text-xs py-2 px-2 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors disabled:opacity-50 dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600">Horizontal</button>
                                    <button onClick={() => handleGenerateLayoutClick('grid')} disabled={isGeneratingLayout} className="text-xs py-2 px-2 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors disabled:opacity-50 dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600">Grid</button>
                                </div>
                             </div>
                             <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                                <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-2">Generate Styles</h3>
                                <div className="px-2 flex flex-col gap-2">
                                     <div className="grid grid-cols-3 gap-2">
                                        <button onClick={() => handleStylePresetClick('Modern dark mode')} className="text-xs py-1 px-2 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600">Modern</button>
                                        <button onClick={() => handleStylePresetClick('Minimalist, clean and airy')} className="text-xs py-1 px-2 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600">Minimalist</button>
                                        <button onClick={() => handleStylePresetClick('Playful and colorful')} className="text-xs py-1 px-2 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600">Playful</button>
                                    </div>
                                    <textarea
                                        value={stylePrompt}
                                        onChange={e => setStylePrompt(e.target.value)}
                                        placeholder="Or describe a custom style..."
                                        className="w-full text-sm border-slate-300 rounded-md shadow-sm h-16 disabled:bg-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-400"
                                        disabled={isGeneratingStyles}
                                    />
                                    <button
                                        onClick={handleGenerateStylesClick}
                                        disabled={isGeneratingStyles || !stylePrompt}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold shadow-md hover:bg-emerald-700 transition-shadow disabled:opacity-50 disabled:bg-slate-300 disabled:cursor-not-allowed dark:disabled:bg-slate-600"
                                    >
                                        {isGeneratingStyles ? (
                                             <><Icon name="loader" className="w-5 h-5 animate-spin" />Generating...</>
                                        ) : (
                                             <><Icon name="sparkles" className="w-5 h-5" />Generate Styles</>
                                        )}
                                    </button>
                                     {styleSuggestions.length > 0 && (
                                        <div className="mt-2">
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Click to apply a style:</p>
                                                <button onClick={onClearStyles} className="text-xs text-blue-600 hover:underline dark:text-blue-400">Clear</button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {styleSuggestions.map((style, index) => (
                                                    <StylePreview key={index} style={style} onClick={() => applyStyle(style)} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                                <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-2">Generate Content</h3>
                                <div className="px-2 flex flex-col gap-2">
                                    <textarea
                                        value={contentPrompt}
                                        onChange={e => setContentPrompt(e.target.value)}
                                        placeholder="e.g., A profile card for a software engineer"
                                        className="w-full text-sm border-slate-300 rounded-md shadow-sm h-20 disabled:bg-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-400"
                                        disabled={isGeneratingContent}
                                    />
                                    <button
                                        onClick={handleGenerateContentClick}
                                        disabled={isGeneratingContent || !contentPrompt || selectedComponentIds.length === 0}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow-md hover:bg-blue-700 transition-shadow disabled:opacity-50 disabled:bg-slate-300 disabled:cursor-not-allowed dark:disabled:bg-slate-600"
                                    >
                                        {isGeneratingContent ? (
                                            <>
                                                <Icon name="loader" className="w-5 h-5 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Icon name="sparkles" className="w-5 h-5" />
                                                Fill Content
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                            </>
                        )}
                    </div>
                )}
                {activeTab === 'code' && (
                    <div className="p-4">
                        <CodePanel components={components} />
                    </div>
                )}
            </div>
        </aside>
    );
};