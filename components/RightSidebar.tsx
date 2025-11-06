import React, { useState, useContext } from 'react';
import { Alignment, ComponentProperties, LayoutSuggestionType } from '../library/types';
import { ComponentList } from './ComponentList';
import { PropertiesPanel } from './PropertiesPanel';
import { CodePanel } from './CodePanel';
import { Icon } from './Icon';
import { useStore } from '../store/store'; // Corrected import path

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
    const {
        components,
        selectedComponentIds,
        styleSuggestions,
        isGeneratingStyles,
        isGeneratingLayout,
        allEffectivelySelectedIds,
        bringToFront,
        sendToBack,
        alignComponents,
        generateContent,
        generateStyles,
        applyStyle,
        generateLayout,
        duplicateComponents,
        clearStyleSuggestions,
    } = useStore();
    
    const selectedComponent = selectedComponentIds.length === 1 ? components.find(c => c.id === selectedComponentIds[0]) || null : null;
    const hasLockedSelection = components.some(c => allEffectivelySelectedIds.has(c.id) && c.isLocked);

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
        clearStyleSuggestions();
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
        <aside className="w-full bg-slate-50 border-l border-slate-200 h-full flex flex-col shadow-sm dark:bg-slate-800 dark:border-slate-700">
   
         {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => setActiveTab('layers')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === 'layers'
                            ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                >
                    <Icon name="layers" className="w-4 h-4 inline mr-2" />
                    Layers
                </button>
                <button
                    onClick={() => setActiveTab('code')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === 'code'
                            ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                >
                    <Icon name="code" className="w-4 h-4 inline mr-2" />
                    Code
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'layers' ? <ComponentList /> : <CodePanel components={components} />}
            </div>

            {/* Properties Panel */}
            {selectedComponent && <PropertiesPanel component={selectedComponent} />}

            {/* AI Tools Section */}
            {selectedComponentIds.length > 0 && (
                <div className="border-t border-slate-200 dark:border-slate-700 p-4 space-y-4">
                    {/* Content Generation */}
                    <div>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 dark:text-slate-500">
                            AI Content
                        </h3>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={contentPrompt}
                                onChange={(e) => setContentPrompt(e.target.value)}
                                placeholder="Generate content..."
                                className="flex-1 text-sm border-slate-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                                disabled={hasLockedSelection}
                            />
                            <button
                                onClick={handleGenerateContentClick}
                                disabled={!contentPrompt || isGeneratingContent || hasLockedSelection}
                                className="px-3 py-2 bg-blue-600 text-white rounded-md font-semibold shadow-md hover:bg-blue-700 transition-shadow disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-slate-600"
                            >
                                {isGeneratingContent ? <Icon name="loader" className="w-5 h-5 animate-spin" /> : <Icon name="sparkles" className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Style Generation */}
                    <div>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 dark:text-slate-500">
                            AI Styles
                        </h3>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={stylePrompt}
                                onChange={(e) => setStylePrompt(e.target.value)}
                                placeholder="Describe style..."
                                className="flex-1 text-sm border-slate-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                                disabled={hasLockedSelection}
                            />
                            <button
                                onClick={handleGenerateStylesClick}
                                disabled={!stylePrompt || isGeneratingStyles || hasLockedSelection}
                                className="px-3 py-2 bg-blue-600 text-white rounded-md font-semibold shadow-md hover:bg-blue-700 transition-shadow disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-slate-600"
                            >
                                {isGeneratingStyles ? <Icon name="loader" className="w-5 h-5 animate-spin" /> : <Icon name="sparkles" className="w-5 h-5" />}
                            </button>
                        </div>
                        
                        {styleSuggestions.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Style Variations</span>
                                    <button onClick={onClearStyles} className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">Clear</button>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {styleSuggestions.map((style, index) => (
                                        <StylePreview key={index} style={style} onClick={() => applyStyle(style)} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Layout Suggestions */}
                    {selectedComponentIds.length >= 2 && (
                        <div>
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 dark:text-slate-500">
                                AI Layout
                            </h3>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => handleGenerateLayoutClick('grid')}
                                    disabled={isGeneratingLayout || hasLockedSelection}
                                    className="px-3 py-2 bg-slate-200 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-300 transition-colors disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                                >
                                    Grid
                                </button>
                                <button
                                    onClick={() => handleGenerateLayoutClick('vertical-stack')}
                                    disabled={isGeneratingLayout || hasLockedSelection}
                                    className="px-3 py-2 bg-slate-200 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-300 transition-colors disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                                >
                                    V-Stack
                                </button>
                                <button
                                    onClick={() => handleGenerateLayoutClick('horizontal-list')}
                                    disabled={isGeneratingLayout || hasLockedSelection}
                                    className="px-3 py-2 bg-slate-200 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-300 transition-colors disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                                >
                                    H-List
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Alignment Tools */}
                    {selectedComponentIds.length >= 2 && (
                        <div>
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 dark:text-slate-500">
                                Alignment
                            </h3>
                            <div className="grid grid-cols-3 gap-2">
                                {alignmentTools.map((tool) => (
                                    <button
                                        key={tool.type}
                                        onClick={() => alignComponents(tool.type)}
                                        className="p-2 bg-slate-200 rounded-md hover:bg-slate-300 transition-colors disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
                                        title={tool.name}
                                        disabled={hasLockedSelection}
                                    >
                                        <Icon name={tool.icon} className="w-5 h-5 text-slate-600 dark:text-slate-300 mx-auto" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Layer Order */}
                    {selectedComponentIds.length > 0 && (
                        <div>
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 dark:text-slate-500">
                                Layer Order
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={bringToFront}
                                    className="px-3 py-2 bg-slate-200 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-300 transition-colors disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                                    disabled={hasLockedSelection}
                                >
                                    <Icon name="bring-to-front" className="w-4 h-4 inline mr-1" />
                                    Front
                                </button>
                                <button
                                    onClick={sendToBack}
                                    className="px-3 py-2 bg-slate-200 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-300 transition-colors disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                                    disabled={hasLockedSelection}
                                >
                                    <Icon name="send-to-back" className="w-4 h-4 inline mr-1" />
                                    Back
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Duplicate */}
                    {selectedComponentIds.length > 0 && (
                        <button
                            onClick={duplicateComponents}
                            className="w-full px-3 py-2 bg-slate-200 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-300 transition-colors disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                            disabled={hasLockedSelection}
                        >
                            <Icon name="copy" className="w-4 h-4 inline mr-1" />
                            Duplicate
                        </button>
                    )}
                </div>
            )}
        </aside>
    );
};