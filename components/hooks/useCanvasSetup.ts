// components/hooks/useCanvasSetup.ts
import { useRef, useEffect, useCallback } from 'react';

export const useCanvasSetup = (draw: (ctx: CanvasRenderingContext2D) => void) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      draw(ctx);
    }
  }, [draw]);

  useEffect(() => {
    setupCanvas(); // Initial draw

    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!container || !canvas) return;

    const resizeObserver = new ResizeObserver(() => {
      setupCanvas(); // Redraw on resize
    });
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [setupCanvas]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      draw(ctx); // Redraw when dependencies of draw change
    }
  }, [draw]);

  return { canvasRef };
};