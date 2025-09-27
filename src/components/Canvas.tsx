
import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { WireframeComponent, Tool } from '../types';
import { getComponentLabel, getDefaultProperties } from '../utils/componentUtils';

interface CanvasProps {
    currentTool: Tool;
    onToolChange: (tool: Tool) => void;
    components: WireframeComponent[];
    onAddComponent: (component: Omit<WireframeComponent, 'id'>) => WireframeComponent;
    selectedComponentId: string | null;
    onSelectComponent: (id: string | null) => void;
    onUpdateComponent: (id: string, updates: Partial<WireframeComponent>) => void;
}

// Fix: Define and export a handle for the parent to call methods on this component
export interface CanvasHandle {
    getCanvasData: () => { imageDataUrl: string; drawnPaths: { x: number; y: number }[][] };
}

export const Canvas = forwardRef<CanvasHandle, CanvasProps>(({ currentTool, onToolChange, components, onAddComponent, selectedComponentId, onSelectComponent, onUpdateComponent }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
    const [currentPoint, setCurrentPoint] = useState<{ x: number; y: number } | null>(null);
    const [drawnPaths, setDrawnPaths] = useState<{ x: number; y: number }[][]>([]);
    
    // For moving components
    const [isMoving, setIsMoving] = useState(false);
    const [moveOffset, setMoveOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    };

    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 0.5;
        for (let x = 0; x < canvas.width; x += 20) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        // Draw pen paths
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        drawnPaths.forEach(path => {
            if (path.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            path.forEach(point => ctx.lineTo(point.x, point.y));
            ctx.stroke();
        });

        // Draw components
        components.forEach(component => drawComponent(ctx, component, component.id === selectedComponentId));

        // Draw current shape being created
        if (isDrawing && startPoint && currentPoint && currentTool.match(/rectangle|circle|button|input|image|text/)) {
            const tempComponent = {
                id: 'temp',
                type: currentTool as any,
                x: Math.min(startPoint.x, currentPoint.x),
                y: Math.min(startPoint.y, currentPoint.y),
                width: Math.abs(currentPoint.x - startPoint.x),
                height: Math.abs(currentPoint.y - startPoint.y),
                label: '',
                properties: {}
            };
            drawComponent(ctx, tempComponent, true);
        }

    }, [components, selectedComponentId, drawnPaths, isDrawing, startPoint, currentPoint, currentTool]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const container = canvas.parentElement;
        if (!container) return;

        const resizeObserver = new ResizeObserver(() => {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            redrawCanvas();
        });

        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();
    }, [redrawCanvas]);

    useEffect(() => {
        redrawCanvas();
    }, [redrawCanvas]);

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const coords = getCanvasCoordinates(e);
        
        if (currentTool === 'select') {
            const clickedComponent = [...components].reverse().find(comp =>
                coords.x >= comp.x && coords.x <= comp.x + comp.width &&
                coords.y >= comp.y && coords.y <= comp.y + comp.height
            );

            if (clickedComponent) {
                onSelectComponent(clickedComponent.id);
                setIsMoving(true);
                setMoveOffset({ x: coords.x - clickedComponent.x, y: coords.y - clickedComponent.y });
            } else {
                onSelectComponent(null);
            }
            return;
        }

        setIsDrawing(true);
        setStartPoint(coords);
        setCurrentPoint(coords);

        if (currentTool === 'pen') {
            setDrawnPaths(prev => [...prev, [coords]]);
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const coords = getCanvasCoordinates(e);

        if (isMoving && selectedComponentId) {
            onUpdateComponent(selectedComponentId, { x: coords.x - moveOffset.x, y: coords.y - moveOffset.y });
            return;
        }
        
        if (!isDrawing) return;
        
        setCurrentPoint(coords);

        if (currentTool === 'pen') {
            setDrawnPaths(prev => {
                const newPaths = [...prev];
                newPaths[newPaths.length - 1].push(coords);
                return newPaths;
            });
        }
    };

    const handleMouseUp = () => {
        if (isMoving) {
            setIsMoving(false);
            return;
        }

        if (!isDrawing || !startPoint || !currentPoint) {
            setIsDrawing(false);
            return;
        }

        setIsDrawing(false);

        const width = Math.abs(currentPoint.x - startPoint.x);
        const height = Math.abs(currentPoint.y - startPoint.y);

        if (width < 5 || height < 5) return; // Ignore tiny shapes

        const componentType = currentTool.match(/rectangle|circle|button|input|image|text/);
        if (componentType) {
            const newComponent = onAddComponent({
                type: componentType[0] as any,
                x: Math.min(startPoint.x, currentPoint.x),
                y: Math.min(startPoint.y, currentPoint.y),
                width,
                height,
                label: getComponentLabel(componentType[0] as any),
                properties: getDefaultProperties(componentType[0] as any)
            });
            onSelectComponent(newComponent.id);
            onToolChange('select');
        }
        
        setStartPoint(null);
        setCurrentPoint(null);
    };

    const drawComponent = (ctx: CanvasRenderingContext2D, component: Omit<WireframeComponent, 'id'>, isSelected: boolean) => {
        ctx.save();
        
        const { x, y, width, height, type, properties } = component;

        // Selection outline
        if (isSelected) {
            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 3]);
            ctx.strokeRect(x - 4, y - 4, width + 8, height + 8);
            ctx.setLineDash([]);
        }

        // Main shape
        ctx.fillStyle = properties.backgroundColor || '#ffffff';
        ctx.strokeStyle = properties.borderColor || '#cbd5e1';
        ctx.lineWidth = properties.borderWidth || 1;
        
        const radius = properties.borderRadius || 4;

        ctx.beginPath();
        if (type === 'circle') {
             ctx.arc(x + width / 2, y + height / 2, Math.min(width, height) / 2, 0, 2 * Math.PI);
        } else {
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Content
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        switch (type) {
            case 'button':
                ctx.fillStyle = properties.textColor || (properties.buttonStyle === 'primary' ? '#ffffff' : '#1e293b');
                ctx.font = `${properties.fontWeight || '500'} ${properties.fontSize || '14'}px Inter`;
                ctx.fillText(properties.buttonText || 'Button', x + width / 2, y + height / 2);
                break;
            case 'input':
                ctx.fillStyle = properties.textColor || '#94a3b8';
                ctx.font = `${properties.fontWeight || '400'} ${properties.fontSize || '14'}px Inter`;
                ctx.textAlign = 'left';
                ctx.fillText(properties.placeholder || 'Placeholder', x + 10, y + height / 2);
                break;
            case 'text':
                ctx.fillStyle = properties.textColor || '#1e293b';
                ctx.font = `${properties.fontWeight || '400'} ${properties.fontSize || '16'}px Inter`;
                ctx.textAlign = properties.textAlign || 'left';
                const textX = properties.textAlign === 'center' ? x + width / 2 : (properties.textAlign === 'right' ? x + width - 10 : x + 10);
                ctx.fillText(component.label, textX, y + height / 2);
                break;
            case 'image':
                ctx.strokeStyle = properties.borderColor || '#cbd5e1';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + width, y + height);
                ctx.moveTo(x + width, y);
                ctx.lineTo(x, y + height);
                ctx.stroke();
                break;
        }

        ctx.restore();
    };

    // Fix: Expose a getCanvasData method to the parent component using useImperativeHandle
    useImperativeHandle(ref, () => ({
        getCanvasData: () => {
            const canvas = canvasRef.current;
            if (!canvas) {
                return { imageDataUrl: '', drawnPaths: [] };
            }
            return {
                imageDataUrl: canvas.toDataURL('image/png'),
                drawnPaths,
            };
        }
    }));


    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full bg-white rounded-lg shadow-lg"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: currentTool === 'select' ? (isMoving ? 'grabbing' : 'grab') : 'crosshair' }}
        />
    );
});
Canvas.displayName = 'Canvas';
