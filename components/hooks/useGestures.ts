import { useState, useCallback, useRef, useEffect } from 'react';

export const useGestures = ({
  isMobile,
  zoom,
  pan,
  setViewTransform,
  setAction,
  handleMouseUp,
  canvasRef,
}: {
  isMobile: boolean;
  zoom: number;
  pan: { x: number; y: number };
  setViewTransform: (t: { zoom?: number; pan?: { x: number; y: number } }) => void;
  setAction: React.Dispatch<
    React.SetStateAction<'none' | 'drawing' | 'moving' | 'resizing' | 'rotating' | 'panning'>
  >;
  handleMouseUp: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}) => {
  const [isGesturing, setIsGesturing] = useState(false);
  const initialDistanceRef = useRef(0);
  const initialZoomRef = useRef(zoom);
  const initialPanRef = useRef(pan);

  const getDistance = (touches: TouchList) => {
    if (touches.length < 2) return 0;
    const [a, b] = [touches[0], touches[1]];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!isMobile) return;
      if (e.touches.length === 2) {
        initialDistanceRef.current = getDistance(e.touches);
        initialZoomRef.current = zoom;
        initialPanRef.current = pan;
        setIsGesturing(true);
        setAction('panning');
      }
    },
    [isMobile, zoom, pan, setAction]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!isMobile || !isGesturing || e.touches.length !== 2) return;
      e.preventDefault();

      const newDist = getDistance(e.touches);
      if (!initialDistanceRef.current) return;

      const scale = newDist / initialDistanceRef.current;
      const newZoom = Math.max(0.1, Math.min(4, initialZoomRef.current * scale));
      setViewTransform({ zoom: newZoom, pan: initialPanRef.current });
    },
    [isMobile, isGesturing, setViewTransform]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!isMobile) return;
      if (e.touches.length < 2 && isGesturing) {
        setIsGesturing(false);
        setAction('none');
        handleMouseUp();
      }
    },
    [isMobile, isGesturing, setAction, handleMouseUp]
  );

  useEffect(() => {
    if (!isMobile) return;
    const onEnd = () => {
      if (isGesturing) {
        setIsGesturing(false);
        setAction('none');
        handleMouseUp();
      }
    };
    window.addEventListener('touchend', onEnd);
    return () => window.removeEventListener('touchend', onEnd);
  }, [isMobile, isGesturing, setAction, handleMouseUp]);

  return { handleTouchStart, handleTouchMove, handleTouchEnd, isGesturing };
}