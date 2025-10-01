import React, { useState, useContext, useRef, useCallback, useEffect } from 'react';
import { WireframeComponent, ComponentProperties } from '../../library/types';
import { Icon } from '../Icon';
import { generateImage } from '../../library/services/geminiService';
import { AppContext } from '../../store/AppContext';

interface MobilePropertiesPanelProps {
    isVisible: boolean;
    onClose: () => void;
}

/**
 * MobilePropertiesPanel provides a full-screen modal interface for editing component properties.
 * 
 * Architecture Features:
 * - Full-screen modal optimized for mobile touch interaction
 * - Swipe-down-to-dismiss gesture support
 * - Touch-optimized form controls with proper spacing
 * - Maintains complete feature parity with desktop PropertiesPanel
 * - Accessible design with proper ARIA labels and keyboard navigation
 * - Performance optimized with efficient re-renders and gesture handling
 */
// Mobile-optimized CSS classes for form controls
const mobileInputClasses = "w-full px-4 py-3 text-base border-2 border-slate-300 dark:border-slate-600 rounded-xl shadow-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-colors disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-700";

const mobileSelectClasses = "w-full px-4 py-3 text-base border-2 border-slate-300 dark:border-slate-600 rounded-xl shadow-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-colors disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-700";

const mobileTextareaClasses = "w-full px-4 py-3 text-base border-2 border-slate-300 dark:border-slate-600 rounded-xl shadow-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-colors resize-none disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-700";

export const MobilePropertiesPanel: React.FC<MobilePropertiesPanelProps> = ({ isVisible, onClose }) => {
    const { state, dispatch, ungroupComponents } = useContext(AppContext);
    const { components, selectedComponentIds } = state;
    
    // Get the selected component (only show properties for single selection)
    const selectedComponent = selectedComponentIds.length === 1 
        ? components.find(c => c.id === selectedComponentIds[0]) || null 
        : null;

    // Local state for image generation
    const [imagePrompt, setImagePrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Swipe gesture handling
    const touchStartY = useRef<number>(0);
    const panelRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Component update handlers
    const handleUpdateComponent = useCallback((id: string, updates: Partial<WireframeComponent>) => {
        dispatch({ type: 'UPDATE_COMPONENT', payload: { id, updates } });
    }, [dispatch]);

    const handlePropertyChange = useCallback(<K extends keyof ComponentProperties,>(
        key: K, 
        value: ComponentProperties[K]
    ) => {
        if (!selectedComponent) return;
        const newProperties = { ...selectedComponent.properties, [key]: value };
        handleUpdateComponent(selectedComponent.id, { properties: newProperties });
    }, [selectedComponent, handleUpdateComponent]);

    // Image generation handler
    const handleGenerateImage = useCallback(async () => {
        if (!imagePrompt || isGenerating || !selectedComponent) return;
        setIsGenerating(true);
        try {
            const base64Data = await generateImage(imagePrompt, selectedComponent.width, selectedComponent.height);
            handlePropertyChange('imageDataUrl', `data:image/png;base64,${base64Data}`);
            setImagePrompt(''); // Clear prompt after successful generation
        } catch (error) {
            console.error('Image generation failed:', error);
            alert('Failed to generate image. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    }, [imagePrompt, isGenerating, selectedComponent, handlePropertyChange]);

    // Swipe gesture handlers for natural mobile interaction
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
        setIsDragging(false);
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - touchStartY.current;
        
        // Only allow swipe down from top of panel
        if (deltaY > 0 && panelRef.current?.scrollTop === 0) {
            setIsDragging(true);
            e.preventDefault();
        }
    }, []);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (!isDragging) return;
        
        const currentY = e.changedTouches[0].clientY;
        const deltaY = currentY - touchStartY.current;
        const swipeThreshold = 120; // Minimum swipe distance to trigger close
        
        if (deltaY > swipeThreshold) {
            onClose();
        }
        setIsDragging(false);
    }, [isDragging, onClose]);

    // Keyboard support for accessibility
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isVisible) {
                onClose();
            }
        };

        if (isVisible) {
            document.addEventListener('keydown', handleKeyDown);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
                document.body.style.overflow = 'unset';
            };
        }
    }, [isVisible, onClose]);

    // Backdrop click handler
    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }, [onClose]);

    // Don't render if not visible or no component selected
    if (!isVisible || !selectedComponent) return null;

    const isLocked = !!selectedComponent.isLocked;

    return (
        <>
            {/* Full-screen backdrop */}
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                onClick={handleBackdropClick}
                aria-hidden="true"
            />
            
            {/* Full-screen modal panel */}
            <div 
                ref={panelRef}
                className={`
                    fixed inset-0 z-50 bg-slate-50 dark:bg-slate-900
                    transform transition-transform duration-300 ease-in-out
                    ${isVisible ? 'translate-y-0' : 'translate-y-full'}
                    overflow-y-auto
                `}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                role="dialog"
                aria-modal="true"
                aria-labelledby="properties-title"
            >
                {/* Header with swipe indicator */}
                <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                    {/* Swipe indicator */}
                    <div className="flex justify-center py-3">
                        <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                    </div>
                    
                    {/* Header content */}
                    <div className="flex items-center justify-between px-6 pb-4">
                        <div>
                            <h1 id="properties-title" className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                                Properties
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                {selectedComponent.type} • {selectedComponent.label}
                                {isLocked && (
                                    <span className="ml-2 inline-flex items-center">
                                        <Icon name="lock" className="w-4 h-4 text-amber-500" />
                                        <span className="ml-1 text-amber-600 dark:text-amber-400">Locked</span>
                                    </span>
                                )}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                            aria-label="Close properties panel"
                        >
                            <Icon name="x" className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </button>
                    </div>
                </div>

                {/* Properties content */}
                <div className="px-6 py-6 space-y-8">
                    {/* Transform Properties */}
                    <PropertySection title="Transform" icon="move">
                        <div className="grid grid-cols-2 gap-4">
                            <PropertyInput label="Width" disabled={isLocked}>
                                <input 
                                    type="number" 
                                    value={Math.round(selectedComponent.width)} 
                                    onChange={e => handleUpdateComponent(selectedComponent.id, { width: parseInt(e.target.value) || 0 })}
                                    className={mobileInputClasses}
                                    disabled={isLocked}
                                />
                            </PropertyInput>
                            <PropertyInput label="Height" disabled={isLocked}>
                                <input 
                                    type="number" 
                                    value={Math.round(selectedComponent.height)} 
                                    onChange={e => handleUpdateComponent(selectedComponent.id, { height: parseInt(e.target.value) || 0 })}
                                    className={mobileInputClasses}
                                    disabled={isLocked}
                                />
                            </PropertyInput>
                        </div>
                        <PropertyInput label="Rotation (degrees)" disabled={isLocked}>
                            <input 
                                type="number" 
                                value={Math.round(selectedComponent.rotation || 0)} 
                                onChange={e => handleUpdateComponent(selectedComponent.id, { rotation: parseInt(e.target.value) || 0 })}
                                className={mobileInputClasses}
                                disabled={isLocked}
                            />
                        </PropertyInput>
                    </PropertySection>

                    {/* Appearance Properties (for non-group components) */}
                    {selectedComponent.type !== 'group' && (
                        <PropertySection title="Appearance" icon="palette">
                            <PropertyInput label="Background Color" disabled={isLocked}>
                                <div className="flex items-center space-x-3">
                                    <input 
                                        type="color" 
                                        value={selectedComponent.properties.backgroundColor || '#ffffff'} 
                                        onChange={e => handlePropertyChange('backgroundColor', e.target.value)}
                                        className="w-12 h-12 rounded-lg border-2 border-slate-300 dark:border-slate-600 cursor-pointer disabled:opacity-50"
                                        disabled={isLocked}
                                    />
                                    <input 
                                        type="text" 
                                        value={selectedComponent.properties.backgroundColor || '#ffffff'} 
                                        onChange={e => handlePropertyChange('backgroundColor', e.target.value)}
                                        className={`${mobileInputClasses} flex-1`}
                                        placeholder="#ffffff"
                                        disabled={isLocked}
                                    />
                                </div>
                            </PropertyInput>
                            
                            <PropertyInput label="Border Color" disabled={isLocked}>
                                <div className="flex items-center space-x-3">
                                    <input 
                                        type="color" 
                                        value={selectedComponent.properties.borderColor || '#cbd5e1'} 
                                        onChange={e => handlePropertyChange('borderColor', e.target.value)}
                                        className="w-12 h-12 rounded-lg border-2 border-slate-300 dark:border-slate-600 cursor-pointer disabled:opacity-50"
                                        disabled={isLocked}
                                    />
                                    <input 
                                        type="text" 
                                        value={selectedComponent.properties.borderColor || '#cbd5e1'} 
                                        onChange={e => handlePropertyChange('borderColor', e.target.value)}
                                        className={`${mobileInputClasses} flex-1`}
                                        placeholder="#cbd5e1"
                                        disabled={isLocked}
                                    />
                                </div>
                            </PropertyInput>

                            <div className="grid grid-cols-2 gap-4">
                                <PropertyInput label="Border Width" disabled={isLocked}>
                                    <input 
                                        type="number" 
                                        min="0" 
                                        value={selectedComponent.properties.borderWidth ?? 1} 
                                        onChange={e => handlePropertyChange('borderWidth', parseInt(e.target.value) || 0)}
                                        className={mobileInputClasses}
                                        disabled={isLocked}
                                    />
                                </PropertyInput>
                                <PropertyInput label="Border Radius" disabled={isLocked}>
                                    <input 
                                        type="number" 
                                        min="0" 
                                        value={selectedComponent.properties.borderRadius ?? 4} 
                                        onChange={e => handlePropertyChange('borderRadius', parseInt(e.target.value) || 0)}
                                        className={mobileInputClasses}
                                        disabled={isLocked}
                                    />
                                </PropertyInput>
                            </div>
                        </PropertySection>
                    )}

                    {/* Type-specific Properties */}
                    {renderTypeSpecificProperties(selectedComponent, handlePropertyChange, isLocked)}

                    {/* Image Generation (for image components) */}
                    {selectedComponent.type === 'image' && (
                        <PropertySection title="AI Image Generation" icon="sparkles">
                            <PropertyInput label="Describe the image you want to generate" disabled={isLocked || isGenerating}>
                                <textarea
                                    value={imagePrompt}
                                    onChange={e => setImagePrompt(e.target.value)}
                                    placeholder="e.g., A photorealistic portrait of a person, professional headshot, studio lighting"
                                    className={mobileTextareaClasses}
                                    rows={4}
                                    disabled={isLocked || isGenerating}
                                />
                            </PropertyInput>
                            <button
                                onClick={handleGenerateImage}
                                disabled={isLocked || isGenerating || !imagePrompt.trim()}
                                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:bg-slate-400 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? (
                                    <>
                                        <Icon name="loader" className="w-6 h-6 animate-spin" />
                                        Generating Image...
                                    </>
                                ) : (
                                    <>
                                        <Icon name="sparkles" className="w-6 h-6" />
                                        Generate Image
                                    </>
                                )}
                            </button>
                        </PropertySection>
                    )}

                    {/* Group Actions */}
                    {selectedComponent.type === 'group' && (
                        <PropertySection title="Group Actions" icon="group">
                            <button
                                onClick={ungroupComponents}
                                disabled={isLocked}
                                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-600 dark:bg-slate-700 text-white rounded-xl font-semibold shadow-lg hover:bg-slate-700 dark:hover:bg-slate-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Icon name="ungroup" className="w-6 h-6" />
                                Ungroup Components
                            </button>
                        </PropertySection>
                    )}

                    {/* Safe area padding for devices with home indicators */}
                    <div className="h-8" />
                </div>
            </div>
        </>
    );
};

// Helper Components for consistent styling and structure

interface PropertySectionProps {
    title: string;
    icon: React.ComponentProps<typeof Icon>['name'];
    children: React.ReactNode;
}

const PropertySection: React.FC<PropertySectionProps> = ({ title, icon, children }) => (
    <div className="space-y-4">
        <div className="flex items-center space-x-2">
            <Icon name={icon} className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        </div>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

interface PropertyInputProps {
    label: string;
    children: React.ReactNode;
    disabled?: boolean;
}

const PropertyInput: React.FC<PropertyInputProps> = ({ label, children, disabled }) => (
    <div className="space-y-2">
        <label className={`block text-sm font-medium ${disabled ? 'text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>
            {label}
        </label>
        {children}
    </div>
);

// Type-specific property renderers
const renderTypeSpecificProperties = (
    component: WireframeComponent,
    handlePropertyChange: <K extends keyof ComponentProperties>(key: K, value: ComponentProperties[K]) => void,
    isLocked: boolean
) => {
    switch (component.type) {
        case 'button':
            return (
                <PropertySection title="Button Content" icon="button">
                    <PropertyInput label="Button Text" disabled={isLocked}>
                        <input 
                            type="text" 
                            value={component.properties.buttonText || 'Button'} 
                            onChange={e => handlePropertyChange('buttonText', e.target.value)}
                            className={mobileInputClasses}
                            placeholder="Button"
                            disabled={isLocked}
                        />
                    </PropertyInput>
                </PropertySection>
            );

        case 'input':
            return (
                <PropertySection title="Input Settings" icon="input">
                    <PropertyInput label="Placeholder Text" disabled={isLocked}>
                        <input 
                            type="text" 
                            value={component.properties.placeholder || 'Placeholder'} 
                            onChange={e => handlePropertyChange('placeholder', e.target.value)}
                            className={mobileInputClasses}
                            placeholder="Placeholder"
                            disabled={isLocked}
                        />
                    </PropertyInput>
                </PropertySection>
            );

        case 'text':
            return (
                <PropertySection title="Text Styling" icon="text">
                    <PropertyInput label="Text Color" disabled={isLocked}>
                        <div className="flex items-center space-x-3">
                            <input 
                                type="color" 
                                value={component.properties.textColor || '#1e293b'} 
                                onChange={e => handlePropertyChange('textColor', e.target.value)}
                                className="w-12 h-12 rounded-lg border-2 border-slate-300 dark:border-slate-600 cursor-pointer disabled:opacity-50"
                                disabled={isLocked}
                            />
                            <input 
                                type="text" 
                                value={component.properties.textColor || '#1e293b'} 
                                onChange={e => handlePropertyChange('textColor', e.target.value)}
                                className={`${mobileInputClasses} flex-1`}
                                placeholder="#1e293b"
                                disabled={isLocked}
                            />
                        </div>
                    </PropertyInput>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <PropertyInput label="Font Size" disabled={isLocked}>
                            <input 
                                type="number" 
                                min="1" 
                                value={component.properties.fontSize || 16} 
                                onChange={e => handlePropertyChange('fontSize', parseInt(e.target.value) || 16)}
                                className={mobileInputClasses}
                                disabled={isLocked}
                            />
                        </PropertyInput>
                        <PropertyInput label="Font Weight" disabled={isLocked}>
                            <select 
                                value={component.properties.fontWeight || 'normal'} 
                                onChange={e => handlePropertyChange('fontWeight', e.target.value)}
                                className={mobileSelectClasses}
                                disabled={isLocked}
                            >
                                <option value="normal">Normal</option>
                                <option value="500">Medium</option>
                                <option value="600">Semibold</option>
                                <option value="bold">Bold</option>
                            </select>
                        </PropertyInput>
                    </div>
                </PropertySection>
            );

        default:
            return null;
    }
};