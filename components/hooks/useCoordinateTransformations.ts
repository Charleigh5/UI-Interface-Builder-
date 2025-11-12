import React, { useCallback } from 'react';

export const useCoordinateTransformations = (
  pan: { x: number; y: number },
  zoom: number,
  canvasRef: React.RefObject<HTMLCanvasElement>
) => {
  const getCanvasCoordinates = useCallback(
    (
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
    },
    [canvasRef]
  );

  const screenToWorld = useCallback(
    (screenCoords: { x: number; y: number }): { x: number; y: number } => ({
      x: (screenCoords.x - pan.x) / zoom,
      y: (screenCoords.y - pan.y) / zoom,
    }),
    [pan, zoom]
  );

  return { getCanvasCoordinates, screenToWorld };
};