import React, { useState, useCallback, useRef, useEffect } from 'react';

interface UseGesturesProps {
  isMobileMode: boolean;
  zoom: number;
  pan: { x: number; y: number };
  setViewTransform: (transform: { zoom?: number; pan?: { x: number; y: number } }) => void;
  setAction: React.Dispatch<
    React.SetStateAction<
      'none' | 'drawing' | 'moving' | 'resizing' | 'rotating' | 'panning'
    >
  >;
  handleMouseUp: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export const useGestures = ({
  isMobileMode,
  zoom,
  pan,
  setViewTransform,
  setAction,
  handleMouseUp,
  canvasRef,
}: UseGesturesProps) => {
  const [gestureState, setGestureState] = useState({
    isGesturing: false,
    initialDistance: 0,
    initialZoom: 1,
    initialPan: { x: 0, y: 0 },
    gestureCenter: { x: 0, y: 0 },
    lastTouchPositions: [] as { x: number; y: number }[],
    gestureStartTime: 0,
  });

  const gestureThrottleRef = useRef<number>(0);

  const getTouchDistance = useCallback((touches: TouchList) => {
    if (touches.length < 2) return 0;
    const [t1, t2] = [touches[0], touches[1]];
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const getTouchCenter = useCallback((touches: TouchList) => {
    if (touches.length < 2) return { x: 0, y: 0 };
    const [t1, t2] = [touches[0], touches[1]];
    return { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!isMobileMode) return;
      // existing logic...
    },
    [isMobileMode]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!isMobileMode) return;
      // existing logic...
    },
    [isMobileMode]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!isMobileMode) return;
      // existing logic...
    },
    [isMobileMode, handleMouseUp]
  );

  useEffect(() => {
    const handleGlobalTouchEnd = () => {
      if (isMobileMode && gestureState.isGesturing) {
        handleMouseUp();
        setGestureState(prev => ({
          ...prev,
          isGesturing: false,
          initialDistance: 0,
          lastTouchPositions: [],
          gestureStartTime: 0,
        }));
      }
    };
    window.addEventListener('touchend', handleGlobalTouchEnd);
    return () => window.removeEventListener('touchend', handleGlobalTouchEnd);
  }, [isMobileMode, gestureState.isGesturing, handleMouseUp]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    isGesturing: gestureState.isGesturing,
  };
};