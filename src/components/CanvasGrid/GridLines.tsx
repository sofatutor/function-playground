import React from 'react';
import { MeasurementUnit } from '@/types/shapes';

interface GridLinesProps {
  canvasSize: { width: number, height: number };
  pixelsPerCm: number;
  pixelsPerMm: number;
  measurementUnit: MeasurementUnit;
  origin: { x: number, y: number };
}

const GridLines: React.FC<GridLinesProps> = ({ 
  canvasSize, 
  pixelsPerCm, 
  pixelsPerMm, 
  measurementUnit, 
  origin 
}) => {
  // Default to 'cm' if measurementUnit is undefined
  const unit = measurementUnit || 'cm';
  
  // Define the text style to prevent selection
  const textStyle: React.CSSProperties = {
    userSelect: 'none' as const,
    pointerEvents: 'none'
  };

  // Use the appropriate pixel ratio based on the measurement unit
  const pixelsPerUnit = pixelsPerCm;
  const pixelsPerSmallUnit = pixelsPerMm;

  // Add more buffer to ensure all grid lines are rendered in fullscreen
  // Calculate the range of grid lines needed based on the origin
  const minHorizontalLine = Math.floor(-origin.y / pixelsPerUnit) - 20;
  const maxHorizontalLine = Math.ceil((canvasSize.height - origin.y) / pixelsPerUnit) + 20;
  const minVerticalLine = Math.floor(-origin.x / pixelsPerUnit) - 20;
  const maxVerticalLine = Math.ceil((canvasSize.width - origin.x) / pixelsPerUnit) + 20;

  const majorGridLines = [];
  const minorGridLines = [];
  const gridLabels = [];

  // Horizontal major and minor lines
  for (let i = minHorizontalLine; i <= maxHorizontalLine; i++) {
    const yPosition = origin.y + i * pixelsPerUnit;
    majorGridLines.push(
      <line 
        key={`h-major-${i}`} 
        x1="0" 
        y1={yPosition} 
        x2={canvasSize.width} 
        y2={yPosition} 
        stroke="#555B6E" 
        strokeWidth={i === 0 ? "1" : "0.5"} 
        strokeOpacity={i === 0 ? "1" : "0.8"}
      />
    );
    if (i < maxHorizontalLine) {
      // Draw 9 minor lines between major lines (for cm: mm lines, for inches: 1/10th inch lines)
      for (let j = 1; j < 10; j++) {
        const minorY = yPosition + j * pixelsPerSmallUnit;
        if (minorY >= 0 && minorY <= canvasSize.height) {
          minorGridLines.push(
            <line 
              key={`h-minor-${i}-${j}`} 
              x1="0" 
              y1={minorY} 
              x2={canvasSize.width} 
              y2={minorY} 
              stroke="#555B6E" 
              strokeWidth="0.2" 
              strokeOpacity="0.5"
            />
          );
        }
      }
    }
    if (yPosition >= 0 && yPosition <= canvasSize.height) {
      // Invert the y-axis label value to follow standard Cartesian coordinates
      // In Cartesian coordinates, y increases upward, so we negate the value
      const yLabelValue = -i;
      
      // Only show labels for non-zero values or the origin (0,0)
      if (i !== 0 || Math.abs(origin.x - canvasSize.width / 2) > 50) {
        gridLabels.push(
          <text 
            key={`h-label-${i}`} 
            x="2" 
            y={yPosition - 2} 
            fontSize="8" 
            fill="#555B6E"
            style={textStyle}
          >
            {yLabelValue} {unit}
          </text>
        );
      }
    }
  }

  // Vertical major and minor lines
  for (let i = minVerticalLine; i <= maxVerticalLine; i++) {
    const xPosition = origin.x + i * pixelsPerUnit;
    majorGridLines.push(
      <line 
        key={`v-major-${i}`} 
        x1={xPosition} 
        y1="0" 
        x2={xPosition} 
        y2={canvasSize.height} 
        stroke="#555B6E" 
        strokeWidth={i === 0 ? "1" : "0.5"} 
        strokeOpacity={i === 0 ? "1" : "0.8"}
      />
    );
    if (i < maxVerticalLine) {
      // Draw 9 minor lines between major lines
      for (let j = 1; j < 10; j++) {
        const minorX = xPosition + j * pixelsPerSmallUnit;
        if (minorX >= 0 && minorX <= canvasSize.width) {
          minorGridLines.push(
            <line 
              key={`v-minor-${i}-${j}`} 
              x1={minorX} 
              y1="0" 
              x2={minorX} 
              y2={canvasSize.height} 
              stroke="#555B6E" 
              strokeWidth="0.2" 
              strokeOpacity="0.5"
            />
          );
        }
      }
    }
    if (xPosition >= 0 && xPosition <= canvasSize.width) {
      // Only show labels for non-zero values or the origin (0,0)
      if (i !== 0 || Math.abs(origin.y - canvasSize.height / 2) > 50) {
        gridLabels.push(
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
    }
  }
  
  // Add a special label for the origin (0,0) if it's visible
  if (
    origin.x >= 0 && 
    origin.x <= canvasSize.width && 
    origin.y >= 0 && 
    origin.y <= canvasSize.height
  ) {
    // We've moved the origin label to the OriginIndicator component
    // So we don't need to add it here anymore
    // This prevents duplicate labels
  }

  return (
    <>
      {minorGridLines}
      {majorGridLines}
      {gridLabels}
    </>
  );
};

export default GridLines; 