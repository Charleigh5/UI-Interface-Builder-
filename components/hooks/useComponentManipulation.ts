import React, { useCallback } from 'react';
import { WireframeComponent } from '../../library/types';
import { getComponentLabel, getDefaultProperties } from '../../utils/componentUtils';

interface UseComponentManipulationProps {
  addComponent: (component: Omit<WireframeComponent, 'id'>) => WireframeComponent;
  selectComponent: (id: string | null, multiSelect: boolean) => void;
  triggerHapticFeedback: (
    type?: 'light' | 'medium' | 'heavy' | 'selection' | 'impact'
  ) => void;
  currentShape: Omit<WireframeComponent, 'id' | 'label'> | null;
  setCurrentShape: React.Dispatch<
    React.SetStateAction<Omit<WireframeComponent, 'id' | 'label'> | null>
  >;
  setDrawnPaths: React.Dispatch<
    React.SetStateAction<{ x: number; y: number }[][]>
  >;
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
  const startDrawing = useCallback(
    (world: { x: number; y: number }, tool: string, theme: string) => {
      if (tool === 'pen') {
        setDrawnPaths(paths => [...paths, [world]]);
        triggerHapticFeedback('light');
      } else if (tool !== 'erase') {
        setCurrentShape({
          type: tool as WireframeComponent['type'],
          x: world.x,
          y: world.y,
          width: 0,
          height: 0,
          properties: getDefaultProperties(tool as any, theme as any),
        });
      }
    },
    [setDrawnPaths, setCurrentShape, triggerHapticFeedback]
  );

  const finalizeDrawing = useCallback(
    (world: { x: number; y: number }) => {
      if (currentShape) {
        const { x, y, width, height, type, properties } = currentShape;
        const finalWidth = Math.abs(width);
        const finalHeight = Math.abs(height);
        if (finalWidth < 4 || finalHeight < 4) {
          setCurrentShape(null);
          return;
        }

        const newComponent = addComponent({
          type,
          x: width < 0 ? x + width : x,
          y: height < 0 ? y + height : y,
          width: finalWidth,
          height: finalHeight,
          label: getComponentLabel(type),
          properties,
        });

        selectComponent(newComponent.id, false);
        triggerHapticFeedback('impact');
        setCurrentShape(null);
      }
    },
    [currentShape, addComponent, selectComponent, triggerHapticFeedback, setCurrentShape]
  );

  return { startDrawing, finalizeDrawing };
};