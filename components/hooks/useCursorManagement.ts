import React, { useEffect } from 'react';

interface UseCursorManagementProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  cursor: string;
}

export const useCursorManagement = ({ canvasRef, cursor }: UseCursorManagementProps) => {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = cursor;
    }
  }, [cursor, canvasRef]);
};