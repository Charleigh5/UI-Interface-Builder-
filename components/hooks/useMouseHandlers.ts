// components/hooks/useMouseHandlers.ts
import { useState, useCallback, useEffect } from 'react';
import { WireframeComponent, Tool, ThemeMode } from '../../library/types';
import { getComponentLabel, getDefaultProperties } from '../../utils/componentUtils';
import { getCursorForHandle } from '../../utils/canvasUtils';

type Action = "none" | "drawing" | "moving" | "resizing" | "rotating" | "panning";
type ResizeHandle = "tl" | "tm" | "tr" | "ml" | "mr" | "bl" | "bm" | "br";

interface UseMouseHandlersProps {
  currentTool: Tool;
  components: WireframeComponent[];
  selectedComponentIds: string[];
  allEffectivelySelectedIds: Set<string>;
  theme: ThemeMode;
  zoom: number;
  pan: { x: number; y: number };
  isMobileMode: boolean;
  screenToWorld: (screenCoords: { x: number; y: number }) => { x: number; y: number };
  getActionUnderCursor: (worldCoords: { x: number; y: number }) => { action: string; componentId?: string; handle?: string } | null;
  triggerHapticFeedback: (type?: "light" | "medium" | "heavy" | "selection" | "impact") => void;
  addDrawingPoint: (point: { x: number; y: number }) => void;
  drawnPaths: { x: number; y: number }[][];
  setDrawnPaths: React.Dispatch<React.SetStateAction<{ x: number; y: number }[][]>>;
  currentShape: Omit<WireframeComponent, "id" | "label"> | null;
  setCurrentShape: React.Dispatch<React.SetStateAction<Omit<WireframeComponent, "id" | "label"> | null>>;
  addComponent: (component: Omit<WireframeComponent, 'id'>) => WireframeComponent;
  selectComponent: (id: string | null, multiSelect: boolean) => void;
  setViewTransform: (transform: { zoom?: number; pan?: { x: number; y: number } }) => void;
  updateComponent: (id: string, updates: Partial<WireframeComponent>) => void;
  setCursor: (cursor: string) => void;
  rotatePoint: (point: { x: number; y: number }, center: { x: number; y: number }, angle: number) => { x: number; y: number };
}

export const useMouseHandlers = ({
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
}: UseMouseHandlersProps) => {
  const [action, setAction] = useState<Action>("none");
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [moveOffsets, setMoveOffsets] = useState<Map<string, { dx: number; dy: number }>>(new Map());
  const [activeResizeHandle, setActiveResizeHandle] = useState<ResizeHandle | "rot" | null>(null);
  const [originalComponents, setOriginalComponents] = useState<Map<string, WireframeComponent>>(new Map());

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const screenCoords = { x: e.clientX, y: e.clientY };
      const worldCoords = screenToWorld(screenCoords);
      setStartPoint(worldCoords);

      if (e.button === 1 || e.metaKey || e.ctrlKey) {
        setAction("panning");
        return;
      }

      const actionUnderCursor = getActionUnderCursor(worldCoords);

      if (currentTool === "select") {
        if (actionUnderCursor) {
          const component = components.find(
            (c) => c.id === actionUnderCursor.componentId
          );
          if (component?.isLocked) {
            selectComponent(actionUnderCursor.componentId!, e.shiftKey);
            return;
          }

          setAction(actionUnderCursor.action as Action);
          setActiveResizeHandle(
            actionUnderCursor.handle as ResizeHandle | "rot" | null
          );

          // Trigger haptic feedback for manipulation start
          const feedbackType =
            actionUnderCursor.action === "rotating" ? "medium" : "light";
          triggerHapticFeedback(feedbackType);

          if (!selectedComponentIds.includes(actionUnderCursor.componentId!)) {
            selectComponent(actionUnderCursor.componentId!, false);
            // Trigger haptic feedback for component selection
            triggerHapticFeedback("selection");
          }

          const original = new Map<string, WireframeComponent>();
          const offsets = new Map<string, { dx: number; dy: number }>();

          const effectivelySelected = components.filter((c) =>
            allEffectivelySelectedIds.has(c.id)
          );
          effectivelySelected.forEach((c) => {
            original.set(c.id, c);
            offsets.set(c.id, {
              dx: worldCoords.x - c.x,
              dy: worldCoords.y - c.y,
            });
          });
          setOriginalComponents(original);
          setMoveOffsets(offsets);
        } else {
          selectComponent(null, false);
          setAction("panning");
        }
      } else if (currentTool === "pen") {
        setAction("drawing");
        setDrawnPaths((paths) => [...paths, [worldCoords]]);

        // Trigger haptic feedback for drawing start
        triggerHapticFeedback("light");
      } else if (currentTool !== "erase") {
        setAction("drawing");
        setCurrentShape({
          type: currentTool as any,
          x: worldCoords.x,
          y: worldCoords.y,
          width: 0,
          height: 0,
          properties: getDefaultProperties(currentTool as any, theme),
        });
      }
    },
    [
      currentTool,
      components,
      selectedComponentIds,
      screenToWorld,
      getActionUnderCursor,
      selectComponent,
      allEffectivelySelectedIds,
      theme,
      triggerHapticFeedback,
      setDrawnPaths,
      setCurrentShape,
    ]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const screenCoords = { x: e.clientX, y: e.clientY };
      const worldCoords = screenToWorld(screenCoords);

      if (action === "none") {
        const actionUnderCursor = getActionUnderCursor(worldCoords);
        if (actionUnderCursor) {
          const component = components.find(
            (c) => c.id === actionUnderCursor.componentId
          );
          if (
            actionUnderCursor.action === "resizing" ||
            actionUnderCursor.action === "rotating"
          ) {
            setCursor(
              getCursorForHandle(actionUnderCursor.handle!, component?.rotation)
            );
          } else if (component?.isLocked) {
            setCursor("not-allowed");
          } else {
            setCursor("move");
          }
        } else if (
          currentTool === "pen" ||
          currentTool === "rectangle" ||
          currentTool === "circle"
        ) {
          setCursor("crosshair");
        } else {
          setCursor("default");
        }
      }

      if (!startPoint || action === "none") return;

      const dx = worldCoords.x - startPoint.x;
      const dy = worldCoords.y - startPoint.y;

      if (action === "drawing") {
        if (currentTool === "pen") {
          // Use optimized drawing for better mobile performance
          addDrawingPoint(worldCoords);
        } else if (currentShape) {
          setCurrentShape({ ...currentShape, width: dx, height: dy });
        }
      } else if (action === "panning") {
        setViewTransform({
          pan: { x: pan.x + e.movementX, y: pan.y + e.movementY },
        });
      } else if (action === "moving") {
        allEffectivelySelectedIds.forEach((id) => {
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
        action === "resizing" &&
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

        let newX = x,
          newY = y,
          newWidth = width,
          newHeight = height;

        if (activeResizeHandle.includes("l")) {
          newX += rdx;
          newWidth -= rdx;
        }
        if (activeResizeHandle.includes("r")) {
          newWidth += rdx;
        }
        if (activeResizeHandle.includes("t")) {
          newY += rdy;
          newHeight -= rdy;
        }
        if (activeResizeHandle.includes("b")) {
          newHeight += rdy;
        }

        const newCenter = { x: newX + newWidth / 2, y: newY + newHeight / 2 };
        const finalCenter = rotatePoint(newCenter, center, rotation);

        const finalX = finalCenter.x - newWidth / 2;
        const finalY = finalCenter.y - newHeight / 2;

        updateComponent(id, {
          x: finalX,
          y: finalY,
          width: newWidth,
          height: newHeight,
        });
      } else if (action === "rotating" && originalComponents.size > 0) {
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
          (Math.atan2(startPoint.y - center.y, startPoint.x - center.x) * 180) /
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
      zoom,
      setViewTransform,
      moveOffsets,
      originalComponents,
      activeResizeHandle,
      allEffectivelySelectedIds,
      addDrawingPoint,
      updateComponent,
      setCurrentShape,
      setCursor,
      rotatePoint,
    ]
  );

  const handleMouseUp = useCallback(() => {
    if (action === "drawing" && currentShape) {
      const { x, y, width, height, type, properties } = currentShape;
      const finalShape = {
        type,
        properties,
        x: width < 0 ? x + width : x,
        y: height < 0 ? y + height : y,
        width: Math.abs(width),
        height: Math.abs(height),
        label: getComponentLabel(type as any),
      };
      if (finalShape.width > 5 && finalShape.height > 5) {
        const newComponent = addComponent(finalShape);
        selectComponent(newComponent.id, false);

        // Trigger haptic feedback for component creation
        triggerHapticFeedback("impact");
      }
    }
    setAction("none");
    setStartPoint(null);
    setCurrentShape(null);
    setActiveResizeHandle(null);
    setOriginalComponents(new Map());
    setMoveOffsets(new Map());
  }, [action, currentShape, addComponent, selectComponent, triggerHapticFeedback, setCurrentShape]);

  // Global mouse up listener
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (action !== "none") handleMouseUp();
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [action, handleMouseUp]);

  return {
    action,
    setAction,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    startPoint,
    moveOffsets,
    setMoveOffsets,
    activeResizeHandle,
    setActiveResizeHandle,
    originalComponents,
    setOriginalComponents,
  };
};