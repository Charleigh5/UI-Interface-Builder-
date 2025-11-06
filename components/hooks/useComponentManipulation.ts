// components/hooks/useComponentManipulation.ts
import { useCallback } from 'react';
import { WireframeComponent } from '../../library/types';
import { getComponentLabel, getDefaultProperties } from '../../utils/componentUtils';

interface UseComponentManipulationProps {
  addComponent: (component: Omit<WireframeComponent, 'id'>) => WireframeComponent;
  selectComponent: (id: string | null, multiSelect: boolean) => void;
  triggerHapticFeedback: (type?: "light" | "medium" | "heavy" | "selection" | "impact") => void;
  currentShape: Omit<WireframeComponent, "id" | "label"> | null;
  setCurrentShape: React.Dispatch<React.SetStateAction<Omit<WireframeComponent, "id" | "label"> | null>>;
  setDrawnPaths: React.Dispatch<React.SetStateAction<{ x: number; y: number }[][]>>;
  addDrawingPoint: (point: { x: number; y: number }) => void;
}

export const useComponentManipulation = ({
  addComponent,
  selectComponent,
  triggerHapticFeedback,
  currentShape,
  setCurrentShape,
  setDrawnPaths,
  addDrawingPoint,
}: UseComponentManipulationProps) => {
  const startDrawing = useCallback((worldCoords: { x: number; y: number }, toolType: string, theme: string) => {
    if (toolType === "pen") {
      setDrawnPaths((paths) => [...paths, [worldCoords]]);
      triggerHapticFeedback("light");
    } else if (toolType !== "erase") {
      setCurrentShape({
        type: toolType as any,
        x: worldCoords.x,
        y: worldCoords.y,
        width: 0,
        height: 0,
        properties: getDefaultProperties(toolType as any, theme as any),
      });
    }
  }, [setDrawnPaths, setCurrentShape, triggerHapticFeedback, addDrawingPoint]);

  const finalizeDrawing = useCallback((worldCoords: { x: number; y: number }) => {
    if (currentShape) {
      const { x, y, width, height, type, properties } = currentShape;
      const finalShape = {
        type,
        properties,
        x: width < 0 ? x + width : x,
        y: height < 0 ? y + height : y,
        width: Math.abs(width),
        height: Math.abs(height),
        label: getComponentLabel(type as any),
      };
      
      if (finalShape.width > 5 && finalShape.height > 5) {
        const newComponent = addComponent(finalShape);
        selectComponent(newComponent.id, false);
        triggerHapticFeedback("impact");
      }
    }
  }, [currentShape, addComponent, selectComponent, triggerHapticFeedback]);

  return { startDrawing, finalizeDrawing };
};