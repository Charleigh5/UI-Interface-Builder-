import React, { useState, useContext, useRef, useCallback, useEffect } from 'react';
import { WireframeComponent, ComponentProperties } from '../../library/types';
import { Icon } from '../Icon';
import { generateImage } from '../../library/services/geminiService';
import { AppContext } from '../../store/AppContext';

interface MobilePropertiesPanelProps {
    isVisible: boolean;
    onClose: () => void;
}

const PropertyInput: React.FC<{
    label: string;
    children: React.ReactNode;
}> = ({ label, children }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-300">{label}</label>
        {children}
    </div>
);

/**
 * MobilePropertiesPanel provides a full-screen modal interface for editing component properties on mobile devices.
 * 
 * Design Features:
 * - Full-screen modal with header and close button
 * - Touch-optimized controls with larger touch targets
 * - Swipe-down-to-dismiss functionality
 * - Identical functionality to desktop properties panel
 * - Smooth slide-up animation
 */
export const MobilePropertiesPanel: React.FC<MobilePropertiesPanelProps> = ({ isVisible, onClose }) => {
    const { state, dispatch, ungroupComponents } = useContext(AppContext);
    const [imagePrompt, setImagePrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Swipe gesture handling
    const touchStartY = useRef<number>(0);
    const panelRef = useRef<HTMLDivElement>(null);

    // Get the selected component
    const selectedComponent = state.components.find(c => 
        state.selectedComponentIds.length === 1 && c.id === state.selectedComponentIds[0]
    );

    const handleUpdateComponent = (id: string, updates: Partial<WireframeComponent>) => {
        dispatch({ type: 'UPDATE_COMPONENT', payload: { id, updates } });
    };

    const handlePropertyChange = <K extends keyof ComponentProperties,>(
        key: K, 
        value: ComponentProperties[K]
    ) => {
        if (!selectedComponent) return;
        const newProperties = { ...selectedComponent.properties, [key]: value };
        handleUpdateComponent(selectedComponent.id, { properties: newProperties });
    };

    const handleGenerateImage = async () => {
        if (!imagePrompt || isGenerating || !selectedComponent) return;
        setIsGenerating(true);
        try {
            const base64Data = await generateImage(
                imagePrompt, 
                selectedComponent.width, 
                selectedComponent.height
            );
            handlePropertyChange('imageDataUrl', `data:image/png;base64,${base64Data}`);
        } catch (error) {
            console.error(error);
            alert('Failed to generate image. Please check the console for details.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Swipe down gesture to close panel
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - touchStartY.current;
        
        if (deltaY > 0 && panelRef.current?.scrollTop === 0) {
            e.preventDefault();
        }
    }, []);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        const currentY = e.changedTouches[0].clientY;
        const deltaY = currentY - touchStartY.current;
        const swipeThreshold = 100;
        
        if (deltaY > swipeThreshold && panelRef.current?.scrollTop === 0) {
            onClose();
        }
    }, [onClose]);

    // Keyboard support - close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isVisible) {
                onClose();
            }
        };

        if (isVisible) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isVisible, onClose]);

    if (!isVisible || !selectedComponent) return null;

    const isLocked = !!selectedComponent.isLocked;

    const renderCommonFields = () => (
        <>
            <PropertyInput label="Background Color">
                <input 
                    type="color" 
                    value={selectedComponent.properties.backgroundColor || '#ffffff'} 
                    onChange={e => handlePropertyChange('backgroundColor', e.target.value)} 
                    className="w-full h-12 p-1 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer disabled:opacity-50" 
                    disabled={isLocked} 
                />
            </PropertyInput>
            <PropertyInput label="Border Color">
                <input 
                    type="color" 
                    value={selectedComponent.properties.borderColor || '#cbd5e1'} 
                    onChange={e => handlePropertyChange('borderColor', e.target.value)} 
                    className="w-full h-12 p-1 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer disabled:opacity-50" 
                    disabled={isLocked} 
                />
            </PropertyInput>
            <div className="grid grid-cols-2 gap-4">
                <PropertyInput label="Border Width">
                    <input 
                        type="number" 
                        min="0" 
                        value={selectedComponent.properties.borderWidth ?? 1} 
                        onChange={e => handlePropertyChange('borderWidth', parseInt(e.target.value))} 
                        className="w-full text-base p-3 border border-slate-300 rounded-lg shadow-sm disabled:bg-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:disabled:bg-slate-700/50" 
                        disabled={isLocked} 
                    />
                </PropertyInput>
                <PropertyInput label="Border Radius">
                    <input 
                        type="number" 
                        min="0" 
                        value={selectedComponent.properties.borderRadius ?? 4} 
                        onChange={e => handlePropertyChange('borderRadius', parseInt(e.target.value))} 
                        className="w-full text-base p-3 border border-slate-300 rounded-lg shadow-sm disabled:bg-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:disabled:bg-slate-700/50" 
                        disabled={isLocked} 
                    />
                </PropertyInput>
            </div>
        </>
    );

    const renderTypeSpecificFields = () => {
        switch (selectedComponent.type) {
            case 'button':
                return (
                    <PropertyInput label="Button Text">
                        <input 
                            type="text" 
                            value={selectedComponent.properties.buttonText || 'Button'} 
                            onChange={e => handlePropertyChange('buttonText', e.target.value)} 
                            className="w-full text-base p-3 border border-slate-300 rounded-lg shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" 
                            disabled={isLocked}
                        />
                    </PropertyInput>
                );
            case 'input':
                return (
                    <PropertyInput label="Placeholder Text">
                        <input 
                            type="text" 
                            value={selectedComponent.properties.placeholder || 'Placeholder'} 
                            onChange={e => handlePropertyChange('placeholder', e.target.value)} 
                            className="w-full text-base p-3 border border-slate-300 rounded-lg shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" 
                            disabled={isLocked}
                        />
                    </PropertyInput>
                );
            case 'text':
                return (
                    <>
                        <PropertyInput label="Text Color">
                            <input 
                                type="color" 
                                value={selectedComponent.properties.textColor || '#1e293b'} 
                                onChange={e => handlePropertyChange('textColor', e.target.value)} 
                                className="w-full h-12 p-1 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer" 
                                disabled={isLocked}
                            />
                        </PropertyInput>
                        <div className="grid grid-cols-2 gap-4">
                            <PropertyInput label="Font Size">
                                <input 
                                    type="number" 
                                    min="1" 
                                    value={selectedComponent.properties.fontSize || 16} 
                                    onChange={e => handlePropertyChange('fontSize', parseInt(e.target.value))} 
                                    className="w-full text-base p-3 border border-slate-300 rounded-lg shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" 
                                    disabled={isLocked}
                                />
                            </PropertyInput>
                            <PropertyInput label="Font Weight">
                                <select 
                                    value={selectedComponent.properties.fontWeight || 'normal'} 
                                    onChange={e => handlePropertyChange('fontWeight', e.target.value)} 
                                    className="w-full text-base p-3 border border-slate-300 rounded-lg shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" 
                                    disabled={isLocked}
                                >
                                    <option value="normal">Normal</option>
                                    <option value="bold">Bold</option>
                                    <option value="500">500</option>
                                    <option value="600">600</option>
                                </select>
                            </PropertyInput>
                        </div>
                    </>
                );
            case 'image':
                return (
                    <div className="flex flex-col gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <PropertyInput label="Generate Image with AI">
                            <textarea
                                value={imagePrompt}
                                onChange={e => setImagePrompt(e.target.value)}
                                placeholder="e.g., A photorealistic portrait of a person"
                                className="w-full text-base p-3 border border-slate-300 rounded-lg shadow-sm h-24 disabled:bg-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-400"
                                disabled={isLocked || isGenerating}
                            />
                        </PropertyInput>
                        <button
                            onClick={handleGenerateImage}
                            disabled={isLocked || isGenerating || !imagePrompt}
                            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-lg font-semibold shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:bg-slate-300 disabled:cursor-not-allowed dark:disabled:bg-slate-600 min-h-[48px]"
                        >
                            {isGenerating ? (
                                <>
                                    <Icon name="loader" className="w-5 h-5 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Icon name="sparkles" className="w-5 h-5" />
                                    Generate Image
                                </>
                            )}
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            {/* Semi-transparent backdrop */}
            <div 
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
                onClick={handleBackdropClick}
            />
            
            {/* Full-screen modal panel */}
            <div 
                ref={panelRef}
                className={`
                    fixed inset-0 z-50
                    bg-white dark:bg-slate-900
                    transform transition-transform duration-300 ease-in-out
                    ${isVisible ? 'translate-y-0' : 'translate-y-full'}
                    flex flex-col
                    overflow-hidden
                `}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Header */}
                <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    {/* Swipe handle indicator */}
                    <div className="flex justify-center py-3">
                        <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                    </div>
                    
                    <div className="flex items-center justify-between px-4 pb-4">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                                Properties
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                {selectedComponent.label || selectedComponent.type}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            aria-label="Close properties panel"
                        >
                            <Icon name="x" className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </button>
                    </div>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-4 py-6">
                    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
                        {/* Dimensions and Rotation */}
                        <div className="grid grid-cols-2 gap-4">
                            <PropertyInput label="Width">
                                <input 
                                    type="number" 
                                    value={Math.round(selectedComponent.width)} 
                                    onChange={e => handleUpdateComponent(selectedComponent.id, { width: parseInt(e.target.value)})} 
                                    className="w-full text-base p-3 border border-slate-300 rounded-lg shadow-sm disabled:bg-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:disabled:bg-slate-700/50" 
                                    disabled={isLocked} 
                                />
                            </PropertyInput>
                            <PropertyInput label="Height">
                                <input 
                                    type="number" 
                                    value={Math.round(selectedComponent.height)} 
                                    onChange={e => handleUpdateComponent(selectedComponent.id, { height: parseInt(e.target.value)})} 
                                    className="w-full text-base p-3 border border-slate-300 rounded-lg shadow-sm disabled:bg-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:disabled:bg-slate-700/50" 
                                    disabled={isLocked} 
                                />
                            </PropertyInput>
                        </div>
                        
                        <PropertyInput label="Rotation (degrees)">
                            <input 
                                type="number" 
                                value={Math.round(selectedComponent.rotation || 0)} 
                                onChange={e => handleUpdateComponent(selectedComponent.id, { rotation: parseInt(e.target.value)})} 
                                className="w-full text-base p-3 border border-slate-300 rounded-lg shadow-sm disabled:bg-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:disabled:bg-slate-700/50" 
                                disabled={isLocked} 
                            />
                        </PropertyInput>

                        {/* Common styling fields */}
                        {selectedComponent.type !== 'group' && renderCommonFields()}
                        
                        {/* Type-specific fields */}
                        {renderTypeSpecificFields()}

                        {/* Ungroup button for groups */}
                        {selectedComponent.type === 'group' && (
                            <button
                                onClick={() => {
                                    ungroupComponents();
                                    onClose();
                                }}
                                className="w-full flex items-center justify-center gap-2 px-6 py-4 mt-4 bg-slate-600 text-white rounded-lg font-semibold shadow-md hover:bg-slate-700 transition-colors dark:bg-slate-700 dark:hover:bg-slate-600 min-h-[48px]"
                                disabled={isLocked}
                            >
                                <Icon name="ungroup" className="w-5 h-5" />
                                Ungroup Components
                            </button>
                        )}
                    </div>
                    
                    {/* Safe area padding for devices with home indicators */}
                    <div className="h-8" />
                </div>
            </div>
        </>
    );
};
