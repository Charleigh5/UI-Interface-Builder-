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
    worldCoords: { x: number; y: number }
  ) => { action: string; componentId?: string; handle?: string } | null;
  components: WireframeComponent[];
  handleComponentSelection: (
    componentId: string,
    action: string,
    isLocked: boolean,
    isMultiSelect: boolean
  ) => void;
  startDrawing: (worldCoords: { x: number; y: number }, toolType: string, theme: string) => void;
  finalizeDrawing: (worldCoords: { x: number; y: number }) => void;
  resetInteractionState: () => void;
  screenToWorld: (screenCoords: { x: number; y: number }) => { x: number; y: number };
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
      const screenCoords = { x: e.clientX, y: e.clientY };
      const worldCoords = screenToWorld(screenCoords);

      if (e.button === 1 || e.metaKey || e.ctrlKey) {
        return;
      }

      const actionUnderCursor = getActionUnderCursor(worldCoords);

      if (currentTool === 'select') {
        if (actionUnderCursor) {
          const component = components.find(
            c => c.id === actionUnderCursor.componentId
          );
          if (component) {
            handleComponentSelection(
              actionUnderCursor.componentId!,
              actionUnderCursor.action,
              !!component.isLocked,
              e.shiftKey
            );
          }
        }
      } else if (currentTool === 'pen' || currentTool !== 'erase') {
        startDrawing(worldCoords, currentTool, theme);
      }
    },
    [
      components,
      currentTool,
      getActionUnderCursor,
      handleComponentSelection,
      screenToWorld,
      startDrawing,
      theme,
    ]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const screenCoords = { x: e.clientX, y: e.clientY };
      const worldCoords = screenToWorld(screenCoords);

      if (action === 'none') {
        const actionUnderCursor = getActionUnderCursor(worldCoords);
        if (actionUnderCursor) {
          // cursor management omitted for brevity
        } else if (
          currentTool === 'pen' ||
          currentTool === 'rectangle' ||
          currentTool === 'circle'
        ) {
          setCursor('crosshair');
        } else {
          setCursor('default');
        }
      }

      if (!startPoint || action === 'none') return;

      const dx = worldCoords.x - startPoint.x;
      const dy = worldCoords.y - startPoint.y;

      if (action === 'drawing') {
        if (currentTool === 'pen') {
          addDrawingPoint(worldCoords);
        } else if (currentShape) {
          setCurrentShape({ ...currentShape, width: dx, height: dy });
        }
      } else if (action === 'panning') {
        setViewTransform({
          pan: { x: pan.x + e.movementX, y: pan.y + e.movementY },
        });
      } else if (action === 'moving') {
        allEffectivelySelectedIds.forEach(id => {
          const original = originalComponents.get(id);
          const offset = moveOffsets.get(id);
          if (original && offset) {
            updateComponent(id, {
              x: worldCoords.x - offset.dx,
              y: worldCoords.y - offset.dy,
            });
          }
        });
      } else if (
        action === 'resizing' &&
        activeResizeHandle &&
        originalComponents.size > 0
      ) {
        const firstEntry = originalComponents.entries().next().value as [
          string,
          WireframeComponent
        ];
        const [id, original] = firstEntry;
        const { x, y, width, height, rotation = 0 } = original;

        const center = { x: x + width / 2, y: y + height / 2 };
        const rotatedStart = rotatePoint(startPoint, center, -rotation);
        const rotatedCurrent = rotatePoint(worldCoords, center, -rotation);
        const rdx = rotatedCurrent.x - rotatedStart.x;
        const rdy = rotatedCurrent.y - rotatedStart.y;

        let newX = x;
        let newY = y;
        let newWidth = width;
        let newHeight = height;

        if (activeResizeHandle.includes('l')) {
          newX += rdx;
          newWidth -= rdx;
        }
        if (activeResizeHandle.includes('r')) {
          newWidth += rdx;
        }
        if (activeResizeHandle.includes('t')) {
          newY += rdy;
          newHeight -= rdy;
        }
        if (activeResizeHandle.includes('b')) {
          newHeight += rdy;
        }

        const newCenter = {
          x: newX + newWidth / 2,
          y: newY + newHeight / 2,
        };
        const finalCenter = rotatePoint(newCenter, center, rotation);

        updateComponent(id, {
          x: finalCenter.x - newWidth / 2,
          y: finalCenter.y - newHeight / 2,
          width: newWidth,
          height: newHeight,
        });
      } else if (action === 'rotating' && originalComponents.size > 0) {
        const firstEntry = originalComponents.entries().next().value as [
          string,
          WireframeComponent
        ];
        const [id, original] = firstEntry;
        const center = {
          x: original.x + original.width / 2,
          y: original.y + original.height / 2,
        };
        const startAngle =
          (Math.atan2(startPoint.y - center.y, startPoint.x - center.x) *
            180) /
          Math.PI;
        const currentAngle =
          (Math.atan2(worldCoords.y - center.y, worldCoords.x - center.x) *
            180) /
          Math.PI;
        const originalRotation = original.rotation || 0;
        let newRotation = originalRotation + (currentAngle - startAngle);
        if (e.shiftKey) newRotation = Math.round(newRotation / 15) * 15;
        updateComponent(id, { rotation: newRotation });
      }
    },
    [
      action,
      startPoint,
      currentShape,
      currentTool,
      screenToWorld,
      getActionUnderCursor,
      components,
      pan,
      setViewTransform,
      moveOffsets,
      originalComponents,
      activeResizeHandle,
      allEffectivelySelectedIds,
      addDrawingPoint,
      updateComponent,
      setCurrentShape,
      setCursor,
    ]
  );

  const handleMouseUp = useCallback(() => {
    if (action === 'drawing') {
      finalizeDrawing({ x: 0, y: 0 });
    }
    resetInteractionState();
  }, [action, finalizeDrawing, resetInteractionState]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (action !== 'none') handleMouseUp();
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [action, handleMouseUp]);

  return { handleMouseDown, handleMouseMove, handleMouseUp };
};