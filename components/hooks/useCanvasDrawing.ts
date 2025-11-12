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
  // existing body unchanged
  const imageCache = useRef<Record<string, HTMLImageElement>>({});
  // ...
  return { draw, imageCache };
};