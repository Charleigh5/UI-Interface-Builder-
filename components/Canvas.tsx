import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useContext,
} from "react";
import { WireframeComponent, Tool } from "../library/types";
import {
  getComponentLabel,
  getDefaultProperties,
} from "../utils/componentUtils";
import { AppContext } from "../store/AppContext";

type Action =
  | "none"
  | "drawing"
  | "moving"
  | "resizing"
  | "rotating"
  | "panning";
type ResizeHandle = "tl" | "tm" | "tr" | "ml" | "mr" | "bl" | "bm" | "br";

// Desktop handle sizes
const HANDLE_SIZE = 8;
const ROTATION_HANDLE_OFFSET = 25;

// Mobile-optimized handle sizes (minimum 44px touch targets)
const MOBILE_HANDLE_SIZE = 16;
const MOBILE_ROTATION_HANDLE_OFFSET = 35;
const MOBILE_MIN_TOUCH_TARGET = 44;

const rotatePoint = (
  point: { x: number; y: number },
  center: { x: number; y: number },
  angle: number
) => {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: dx * cos - dy * sin + center.x,
    y: dx * sin + dy * cos + center.y,
  };
};

const getCursorForHandle = (handle: string, rotation = 0) => {
  const angle = ((rotation % 360) + 360) % 360;
  const getRotatedCursor = (cursors: string[]) => {
    const index = Math.round(angle / 45) % 8;
    return cursors[index];
  };

  switch (handle) {
    case "tl":
    case "br":
      return getRotatedCursor([
        "nwse-resize",
        "ns-resize",
        "nesw-resize",
        "ew-resize",
        "nwse-resize",
        "ns-resize",
        "nesw-resize",
        "ew-resize",
      ]);
    case "tr":
    case "bl":
      return getRotatedCursor([
        "nesw-resize",
        "ew-resize",
        "nwse-resize",
        "ns-resize",
        "nesw-resize",
        "ew-resize",
        "nwse-resize",
        "ns-resize",
      ]);
    case "tm":
    case "bm":
      return getRotatedCursor([
        "ns-resize",
        "nesw-resize",
        "ew-resize",
        "nwse-resize",
        "ns-resize",
        "nesw-resize",
        "ew-resize",
        "nwse-resize",
      ]);
    case "ml":
    case "mr":
      return getRotatedCursor([
        "ew-resize",
        "nwse-resize",
        "ns-resize",
        "nesw-resize",
        "ew-resize",
        "nwse-resize",
        "ns-resize",
        "nesw-resize",
      ]);
    case "rot":
      return "crosshair";
    default:
      return "move";
  }
};

/**
 * Get appropriate handle size based on mobile/web UI context
 */
const getHandleSize = (isMobile: boolean, zoom: number) => {
  const baseSize = isMobile ? MOBILE_HANDLE_SIZE : HANDLE_SIZE;
  return baseSize / zoom;
};

/**
 * Get appropriate rotation handle offset based on mobile/web UI context
 */
const getRotationHandleOffset = (isMobile: boolean, zoom: number) => {
  const baseOffset = isMobile
    ? MOBILE_ROTATION_HANDLE_OFFSET
    : ROTATION_HANDLE_OFFSET;
  return baseOffset / zoom;
};

export const Canvas = () => {
  const {
    state,
    dispatch,
    addComponent,
    addLibraryComponent,
    selectComponent,
    setViewTransform,
  } = useContext(AppContext);
  const {
    components,
    selectedComponentIds,
    currentTool,
    theme,
    zoom,
    pan,
    drawingSettings,
    isMobileMode,
  } = state;
  const { shapeFill, penWidth, penOpacity } = drawingSettings;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageCache = useRef<Record<string, HTMLImageElement>>({});
  const [action, setAction] = useState<Action>("none");
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const [currentShape, setCurrentShape] = useState<Omit<
    WireframeComponent,
    "id" | "label"
  > | null>(null);
  const [drawnPaths, setDrawnPaths] = useState<{ x: number; y: number }[][]>(
    []
  );
  const [moveOffsets, setMoveOffsets] = useState<
    Map<string, { dx: number; dy: number }>
  >(new Map());
  const [activeResizeHandle, setActiveResizeHandle] = useState<
    ResizeHandle | "rot" | null
  >(null);
  const [originalComponents, setOriginalComponents] = useState<
    Map<string, WireframeComponent>
  >(new Map());
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
  }, [drawnPaths]);

  useEffect(() => {
    if (state.isAnalyzing) {
      setDrawnPaths([]);
    }
  }, [state.isAnalyzing]);

  const getCanvasCoordinates = (
    e:
      | MouseEvent
      | React.MouseEvent<HTMLCanvasElement>
      | React.DragEvent<HTMLCanvasElement>
  ): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const screenToWorld = useCallback(
    (screenCoords: { x: number; y: number }): { x: number; y: number } => {
      return {
        x: (screenCoords.x - pan.x) / zoom,
        y: (screenCoords.y - pan.y) / zoom,
      };
    },
    [pan, zoom]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Grid
    const scaledLineWidth = 0.5 / zoom;
    ctx.strokeStyle = theme === "dark" ? "#374151" : "#e2e8f0";
    ctx.lineWidth = scaledLineWidth;

    const viewMinX = -pan.x / zoom;
    const viewMinY = -pan.y / zoom;
    const viewMaxX = (canvas.width - pan.x) / zoom;
    const viewMaxY = (canvas.height - pan.y) / zoom;
    const gridSize = 20;

    for (
      let x = Math.floor(viewMinX / gridSize) * gridSize;
      x < viewMaxX;
      x += gridSize
    ) {
      ctx.beginPath();
      ctx.moveTo(x, viewMinY);
      ctx.lineTo(x, viewMaxY);
      ctx.stroke();
    }
    for (
      let y = Math.floor(viewMinY / gridSize) * gridSize;
      y < viewMaxY;
      y += gridSize
    ) {
      ctx.beginPath();
      ctx.moveTo(viewMinX, y);
      ctx.lineTo(viewMaxX, y);
      ctx.stroke();
    }

    // Pen paths
    ctx.save();
    ctx.strokeStyle = theme === "dark" ? "#FFFFFF" : "#000000";
    ctx.lineWidth = penWidth / zoom;
    ctx.globalAlpha = penOpacity;
    ctx.lineCap = "round";
    drawnPaths.forEach((path) => {
      if (path.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      path.forEach((point) => ctx.lineTo(point.x, point.y));
      ctx.stroke();
    });
    ctx.restore();

    components.forEach((c) => drawComponent(ctx, c));

    if (action === "drawing" && currentShape) {
      const { x, y, width, height, type } = currentShape;
      ctx.strokeStyle = theme === "dark" ? "#FFFFFF" : "#000000";
      ctx.lineWidth = 1.5 / zoom;
      ctx.setLineDash([6 / zoom, 3 / zoom]);
      ctx.fillStyle = shapeFill
        ? theme === "dark"
          ? "rgba(255,255,255,0.1)"
          : "rgba(0,0,0,0.1)"
        : "transparent";

      if (type === "circle") {
        ctx.beginPath();
        ctx.arc(
          x + width / 2,
          y + height / 2,
          Math.min(Math.abs(width), Math.abs(height)) / 2,
          0,
          2 * Math.PI
        );
        if (shapeFill) ctx.fill();
        ctx.stroke();
      } else {
        // rectangle, button, input, text, image
        if (shapeFill) ctx.fillRect(x, y, width, height);
        ctx.strokeRect(x, y, width, height);
      }
      ctx.setLineDash([]);
    }

    const selected = components.filter((c) =>
      selectedComponentIds.includes(c.id)
    );
    selected.forEach((c) => drawHandles(ctx, c));

    ctx.restore();
  }, [
    components,
    selectedComponentIds,
    theme,
    action,
    currentShape,
    drawnPaths,
    zoom,
    pan,
    penWidth,
    penOpacity,
    shapeFill,
  ]);

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

  const drawComponent = (
    ctx: CanvasRenderingContext2D,
    component: WireframeComponent
  ) => {
    ctx.save();
    const {
      x,
      y,
      width,
      height,
      type,
      properties,
      rotation = 0,
      isLocked,
    } = component;
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);

    ctx.fillStyle = properties.backgroundColor || "transparent";
    ctx.strokeStyle = properties.borderColor || "#cbd5e1";
    ctx.lineWidth = (properties.borderWidth ?? 1) / zoom;

    const radius =
      type === "circle"
        ? Math.min(width, height) / 2
        : properties.borderRadius ?? 4;

    ctx.beginPath();
    if (type === "circle") {
      ctx.arc(x + width / 2, y + height / 2, radius, 0, 2 * Math.PI);
    } else {
      ctx.roundRect(x, y, width, height, radius);
    }
    ctx.closePath();
    if (
      properties.backgroundColor &&
      properties.backgroundColor !== "transparent"
    )
      ctx.fill();
    if (properties.borderWidth && properties.borderWidth > 0) ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (type === "button") {
      ctx.fillStyle = properties.textColor || "#ffffff";
      ctx.font = `${properties.fontWeight || "500"} ${
        properties.fontSize || 14
      }px Inter`;
      ctx.fillText(
        properties.buttonText || "Button",
        x + width / 2,
        y + height / 2
      );
    } else if (type === "input") {
      ctx.fillStyle = properties.textColor || "#94a3b8";
      ctx.font = `${properties.fontWeight || "400"} ${
        properties.fontSize || 14
      }px Inter`;
      ctx.textAlign = "left";
      ctx.fillText(
        properties.placeholder || "Placeholder",
        x + 10,
        y + height / 2
      );
    } else if (type === "text") {
      ctx.fillStyle =
        properties.textColor || (theme === "dark" ? "#f1f5f9" : "#1e293b");
      ctx.font = `${properties.fontWeight || "400"} ${
        properties.fontSize || 16
      }px Inter`;
      ctx.textAlign = properties.textAlign || "left";
      const textX =
        properties.textAlign === "center"
          ? x + width / 2
          : properties.textAlign === "right"
          ? x + width - 10
          : x + 10;
      ctx.fillText(component.label || "Text", textX, y + height / 2);
    } else if (type === "image") {
      const imgUrl = properties.imageDataUrl;
      if (imgUrl && imageCache.current[imgUrl]) {
        ctx.drawImage(imageCache.current[imgUrl], x, y, width, height);
      } else if (imgUrl && !imageCache.current[imgUrl]) {
        const img = new Image();
        img.onload = () => {
          imageCache.current[imgUrl] = img;
          draw();
        };
        img.src = imgUrl;
      } else {
        const iconSize = Math.min(width, height) * 0.4;
        ctx.strokeStyle = properties.borderColor || "#cbd5e1";
        ctx.lineWidth = 1 / zoom;
        ctx.strokeRect(
          x + (width - iconSize) / 2,
          y + (height - iconSize) / 2,
          iconSize,
          iconSize
        );
        ctx.beginPath();
        ctx.arc(
          x + width * 0.35,
          y + height * 0.35,
          iconSize * 0.1,
          0,
          2 * Math.PI
        );
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(
          x + (width - iconSize) / 2,
          y + height - (height - iconSize) / 2
        );
        ctx.lineTo(x + width * 0.5, y + height * 0.6);
        ctx.lineTo(
          x + width - (width - iconSize) / 2,
          y + height - (height - iconSize) / 2
        );
        ctx.stroke();
      }
    }

    if (isLocked) {
      const lockSize = Math.max(12 / zoom, Math.min(width, height) * 0.12);
      const padding = lockSize * 0.4;
      const iconX = x + width - lockSize - padding;
      const iconY = y + padding;

      ctx.save();
      ctx.fillStyle =
        theme === "dark" ? "rgba(248, 250, 252, 0.5)" : "rgba(51, 65, 85, 0.3)";
      ctx.strokeStyle =
        theme === "dark" ? "rgba(248, 250, 252, 0.5)" : "rgba(51, 65, 85, 0.3)";
      ctx.lineWidth = lockSize * 0.15;

      // Body
      ctx.beginPath();
      ctx.roundRect(
        iconX,
        iconY + lockSize * 0.4,
        lockSize,
        lockSize * 0.6,
        lockSize * 0.1
      );
      ctx.fill();

      // Shackle
      ctx.beginPath();
      ctx.arc(
        iconX + lockSize / 2,
        iconY + lockSize * 0.4,
        lockSize * 0.3,
        Math.PI,
        2 * Math.PI
      );
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  };

  const drawHandles = (
    ctx: CanvasRenderingContext2D,
    c: WireframeComponent
  ) => {
    if (c.isLocked) return;
    const { x, y, width, height, rotation = 0 } = c;
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // Use mobile-aware handle sizes for better touch interaction
    const scaledHandleSize = getHandleSize(isMobileMode, zoom);
    const scaledRotationOffset = getRotationHandleOffset(isMobileMode, zoom);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);

    // Bounding box
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash([4 / zoom, 2 / zoom]);
    ctx.strokeRect(-width / 2, -height / 2, width, height);
    ctx.setLineDash([]);

    // Handles
    const hs = scaledHandleSize / 2;
    const handles = {
      tl: { x: -width / 2 - hs, y: -height / 2 - hs },
      tr: { x: width / 2 - hs, y: -height / 2 - hs },
      bl: { x: -width / 2 - hs, y: height / 2 - hs },
      br: { x: width / 2 - hs, y: height / 2 - hs },
      tm: { x: -hs, y: -height / 2 - hs },
      bm: { x: -hs, y: height / 2 - hs },
      ml: { x: -width / 2 - hs, y: -hs },
      mr: { x: width / 2 - hs, y: -hs },
      rot: { x: -hs, y: -height / 2 - scaledRotationOffset - hs },
    };

    ctx.fillStyle = "white";
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 1.5 / zoom;

    Object.values(handles).forEach((p) => {
      ctx.beginPath();
      if (p === handles.rot) {
        ctx.arc(p.x + hs, p.y + hs, hs, 0, 2 * Math.PI);
      } else {
        ctx.rect(p.x, p.y, scaledHandleSize, scaledHandleSize);
      }
      ctx.fill();
      ctx.stroke();
    });

    // Rotation line
    ctx.beginPath();
    ctx.moveTo(0, -height / 2);
    ctx.lineTo(0, -height / 2 - scaledRotationOffset);
    ctx.stroke();

    ctx.restore();
  };

  const getActionUnderCursor = (worldCoords: { x: number; y: number }) => {
    const reversedComponents = [...components].reverse();
    for (const c of reversedComponents) {
      if (!selectedComponentIds.includes(c.id)) continue;
      if (c.isLocked) continue;

      const { x, y, width, height, rotation = 0 } = c;
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      const p = rotatePoint(worldCoords, { x: centerX, y: centerY }, -rotation);

      // Use mobile-aware handle sizes for better touch interaction
      const hs = getHandleSize(isMobileMode, zoom);
      const scaledRotationOffset = getRotationHandleOffset(isMobileMode, zoom);

      const handleChecks: {
        name: ResizeHandle | "rot";
        x: number;
        y: number;
        w: number;
        h: number;
      }[] = [
        { name: "tl", x: x, y: y, w: hs, h: hs },
        { name: "tr", x: x + width - hs, y: y, w: hs, h: hs },
        { name: "bl", x: x, y: y + height - hs, w: hs, h: hs },
        { name: "br", x: x + width - hs, y: y + height - hs, w: hs, h: hs },
        { name: "tm", x: x + width / 2 - hs / 2, y: y, w: hs, h: hs },
        {
          name: "bm",
          x: x + width / 2 - hs / 2,
          y: y + height - hs,
          w: hs,
          h: hs,
        },
        { name: "ml", x: x, y: y + height / 2 - hs / 2, w: hs, h: hs },
        {
          name: "mr",
          x: x + width - hs,
          y: y + height / 2 - hs / 2,
          w: hs,
          h: hs,
        },
        {
          name: "rot",
          x: x + width / 2 - hs / 2,
          y: y - scaledRotationOffset,
          w: hs,
          h: hs,
        },
      ];

      for (const handle of handleChecks) {
        const hx = handle.x - hs / 2;
        const hy = handle.y - hs / 2;
        if (
          p.x >= hx &&
          p.x <= hx + handle.w + hs &&
          p.y >= hy &&
          p.y <= hy + handle.h + hs
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
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const screenCoords = getCanvasCoordinates(e);
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

          if (!selectedComponentIds.includes(actionUnderCursor.componentId)) {
            selectComponent(actionUnderCursor.componentId, false);
          }

          const original = new Map<string, WireframeComponent>();
          const offsets = new Map<string, { dx: number; dy: number }>();

          const effectivelySelected = components.filter((c) =>
            state.allEffectivelySelectedIds.has(c.id)
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
      state.allEffectivelySelectedIds,
      theme,
    ]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const screenCoords = getCanvasCoordinates(e);
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
          setDrawnPaths((paths) => {
            const newPaths = [...paths];
            newPaths[newPaths.length - 1].push(worldCoords);
            return newPaths;
          });
        } else if (currentShape) {
          setCurrentShape({ ...currentShape, width: dx, height: dy });
        }
      } else if (action === "panning") {
        setViewTransform({
          pan: { x: pan.x + e.movementX, y: pan.y + e.movementY },
        });
      } else if (action === "moving") {
        state.allEffectivelySelectedIds.forEach((id) => {
          const original = originalComponents.get(id);
          const offset = moveOffsets.get(id);
          if (original && offset) {
            dispatch({
              type: "UPDATE_COMPONENT",
              payload: {
                id,
                updates: {
                  x: worldCoords.x - offset.dx,
                  y: worldCoords.y - offset.dy,
                },
              },
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

        dispatch({
          type: "UPDATE_COMPONENT",
          payload: {
            id,
            updates: {
              x: finalX,
              y: finalY,
              width: newWidth,
              height: newHeight,
            },
          },
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
        dispatch({
          type: "UPDATE_COMPONENT",
          payload: { id, updates: { rotation: newRotation } },
        });
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
      dispatch,
      moveOffsets,
      originalComponents,
      activeResizeHandle,
      state.allEffectivelySelectedIds,
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
      }
    }
    setAction("none");
    setStartPoint(null);
    setCurrentShape(null);
    setActiveResizeHandle(null);
    setOriginalComponents(new Map());
    setMoveOffsets(new Map());
  }, [action, currentShape, addComponent, selectComponent]);

  const handleDragOver = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const itemName = e.dataTransfer.getData("library-item-name");
    if (itemName) {
      const screenCoords = getCanvasCoordinates(e);
      const worldCoords = screenToWorld(screenCoords);
      addLibraryComponent(itemName, worldCoords);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
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
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = cursor;
    }
  }, [cursor]);

  // Touch event handlers for mobile UI support
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!isMobileMode) return; // Only handle touch events in mobile mode

      e.preventDefault();
      const touch = e.touches[0];
      if (touch) {
        // Convert touch event to mouse event format
        const mouseEvent = {
          preventDefault: () => e.preventDefault(),
          button: 0,
          clientX: touch.clientX,
          clientY: touch.clientY,
          shiftKey: false,
          metaKey: false,
          ctrlKey: false,
          movementX: 0,
          movementY: 0,
        } as React.MouseEvent<HTMLCanvasElement>;

        handleMouseDown(mouseEvent);
      }
    },
    [isMobileMode, handleMouseDown]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!isMobileMode) return;

      e.preventDefault();
      const touch = e.touches[0];
      if (touch) {
        const mouseEvent = {
          preventDefault: () => e.preventDefault(),
          clientX: touch.clientX,
          clientY: touch.clientY,
          movementX: 0, // Touch events don't have movement deltas
          movementY: 0,
        } as React.MouseEvent<HTMLCanvasElement>;

        handleMouseMove(mouseEvent);
      }
    },
    [isMobileMode, handleMouseMove]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!isMobileMode) return;

      e.preventDefault();
      handleMouseUp();
    },
    [isMobileMode, handleMouseUp]
  );

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (action !== "none") handleMouseUp();
    };

    const handleGlobalTouchEnd = () => {
      if (isMobileMode && action !== "none") handleMouseUp();
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    window.addEventListener("touchend", handleGlobalTouchEnd);

    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("touchend", handleGlobalTouchEnd);
    };
  }, [action, handleMouseUp, isMobileMode]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full bg-slate-100 dark:bg-slate-900"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onWheel={handleWheel}
      style={{ touchAction: isMobileMode ? "none" : "auto" }} // Prevent default touch behaviors in mobile mode
    />
  );
};
