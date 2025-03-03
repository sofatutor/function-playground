import React from 'react';
import { MeasurementUnit } from '@/types/shapes';
import ResponsiveGrid from './CanvasGrid/ResponsiveGrid';

interface CanvasGridProps {
  canvasSize: { width: number, height: number };
  pixelsPerCm: number;
  pixelsPerMm: number;
  measurementUnit: MeasurementUnit;
}

const CanvasGrid: React.FC<CanvasGridProps> = ({ 
  canvasSize, 
  pixelsPerCm, 
  pixelsPerMm, 
  measurementUnit 
}) => {
  console.log('CanvasGrid received props:', { canvasSize, pixelsPerCm, pixelsPerMm, measurementUnit });
  
  return (
    <svg className="absolute inset-0 pointer-events-none" width={canvasSize.width} height={canvasSize.height}>
      <ResponsiveGrid
        canvasSize={canvasSize}
        pixelsPerCm={pixelsPerCm}
        pixelsPerMm={pixelsPerMm}
        measurementUnit={measurementUnit}
      />
    </svg>
  );
};

export default CanvasGrid;
