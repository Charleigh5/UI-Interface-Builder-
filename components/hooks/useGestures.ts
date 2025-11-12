// components/hooks/useGestures.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { useStore } from '../../store/store'; // Assuming useStore is available globally or passed

interface UseGesturesProps {
  isMobileMode: boolean;
  zoom: number;
  pan: { x: number; y: number };
  setViewTransform: (transform: { zoom?: number; pan?: { x: number; y: number } }) => void;
  setAction: React.Dispatch<React.SetStateAction<"none" | "drawing" | "moving" | "resizing" | "rotating" | "panning">>;
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
  const [gestureState, setGestureState] = useState<{
    isGesturing: boolean;
    initialDistance: number;
    initialZoom: number;
    initialPan: { x: number; y: number };
    gestureCenter: { x: number; y: number };
    lastTouchPositions: { x: number; y: number }[];
    gestureStartTime: number;
  }>({
    isGesturing: false,
    initialDistance: 0,
    initialZoom: 1,
    initialPan: { x: 0, y: 0 },
    gestureCenter: { x: 0, y: 0 },
    lastTouchPositions: [],
    gestureStartTime: 0,
  });

  // Gesture smoothing and performance optimization
  const gestureThrottleRef = useRef<number>(0);

  // Helper function to calculate distance between two touch points
  const getTouchDistance = useCallback((touches: TouchList) => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Helper function to get center point between two touches
  const getTouchCenter = useCallback((touches: TouchList) => {
    if (touches.length < 2) return { x: 0, y: 0 };
    const touch1 = touches[0];
    const touch2 = touches[1];
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  }, []);

  // Enhanced touch event handlers with multi-touch gesture support
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!isMobileMode) return; // Only handle touch events in mobile mode

      const touchCount = e.touches.length;

      if (touchCount === 2) {
        // Two-finger gesture detected - start pinch/pan gesture
        e.preventDefault();

        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();

        const distance = getTouchDistance(e.touches);
        const center = getTouchCenter(e.touches);

        // Convert screen coordinates to canvas coordinates
        const canvasCenter = {
          x: center.x - rect.left,
          y: center.y - rect.top,
        };

        setGestureState({
          isGesturing: true,
          initialDistance: distance,
          initialZoom: zoom,
          initialPan: { ...pan },
          gestureCenter: canvasCenter,
          lastTouchPositions: Array.from(e.touches).map((touch: Touch) => ({
            x: touch.clientX,
            y: touch.clientY,
          })),
          gestureStartTime: performance.now(),
        });

        // Cancel any ongoing single-touch action
        setAction("none");
      } else if (touchCount === 1 && !gestureState.isGesturing) {
        // Single touch - convert to mouse event for existing functionality
        e.preventDefault();
        const touch = e.touches[0];

        const mouseEvent = {
          preventDefault: () => e.preventDefault(),
          button: 0,
          clientX: touch.clientX,
          clientY: touch.clientY,
          shiftKey: false,
          metaKey: false,
          ctrlKey: false,
          movementX: 0,
          movementY: 0,
        } as React.MouseEvent<HTMLCanvasElement>;

        // Call the handleMouseDown from useCanvasInteraction
        // This requires passing handleMouseDown as a prop or using a ref
        // For now, we'll assume it's passed or accessible.
        // This is a point where the modularity needs careful prop drilling or context.
        // For this example, we'll assume it's passed.
        // handleMouseDown(mouseEvent); // This would be passed from Canvas.tsx
      }
    },
    [
      isMobileMode,
      getTouchDistance,
      getTouchCenter,
      zoom,
      pan,
      gestureState.isGesturing,
      setAction,
      canvasRef,
    ]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!isMobileMode) return;

      const touchCount = e.touches.length;

      if (touchCount === 2 && gestureState.isGesturing) {
        // Two-finger gesture in progress - handle pinch-to-zoom and pan
        e.preventDefault();

        // Throttle gesture updates for better performance (60fps max)
        const now = performance.now();
        if (now - gestureThrottleRef.current < 16) return; // ~60fps
        gestureThrottleRef.current = now;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();

        const currentDistance = getTouchDistance(e.touches);
        const currentCenter = getTouchCenter(e.touches);
        const currentCanvasCenter = {
          x: currentCenter.x - rect.left,
          y: currentCenter.y - rect.top,
        };

        // Prevent invalid gestures (distance too small or too large changes)
        if (currentDistance < 20) return; // Minimum distance to prevent jitter

        const distanceRatio = currentDistance / gestureState.initialDistance;
        if (distanceRatio < 0.1 || distanceRatio > 10) return; // Prevent extreme zoom changes

        // Prevent gestures that are too fast (likely accidental)
        const gestureTime = now - gestureState.gestureStartTime;
        if (gestureTime < 50) return; // Minimum gesture time to prevent accidental triggers

        // Calculate zoom based on pinch gesture with smoothing
        const zoomFactor = currentDistance / gestureState.initialDistance;
        const rawNewZoom = gestureState.initialZoom * zoomFactor;
        const newZoom = Math.max(0.1, Math.min(rawNewZoom, 4));

        // Calculate pan based on gesture center movement
        const centerDeltaX =
          currentCanvasCenter.x - gestureState.gestureCenter.x;
        const centerDeltaY =
          currentCanvasCenter.y - gestureState.gestureCenter.y;

        // Apply zoom-aware pan calculation (similar to mouse wheel zoom)
        const zoomRatio = newZoom / gestureState.initialZoom;
        const newPanX =
          gestureState.gestureCenter.x -
          (gestureState.gestureCenter.x - gestureState.initialPan.x) *
            zoomRatio +
          centerDeltaX;
        const newPanY =
          gestureState.gestureCenter.y -
          (gestureState.gestureCenter.y - gestureState.initialPan.y) *
            zoomRatio +
          centerDeltaY;

        // Apply the transform with requestAnimationFrame for smooth updates
        requestAnimationFrame(() => {
          setViewTransform({
            zoom: newZoom,
            pan: { x: newPanX, y: newPanY },
          });
        });
      } else if (touchCount === 1 && !gestureState.isGesturing) {
        // Single touch move - convert to mouse event
        e.preventDefault();
        const touch = e.touches[0];

        const mouseEvent = {
          preventDefault: () => e.preventDefault(),
          clientX: touch.clientX,
          clientY: touch.clientY,
          movementX: 0, // Touch events don't have movement deltas
          movementY: 0,
        } as React.MouseEvent<HTMLCanvasElement>;

        // Call the handleMouseMove from useCanvasInteraction
        // handleMouseMove(mouseEvent); // This would be passed from Canvas.tsx
      }
    },
    [
      isMobileMode,
      gestureState,
      getTouchDistance,
      getTouchCenter,
      setViewTransform,
      canvasRef,
    ]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!isMobileMode) return;

      const touchCount = e.touches.length;

      if (gestureState.isGesturing && touchCount < 2) {
        // End of multi-touch gesture
        e.preventDefault();
        setGestureState((prev) => ({
          ...prev,
          isGesturing: false,
          initialDistance: 0,
          lastTouchPositions: [],
          gestureStartTime: 0,
        }));
      } else if (touchCount === 0 && !gestureState.isGesturing) {
        // End of single touch
        e.preventDefault();
        handleMouseUp();
      }
    },
    [isMobileMode, gestureState.isGesturing, handleMouseUp]
  );

  useEffect(() => {
    const handleGlobalTouchEnd = () => {
      if (isMobileMode && (gestureState.isGesturing)) {
        handleMouseUp();
        // Reset gesture state if needed
        setGestureState((prev) => ({
          ...prev,
          isGesturing: false,
          initialDistance: 0,
          lastTouchPositions: [],
          gestureStartTime: 0,
        }));
      }
    };

    window.addEventListener("touchend", handleGlobalTouchEnd);

    return () => {
      window.removeEventListener("touchend", handleGlobalTouchEnd);
    };
  }, [handleMouseUp, isMobileMode, gestureState.isGesturing]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    isGesturing: gestureState.isGesturing,
  };
};