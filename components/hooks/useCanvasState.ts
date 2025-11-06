// components/hooks/useCanvasState.ts
import { useState, useCallback } from 'react';
import { WireframeComponent } from '../../library/types';

type Action = "none" | "drawing" | "moving" | "resizing" | "rotating" | "panning";
type ResizeHandle = "tl" | "tm" | "tr" | "ml" | "mr" | "bl" | "bm" | "br";

export const useCanvasState = () => {
  const [action, setAction] = useState<Action>("none");
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [moveOffsets, setMoveOffsets] = useState<Map<string, { dx: number; dy: number }>>(new Map());
  const [activeResizeHandle, setActiveResizeHandle] = useState<ResizeHandle | "rot" | null>(null);
  const [originalComponents, setOriginalComponents] = useState<Map<string, WireframeComponent>>(new Map());
  const [cursor, setCursor] = useState("default");

  const resetInteractionState = useCallback(() => {
    setAction("none");
    setStartPoint(null);
    setActiveResizeHandle(null);
    setOriginalComponents(new Map());
    setMoveOffsets(new Map());
  }, []);

  return {
    action,
    setAction,
    startPoint,
    setStartPoint,
    moveOffsets,
    setMoveOffsets,
    activeResizeHandle,
    setActiveResizeHandle,
    originalComponents,
    setOriginalComponents,
    cursor,
    setCursor,
    resetInteractionState,
  };
};