import React from 'react';
import { WireframeComponent, Tool, ThemeMode } from '../../library/types';
import { useActionDetection } from './useActionDetection';
import { useComponentSelection } from './useComponentSelection';
import { useComponentManipulation } from './useComponentManipulation';
import { useCanvasState } from './useCanvasState';
import { useInteractionHandlers } from './useInteractionHandlers';
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
  triggerHapticFeedback: (type?: 'light' | 'medium' | 'heavy' | 'selection' | 'impact') => void;
  addDrawingPoint: (point: { x: number; y: number }) => void;
  drawnPaths: { x: number; y: number }[][];
  setDrawnPaths: React.Dispatch<React.SetStateAction<{ x: number; y: number }[][]>>;
  currentShape: Omit<WireframeComponent, 'id' | 'label'> | null;
  setCurrentShape: React.Dispatch<
    React.SetStateAction<Omit<WireframeComponent, 'id' | 'label'> | null>
  >;
  addComponent: (component: Omit<WireframeComponent, 'id'>) => WireframeComponent;
  addLibraryComponent: (name: string, position: { x: number; y: number }) => void;
  selectComponent: (id: string | null, multiSelect: boolean) => void;
  setViewTransform: (transform: { zoom?: number; pan?: { x: number; y: number } }) => void;
  updateComponent: (id: string, updates: Partial<WireframeComponent>) => void;
}

export const useCanvasInteraction = (props: UseCanvasInteractionProps) => {
  const {
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
  } = props;

  const { getActionUnderCursor } = useActionDetection({
    components,
    selectedComponentIds,
    isMobileMode,
    getHandleSize,
    getRotationHandleOffset,
    getTouchArea,
    zoom,
  });

  const { handleComponentSelection } = useComponentSelection({
    components,
    selectedComponentIds,
    selectComponent,
    triggerHapticFeedback,
  });

  const { startDrawing, finalizeDrawing } = useComponentManipulation({
    addComponent,
    selectComponent,
    triggerHapticFeedback,
    currentShape,
    setCurrentShape,
    setDrawnPaths,
    addDrawingPoint,
  });

  const {
    action,
    setAction,
    startPoint,
    setStartPoint,
    moveOffsets,
    setMoveOffsets,
    activeResizeHandle,
    setActiveResizeHandle,
    originalComponents,
    setOriginalComponents,
    cursor,
    setCursor,
    resetInteractionState,
  } = useCanvasState();

  const { handleMouseDown, handleMouseMove, handleMouseUp } = useInteractionHandlers({
    action,
    startPoint,
    moveOffsets,
    activeResizeHandle,
    originalComponents,
    allEffectivelySelectedIds,
    updateComponent,
    setViewTransform,
    pan,
    zoom,
    isMobileMode,
    addDrawingPoint,
    currentShape,
    setCurrentShape,
    currentTool,
    setCursor,
    getActionUnderCursor,
    components,
    handleComponentSelection,
    startDrawing,
    finalizeDrawing,
    resetInteractionState,
    screenToWorld,
    theme,
  });

  const { handleDragOver, handleDrop } = useDragAndDrop({
    addLibraryComponent,
    screenToWorld,
  });

  const { handleWheel } = useWheelZoom({
    isMobileMode,
    zoom,
    pan,
    setViewTransform,
    canvasRef,
  });

  useCursorManagement({ canvasRef, cursor });

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