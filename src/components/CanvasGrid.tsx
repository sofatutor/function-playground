
import React from 'react';
import { MeasurementUnit } from '@/types/shapes';

interface CanvasGridProps {
  canvasSize: { width: number, height: number };
  pixelsPerCm: number;
  pixelsPerMm: number;
  measurementUnit: MeasurementUnit;
}

const CanvasGrid: React.FC<CanvasGridProps> = ({ canvasSize, pixelsPerCm, pixelsPerMm, measurementUnit }) => {
  console.log('CanvasGrid received props:', { canvasSize, pixelsPerCm, pixelsPerMm, measurementUnit });
  
  // Default to 'cm' if measurementUnit is undefined
  const unit = measurementUnit || 'cm';
  
  const numHorizontalCmLines = Math.ceil(canvasSize.height / pixelsPerCm) + 1;
  const numVerticalCmLines = Math.ceil(canvasSize.width / pixelsPerCm) + 1;
  const cmGridLines = [];
  const mmGridLines = [];
  const cmLabels = [];

  // Define the text style to prevent selection - using correct TypeScript types
  const textStyle: React.CSSProperties = {
    userSelect: 'none' as const,
    pointerEvents: 'none'
  };

  // Horizontal centimeter and millimeter lines
  for (let i = 0; i < numHorizontalCmLines; i++) {
    const yPosition = i * pixelsPerCm;
    cmGridLines.push(
      <line 
        key={`h-cm-${i}`} 
        x1="0" 
        y1={yPosition} 
        x2={canvasSize.width} 
        y2={yPosition} 
        stroke="#555B6E" 
        strokeWidth="0.5" 
      />
    );
    if (i < numHorizontalCmLines - 1) {
      for (let j = 1; j < 10; j++) {
        const mmY = yPosition + j * pixelsPerMm;
        mmGridLines.push(
          <line 
            key={`h-mm-${i}-${j}`} 
            x1="0" 
            y1={mmY} 
            x2={canvasSize.width} 
            y2={mmY} 
            stroke="#555B6E" 
            strokeWidth="0.2" 
            strokeOpacity="0.5"
          />
        );
      }
    }
    cmLabels.push(
      <text 
        key={`h-label-${i}`} 
        x="2" 
        y={yPosition - 2} 
        fontSize="8" 
        fill="#555B6E"
        style={textStyle}
      >
        {i} {unit}
      </text>
    );
  }

  // Vertical centimeter and millimeter lines
  for (let i = 0; i < numVerticalCmLines; i++) {
    const xPosition = i * pixelsPerCm;
    cmGridLines.push(
      <line 
        key={`v-cm-${i}`} 
        x1={xPosition} 
        y1="0" 
        x2={xPosition} 
        y2={canvasSize.height} 
        stroke="#555B6E" 
        strokeWidth="0.5" 
      />
    );
    if (i < numVerticalCmLines - 1) {
      for (let j = 1; j < 10; j++) {
        const mmX = xPosition + j * pixelsPerMm;
        mmGridLines.push(
          <line 
            key={`v-mm-${i}-${j}`} 
            x1={mmX} 
            y1="0" 
            x2={mmX} 
            y2={canvasSize.height} 
            stroke="#555B6E" 
            strokeWidth="0.2" 
            strokeOpacity="0.5"
          />
        );
      }
    }
    cmLabels.push(
      <text 
        key={`v-label-${i}`} 
        x={xPosition + 2} 
        y="10" 
        fontSize="8" 
        fill="#555B6E"
        style={textStyle}
      >
        {i} {unit}
      </text>
    );
  }

  return (
    <svg className="absolute inset-0 pointer-events-none" width={canvasSize.width} height={canvasSize.height}>
      {mmGridLines}
      {cmGridLines}
      {cmLabels}
    </svg>
  );
};

export default CanvasGrid;
