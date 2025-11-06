// components/hooks/useCanvasDrawing.ts
import { useCallback, useRef } from 'react';
import { WireframeComponent, ThemeMode, DrawingSettings } from '../../library/types';
import { rotatePoint } from '../../utils/canvasUtils';

export const useCanvasDrawing = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  components: WireframeComponent[],
  selectedComponentIds: string[],
  theme: ThemeMode,
  zoom: number,
  pan: { x: number; y: number },
  drawingSettings: DrawingSettings,
  action: string,
  currentShape: Omit<WireframeComponent, "id" | "label"> | null,
  drawnPaths: { x: number; y: number }[][],
  isMobileMode: boolean,
  getHandleSize: () => number,
  getRotationHandleOffset: () => number,
) => {
  const imageCache = useRef<Record<string, HTMLImageElement>>({});
  const { shapeFill, penWidth, penOpacity } = drawingSettings;

  const drawComponent = useCallback(
    (ctx: CanvasRenderingContext2D, component: WireframeComponent) => {
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
            const canvas = canvasRef.current;
            if (canvas) {
              const ctx = canvas.getContext('2d');
              if (ctx) draw(ctx); // Redraw canvas after image loads
            }
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
    },
    [zoom, theme, canvasRef]
  );

  const drawHandles = useCallback(
    (ctx: CanvasRenderingContext2D, c: WireframeComponent) => {
      if (c.isLocked) return;
      const { x, y, width, height, rotation = 0 } = c;
      const centerX = x + width / 2;
      const centerY = y + height / 2;

      // Use mobile-aware handle sizes for better touch interaction
      const scaledHandleSize = getHandleSize();
      const scaledRotationOffset = getRotationHandleOffset();

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
    },
    [zoom, isMobileMode, getHandleSize, getRotationHandleOffset]
  );

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

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
    },
    [
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
      drawComponent,
      drawHandles,
      canvasRef
    ]
  );

  return { draw, imageCache };
};