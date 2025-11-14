import React, { useContext, useEffect } from 'react';
import { useStore } from '../store/store';
import { AppContext } from '../store/AppContext';
import { useHapticFeedback } from './hooks/useHapticFeedback';
import { useCoordinateTransformations } from './hooks/useCoordinateTransformations';
import { useHandleCalculations } from './hooks/useHandleCalculations';
import { useDrawingTools } from './hooks/useDrawingTools';
import { useCanvasDrawing } from './hooks/useCanvasDrawing';
import { useCanvasInteraction } from './hooks/useCanvasInteraction';
import { useCanvasSetup } from './hooks/useCanvasSetup';

export const Canvas: React.FC = () => {
  const {
    components,
    selectedComponentIds,
    currentTool,
    theme,
    zoom,
    pan,
    drawingSettings,
    isMobileMode,
    isAnalyzing,
    allEffectivelySelectedIds,
    addComponent,
    addLibraryComponent,
    setViewTransform,
    updateComponent,
  } = useStore();

  const { selectComponent } = useContext(AppContext);
  const { triggerHapticFeedback } = useHapticFeedback(isMobileMode);
  const { getHandleSize, getRotationHandleOffset, getTouchArea } =
    useHandleCalculations(isMobileMode, zoom);
  const {
    drawnPaths,
    setDrawnPaths,
    currentShape,
    setCurrentShape,
    addDrawingPoint,
  } = useDrawingTools(isMobileMode);

  const { canvasRef } = useCanvasSetup(() => {});

  const { screenToWorld } = useCoordinateTransformations(pan, zoom, canvasRef);

  const interaction = useCanvasInteraction({
    canvasRef,
    currentTool,
    components,
    selectedComponentIds,
    allEffectivelySelectedIds,
    theme,
    zoom,
    pan,
    isMobile: isMobileMode,
    screenToWorld,
    getHandleSize: getHandleSize(),
    getRotationHandleOffset: getRotationHandleOffset(),
    getTouchArea: getTouchArea(),
    triggerHapticFeedback,
    addDrawingPoint,
    drawnPaths,
    setDrawnPaths,
    currentShape,
    setCurrentShape,
    addComponent,
    addLibraryComponent,
    selectComponent,
    setViewTransform,
    updateComponent,
  });

  const { draw } = useCanvasDrawing(
    canvasRef,
    components,
    selectedComponentIds,
    theme,
    zoom,
    pan,
    drawingSettings,
    interaction.action,
    currentShape,
    drawnPaths,
    isMobileMode,
    getHandleSize(),
    getRotationHandleOffset()
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) draw(ctx);
  }, [canvasRef, draw]);

  useEffect(() => {
    if (isAnalyzing) {
      setDrawnPaths([]);
    }
  }, [isAnalyzing, setDrawnPaths]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full bg-slate-100 dark:bg-slate-900"
      onMouseDown={interaction.handleMouseDown}
      onMouseMove={interaction.handleMouseMove}
      onMouseUp={interaction.handleMouseUp}
      onDragOver={interaction.handleDragOver}
      onDrop={interaction.handleDrop}
      onWheel={interaction.handleWheel}
      style={{
        cursor: interaction.cursor,
        touchAction: isMobileMode ? 'none' : 'auto',
      }}
    />
  );
};
</dyadWrite>

That should fix all 31 TypeScript errors. Let me know if you see any remaining issues.<dyad-problem-report summary="9 problems">
<problem file="components/hooks/useCanvasInteraction.ts" line="124" column="7" code="2353">Object literal may only specify known properties, and 'isMobile' does not exist in type 'UseInteractionHandlersProps'.</problem>
<problem file="components/hooks/useCanvasInteraction.ts" line="146" column="5" code="2353">Object literal may only specify known properties, and 'isMobile' does not exist in type 'UseWheelZoomProps'.</problem>
<problem file="components/Canvas.tsx" line="55" column="5" code="2561">Object literal may only specify known properties, but 'isMobileMode' does not exist in type 'UseCanvasInteractionProps'. Did you mean to write 'isMobile'?</problem>
<problem file="components/hooks/useGestures.ts" line="16" column="14" code="2503">Cannot find namespace 'React'.</problem>
<problem file="components/hooks/useGestures.ts" line="17" column="5" code="2503">Cannot find namespace 'React'.</problem>
<problem file="components/hooks/useGestures.ts" line="20" column="14" code="2503">Cannot find namespace 'React'.</problem>
<problem file="components/hooks/useGestures.ts" line="34" column="9" code="2503">Cannot find namespace 'React'.</problem>
<problem file="components/hooks/useGestures.ts" line="48" column="9" code="2503">Cannot find namespace 'React'.</problem>
<problem file="components/hooks/useGestures.ts" line="63" column="9" code="2503">Cannot find namespace 'React'.</problem>
</dyad-problem-report>I'll fix the remaining TypeScript errors by updating the hook interfaces and imports.

<dyad-write path="components/hooks/useGestures.ts" description="Add React import and fix interface">
import React, { useState, useCallback, useRef, useEffect } from 'react';

export const useGestures = ({
  isMobile,
  zoom,
  pan,
  setViewTransform,
  setAction,
  handleMouseUp,
  canvasRef,
}: {
  isMobile: boolean;
  zoom: number;
  pan: { x: number; y: number };
  setViewTransform: (t: { zoom?: number; pan?: { x: number; y: number } }) => void;
  setAction: React.Dispatch<
    React.SetStateAction<'none' | 'drawing' | 'moving' | 'resizing' | 'rotating' | 'panning'>
  >;
  handleMouseUp: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}) => {
  const [isGesturing, setIsGesturing] = useState(false);
  const initialDistanceRef = useRef(0);
  const initialZoomRef = useRef(zoom);
  const initialPanRef = useRef(pan);

  const getDistance = (touches: TouchList) => {
    if (touches.length < 2) return 0;
    const [a, b] = [touches[0], touches[1]];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!isMobile) return;
      if (e.touches.length === 2) {
        initialDistanceRef.current = getDistance(e.touches);
        initialZoomRef.current = zoom;
        initialPanRef.current = pan;
        setIsGesturing(true);
        setAction('panning');
      }
    },
    [isMobile, zoom, pan, setAction]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!isMobile || !isGesturing || e.touches.length !== 2) return;
      e.preventDefault();

      const newDist = getDistance(e.touches);
      if (!initialDistanceRef.current) return;

      const scale = newDist / initialDistanceRef.current;
      const newZoom = Math.max(0.1, Math.min(4, initialZoomRef.current * scale));
      setViewTransform({ zoom: newZoom, pan: initialPanRef.current });
    },
    [isMobile, isGesturing, setViewTransform]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!isMobile) return;
      if (e.touches.length < 2 && isGesturing) {
        setIsGesturing(false);
        setAction('none');
        handleMouseUp();
      }
    },
    [isMobile, isGesturing, setAction, handleMouseUp]
  );

  useEffect(() => {
    if (!isMobile) return;
    const onEnd = () => {
      if (isGesturing) {
        setIsGesturing(false);
        setAction('none');
        handleMouseUp();
      }
    };
    window.addEventListener('touchend', onEnd);
    return () => window.removeEventListener('touchend', onEnd);
  }, [isMobile, isGesturing, setAction, handleMouseUp]);

  return { handleTouchStart, handleTouchMove, handleTouchEnd, isGesturing };
}