import React, { useCallback } from 'react';

interface UseDragAndDropProps {
  addLibraryComponent: (name: string, position: { x: number; y: number }) => void;
  screenToWorld: (screenCoords: { x: number; y: number }) => { x: number; y: number };
}

export const useDragAndDrop = ({ addLibraryComponent, screenToWorld }: UseDragAndDropProps) => {
  const handleDragOver = useCallback((e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const itemName = e.dataTransfer.getData('library-item-name');
      if (itemName) {
        const screenCoords = { x: e.clientX, y: e.clientY };
        const worldCoords = screenToWorld(screenCoords);
        addLibraryComponent(itemName, worldCoords);
      }
    },
    [screenToWorld, addLibraryComponent]
  );

  return { handleDragOver, handleDrop };
};