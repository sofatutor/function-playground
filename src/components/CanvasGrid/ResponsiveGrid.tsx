import React, { useEffect, useState } from 'react';
import { MeasurementUnit } from '@/types/shapes';
import GridLines from './GridLines';

interface ResponsiveGridProps {
  canvasSize: { width: number, height: number };
  pixelsPerCm: number;
  pixelsPerMm: number;
  measurementUnit: MeasurementUnit;
  origin?: { x: number, y: number };
}

const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({ 
  canvasSize, 
  pixelsPerCm, 
  pixelsPerMm, 
  measurementUnit,
  origin: propOrigin
}) => {
  // Default origin to center of canvas if not provided
  const [origin, setOrigin] = useState(propOrigin || {
    x: canvasSize.width / 2,
    y: canvasSize.height / 2
  });

  // Update origin when canvas size changes (e.g., fullscreen)
  useEffect(() => {
    if (!propOrigin) {
      setOrigin({
        x: canvasSize.width / 2,
        y: canvasSize.height / 2
      });
    }
  }, [canvasSize.width, canvasSize.height, propOrigin]);

  return (
    <GridLines
      canvasSize={canvasSize}
      pixelsPerCm={pixelsPerCm}
      pixelsPerMm={pixelsPerMm}
      measurementUnit={measurementUnit}
      origin={propOrigin || origin}
    />
  );
};

export default ResponsiveGrid; 