
import React from 'react';
import { Point, ShapeType } from '@/types/shapes';

interface PreviewShapeProps {
  isDrawing: boolean;
  drawStart: Point | null;
  drawCurrent: Point | null;
  activeShapeType: ShapeType;
}

const PreviewShape: React.FC<PreviewShapeProps> = ({
  isDrawing,
  drawStart,
  drawCurrent,
  activeShapeType
}) => {
  if (!isDrawing || !drawStart || !drawCurrent) return null;
  
  switch (activeShapeType) {
    case 'circle':
      return renderCirclePreview(drawStart, drawCurrent);
    case 'rectangle':
      return renderRectanglePreview(drawStart, drawCurrent);
    case 'triangle':
      return renderTrianglePreview(drawStart, drawCurrent);
    case 'line':
      return renderLinePreview(drawStart, drawCurrent);
    default:
      return null;
  }
};

const renderCirclePreview = (start: Point, current: Point) => {
  const radius = Math.sqrt(
    Math.pow(current.x - start.x, 2) + 
    Math.pow(current.y - start.y, 2)
  );
  
  return (
    <div
      className="absolute border-2 rounded-full border-dashed pointer-events-none"
      style={{
        left: start.x - radius,
        top: start.y - radius,
        width: radius * 2,
        height: radius * 2,
        borderColor: 'rgba(155, 135, 245, 0.7)',
        backgroundColor: 'rgba(155, 135, 245, 0.1)'
      }}
    />
  );
};

const renderRectanglePreview = (start: Point, current: Point) => {
  const left = Math.min(start.x, current.x);
  const top = Math.min(start.y, current.y);
  const width = Math.abs(current.x - start.x);
  const height = Math.abs(current.y - start.y);
  
  return (
    <div
      className="absolute border-2 border-dashed pointer-events-none"
      style={{
        left,
        top,
        width,
        height,
        borderColor: 'rgba(155, 135, 245, 0.7)',
        backgroundColor: 'rgba(155, 135, 245, 0.1)'
      }}
    />
  );
};

const renderTrianglePreview = (start: Point, current: Point) => {
  // Calculate the width based on the horizontal distance
  const width = Math.abs(current.x - start.x) * 1.2;
  
  // Determine the direction of the drag (left-to-right or right-to-left)
  const isRightward = current.x >= start.x;
  
  // Calculate the midpoint between start and current points (horizontal only)
  const midX = (start.x + current.x) / 2;
  const topY = Math.min(start.y, current.y) - width/4;
  
  // Create the right angle at the top point (p1)
  const p1 = { 
    x: midX,
    y: topY
  }; // Top point with right angle
  
  // Point directly below p1
  const p2 = {
    x: midX,
    y: topY + width
  };
  
  // Point to the right or left of p1 depending on drag direction
  const p3 = {
    x: isRightward ? midX + width : midX - width,
    y: topY
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
        style={{ position: 'absolute' }}
      >
        <path
          d={pathData}
          fill="rgba(155, 135, 245, 0.1)"
          stroke="rgba(155, 135, 245, 0.7)"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
      </svg>
    </div>
  );
};

const renderLinePreview = (start: Point, current: Point) => {
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
        style={{ position: 'absolute' }}
      >
        <line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke="rgba(155, 135, 245, 0.7)"
          strokeWidth="2"
          strokeDasharray="5,5"
          strokeLinecap="round"
        />
        
        {/* Add small circles at endpoints */}
        <circle cx={startX} cy={startY} r="3" fill="rgba(155, 135, 245, 0.7)" />
        <circle cx={endX} cy={endY} r="3" fill="rgba(155, 135, 245, 0.7)" />
      </svg>
    </div>
  );
};

export default PreviewShape;
