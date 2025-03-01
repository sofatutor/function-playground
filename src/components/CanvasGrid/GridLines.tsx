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

  // Calculate the range of grid lines needed based on the origin
  const minHorizontalLine = Math.floor(-origin.y / pixelsPerCm) - 2;
  const maxHorizontalLine = Math.ceil((canvasSize.height - origin.y) / pixelsPerCm) + 2;
  const minVerticalLine = Math.floor(-origin.x / pixelsPerCm) - 2;
  const maxVerticalLine = Math.ceil((canvasSize.width - origin.x) / pixelsPerCm) + 2;

  const cmGridLines = [];
  const mmGridLines = [];
  const cmLabels = [];

  // Horizontal centimeter and millimeter lines
  for (let i = minHorizontalLine; i <= maxHorizontalLine; i++) {
    const yPosition = origin.y + i * pixelsPerCm;
    cmGridLines.push(
      <line 
        key={`h-cm-${i}`} 
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
      for (let j = 1; j < 10; j++) {
        const mmY = yPosition + j * pixelsPerMm;
        if (mmY >= 0 && mmY <= canvasSize.height) {
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
    }
    if (yPosition >= 0 && yPosition <= canvasSize.height) {
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
  }

  // Vertical centimeter and millimeter lines
  for (let i = minVerticalLine; i <= maxVerticalLine; i++) {
    const xPosition = origin.x + i * pixelsPerCm;
    cmGridLines.push(
      <line 
        key={`v-cm-${i}`} 
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
      for (let j = 1; j < 10; j++) {
        const mmX = xPosition + j * pixelsPerMm;
        if (mmX >= 0 && mmX <= canvasSize.width) {
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
    }
    if (xPosition >= 0 && xPosition <= canvasSize.width) {
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
  }

  return (
    <>
      {mmGridLines}
      {cmGridLines}
      {cmLabels}
    </>
  );
};

export default GridLines; 