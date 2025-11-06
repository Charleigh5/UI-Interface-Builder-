// components/hooks/useCanvasInteraction.ts
import { useState, useCallback } from 'react';
import { WireframeComponent, Tool, ThemeMode } from '../../library/types';
import { rotatePoint } from '../../utils/canvasUtils';
import { useActionDetection } from './useActionDetection';
import { useMouseHandlers } from './useMouseHandlers';
import { useDragAndDrop } from './useDragAndDrop';
import { useWheelZoom } from './useWheelZoom';
import { useCursorManagement } from './useCursorManagement';

interface UseCanvasInteractionProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  currentTool: Tool;
  components: WireframeComponent[];
  selectedComponentIds: string[];
  allEffectivelySelectedIds: Set<string>;
  theme: ThemeMode;
  zoom: number;
  pan: { x: number; y: number };
  isMobileMode: boolean;
  screenToWorld: (screenCoords: { x: number; y: number }) => { x: number; y: number };
  getHandleSize: () => number;
  getRotationHandleOffset: () => number;
  getTouchArea: () => number;
  triggerHapticFeedback: (type?: "light" | "medium" | "heavy" | "selection" | "impact") => void;
  addDrawingPoint: (point: { x: number; y: number }) => void;
  drawnPaths: { x: number; y: number }[][];
  setDrawnPaths: React.Dispatch<React.SetStateAction<{ x: number; y: number }[][]>>;
  currentShape: Omit<WireframeComponent, "id" | "label"> | null;
  setCurrentShape: React.Dispatch<React.SetStateAction<Omit<WireframeComponent, "id" | "label"> | null>>;
  addComponent: (component: Omit<WireframeComponent, 'id'>) => WireframeComponent;
  addLibraryComponent: (name: string, position: { x: number; y: number }) => void;
  selectComponent: (id: string | null, multiSelect: boolean) => void;
  setViewTransform: (transform: { zoom?: number; pan?: { x: number; y: number } }) => void;
  updateComponent: (id: string, updates: Partial<WireframeComponent>) => void;
}

export const useCanvasInteraction = ({
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
}: UseCanvasInteractionProps) => {
  const [cursor, setCursor] = useState("default");

  // Action detection hook
  const { getActionUnderCursor } = useActionDetection({
    components,
    selectedComponentIds,
    isMobileMode,
    getHandleSize,
    getRotationHandleOffset,
    getTouchArea,
    zoom,
  });

  // Mouse handlers hook
  const {
    action,
    setAction,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useMouseHandlers({
    currentTool,
    components,
    selectedComponentIds,
    allEffectivelySelectedIds,
    theme,
    zoom,
    pan,
    isMobileMode,
    screenToWorld,
    getActionUnderCursor,
    triggerHapticFeedback,
    addDrawingPoint,
    drawnPaths,
    setDrawnPaths,
    currentShape,
    setCurrentShape,
    addComponent,
    selectComponent,
    setViewTransform,
    updateComponent,
    setCursor,
    rotatePoint,
  });

  // Drag and drop hook
  const { handleDragOver, handleDrop } = useDragAndDrop({
    addLibraryComponent,
    screenToWorld,
  });

  // Wheel zoom hook
  const { handleWheel } = useWheelZoom({
    isMobileMode,
    zoom,
    pan,
    setViewTransform,
    canvasRef,
  });

  // Cursor management hook
  useCursorManagement({
    canvasRef,
    cursor,
  });

  return {
    action,
    setAction,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDragOver,
    handleDrop,
    handleWheel,
    cursor,
    setCursor,
  };
};