import React from 'react';
import { Point, ShapeType } from '@/types/shapes';

interface PreviewShapeProps {
  isDrawing: boolean;
  drawStart: Point | null;
  drawCurrent: Point | null;
  activeShapeType: ShapeType;
  snapToGrid?: boolean;
  pixelsPerSmallUnit?: number;
  zoomFactor?: number;
}

const PreviewShape: React.FC<PreviewShapeProps> = ({
  isDrawing,
  drawStart,
  drawCurrent,
  activeShapeType,
  snapToGrid = false,
  pixelsPerSmallUnit,
  zoomFactor: _zoomFactor = 1
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
  
  // Calculate width and height in screen coordinates (these will be exact pixel measurements)
  const screenWidth = Math.abs(effectiveCurrent.x - effectiveStart.x);
  const screenHeight = Math.abs(effectiveCurrent.y - effectiveStart.y);
  
  // For the preview shape we need to match what the final shape will be
  // The final shape's size is determined by screenWidth/zoomFactor
  // So for our preview to match that, we need to use that exact size
  const finalWidth = screenWidth;
  const finalHeight = screenHeight;
  
  // Figure out if we're dragging right/down or left/up
  const isRightward = effectiveCurrent.x > effectiveStart.x;
  const isDownward = effectiveCurrent.y > effectiveStart.y;
  
  switch (activeShapeType) {
    case 'circle':
      return renderCirclePreview(
        effectiveStart,
        finalWidth,
        finalHeight,
        isRightward,
        isDownward,
        borderStyle,
        borderColor,
        fillColor
      );
    case 'rectangle':
      return renderRectanglePreview(
        effectiveStart,
        finalWidth,
        finalHeight,
        isRightward,
        isDownward,
        borderStyle,
        borderColor,
        fillColor
      );
    case 'triangle':
      return renderTrianglePreview(
        effectiveStart,
        finalWidth,
        finalHeight,
        isRightward,
        isDownward,
        borderStyle,
        borderColor,
        fillColor
      );
    case 'line':
      return renderLinePreview(
        effectiveStart,
        finalWidth,
        finalHeight,
        isRightward,
        isDownward,
        borderStyle,
        borderColor,
        fillColor
      );
    default:
      return null;
  }
};

const renderCirclePreview = (
  start: Point,
  width: number,
  height: number, 
  isRightward: boolean,
  isDownward: boolean,
  borderStyle: string, 
  borderColor: string, 
  fillColor: string
) => {
  // For circles, calculate the radius based on normalized width/height
  const radius = Math.sqrt(width * width + height * height);
  
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

const renderRectanglePreview = (
  start: Point,
  width: number,
  height: number,
  isRightward: boolean,
  isDownward: boolean,
  borderStyle: string, 
  borderColor: string, 
  fillColor: string
) => {
  // Calculate the position based on whether drawing right/down or left/up
  const position = {
    x: isRightward ? start.x : start.x - width,
    y: isDownward ? start.y : start.y - height
  };
  
  return (
    <div
      className="absolute pointer-events-none border-[1px]"
      style={{
        left: position.x,
        top: position.y,
        width,
        height,
        borderColor,
        backgroundColor: fillColor,
        borderStyle,
        // Add comment explaining this style is designed to match the final shape size
        // when rendered at the current zoom level
      }}
    />
  );
};

const renderTrianglePreview = (
  start: Point,
  width: number,
  height: number,
  isRightward: boolean,
  isDownward: boolean,
  borderStyle: string, 
  borderColor: string, 
  fillColor: string
) => {
  // Calculate the three points of the triangle
  // Position depends on drawing direction
  const p1 = { // Top point
    x: start.x,
    y: start.y
  };
  
  const p2 = { // Bottom left
    x: start.x,
    y: isDownward ? start.y + height : start.y - height
  };
  
  const p3 = { // Bottom right
    x: isRightward ? start.x + width : start.x - width,
    y: isDownward ? start.y + height : start.y - height
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

const renderLinePreview = (
  start: Point,
  width: number,
  height: number,
  isRightward: boolean,
  isDownward: boolean,
  borderStyle: string, 
  borderColor: string, 
  _fillColor: string
) => {
  // Calculate end point based on normalized dimensions and direction
  const end = {
    x: isRightward ? start.x + width : start.x - width,
    y: isDownward ? start.y + height : start.y - height
  };
  
  // Calculate the bounding box (add some padding)
  const padding = 10;
  const minX = Math.min(start.x, end.x) - padding;
  const minY = Math.min(start.y, end.y) - padding;
  const maxX = Math.max(start.x, end.x) + padding;
  const maxY = Math.max(start.y, end.y) + padding;
  
  const boxWidth = maxX - minX;
  const boxHeight = maxY - minY;
  
  // Define start and end points relative to the container
  const startX = start.x - minX;
  const startY = start.y - minY;
  const endX = end.x - minX;
  const endY = end.y - minY;
  
  // Determine the dash array based on border style
  const strokeDasharray = borderStyle === 'dashed' ? '5,5' : 'none';
  
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: minX,
        top: minY,
        width: boxWidth,
        height: boxHeight
      }}
    >
      <svg 
        width={boxWidth} 
        height={boxHeight} 
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
