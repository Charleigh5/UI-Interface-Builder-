
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
    const { state, dispatch, bringToFront, sendToBack, alignComponents, generateContent, generateStyles, applyStyle, generateLayout, allEffectivelySelectedIds, duplicateComponents } = useContext(AppContext);
    const { components, selectedComponentIds, styleSuggestions, isGeneratingStyles, isGeneratingLayout } = state;
    
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
        <aside className="w-full bg-slate-50 border-l border-slate-200 h-full flex flex-col shadow-sm dark:bg-slate-800 dark:border