import React, { useState } from 'react';
import { MeasurementUnit } from '@/types/shapes';
import GridLines from './GridLines';
import OriginIndicator from './OriginIndicator';
import GridDragHandler from './GridDragHandler';

interface CanvasGridProps {
  canvasSize: { width: number, height: number };
  pixelsPerCm: number;
  pixelsPerMm: number;
  measurementUnit?: MeasurementUnit;
}

const CanvasGrid: React.FC<CanvasGridProps> = ({
  canvasSize,
  pixelsPerCm,
  pixelsPerMm,
  measurementUnit = 'cm'
}) => {
  // State for the grid origin point
  const [origin, setOrigin] = useState({
    x: canvasSize.width / 2,
    y: canvasSize.height / 2
  });

  return (
    <div 
      className="canvas-grid" 
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        pointerEvents: 'none', // Allow events to pass through to shapes underneath
        zIndex: 0 // Changed from -1 to 0 to ensure grid is visible but still below shapes
      }}
    >
      <GridDragHandler
        origin={origin}
        onOriginChange={setOrigin}
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