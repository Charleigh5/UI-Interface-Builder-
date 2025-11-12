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
    isMobileMode,
    screenToWorld,
    getHandleSize,
    getRotationHandleOffset,
    getTouchArea,
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
    getHandleSize,
    getRotationHandleOffset
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