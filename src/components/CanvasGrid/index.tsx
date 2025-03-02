import React, { useState, useEffect } from 'react';
import { MeasurementUnit } from '@/types/shapes';
import GridLines from './GridLines';
import OriginIndicator from './OriginIndicator';
import GridDragHandler from './GridDragHandler';

interface CanvasGridProps {
  canvasSize: { width: number, height: number };
  pixelsPerCm: number;
  pixelsPerMm: number;
  measurementUnit?: MeasurementUnit;
  onMoveAllShapes?: (dx: number, dy: number) => void;
}

const CanvasGrid: React.FC<CanvasGridProps> = ({
  canvasSize,
  pixelsPerCm,
  pixelsPerMm,
  measurementUnit = 'cm',
  onMoveAllShapes
}) => {
  // State for the grid origin point
  const [origin, setOrigin] = useState({
    x: canvasSize.width / 2,
    y: canvasSize.height / 2
  });

  // Update origin when canvas size changes to keep it centered
  useEffect(() => {
    // Only update if the origin is at the default center position
    if (origin.x === canvasSize.width / 2 - 1 || origin.y === canvasSize.height / 2 - 1) {
      setOrigin({
        x: canvasSize.width / 2,
        y: canvasSize.height / 2
      });
    }
  }, [canvasSize, origin.x, origin.y]);

  return (
    <div 
      className="canvas-grid" 
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        pointerEvents: 'none', // Allow events to pass through to shapes underneath by default
        zIndex: 5 // Ensure grid is above shapes when interacting with it
      }}
    >
      <GridDragHandler
        origin={origin}
        onOriginChange={setOrigin}
        onMoveAllShapes={onMoveAllShapes}
        pixelsPerSmallUnit={pixelsPerMm}
      >
        <GridLines
          canvasSize={canvasSize}
          pixelsPerCm={pixelsPerCm}
          pixelsPerMm={pixelsPerMm}
          measurementUnit={measurementUnit}
          origin={origin}
        />
        <OriginIndicator
          origin={origin}
          canvasSize={canvasSize}
        />
      </GridDragHandler>
    </div>
  );
};

export default CanvasGrid; 