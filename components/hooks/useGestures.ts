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
  const [isGesturing, setIsGesturing] = useState(false);
  const initialDistanceRef = useRef(0);
  const initialZoomRef = useRef(zoom);
  const initialPanRef = useRef(pan);

  const getDistance = (touches: TouchList) => {
    if (touches.length < 2) return 0;
    const [a, b] = [touches[0], touches[1]];
    const dx = a.clientX - b.clientX;
    const dy = a.clientY - b.clientY;
    return Math.hypot(dx, dy);
  };

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!isMobileMode) return;
      if (e.touches.length === 2) {
        initialDistanceRef.current = getDistance(e.touches);
        initialZoomRef.current = zoom;
        initialPanRef.current = pan;
        setIsGesturing(true);
        setAction('panning');
      }
    },
    [isMobileMode, zoom, pan, setAction]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!isMobileMode || !isGesturing || e.touches.length !== 2) return;
      e.preventDefault();

      const newDistance = getDistance(e.touches);
      if (!initialDistanceRef.current) return;

      const scale = newDistance / initialDistanceRef.current;
      const newZoom = Math.max(0.1, Math.min(4, initialZoomRef.current * scale));

      setViewTransform({ zoom: newZoom, pan: initialPanRef.current });
    },
    [isMobileMode, isGesturing, setViewTransform]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!isMobileMode) return;
      if (e.touches.length < 2 && isGesturing) {
        setIsGesturing(false);
        setAction('none');
        handleMouseUp();
      }
    },
    [isMobileMode, isGesturing, setAction, handleMouseUp]
  );

  useEffect(() => {
    if (!isMobileMode) return;
    const onEnd = () => {
      if (isGesturing) {
        setIsGesturing(false);
        setAction('none');
        handleMouseUp();
      }
    };
    window.addEventListener('touchend', onEnd);
    return () => window.removeEventListener('touchend', onEnd);
  }, [isMobileMode, isGesturing, setAction, handleMouseUp]);

  return { handleTouchStart, handleTouchMove, handleTouchEnd, isGesturing };
};