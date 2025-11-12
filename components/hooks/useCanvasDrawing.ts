import React, { useRef, useCallback } from 'react';
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
  currentShape: Omit<WireframeComponent, 'id' | 'label'> | null,
  drawnPaths: { x: number; y: number }[][],
  isMobileMode: boolean,
  getHandleSize: () => number,
  getRotationHandleOffset: () => number
) => {
  const imageCache = useRef<Record<string, HTMLImageElement>>({});

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply zoom / pan
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // Background
      ctx.fillStyle = theme === 'dark' ? '#020817' : '#f8fafc';
      ctx.fillRect(
        -pan.x / zoom,
        -pan.y / zoom,
        canvas.width / zoom,
        canvas.height / zoom
      );

      // Components (very lightweight rendering—rect-style for all)
      components.forEach(component => {
        const isSelected = selectedComponentIds.includes(component.id);
        const { x, y, width, height, rotation = 0 } = component;

        ctx.save();
        ctx.translate(x + width / 2, y + height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-width / 2, -height / 2);

        const bg =
          component.properties.backgroundColor ??
          (theme === 'dark' ? '#111827' : '#ffffff');
        const border =
          component.properties.borderColor ??
          (theme === 'dark' ? '#4b5563' : '#e5e7eb');
        const borderWidth = component.properties.borderWidth ?? 1;
        const radius = component.properties.borderRadius ?? 4;

        const r = radius;
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(width - r, 0);
        ctx.quadraticCurveTo(width, 0, width, r);
        ctx.lineTo(width, height - r);
        ctx.quadraticCurveTo(width, height, width - r, height);
        ctx.lineTo(r, height);
        ctx.quadraticCurveTo(0, height, 0, height - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();

        ctx.fillStyle = bg;
        ctx.fill();
        if (borderWidth > 0) {
          ctx.lineWidth = borderWidth;
          ctx.strokeStyle = border;
          ctx.stroke();
        }

        if (isSelected) {
          ctx.lineWidth = 1;
          ctx.strokeStyle = '#3b82f6';
          ctx.setLineDash([4, 2]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.restore();
      });

      // (drawnPaths and currentShape could be rendered here if needed)

      ctx.restore();
    },
    [canvasRef, components, selectedComponentIds, pan, zoom, theme]
  );

  return { draw, imageCache };
};