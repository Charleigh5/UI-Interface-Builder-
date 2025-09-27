
import React, { useState, useCallback, useRef } from 'react';
// Fix: Import CanvasHandle type and use ref to get canvas data
import { Canvas, type CanvasHandle } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { RightSidebar } from './components/RightSidebar';
import { WireframeComponent, Tool } from './types';
import { generateReactCode } from './services/codeGenerator';
import { analyzeSketch } from './services/geminiService';

export default function App() {
    const [currentTool, setCurrentTool] = useState<Tool>('pen');
    const [components, setComponents] = useState<WireframeComponent[]>([]);
    const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const canvasRef = useRef<CanvasHandle>(null);

    const addComponent = useCallback((component: Omit<WireframeComponent, 'id'>) => {
        const newComponent: WireframeComponent = { ...component, id: Date.now().toString() };
        setComponents(prev => [...prev, newComponent]);
        return newComponent;
    }, []);

    const updateComponent = useCallback((id: string, updates: Partial<WireframeComponent>) => {
        setComponents(prev =>
            prev.map(comp => (comp.id === id ? { ...comp, ...updates } : comp))
        );
    }, []);

    const deleteComponent = useCallback((id: string) => {
        setComponents(prev => prev.filter(comp => comp.id !== id));
        if (selectedComponentId === id) {
            setSelectedComponentId(null);
        }
    }, [selectedComponentId]);

    const clearCanvas = useCallback(() => {
        setComponents([]);
        setSelectedComponentId(null);
    }, []);

    const handleAnalyzeSketch = async (imageDataUrl: string, drawnPaths: { x: number; y: number }[][]) => {
        if (drawnPaths.length === 0) {
            alert("Please draw something on the canvas before analyzing.");
            return;
        }
        setIsAnalyzing(true);
        try {
            const newComponents = await analyzeSketch(imageDataUrl);
            // Clear drawn paths and existing components, then add new ones
            clearCanvas();
            const createdComponents: WireframeComponent[] = [];
            newComponents.forEach(comp => {
                const newComp = addComponent(comp);
                createdComponents.push(newComp);
            });
            // Select the first new component if any
            if(createdComponents.length > 0) {
                setSelectedComponentId(createdComponents[0].id);
            }
        } catch (error) {
            console.error("Failed to analyze sketch:", error);
            alert("Sorry, I couldn't understand that sketch. Please try again with a clearer drawing.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Fix: This function will be passed to Toolbar and will trigger the analysis
    const triggerAnalyze = async () => {
        if (canvasRef.current) {
            const { imageDataUrl, drawnPaths } = canvasRef.current.getCanvasData();
            if (imageDataUrl) {
                await handleAnalyzeSketch(imageDataUrl, drawnPaths);
            }
        }
    };

    const selectedComponent = components.find(c => c.id === selectedComponentId) || null;

    return (
        <div className="flex h-screen w-screen bg-slate-100 text-slate-800">
            <Toolbar
                currentTool={currentTool}
                onToolChange={setCurrentTool}
                onAnalyze={triggerAnalyze}
                isAnalyzing={isAnalyzing}
            />
            <main className="flex-1 flex items-center justify-center p-4">
                <Canvas
                    ref={canvasRef}
                    currentTool={currentTool}
                    onToolChange={setCurrentTool}
                    onAddComponent={addComponent}
                    components={components}
                    selectedComponentId={selectedComponentId}
                    onSelectComponent={setSelectedComponentId}
                    onUpdateComponent={updateComponent}
                />
            </main>
            <RightSidebar
                components={components}
                selectedComponent={selectedComponent}
                onSelectComponent={setSelectedComponentId}
                onUpdateComponent={updateComponent}
                onDeleteComponent={deleteComponent}
                onAddComponent={addComponent}
            />
        </div>
    );
}
