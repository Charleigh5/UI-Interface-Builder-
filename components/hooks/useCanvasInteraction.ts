// components/hooks/useCanvasInteraction.ts
import { useState, useCallback, useEffect } from 'react';
import { WireframeComponent, Tool, ThemeMode } from '../../library/types';
import { getComponentLabel, getDefaultProperties } from '../../utils/componentUtils';
import { rotatePoint, getCursorForHandle } from '../../utils/canvasUtils';
import { useStore } from '../../store/store'; // Assuming useStore is available globally or passed

type Action = "none" | "drawing" | "moving" | "resizing" | "rotating" | "panning";
type ResizeHandle = "tl" | "tm" | "tr" | "ml" | "mr" | "bl" | "bm" | "br";

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
  const [action, setAction] = useState<Action>("none");
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [moveOffsets, setMoveOffsets] = useState<Map<string, { dx: number; dy: number }>>(new Map());
  const [activeResizeHandle, setActiveResizeHandle] = useState<ResizeHandle | "rot" | null>(null);
  const [originalComponents, setOriginalComponents] = useState<Map<string, WireframeComponent>>(new Map());
  const [cursor, setCursor] = useState("default");

  useEffect(() => {
    const handleRequestData = (event: Event) => {
      const customEvent = event as CustomEvent;
      const canvas = canvasRef.current;
      if (canvas && customEvent.detail.callback) {
        customEvent.detail.callback({
          imageDataUrl: canvas.toDataURL("image/png"),
          drawnPaths,
        });
      }
    };
    window.addEventListener("requestCanvasData", handleRequestData);
    return () =>
      window.removeEventListener("requestCanvasData", handleRequestData);
  }, [drawnPaths, canvasRef]);

  const getActionUnderCursor = useCallback(
    (worldCoords: { x: number; y: number }) => {
      const reversedComponents = [...components].reverse();
      for (const c of reversedComponents) {
        if (!selectedComponentIds.includes(c.id)) continue;
        if (c.isLocked) continue;

        const { x, y, width, height, rotation = 0 } = c;
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const p = rotatePoint(worldCoords, { x: centerX, y: centerY }, -rotation);

        // Use mobile-aware handle sizes and touch areas for better interaction
        const hs = getHandleSize();
        const touchArea = getTouchArea();
        const scaledRotationOffset = getRotationHandleOffset();

        // Use enhanced touch areas for mobile interaction while keeping visual handles smaller
        const touchAreaSize = isMobileMode ? touchArea : hs;
        const touchOffset = (touchAreaSize - hs) / 2;

        const handleChecks: {
          name: ResizeHandle | "rot";
          x: number;
          y: number;
          w: number;
          h: number;
        }[] = [
          {
            name: "tl",
            x: x - touchOffset,
            y: y - touchOffset,
            w: touchAreaSize,
            h: touchAreaSize,
          },
          {
            name: "tr",
            x: x + width - hs - touchOffset,
            y: y - touchOffset,
            w: touchAreaSize,
            h: touchAreaSize,
          },
          {
            name: "bl",
            x: x - touchOffset,
            y: y + height - hs - touchOffset,
            w: touchAreaSize,
            h: touchAreaSize,
          },
          {
            name: "br",
            x: x + width - hs - touchOffset,
            y: y + height - hs - touchOffset,
            w: touchAreaSize,
            h: touchAreaSize,
          },
          {
            name: "tm",
            x: x + width / 2 - touchAreaSize / 2,
            y: y - touchOffset,
            w: touchAreaSize,
            h: touchAreaSize,
          },
          {
            name: "bm",
            x: x + width / 2 - touchAreaSize / 2,
            y: y + height - hs - touchOffset,
            w: touchAreaSize,
            h: touchAreaSize,
          },
          {
            name: "ml",
            x: x - touchOffset,
            y: y + height / 2 - touchAreaSize / 2,
            w: touchAreaSize,
            h: touchAreaSize,
          },
          {
            name: "mr",
            x: x + width - hs - touchOffset,
            y: y + height / 2 - touchAreaSize / 2,
            w: touchAreaSize,
            h: touchAreaSize,
          },
          {
            name: "rot",
            x: x + width / 2 - touchAreaSize / 2,
            y: y - scaledRotationOffset - touchOffset,
            w: touchAreaSize,
            h: touchAreaSize,
          },
        ];

        for (const handle of handleChecks) {
          // Use the handle's actual position and size for detection
          if (
            p.x >= handle.x &&
            p.x <= handle.x + handle.w &&
            p.y >= handle.y &&
            p.y <= handle.y + handle.w
          ) {
            return {
              action: handle.name === "rot" ? "rotating" : "resizing",
              componentId: c.id,
              handle: handle.name,
            };
          }
        }
      }

      for (const c of reversedComponents) {
        const { x, y, width, height, rotation = 0 } = c;
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const p = rotatePoint(worldCoords, { x: centerX, y: centerY }, -rotation);
        if (p.x >= x && p.x <= x + width && p.y >= y && p.y <= y + height) {
          return { action: "moving", componentId: c.id };
        }
      }
      return null;
    },
    [components, selectedComponentIds, isMobileMode, getHandleSize, getTouchArea, getRotationHandleOffset]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const screenCoords = { x: e.clientX, y: e.clientY }; // getCanvasCoordinates(e) will be called by screenToWorld
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
            selectComponent(actionUnderCursor.componentId, e.shiftKey);
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

          if (!selectedComponentIds.includes(actionUnderCursor.componentId)) {
            selectComponent(actionUnderCursor.componentId, false);
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
      const screenCoords = { x: e.clientX, y: e.clientY }; // getCanvasCoordinates(e) will be called by screenToWorld
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

  const handleDragOver = useCallback((e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const itemName = e.dataTransfer.getData("library-item-name");
    if (itemName) {
      const screenCoords = { x: e.clientX, y: e.clientY }; // getCanvasCoordinates(e) will be called by screenToWorld
      const worldCoords = screenToWorld(screenCoords);
      addLibraryComponent(itemName, worldCoords);
    }
  }, [screenToWorld, addLibraryComponent]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    // Only handle wheel events in web UI mode to prevent conflicts with mobile gestures
    if (isMobileMode) return;

    e.preventDefault();
    const zoomFactor = 1.1;
    const newZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
    const clampedZoom = Math.max(0.1, Math.min(newZoom, 4));

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newPanX = mouseX - (mouseX - pan.x) * (clampedZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (clampedZoom / zoom);

    setViewTransform({ zoom: clampedZoom, pan: { x: newPanX, y: newPanY } });
  }, [isMobileMode, zoom, pan, setViewTransform, canvasRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = cursor;
    }
  }, [cursor, canvasRef]);

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
    handleDragOver,
    handleDrop,
    handleWheel,
    cursor,
  };
};