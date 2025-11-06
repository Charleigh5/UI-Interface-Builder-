// components/hooks/useHandleCalculations.ts
import { useMemo } from 'react';

// Desktop handle sizes
const HANDLE_SIZE = 8;
const ROTATION_HANDLE_OFFSET = 25;

// Mobile-optimized handle sizes (minimum 44px touch targets)
const MOBILE_HANDLE_SIZE = 16;
const MOBILE_ROTATION_HANDLE_OFFSET = 35;
const MOBILE_MIN_TOUCH_TARGET = 44;

export const useHandleCalculations = (isMobileMode: boolean, zoom: number) => {
  const getHandleSize = useMemo(() => {
    return () => {
      const baseSize = isMobileMode ? MOBILE_HANDLE_SIZE : HANDLE_SIZE;
      const scaledSize = baseSize / zoom;

      // Ensure minimum 44px touch target in mobile mode
      if (isMobileMode) {
        const minTouchTarget = MOBILE_MIN_TOUCH_TARGET / zoom;
        return Math.max(scaledSize, minTouchTarget);
      }

      return scaledSize;
    };
  }, [isMobileMode, zoom]);

  const getRotationHandleOffset = useMemo(() => {
    return () => {
      const baseOffset = isMobileMode
        ? MOBILE_ROTATION_HANDLE_OFFSET
        : ROTATION_HANDLE_OFFSET;
      return baseOffset / zoom;
    };
  }, [isMobileMode, zoom]);

  const getTouchArea = useMemo(() => {
    return () => {
      if (!isMobileMode) return getHandleSize();

      const minTouchArea = MOBILE_MIN_TOUCH_TARGET / zoom;
      const visualHandle = MOBILE_HANDLE_SIZE / zoom;

      // Touch area should be at least 44px but can be larger than visual handle
      return Math.max(minTouchArea, visualHandle * 1.5);
    };
  }, [isMobileMode, zoom, getHandleSize]);

  return { getHandleSize, getRotationHandleOffset, getTouchArea };
};