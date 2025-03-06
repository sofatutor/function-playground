import React from 'react';
import { Point, ShapeType } from '@/types/shapes';

interface PreviewShapeProps {
  isDrawing: boolean;
  drawStart: Point | null;
  drawCurrent: Point | null;
  activeShapeType: ShapeType;
  snapToGrid?: boolean;
  pixelsPerSmallUnit?: number;
}

const PreviewShape: React.FC<PreviewShapeProps> = ({
  isDrawing,
  drawStart,
  drawCurrent,
  activeShapeType,
  snapToGrid = false,
  pixelsPerSmallUnit
}) => {
  if (!isDrawing || !drawStart || !drawCurrent) return null;
  
  // If snapToGrid is true and we have pixelsPerSmallUnit, snap the current point to the grid
  let effectiveCurrent = { ...drawCurrent };
  
  if (snapToGrid && pixelsPerSmallUnit) {
    effectiveCurrent = {
      x: Math.floor(drawCurrent.x / pixelsPerSmallUnit) * pixelsPerSmallUnit,
      y: Math.floor(drawCurrent.y / pixelsPerSmallUnit) * pixelsPerSmallUnit
    };
  }
  
  // Also snap the start point if we're in grid snapping mode
  let effectiveStart = { ...drawStart };
  if (snapToGrid && pixelsPerSmallUnit) {
    effectiveStart = {
      x: Math.floor(drawStart.x / pixelsPerSmallUnit) * pixelsPerSmallUnit,
      y: Math.floor(drawStart.y / pixelsPerSmallUnit) * pixelsPerSmallUnit
    };
  }
  
  // Determine the border style based on whether we're snapping to grid
  const borderStyle = snapToGrid ? 'solid' : 'dashed';
  const borderColor = snapToGrid ? 'rgba(76, 175, 80, 0.7)' : 'rgba(155, 135, 245, 0.7)';
  const fillColor = snapToGrid ? 'rgba(76, 175, 80, 0.1)' : 'rgba(155, 135, 245, 0.1)';
  
  switch (activeShapeType) {
    case 'circle':
      return renderCirclePreview(effectiveStart, effectiveCurrent, borderStyle, borderColor, fillColor);
    case 'rectangle':
      return renderRectanglePreview(effectiveStart, effectiveCurrent, borderStyle, borderColor, fillColor);
    case 'triangle':
      return renderTrianglePreview(effectiveStart, effectiveCurrent, borderStyle, borderColor, fillColor);
    case 'line':
      return renderLinePreview(effectiveStart, effectiveCurrent, borderStyle, borderColor, fillColor);
    default:
      return null;
  }
};

const renderCirclePreview = (start: Point, current: Point, borderStyle: string, borderColor: string, fillColor: string) => {
  const radius = Math.sqrt(
    Math.pow(current.x - start.x, 2) + 
    Math.pow(current.y - start.y, 2)
  );
  
  return (
    <div
      className="absolute rounded-full pointer-events-none border-[1px]"
      style={{
        left: start.x - radius,
        top: start.y - radius,
        width: radius * 2,
        height: radius * 2,
        borderColor,
        backgroundColor: fillColor,
        borderStyle
      }}
    />
  );
};

const renderRectanglePreview = (start: Point, current: Point, borderStyle: string, borderColor: string, fillColor: string) => {
  const left = Math.min(start.x, current.x);
  const top = Math.min(start.y, current.y);
  const width = Math.abs(current.x - start.x);
  const height = Math.abs(current.y - start.y);
  
  return (
    <div
      className="absolute pointer-events-none border-[1px]"
      style={{
        left,
        top,
        width,
        height,
        borderColor,
        backgroundColor: fillColor,
        borderStyle
      }}
    />
  );
};

const renderTrianglePreview = (start: Point, current: Point, borderStyle: string, borderColor: string, fillColor: string) => {
  // Calculate the three points of the right triangle
  // Point 1: Bottom left (where the right angle is)
  const p1 = {
    x: start.x,
    y: current.y
  };
  
  // Point 2: Top point
  const p2 = {
    x: start.x,
    y: start.y
  };
  
  // Point 3: Bottom right
  const p3 = {
    x: current.x,
    y: current.y
  };
  
  // Calculate the bounding box
  const minX = Math.min(p1.x, p2.x, p3.x);
  const minY = Math.min(p1.y, p2.y, p3.y);
  const maxX = Math.max(p1.x, p2.x, p3.x);
  const maxY = Math.max(p1.y, p2.y, p3.y);
  
  const boundingWidth = maxX - minX;
  const boundingHeight = maxY - minY;
  
  // Create SVG path for the triangle
  const pathData = `
    M ${p1.x - minX} ${p1.y - minY}
    L ${p2.x - minX} ${p2.y - minY}
    L ${p3.x - minX} ${p3.y - minY}
    Z
  `;
  
  // Determine the dash array based on border style
  const strokeDasharray = borderStyle === 'dashed' ? '5,5' : 'none';
  
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: minX,
        top: minY,
        width: boundingWidth,
        height: boundingHeight
      }}
    >
      <svg 
        width={boundingWidth} 
        height={boundingHeight} 
        className="absolute"
      >
        <path
          d={pathData}
          fill={fillColor}
          stroke={borderColor}
          strokeWidth="1"
          strokeDasharray={strokeDasharray}
        />
      </svg>
    </div>
  );
};

const renderLinePreview = (start: Point, current: Point, borderStyle: string, borderColor: string, fillColor: string) => {
  // For a line preview, we'll use SVG to draw a dashed line

  // Calculate the bounding box (add some padding)
  const padding = 10;
  const minX = Math.min(start.x, current.x) - padding;
  const minY = Math.min(start.y, current.y) - padding;
  const maxX = Math.max(start.x, current.x) + padding;
  const maxY = Math.max(start.y, current.y) + padding;
  
  const width = maxX - minX;
  const height = maxY - minY;
  
  // Define start and end points relative to the container
  const startX = start.x - minX;
  const startY = start.y - minY;
  const endX = current.x - minX;
  const endY = current.y - minY;
  
  // Determine the dash array based on border style
  const strokeDasharray = borderStyle === 'dashed' ? '5,5' : 'none';
  
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: minX,
        top: minY,
        width,
        height
      }}
    >
      <svg 
        width={width} 
        height={height} 
        className="absolute"
      >
        <line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke={borderColor}
          strokeWidth="1"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
        />
        
        {/* Add small circles at endpoints */}
        <circle cx={startX} cy={startY} r="3" fill={borderColor} />
        <circle cx={endX} cy={endY} r="3" fill={borderColor} />
      </svg>
    </div>
  );
};

export default PreviewShape;
