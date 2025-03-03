import React, { useCallback } from 'react';
import { createHandleMouseDown, createHandleMouseMove, createHandleMouseUp } from './CanvasEventHandlers';
import { GeometryCanvasProps } from './GeometryCanvas.types';
import { snapToGrid } from '../utils/snapToGrid';

const GeometryCanvas: React.FC<GeometryCanvasProps> = ({
  gridPosition,
  // ... rest of props
}) => {
  // ... existing code
  
  // Create event handlers with the grid position
  const handleMouseDown = createHandleMouseDown({
    // ... existing params
    gridPosition,
    // ... rest of params
  });
  
  const handleMouseMove = createHandleMouseMove({
    // ... existing params
    gridPosition,
    // ... rest of params
  });
  
  const handleMouseUp = createHandleMouseUp({
    // ... existing params
    gridPosition,
    // ... rest of params
  });
  
  // ... rest of the component
};

export default GeometryCanvas; 