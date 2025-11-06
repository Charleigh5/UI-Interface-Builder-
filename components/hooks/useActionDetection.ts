// components/hooks/useActionDetection.ts
import { useCallback } from 'react';
import { WireframeComponent } from '../../library/types';
import { rotatePoint } from '../../utils/canvasUtils';

type ResizeHandle = "tl" | "tm" | "tr" | "ml" | "mr" | "bl" | "bm" | "br";

interface UseActionDetectionProps {
  components: WireframeComponent[];
  selectedComponentIds: string[];
  isMobileMode: boolean;
  getHandleSize: () => number;
  getRotationHandleOffset: () => number;
  getTouchArea: () => number;
  zoom: number;
}

interface ActionUnderCursor {
  action: "moving" | "resizing" | "rotating" | "panning" | "drawing" | "none";
  componentId?: string;
  handle?: ResizeHandle | "rot";
}

export const useActionDetection = ({
  components,
  selectedComponentIds,
  isMobileMode,
  getHandleSize,
  getRotationHandleOffset,
  getTouchArea,
  zoom,
}: UseActionDetectionProps) => {
  const getActionUnderCursor = useCallback(
    (worldCoords: { x: number; y: number }): ActionUnderCursor | null => {
      const reversedComponents = [...components].reverse();
      for (const c of reversedComponents) {
        if (!selectedComponentIds.includes(c.id)) continue;
        if (c.isLocked) continue;

        const { x, y, width, height, rotation = 0 } = c;
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const p = rotatePoint(worldCoords, { x: centerX, y: centerY }, -rotation);

        // Use mobile-aware handle sizes and touch areas for better interaction
        const hs = getHandleSize();
        const touchArea = getTouchArea();
        const scaledRotationOffset = getRotationHandleOffset();

        // Use enhanced touch areas for mobile interaction while keeping visual handles smaller
        const touchAreaSize = isMobileMode ? touchArea : hs;
        const touchOffset = (touchAreaSize - hs) / 2;

        const handleChecks: {
          name: ResizeHandle | "rot";
          x: number;
          y: number;
          w: number;
          h: number;
        }[] = [
          {
            name: "tl",
            x: x - touchOffset,
            y: y - touchOffset,
            w: touchAreaSize,
            h: touchAreaSize,
          },
          {
            name: "tr",
            x: x + width - hs - touchOffset,
            y: y - touchOffset,
            w: touchAreaSize,
            h: touchAreaSize,
          },
          {
            name: "bl",
            x: x - touchOffset,
            y: y + height - hs - touchOffset,
            w: touchAreaSize,
            h: touchAreaSize,
          },
          {
            name: "br",
            x: x + width - hs - touchOffset,
            y: y + height - hs - touchOffset,
            w: touchAreaSize,
            h: touchAreaSize,
          },
          {
            name: "tm",
            x: x + width / 2 - touchAreaSize / 2,
            y: y - touchOffset,
            w: touchAreaSize,
            h: touchAreaSize,
          },
          {
            name: "bm",
            x: x + width / 2 - touchAreaSize / 2,
            y: y + height - hs - touchOffset,
            w: touchAreaSize,
            h: touchAreaSize,
          },
          {
            name: "ml",
            x: x - touchOffset,
            y: y + height / 2 - touchAreaSize / 2,
            w: touchAreaSize,
            h: touchAreaSize,
          },
          {
            name: "mr",
            x: x + width - hs - touchOffset,
            y: y + height / 2 - touchAreaSize / 2,
            w: touchAreaSize,
            h: touchAreaSize,
          },
          {
            name: "rot",
            x: x + width / 2 - touchAreaSize / 2,
            y: y - scaledRotationOffset - touchOffset,
            w: touchAreaSize,
            h: touchAreaSize,
          },
        ];

        for (const handle of handleChecks) {
          // Use the handle's actual position and size for detection
          if (
            p.x >= handle.x &&
            p.x <= handle.x + handle.w &&
            p.y >= handle.y &&
            p.y <= handle.y + handle.w
          ) {
            return {
              action: handle.name === "rot" ? "rotating" : "resizing",
              componentId: c.id,
              handle: handle.name,
            };
          }
        }
      }

      for (const c of reversedComponents) {
        const { x, y, width, height, rotation = 0 } = c;
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const p = rotatePoint(worldCoords, { x: centerX, y: centerY }, -rotation);
        if (p.x >= x && p.x <= x + width && p.y >= y && p.y <= y + height) {
          return { action: "moving", componentId: c.id };
        }
      }
      return null;
    },
    [components, selectedComponentIds, isMobileMode, getHandleSize, getTouchArea, getRotationHandleOffset, zoom]
  );

  return { getActionUnderCursor };
};