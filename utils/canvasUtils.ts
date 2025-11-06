// utils/canvasUtils.ts

/**
 * Rotates a point around a center by a given angle.
 */
export const rotatePoint = (
  point: { x: number; y: number },
  center: { x: number; y: number },
  angle: number
) => {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: dx * cos - dy * sin + center.x,
    y: dx * sin + dy * cos + center.y,
  };
};

/**
 * Determines the appropriate CSS cursor style for a given resize handle and rotation.
 */
export const getCursorForHandle = (handle: string, rotation = 0) => {
  const angle = ((rotation % 360) + 360) % 360;
  const getRotatedCursor = (cursors: string[]) => {
    const index = Math.round(angle / 45) % 8;
    return cursors[index];
  };

  switch (handle) {
    case "tl":
    case "br":
      return getRotatedCursor([
        "nwse-resize",
        "ns-resize",
        "nesw-resize",
        "ew-resize",
        "nwse-resize",
        "ns-resize",
        "nesw-resize",
        "ew-resize",
      ]);
    case "tr":
    case "bl":
      return getRotatedCursor([
        "nesw-resize",
        "ew-resize",
        "nwse-resize",
        "ns-resize",
        "nesw-resize",
        "ew-resize",
        "nwse-resize",
        "ns-resize",
      ]);
    case "tm":
    case "bm":
      return getRotatedCursor([
        "ns-resize",
        "nesw-resize",
        "ew-resize",
        "nwse-resize",
        "ns-resize",
        "nesw-resize",
        "ew-resize",
        "nwse-resize",
      ]);
    case "ml":
    case "mr":
      return getRotatedCursor([
        "ew-resize",
        "nwse-resize",
        "ns-resize",
        "nesw-resize",
        "ew-resize",
        "nwse-resize",
        "ns-resize",
        "nesw-resize",
      ]);
    case "rot":
      return "crosshair";
    default:
      return "move";
  }
};