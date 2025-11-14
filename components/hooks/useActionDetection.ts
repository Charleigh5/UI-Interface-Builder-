import { useCallback } from 'react';
import { WireframeComponent } from '../../library/types';
import { rotatePoint } from '../../utils/canvasUtils';

type ResizeHandle = 'tl' | 'tm' | 'tr' | 'ml' | 'mr' | 'bl' | 'bm' | 'br';

interface UseActionDetectionProps {
  components: WireframeComponent[];
  selectedComponentIds: string[];
  isMobile: boolean;
  getHandleSize: () => number;
  getRotationHandleOffset: () => number;
  getTouchArea: () => number;
  zoom: number;
}

interface ActionUnderCursor {
  action: 'moving' | 'resizing' | 'rotating' | 'panning' | 'drawing' | 'none';
  componentId?: string;
  handle?: ResizeHandle | 'rot';
}

export const useActionDetection = ({
  components,
  selectedComponentIds,
  isMobile,
  getHandleSize,
  getRotationHandleOffset,
  getTouchArea,
  zoom,
}: UseActionDetectionProps) => {
  const getActionUnderCursor = useCallback(
    (world: { x: number; y: number }): ActionUnderCursor | null => {
      const reversed = [...components].reverse();
      for (const c of reversed) {
        if (!selectedComponentIds.includes(c.id)) continue;
        if (c.isLocked) continue;

        const { x, y, width, height, rotation = 0 } = c;
        const cx = x + width / 2;
        const cy = y + height / 2;
        const p = rotatePoint(world, { x: cx, y: cy }, -rotation);

        const hs = getHandleSize();
        const touchArea = getTouchArea();
        const hsTouch = isMobile ? touchArea : hs;
        const offset = (hsTouch - hs) / 2;
        const rotOffset = getRotationHandleOffset();

        const checks: { name: ResizeHandle | 'rot'; x: number; y: number; w: number; h: number }[] = [
          { name: 'tl', x: x - offset, y: y - offset, w: hsTouch, h: hsTouch },
          { name: 'tr', x: x + width - hs - offset, y: y - offset, w: hsTouch, h: hsTouch },
          { name: 'bl', x: x - offset, y: y + height - hs - offset, w: hsTouch, h: hsTouch },
          { name: 'br', x: x + width - hs - offset, y: y + height - hs - offset, w: hsTouch, h: hsTouch },
          { name: 'tm', x: x + width / 2 - hsTouch / 2, y: y - offset, w: hsTouch, h: hsTouch },
          { name: 'bm', x: x + width / 2 - hsTouch / 2, y: y + height - hs - offset, w: hsTouch, h: hsTouch },
          { name: 'ml', x: x - offset, y: y + height / 2 - hsTouch / 2, w: hsTouch, h: hsTouch },
          { name: 'mr', x: x + width - hs - offset, y: y + height / 2 - hsTouch / 2, w: hsTouch, h: hsTouch },
          { name: 'rot', x: x + width / 2 - hsTouch / 2, y: y - rotOffset - offset, w: hsTouch, h: hsTouch },
        ];

        for (const h of checks) {
          if (p.x >= h.x && p.x <= h.x + h.w && p.y >= h.y && p.y <= h.y + h.h) {
            return { action: h.name === 'rot' ? 'rotating' : 'resizing', componentId: c.id, handle: h.name };
          }
        }
      }

      // Hit test for moving
      for (const c of reversed) {
        const { x, y, width, height, rotation = 0 } = c;
        const cx = x + width / 2;
        const cy = y + height / 2;
        const p = rotatePoint(world, { x: cx, y: cy }, -rotation);
        if (p.x >= x && p.x <= x + width && p.y >= y && p.y <= y + height) {
          return { action: 'moving', componentId: c.id };
        }
      }

      return null;
    },
    [components, selectedComponentIds, isMobile, getHandleSize, getTouchArea, getRotationHandleOffset, zoom]
  );

  return { getActionUnderCursor };
};