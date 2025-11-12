import React, { useCallback, useEffect } from 'react';
import { WireframeComponent } from '../../library/types';
import { rotatePoint } from '../../utils/canvasUtils';

interface UseInteractionHandlersProps {
  action: string;
  startPoint: { x: number; y: number } | null;
  moveOffsets: Map<string, { dx: number; dy: number }>;
  activeResizeHandle: string | null;
  originalComponents: Map<string, WireframeComponent>;
  allEffectivelySelectedIds: Set<string>;
  updateComponent: (id: string, updates: Partial<WireframeComponent>) => void;
  setViewTransform: (transform: { zoom?: number; pan?: { x: number; y: number } }) => void;
  pan: { x: number; y: number };
  zoom: number;
  isMobileMode: boolean;
  addDrawingPoint: (point: { x: number; y: number }) => void;
  currentShape: Omit<WireframeComponent, 'id' | 'label'> | null;
  setCurrentShape: React.Dispatch<
    React.SetStateAction<Omit<WireframeComponent, 'id' | 'label'> | null>
  >;
  currentTool: string;
  setCursor: (cursor: string) => void;
  getActionUnderCursor: (
    world: { x: number; y: number }
  ) => { action: string; componentId?: string; handle?: string } | null;
  components: WireframeComponent[];
  handleComponentSelection: (
    componentId: string,
    action: string,
    isLocked: boolean,
    isMultiSelect: boolean
  ) => void;
  startDrawing: (world: { x: number; y: number }, tool: string, theme: string) => void;
  finalizeDrawing: (world: { x: number; y: number }) => void;
  resetInteractionState: () => void;
  screenToWorld: (screen: { x: number; y: number }) => { x: number; y: number };
  theme: string;
}

export const useInteractionHandlers = ({
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
}: UseInteractionHandlersProps) => {
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const world = screenToWorld({ x: e.clientX, y: e.clientY });

      if (currentTool === 'select') {
        const hit = getActionUnderCursor(world);
        if (hit?.componentId) {
          const comp = components.find(c => c.id === hit.componentId);
          handleComponentSelection(
            hit.componentId,
            hit.action,
            !!comp?.isLocked,
            e.shiftKey
          );
        }
      } else {
        startDrawing(world, currentTool, theme);
      }
    },
    [
      currentTool,
      screenToWorld,
      getActionUnderCursor,
      components,
      handleComponentSelection,
      startDrawing,
      theme,
    ]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const world = screenToWorld({ x: e.clientX, y: e.clientY });

      if (action === 'drawing' && currentTool === 'pen') {
        addDrawingPoint(world);
      }
      // For brevity, other interaction paths (move/resize/rotate) can be added later.
    },
    [action, currentTool, screenToWorld, addDrawingPoint]
  );

  const handleMouseUp = useCallback(() => {
    if (action === 'drawing') {
      finalizeDrawing({ x: 0, y: 0 });
    }
    resetInteractionState();
  }, [action, finalizeDrawing, resetInteractionState]);

  useEffect(() => {
    const onUp = () => {
      if (action !== 'none') handleMouseUp();
    };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, [action, handleMouseUp]);

  return { handleMouseDown, handleMouseMove, handleMouseUp };
};