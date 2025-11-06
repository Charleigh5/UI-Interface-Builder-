// components/hooks/useDrawingTools.ts
import { useState, useCallback, useRef } from 'react';
import { WireframeComponent } from '../../library/types';

export const useDrawingTools = (isMobileMode: boolean) => {
  const [drawnPaths, setDrawnPaths] = useState<{ x: number; y: number }[][]>([]);
  const [currentShape, setCurrentShape] = useState<Omit<WireframeComponent, "id" | "label"> | null>(null);

  // Drawing performance optimization refs
  const drawingThrottleRef = useRef<number>(0);
  const pathSmoothingRef = useRef<{ x: number; y: number }[]>([]);

  // Path smoothing for better touch drawing experience
  const smoothPath = useCallback((points: { x: number; y: number }[]) => {
    if (points.length < 3) return points;

    const smoothed: { x: number; y: number }[] = [points[0]];

    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];

      // Simple smoothing using weighted average
      const smoothedPoint = {
        x: (prev.x + 2 * curr.x + next.x) / 4,
        y: (prev.y + 2 * curr.y + next.y) / 4,
      };

      smoothed.push(smoothedPoint);
    }

    smoothed.push(points[points.length - 1]);
    return smoothed;
  }, []);

  // Optimized drawing for mobile touch devices
  const addDrawingPoint = useCallback(
    (point: { x: number; y: number }) => {
      const now = performance.now();

      if (isMobileMode) {
        // Enhanced performance for mobile touch drawing
        if (now - drawingThrottleRef.current < 8) {
          // ~120fps for smooth drawing
          // Buffer the point for later processing
          pathSmoothingRef.current.push(point);
          return;
        }

        drawingThrottleRef.current = now;

        // Process buffered points with smoothing
        const allPoints = [...pathSmoothingRef.current, point];
        const smoothedPoints = smoothPath(allPoints);

        setDrawnPaths((paths) => {
          const newPaths = [...paths];
          if (newPaths.length > 0) {
            // Replace the last few points with smoothed version
            const lastPath = [...newPaths[newPaths.length - 1]];
            const startIndex = Math.max(
              0,
              lastPath.length - smoothedPoints.length
            );

            // Merge smoothed points
            for (let i = 0; i < smoothedPoints.length; i++) {
              if (startIndex + i < lastPath.length) {
                lastPath[startIndex + i] = smoothedPoints[i];
              } else {
                lastPath.push(smoothedPoints[i]);
              }
            }

            newPaths[newPaths.length - 1] = lastPath;
          }
          return newPaths;
        });

        // Clear buffer
        pathSmoothingRef.current = [];
      } else {
        // Standard drawing for desktop (preserve existing behavior)
        setDrawnPaths((paths) => {
          const newPaths = [...paths];
          newPaths[newPaths.length - 1].push(point);
          return newPaths;
        });
      }
    },
    [isMobileMode, smoothPath]
  );

  return {
    drawnPaths,
    setDrawnPaths,
    currentShape,
    setCurrentShape,
    addDrawingPoint,
  };
};