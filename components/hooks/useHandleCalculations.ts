import { useMemo } from 'react';

export const useHandleCalculations = (isMobile: boolean, zoom: number) => {
  // Base visual size
  const HANDLE_SIZE = isMobile ? 16 : 8;
  const ROT_OFFSET = isMobile ? 35 : 25;
  const MIN_TOUCH = 44; // dp

  const getHandleSize = useMemo(() => () => {
    const visual = HANDLE_SIZE / zoom;
    return Math.max(visual, MIN_TOUCH / zoom);
  }, [zoom, isMobile]);

  const getRotationOffset = useMemo(() () => ROT_OFFSET / zoom, [zoom, isMobile]);

  const getTouchArea = useMemo(() => () => {
    if (!isMobile) return getHandleSize();
    // Touch target must be at least 44dp, visual can be smaller
    return Math.max(MIN_TOUCH / zoom, HANDLE_SIZE / zoom * 1.5);
  }, [isMobile, zoom, getHandleSize]);

  return { getHandleSize, getRotationOffset, getTouchArea };
};