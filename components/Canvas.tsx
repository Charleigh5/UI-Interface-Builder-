import React, { useEffect } from "react";
import { useStore } from "../store/store";
import { useHapticFeedback } from "./hooks/useHapticFeedback";
import { useCoordinateTransformations } from "./hooks/useCoordinateTransformations";
import { useHandleCalculations } from "./hooks/useHandleCalculations";
import { useDrawingTools } from "./hooks/useDrawingTools";
import { useCanvasDrawing } from "./hooks/useCanvasDrawing";
import { useCanvasInteraction } from "./hooks/useCanvasInteraction";
import { useGestures } from "./hooks/useGestures";
import { useCanvasSetup } from "./hooks/useCanvasSetup";

export const Canvas = () => {
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
    selectComponent,
    setViewTransform,
    updateComponent,
  } = useStore();

  // Hooks for modularity
  const { triggerHapticFeedback } = useHapticFeedback(isMobileMode);
  const { getHandleSize, getRotationHandleOffset, getTouchArea } = useHandleCalculations(isMobileMode, zoom);
  const { drawnPaths, setDrawnPaths, currentShape, setCurrentShape, addDrawingPoint } = useDrawingTools(isMobileMode);

  // Canvas setup and drawing
  const { canvasRef } = useCanvasSetup((ctx) => draw(ctx)); // Pass draw function to setup hook

  const { draw, imageCache } = useCanvasDrawing(
    canvasRef,
    components,
    selectedComponentIds,
    theme,
    zoom,
    pan,
    drawingSettings,
    interaction.action, // Use action from interaction hook
    currentShape,
    drawnPaths,
    isMobileMode,
    getHandleSize,
    getRotationHandleOffset
  );

  const { getCanvasCoordinates, screenToWorld } = useCoordinateTransformations(pan, zoom, canvasRef);

  // Interaction logic
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

  // Gesture logic (mobile specific)
  const { handleTouchStart, handleTouchMove, handleTouchEnd, isGesturing } = useGestures({
    isMobileMode,
    zoom,
    pan,
    setViewTransform,
    setAction: interaction.setAction, // Pass setAction from interaction hook
    handleMouseUp: interaction.handleMouseUp, // Pass handleMouseUp from interaction hook
    canvasRef,
  });

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
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDragOver={interaction.handleDragOver}
      onDrop={interaction.handleDrop}
      onWheel={interaction.handleWheel}
      style={{ cursor: interaction.cursor, touchAction: isMobileMode ? "none" : "auto" }}
    />
  );
};