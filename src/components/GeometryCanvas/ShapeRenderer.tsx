import React from 'react';
import { AnyShape, Circle, Rectangle, Triangle, Line } from '@/types/shapes';

interface ShapeRendererProps {
  shape: AnyShape;
  isSelected: boolean;
  activeMode: string;
}

const ShapeRenderer: React.FC<ShapeRendererProps> = ({ shape, isSelected, activeMode }) => {
  switch (shape.type) {
    case 'circle':
      return renderCircle(shape as Circle, isSelected, activeMode);
    case 'rectangle':
      return renderRectangle(shape as Rectangle, isSelected, activeMode);
    case 'triangle':
      return renderTriangle(shape as Triangle, isSelected, activeMode);
    case 'line':
      return renderLine(shape as Line, isSelected, activeMode);
    default:
      return null;
  }
};

const renderCircle = (circle: Circle, isSelected: boolean, activeMode: string) => {
  return (
    <div
      key={circle.id}
      className={`absolute rounded-full border-[1px] ${
        isSelected ? 'shadow-[0_0_1px_rgba(0,0,0,0.1)]' : ''
      }`}
      style={{
        left: circle.position.x - circle.radius,
        top: circle.position.y - circle.radius,
        width: circle.radius * 2,
        height: circle.radius * 2,
        backgroundColor: circle.fill,
        borderColor: circle.stroke,
        transform: `rotate(${circle.rotation}rad)`,
        cursor: activeMode === 'select' ? 'pointer' : 'default',
        zIndex: isSelected ? 10 : 1
      }}
    />
  );
};

const renderRectangle = (rect: Rectangle, isSelected: boolean, activeMode: string) => {
  return (
    <div
      key={rect.id}
      className={`absolute border-[1px] ${
        isSelected ? 'shadow-[0_0_1px_rgba(0,0,0,0.1)]' : ''
      }`}
      style={{
        left: rect.position.x,
        top: rect.position.y,
        width: rect.width,
        height: rect.height,
        backgroundColor: rect.fill,
        borderColor: rect.stroke,
        transform: `rotate(${rect.rotation}rad)`,
        transformOrigin: 'center',
        cursor: activeMode === 'select' ? 'pointer' : 'default',
        zIndex: isSelected ? 10 : 1
      }}
    />
  );
};

const renderTriangle = (tri: Triangle, isSelected: boolean, activeMode: string) => {
  // Calculate the bounding box
  const minX = Math.min(tri.points[0].x, tri.points[1].x, tri.points[2].x);
  const minY = Math.min(tri.points[0].y, tri.points[1].y, tri.points[2].y);
  const maxX = Math.max(tri.points[0].x, tri.points[1].x, tri.points[2].x);
  const maxY = Math.max(tri.points[0].y, tri.points[1].y, tri.points[2].y);
  
  const width = maxX - minX;
  const height = maxY - minY;
  
  // Create SVG path for the triangle
  const pathData = `
    M ${tri.points[0].x - minX} ${tri.points[0].y - minY}
    L ${tri.points[1].x - minX} ${tri.points[1].y - minY}
    L ${tri.points[2].x - minX} ${tri.points[2].y - minY}
    Z
  `;
  
  return (
    <div
      key={tri.id}
      className="absolute"
      style={{
        left: minX,
        top: minY,
        width,
        height,
        cursor: activeMode === 'select' ? 'pointer' : 'default',
        zIndex: isSelected ? 10 : 1
      }}
    >
      <svg 
        width={width} 
        height={height} 
        className="absolute overflow-visible"
      >
        <path
          d={pathData}
          fill={tri.fill}
          stroke={tri.stroke}
          strokeWidth="1"
          transform={`rotate(${tri.rotation}, ${width/2}, ${height/2})`}
          style={{
            filter: isSelected ? 'drop-shadow(0 0 1px rgba(0,0,0,0.1))' : 'none'
          }}
        />
      </svg>
    </div>
  );
};

const renderLine = (line: Line, isSelected: boolean, activeMode: string) => {
  // For lines, we'll use SVG to render them
  
  // Calculate the bounding box (add more padding for better hit detection)
  const padding = 15;
  const minX = Math.min(line.startPoint.x, line.endPoint.x) - padding;
  const minY = Math.min(line.startPoint.y, line.endPoint.y) - padding;
  const maxX = Math.max(line.startPoint.x, line.endPoint.x) + padding;
  const maxY = Math.max(line.startPoint.y, line.endPoint.y) + padding;
  
  const width = maxX - minX;
  const height = maxY - minY;
  
  // Define start and end points relative to the container
  const startX = line.startPoint.x - minX;
  const startY = line.startPoint.y - minY;
  const endX = line.endPoint.x - minX;
  const endY = line.endPoint.y - minY;
  
  return (
    <div
      key={line.id}
      className="absolute"
      style={{
        left: minX,
        top: minY,
        width,
        height,
        cursor: activeMode === 'select' ? 'pointer' : 'default',
        zIndex: isSelected ? 10 : 1
      }}
    >
      <svg 
        width={width} 
        height={height} 
        className="absolute overflow-visible"
      >
        {/* Invisible wider line for easier selection */}
        <line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke="transparent"
          strokeWidth="20"
          strokeLinecap="round"
        />
        
        {/* Main line */}
        <line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke={line.stroke}
          strokeWidth="1"
          strokeLinecap="round"
          style={{
            filter: isSelected ? 'drop-shadow(0 0 1px rgba(0,0,0,0.1))' : 'none'
          }}
        />
        
        {/* Add small circles at endpoints to make them more visible */}
        <circle cx={startX} cy={startY} r="4" fill={line.stroke} />
        <circle cx={endX} cy={endY} r="4" fill={line.stroke} />
      </svg>
    </div>
  );
};

export default ShapeRenderer; 
