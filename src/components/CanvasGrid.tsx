import React, { useEffect, useState, useCallback } from 'react';
import { MeasurementUnit } from '@/types/shapes';

interface CanvasGridProps {
  canvasSize: { width: number, height: number };
  pixelsPerCm: number;
  pixelsPerMm: number;
  measurementUnit: MeasurementUnit;
}

const CanvasGrid: React.FC<CanvasGridProps> = ({ canvasSize, pixelsPerCm, pixelsPerMm, measurementUnit }) => {
  // Default to 'cm' if measurementUnit is undefined
  const unit = measurementUnit || 'cm';
  
  // State to track the grid origin point (zero point)
  const [origin, setOrigin] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [isDraggingOrigin, setIsDraggingOrigin] = useState(false);
  
  // Add a larger buffer to ensure all grid lines are rendered completely
  const numHorizontalCmLines = Math.ceil(canvasSize.height / pixelsPerCm) + 5;
  const numVerticalCmLines = Math.ceil(canvasSize.width / pixelsPerCm) + 5;
  const cmGridLines = [];
  const mmGridLines = [];
  const cmLabels = [];

  // Define the text style to prevent selection - using correct TypeScript types
  const textStyle: React.CSSProperties = {
    userSelect: 'none' as const,
    pointerEvents: 'none'
  };

  // Calculate the range of grid lines needed based on the origin
  const minHorizontalLine = Math.floor(-origin.y / pixelsPerCm) - 2;
  const maxHorizontalLine = Math.ceil((canvasSize.height - origin.y) / pixelsPerCm) + 2;
  const minVerticalLine = Math.floor(-origin.x / pixelsPerCm) - 2;
  const maxVerticalLine = Math.ceil((canvasSize.width - origin.x) / pixelsPerCm) + 2;

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

  // Handle mouse events for dragging the origin
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Check if we're clicking near the origin
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Define a small area around the origin for easier selection
    const originRadius = 10;
    const distanceToOrigin = Math.sqrt(
      Math.pow(mouseX - origin.x, 2) + Math.pow(mouseY - origin.y, 2)
    );
    
    if (distanceToOrigin <= originRadius) {
      setIsDraggingOrigin(true);
      e.stopPropagation(); // Prevent other mouse handlers from firing
    }
  }, [origin]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDraggingOrigin) {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      setOrigin({
        x: mouseX,
        y: mouseY
      });
      
      e.stopPropagation(); // Prevent other mouse handlers from firing
    }
  }, [isDraggingOrigin]);

  const handleMouseUp = useCallback(() => {
    if (isDraggingOrigin) {
      setIsDraggingOrigin(false);
    }
  }, [isDraggingOrigin]);

  // Add global mouse up handler to ensure we stop dragging even if mouse is released outside the component
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDraggingOrigin(false);
    };
    
    if (isDraggingOrigin) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDraggingOrigin]);

  // Origin indicator (zero point)
  const originIndicator = (
    <g>
      {/* Crosshair at origin */}
      <circle 
        cx={origin.x} 
        cy={origin.y} 
        r="5" 
        fill="rgba(85, 91, 110, 0.3)" 
        stroke="#555B6E" 
        strokeWidth="1"
        style={{ cursor: 'move' }}
      />
      <text 
        x={origin.x + 8} 
        y={origin.y - 8} 
        fontSize="10" 
        fill="#555B6E"
        style={textStyle}
      >
        (0,0)
      </text>
    </g>
  );

  return (
    <svg 
      className="absolute inset-0" 
      width={canvasSize.width} 
      height={canvasSize.height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ pointerEvents: 'all' }}
    >
      {mmGridLines}
      {cmGridLines}
      {cmLabels}
      {originIndicator}
    </svg>
  );
};

export default CanvasGrid;
