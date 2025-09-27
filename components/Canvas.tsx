
import React, { useRef, useEffect, useState, useCallback, useContext } from 'react';
import { WireframeComponent, Tool } from '../library/types';
import { getComponentLabel, getDefaultProperties } from '../utils/componentUtils';
import { AppContext } from '../store/AppContext';

type Action = 'none' | 'drawing' | 'moving' | 'resizing' | 'rotating' | 'panning';
type ResizeHandle = 'tl' | 'tm' | 'tr' | 'ml' | 'mr' | 'bl' | 'bm' | 'br';

const HANDLE_SIZE = 8;
const ROTATION_HANDLE_OFFSET = 25;

const rotatePoint = (point: { x: number; y: number }, center: { x: number; y: number }, angle: number) => {
    const rad = angle * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    return {
        x: dx * cos - dy * sin + center.x,
        y: dx * sin + dy * cos + center.y
    };
};

const getCursorForHandle = (handle: string, rotation = 0) => {
    const angle = (rotation % 360 + 360) % 360;
    const getRotatedCursor = (cursors: string[]) => {
        const index = Math.round(angle / 45) % 8;
        return cursors[index];
    };

    switch (handle) {
        case 'tl': case 'br': return getRotatedCursor(['nwse-resize', 'ns-resize', 'nesw-resize', 'ew-resize', 'nwse-resize', 'ns-resize', 'nesw-resize', 'ew-resize']);
        case 'tr': case 'bl': return getRotatedCursor(['nesw-resize', 'ew-resize', 'nwse-resize', 'ns-resize', 'nesw-resize', 'ew-resize', 'nwse-resize', 'ns-resize']);
        case 'tm': case 'bm': return getRotatedCursor(['ns-resize', 'nesw-resize', 'ew-resize', 'nwse-resize', 'ns-resize', 'nesw-resize', 'ew-resize', 'nwse-resize']);
        case 'ml': case 'mr': return getRotatedCursor(['ew-resize', 'nwse-resize', 'ns-resize', 'nesw-resize', 'ew-resize', 'nwse-resize', 'ns-resize', 'nesw-resize']);
        case 'rot': return 'crosshair';
        default: return 'move';
    }
};


export const Canvas = () => {
    const { state, dispatch, addComponent, addLibraryComponent, selectComponent } = useContext(AppContext);
    const { components, selectedComponentIds, currentTool, theme } = state;

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageCache = useRef<Record<string, HTMLImageElement>>({});
    const [action, setAction] = useState<Action>('none');
    const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
    const [currentShape, setCurrentShape] = useState<Omit<WireframeComponent, 'id' | 'label' | 'properties'> | null>(null);
    const [drawnPaths, setDrawnPaths] = useState<{ x: number; y: number }[][]>([]);
    const [moveOffsets, setMoveOffsets] = useState<Map<string, { dx: number; dy: number }>>(new Map());
    const [activeResizeHandle, setActiveResizeHandle] = useState<ResizeHandle | 'rot' | null>(null);
    const [originalComponents, setOriginalComponents] = useState<Map<string, WireframeComponent>>(new Map());
    const [cursor, setCursor] = useState('default');
    
    useEffect(() => {
        const handleRequestData = (event: Event) => {
            const customEvent = event as CustomEvent;
            const canvas = canvasRef.current;
            if (canvas && customEvent.detail.callback) {
                 customEvent.detail.callback({
                    imageDataUrl: canvas.toDataURL('image/png'),
                    drawnPaths,
                });
            }
        };
        window.addEventListener('requestCanvasData', handleRequestData);
        return () => window.removeEventListener('requestCanvasData', handleRequestData);
    }, [drawnPaths]);
    
    useEffect(() => {
        if (state.isAnalyzing) {
            setDrawnPaths([]);
        }
    }, [state.isAnalyzing]);

    const getCanvasCoordinates = (e: MouseEvent | React.MouseEvent<HTMLCanvasElement> | React.DragEvent<HTMLCanvasElement>): { x: number; y: number } => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    };

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Grid
        ctx.strokeStyle = theme === 'dark' ? '#374151' : '#e2e8f0';
        ctx.lineWidth = 0.5;
        for (let x = 0; x < canvas.width; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
        for (let y = 0; y < canvas.height; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
        
        // Pen paths
        ctx.strokeStyle = theme === 'dark' ? '#9ca3af' : '#475569';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        drawnPaths.forEach(path => {
            if (path.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            path.forEach(point => ctx.lineTo(point.x, point.y));
            ctx.stroke();
        });

        components.forEach(c => drawComponent(ctx, c));
        
        if (action === 'drawing' && currentShape) {
            drawComponent(ctx, { ...currentShape, id: 'temp' });
        }

        const selected = components.filter(c => selectedComponentIds.includes(c.id));
        selected.forEach(c => drawHandles(ctx, c));

    }, [components, selectedComponentIds, theme, action, currentShape, drawnPaths]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = canvas?.parentElement;
        if (!container || !canvas) return;
        const resizeObserver = new ResizeObserver(() => {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            draw();
        });
        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();
    }, [draw]);

    useEffect(() => {
        draw();
    }, [draw]);

    const drawComponent = (ctx: CanvasRenderingContext2D, component: Omit<WireframeComponent, 'id'> & {id: string}) => {
        ctx.save();
        const { x, y, width, height, type, properties, rotation = 0 } = component;
        const centerX = x + width / 2;
        const centerY = y + height / 2;

        ctx.translate(centerX, centerY);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.translate(-centerX, -centerY);

        ctx.fillStyle = properties.backgroundColor || 'transparent';
        ctx.strokeStyle = properties.borderColor || '#cbd5e1';
        ctx.lineWidth = properties.borderWidth ?? 1;

        const radius = type === 'circle' ? Math.min(width, height) / 2 : (properties.borderRadius ?? 4);
        
        ctx.beginPath();
        if (type === 'circle') {
            ctx.arc(x + width / 2, y + height / 2, radius, 0, 2 * Math.PI);
        } else {
            ctx.roundRect(x, y, width, height, radius);
        }
        ctx.closePath();
        if (properties.backgroundColor && properties.backgroundColor !== 'transparent') ctx.fill();
        if (properties.borderWidth && properties.borderWidth > 0) ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (type === 'button') {
            ctx.fillStyle = properties.textColor || '#ffffff';
            ctx.font = `${properties.fontWeight || '500'} ${properties.fontSize || 14}px Inter`;
            ctx.fillText(properties.buttonText || 'Button', x + width / 2, y + height / 2);
        } else if (type === 'input') {
            ctx.fillStyle = properties.textColor || '#94a3b8';
            ctx.font = `${properties.fontWeight || '400'} ${properties.fontSize || 14}px Inter`;
            ctx.textAlign = 'left';
            ctx.fillText(properties.placeholder || 'Placeholder', x + 10, y + height / 2);
        } else if (type === 'text') {
            ctx.fillStyle = properties.textColor || '#1e293b';
            ctx.font = `${properties.fontWeight || '400'} ${properties.fontSize || 16}px Inter`;
            ctx.textAlign = properties.textAlign || 'left';
            const textX = properties.textAlign === 'center' ? x + width / 2 : (properties.textAlign === 'right' ? x + width - 10 : x + 10);
            ctx.fillText(component.label || "Text", textX, y + height / 2);
        } else if (type === 'image') {
            const imgUrl = properties.imageDataUrl;
            if (imgUrl && imageCache.current[imgUrl]) {
                 ctx.drawImage(imageCache.current[imgUrl], x, y, width, height);
            } else if (imgUrl && !imageCache.current[imgUrl]) {
                const img = new Image();
                img.onload = () => { imageCache.current[imgUrl] = img; draw(); };
                img.src = imgUrl;
            } else {
                const iconSize = Math.min(width, height) * 0.4;
                ctx.strokeStyle = properties.borderColor || '#cbd5e1';
                ctx.lineWidth = 1;
                ctx.strokeRect(x + (width - iconSize) / 2, y + (height - iconSize) / 2, iconSize, iconSize);
                ctx.beginPath();
                ctx.arc(x + width * 0.35, y + height * 0.35, iconSize * 0.1, 0, 2 * Math.PI);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x + (width - iconSize) / 2, y + height - (height - iconSize) / 2);
                ctx.lineTo(x + width * 0.5, y + height * 0.6);
                ctx.lineTo(x + width - (width - iconSize) / 2, y + height - (height - iconSize) / 2);
                ctx.stroke();
            }
        }
        ctx.restore();
    };
    
    const drawHandles = (ctx: CanvasRenderingContext2D, c: WireframeComponent) => {
        const { x, y, width, height, rotation = 0 } = c;
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation * Math.PI / 180);
        
        // Bounding box
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 2]);
        ctx.strokeRect(-width / 2, -height / 2, width, height);
        ctx.setLineDash([]);
        
        // Handles
        const hs = HANDLE_SIZE / 2;
        const handles = {
            tl: { x: -width/2 - hs, y: -height/2 - hs }, tr: { x: width/2 - hs, y: -height/2 - hs },
            bl: { x: -width/2 - hs, y: height/2 - hs }, br: { x: width/2 - hs, y: height/2 - hs },
            tm: { x: -hs, y: -height/2 - hs }, bm: { x: -hs, y: height/2 - hs },
            ml: { x: -width/2 - hs, y: -hs }, mr: { x: width/2 - hs, y: -hs },
            rot: { x: -hs, y: -height/2 - ROTATION_HANDLE_OFFSET - hs }
        };
        
        ctx.fillStyle = 'white';
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 1.5;
        
        Object.values(handles).forEach(p => {
            ctx.beginPath();
            if (p === handles.rot) {
                ctx.arc(p.x + hs, p.y + hs, hs, 0, 2 * Math.PI);
            } else {
                ctx.rect(p.x, p.y, HANDLE_SIZE, HANDLE_SIZE);
            }
            ctx.fill();
            ctx.stroke();
        });

        // Rotation line
        ctx.beginPath();
        ctx.moveTo(0, -height / 2);
        ctx.lineTo(0, -height / 2 - ROTATION_HANDLE_OFFSET);
        ctx.stroke();

        ctx.restore();
    };
    
    const getActionUnderCursor = (coords: { x: number, y: number }) => {
        const reversedComponents = [...components].reverse();
        for (const c of reversedComponents) {
            if (!selectedComponentIds.includes(c.id)) continue;
            
            const { x, y, width, height, rotation = 0 } = c;
            const centerX = x + width / 2;
            const centerY = y + height / 2;
            const p = rotatePoint(coords, {x: centerX, y: centerY}, -rotation);
            
            const hs = HANDLE_SIZE;
            const handleChecks: { name: ResizeHandle | 'rot', x: number, y: number, w: number, h: number }[] = [
                { name: 'tl', x: x - hs/2, y: y - hs/2, w: hs, h: hs },
                { name: 'tr', x: x + width - hs/2, y: y - hs/2, w: hs, h: hs },
                { name: 'bl', x: x - hs/2, y: y + height - hs/2, w: hs, h: hs },
                { name: 'br', x: x + width - hs/2, y: y + height - hs/2, w: hs, h: hs },
                { name: 'tm', x: x + width/2 - hs/2, y: y - hs/2, w: hs, h: hs },
                { name: 'bm', x: x + width/2 - hs/2, y: y + height - hs/2, w: hs, h: hs },
                { name: 'ml', x: x - hs/2, y: y + height/2 - hs/2, w: hs, h: hs },
                { name: 'mr', x: x + width - hs/2, y: y + height/2 - hs/2, w: hs, h: hs },
                { name: 'rot', x: x + width/2 - hs/2, y: y - ROTATION_HANDLE_OFFSET - hs/2, w: hs, h: hs }
            ];

            for (const h of handleChecks) {
                if (p.x >= h.x && p.x <= h.x + h.w && p.y >= h.y && p.y <= h.y + h.h) {
                    return { action: h.name === 'rot' ? 'rotating' : 'resizing', handle: h.name, componentId: c.id };
                }
            }
        }
        
        const clickedComponent = reversedComponents.find(c => {
             const { x, y, width, height, rotation = 0 } = c;
             const centerX = x + width / 2;
             const centerY = y + height / 2;
             const p = rotatePoint(coords, {x: centerX, y: centerY}, -rotation);
             return p.x >= x && p.x <= x + width && p.y >= y && p.y <= y + height && !c.isLocked;
        });

        if (clickedComponent) {
            return { action: 'moving', componentId: clickedComponent.id };
        }

        return { action: 'none' };
    };
    
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (e.button !== 0) return;
        const coords = getCanvasCoordinates(e);
        setStartPoint(coords);
        
        if (e.altKey || e.button === 1) {
            setAction('panning');
            return;
        }

        if (currentTool === 'select') {
            const hit = getActionUnderCursor(coords);
            if (hit.action !== 'none' && hit.componentId) {
                setAction(hit.action as Action);
                setActiveResizeHandle(hit.handle as ResizeHandle | 'rot');

                const allComponentsById = new Map(components.map(c => [c.id, c]));
                const original = new Map<string, WireframeComponent>();
                components.forEach(c => original.set(c.id, { ...c, properties: { ...c.properties } }));
                setOriginalComponents(original);

                if (hit.action === 'moving') {
                    const offsets = new Map<string, { dx: number; dy: number }>();
                    selectedComponentIds.forEach(id => {
                        const comp = allComponentsById.get(id);
                        if (comp) offsets.set(id, { dx: coords.x - comp.x, dy: coords.y - comp.y });
                    });
                    setMoveOffsets(offsets);
                }

                if (!selectedComponentIds.includes(hit.componentId)) {
                    selectComponent(hit.componentId, e.shiftKey);
                }
            } else {
                selectComponent(null, false);
            }
        } else {
            setAction('drawing');
            const type = currentTool as WireframeComponent['type'];
            setCurrentShape({ type, x: coords.x, y: coords.y, width: 0, height: 0 });
            if (type === 'pen') {
                setDrawnPaths(prev => [...prev, [coords]]);
            }
        }
    };
    
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const coords = getCanvasCoordinates(e);

        if (action === 'none' && currentTool === 'select') {
            const hit = getActionUnderCursor(coords);
            const comp = components.find(c => c.id === hit.componentId);
            if (hit.action === 'resizing' || hit.action === 'rotating') {
                setCursor(getCursorForHandle(hit.handle!, comp?.rotation || 0));
            } else if (hit.action === 'moving') {
                setCursor('move');
            } else {
                setCursor('default');
            }
        }

        if (action === 'drawing' && startPoint) {
            if (currentTool === 'pen') {
                setDrawnPaths(prev => {
                    const newPaths = [...prev];
                    newPaths[newPaths.length - 1].push(coords);
                    return newPaths;
                });
            } else {
                 setCurrentShape({
                    type: currentTool as any,
                    x: Math.min(startPoint.x, coords.x),
                    y: Math.min(startPoint.y, coords.y),
                    width: Math.abs(coords.x - startPoint.x),
                    height: Math.abs(coords.y - startPoint.y),
                });
            }
        } else if (action === 'moving' && moveOffsets.size > 0) {
            selectedComponentIds.forEach(id => {
                const offset = moveOffsets.get(id);
                if (offset) {
                    dispatch({ type: 'UPDATE_COMPONENT', payload: { id, updates: { x: coords.x - offset.dx, y: coords.y - offset.dy } }});
                }
            });
        } else if (action === 'rotating' && startPoint && activeResizeHandle === 'rot' && selectedComponentIds.length === 1) {
            const id = selectedComponentIds[0];
            const original = originalComponents.get(id);
            if (!original) return;
            const centerX = original.x + original.width / 2;
            const centerY = original.y + original.height / 2;
            const startAngle = Math.atan2(startPoint.y - centerY, startPoint.x - centerX) * 180 / Math.PI;
            const currentAngle = Math.atan2(coords.y - centerY, coords.x - centerX) * 180 / Math.PI;
            let angle = (original.rotation || 0) + (currentAngle - startAngle);
            if (e.shiftKey) angle = Math.round(angle / 15) * 15;
            dispatch({ type: 'UPDATE_COMPONENT', payload: { id, updates: { rotation: angle } } });
        } else if (action === 'resizing' && startPoint && activeResizeHandle && selectedComponentIds.length === 1) {
            const id = selectedComponentIds[0];
            const original = originalComponents.get(id);
            if (!original) return;

            const { x, y, width, height, rotation = 0 } = original;
            const centerX = x + width / 2;
            const centerY = y + height / 2;
            
            const currentRotated = rotatePoint(coords, {x: centerX, y: centerY}, -rotation);
            const startRotated = rotatePoint(startPoint, {x: centerX, y: centerY}, -rotation);
            
            const dx = currentRotated.x - startRotated.x;
            const dy = currentRotated.y - startRotated.y;

            let newX = x, newY = y, newW = width, newH = height;
            const aspectRatio = width / height;

            if (activeResizeHandle.includes('l')) { newX = x + dx; newW = width - dx; }
            if (activeResizeHandle.includes('r')) { newW = width + dx; }
            if (activeResizeHandle.includes('t')) { newY = y + dy; newH = height - dy; }
            if (activeResizeHandle.includes('b')) { newH = height + dy; }
            
            if (e.shiftKey) {
                if (newW / newH > aspectRatio) {
                    const oldH = newH;
                    newH = newW / aspectRatio;
                    if (activeResizeHandle.includes('t')) newY -= (newH - oldH);
                } else {
                    const oldW = newW;
                    newW = newH * aspectRatio;
                    if (activeResizeHandle.includes('l')) newX -= (newW - oldW);
                }
            }

            const newCenter = { x: newX + newW / 2, y: newY + newH / 2 };
            const rotatedNewCenter = rotatePoint(newCenter, {x: centerX, y: centerY}, rotation);
            
            const finalX = original.x + (rotatedNewCenter.x - centerX);
            const finalY = original.y + (rotatedNewCenter.y - centerY);
            
            dispatch({ type: 'UPDATE_COMPONENT', payload: { id, updates: { x: finalX, y: finalY, width: newW, height: newH } } });
        }
    };
    
    const handleMouseUp = () => {
        if (action === 'drawing' && currentShape && (currentShape.width > 5 || currentShape.height > 5)) {
            const newComp = addComponent({
                ...currentShape,
                label: getComponentLabel(currentShape.type),
                properties: getDefaultProperties(currentShape.type, theme),
            });
            selectComponent(newComp.id, false);
            dispatch({ type: 'SET_TOOL', payload: 'select' });
        }
        setAction('none');
        setStartPoint(null);
        setCurrentShape(null);
        setActiveResizeHandle(null);
        originalComponents.clear();
        moveOffsets.clear();
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLCanvasElement>) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const name = e.dataTransfer.getData('library-item-name');
        const data = e.dataTransfer.getData('library-item-data');
        if (name && data) {
            const { width, height } = JSON.parse(data);
            const coords = getCanvasCoordinates(e);
            addLibraryComponent(name, { x: coords.x - width / 2, y: coords.y - height / 2 });
        }
    };

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full bg-white rounded-lg shadow-inner dark:bg-slate-900"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{ cursor: cursor }}
        />
    );
};
