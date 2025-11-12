// components/hooks/useWheelZoom.ts
import { useCallback } from 'react';

interface UseWheelZoomProps {
  isMobileMode: boolean;
  zoom: number;
  pan: { x: number; y: number };
  setViewTransform: (transform: { zoom?: number; pan?: { x: number; y: number } }) => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export const useWheelZoom = ({
  isMobileMode,
  zoom,
  pan,
  setViewTransform,
  canvasRef,
}: UseWheelZoomProps) => {
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

  return { handleWheel };
};