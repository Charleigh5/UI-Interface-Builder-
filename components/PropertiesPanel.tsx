import React, { useState, useContext } from 'react';
import { WireframeComponent, ComponentProperties } from '../library/types';
import { Icon } from './Icon';
import { generateImage } from '../library/services/geminiService';
import { useStore } from '../store/store';

interface PropertiesPanelProps {
    component: WireframeComponent;
}

const PropertyInput: React.FC<{
    label: string;
    children: React.ReactNode;
}> = ({ label, children }) => (
    <div>
        <label className="block text-xs font-medium text-slate-500 mb-1 dark:text-slate-400">{label}</label>
        {children}
    </div>
);

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ component }) => {
    const { updateComponent, ungroupComponents } = useStore();
    const [imagePrompt, setImagePrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleUpdateComponent = (id: string, updates: Partial<WireframeComponent>) => {
        updateComponent(id, updates);
    };

    const handlePropertyChange = <K extends keyof ComponentProperties,>(key: K, value: ComponentProperties[K]) => {
        const newProperties = { ...component.properties, [key]: value };
        handleUpdateComponent(component.id, { properties: newProperties });
    };

    const handleGenerateImage = async () => {
        if (!imagePrompt || isGenerating || !component) return;
        setIsGenerating(true);
        try {
            const base64Data = await generateImage(imagePrompt, component.width, component.height);
            handlePropertyChange('imageDataUrl', `data:image/png;base64,${base64Data}`);
        } catch (error) {
            console.error(error);
            alert('Failed to generate image. Please check the console for details.');
        } finally {
            setIsGenerating(false);
        }
    };

    const isLocked = !!component.isLocked;

    const renderCommonFields = () => (
        <>
            <PropertyInput label="Background">
                <input type="color" value={component.properties.backgroundColor || '#ffffff'} onChange={e => handlePropertyChange('backgroundColor', e.target.value)} className="w-full h-8 p-0 border-none rounded cursor-pointer disabled:opacity-50" disabled={isLocked} />
            </PropertyInput>
            <PropertyInput label="Border Color">
                <input type="color" value={component.properties.borderColor || '#cbd5e1'} onChange={e => handlePropertyChange('borderColor', e.target.value)} className="w-full h-8 p-0 border-none rounded cursor-pointer disabled:opacity-50" disabled={isLocked} />
            </PropertyInput>
            <div className="grid grid-cols-2 gap-2">
                 <PropertyInput label="Border Width">
                    <input type="number" min="0" value={component.properties.borderWidth ?? 1} onChange={e => handlePropertyChange('borderWidth', parseInt(e.target.value))} className="w-full text-sm border-slate-300 rounded-md shadow-sm disabled:bg-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:disabled:bg-slate-700/50" disabled={isLocked} />
                </PropertyInput>
                 <PropertyInput label="Radius">
                    <input type="number" min="0" value={component.properties.borderRadius ?? 4} onChange={e => handlePropertyChange('borderRadius', parseInt(e.target.value))} className="w-full text-sm border-slate-300 rounded-md shadow-sm disabled:bg-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:disabled:bg-slate-700/50" disabled={isLocked} />
                </PropertyInput>
            </div>
        </>
    );

    const renderTypeSpecificFields = () => {
        switch (component.type) {
            case 'button':
                return (
                    <PropertyInput label="Text">
                        <input type="text" value={component.properties.buttonText || 'Button'} onChange={e => handlePropertyChange('buttonText', e.target.value)} className="w-full text-sm border-slate-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" disabled={isLocked}/>
                    </PropertyInput>
                );
            case 'input':
                return (
                     <PropertyInput label="Placeholder">
                        <input type="text" value={component.properties.placeholder || 'Placeholder'} onChange={e => handlePropertyChange('placeholder', e.target.value)} className="w-full text-sm border-slate-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" disabled={isLocked}/>
                    </PropertyInput>
                );
            case 'text':
                 return (
                    <>
                        <PropertyInput label="Text Color">
                            <input type="color" value={component.properties.textColor || '#1e293b'} onChange={e => handlePropertyChange('textColor', e.target.value)} className="w-full h-8 p-0 border-none rounded cursor-pointer" disabled={isLocked}/>
                        </PropertyInput>
                         <div className="grid grid-cols-2 gap-2">
                             <PropertyInput label="Font Size">
                                <input type="number" min="1" value={component.properties.fontSize || 16} onChange={e => handlePropertyChange('fontSize', parseInt(e.target.value))} className="w-full text-sm border-slate-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" disabled={isLocked}/>
                            </PropertyInput>
                             <PropertyInput label="Font Weight">
                                <select value={component.properties.fontWeight || 'normal'} onChange={e => handlePropertyChange('fontWeight', e.target.value)} className="w-full text-sm border-slate-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" disabled={isLocked}>
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
                   <div className="flex flex-col gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 mt-3">
                        <PropertyInput label="Generate Image">
                           <textarea
                               value={imagePrompt}
                               onChange={e => setImagePrompt(e.target.value)}
                               placeholder="e.g., A photorealistic portrait of a person"
                               className="w-full text-sm border-slate-300 rounded-md shadow-sm h-20 disabled:bg-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-400"
                               disabled={isLocked || isGenerating}
                           />
                       </PropertyInput>
                       <button
                           onClick={handleGenerateImage}
                           disabled={isLocked || isGenerating || !imagePrompt}
                           className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow-md hover:bg-blue-700 transition-shadow disabled:opacity-50 disabled:bg-slate-300 disabled:cursor-not-allowed dark:disabled:bg-slate-600"
                       >
                           {isGenerating ? (
                               <>
                                   <Icon name="loader" className="w-5 h-5 animate-spin" />
                                   Generating...
                               </>
                           ) : (
                               <>
                                   <Icon name="sparkles" className="w-5 h-5" />
                                   Generate
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
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2 dark:text-slate-500">Properties</h3>
            <div className="flex flex-col gap-3 p-2">
                <div className="grid grid-cols-2 gap-2">
                    <PropertyInput label="Width">
                        <input type="number" value={Math.round(component.width)} onChange={e => handleUpdateComponent(component.id, { width: parseInt(e.target.value)})} className="w-full text-sm border-slate-300 rounded-md shadow-sm disabled:bg-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:disabled:bg-slate-700/50" disabled={isLocked} />
                    </PropertyInput>
                    <PropertyInput label="Height">
                        <input type="number" value={Math.round(component.height)} onChange={e => handleUpdateComponent(component.id, { height: parseInt(e.target.value)})} className="w-full text-sm border-slate-300 rounded-md shadow-sm disabled:bg-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:disabled:bg-slate-700/50" disabled={isLocked} />
                    </PropertyInput>
                </div>
                 <PropertyInput label="Rotation">
                    <input type="number" value={Math.round(component.rotation || 0)} onChange={e => handleUpdateComponent(component.id, { rotation: parseInt(e.target.value)})} className="w-full text-sm border-slate-300 rounded-md shadow-sm disabled:bg-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:disabled:bg-slate-700/50" disabled={isLocked} />
                </PropertyInput>
                {component.type !== 'group' && renderCommonFields()}
                {renderTypeSpecificFields()}

                {component.type === 'group' && (
                    <button
                        onClick={ungroupComponents}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 mt-2 bg-slate-600 text-white rounded-lg font-semibold shadow-md hover:bg-slate-700 transition-shadow dark:bg-slate-700 dark:hover:bg-slate-600"
                        disabled={isLocked}
                    >
                        <Icon name="ungroup" className="w-5 h-5" />
                        Ungroup
                    </button>
                )}
            </div>
        </div>
    );
};