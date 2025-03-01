
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
      className={`absolute rounded-full border-2 transition-shadow ${
        isSelected ? 'shadow-md' : ''
      }`}
      style={{
        left: circle.position.x - circle.radius,
        top: circle.position.y - circle.radius,
        width: circle.radius * 2,
        height: circle.radius * 2,
        backgroundColor: circle.fill,
        borderColor: circle.stroke,
        borderWidth: circle.strokeWidth,
        transform: `rotate(${circle.rotation}rad)`,
        cursor: activeMode === 'select' ? 'pointer' : 'default',
        zIndex: 1
      }}
    />
  );
};

const renderRectangle = (rect: Rectangle, isSelected: boolean, activeMode: string) => {
  return (
    <div
      key={rect.id}
      className={`absolute border-2 transition-shadow ${
        isSelected ? 'shadow-md' : ''
      }`}
      style={{
        left: rect.position.x,
        top: rect.position.y,
        width: rect.width,
        height: rect.height,
        backgroundColor: rect.fill,
        borderColor: rect.stroke,
        borderWidth: rect.strokeWidth,
        transform: `rotate(${rect.rotation}rad)`,
        transformOrigin: 'center',
        cursor: activeMode === 'select' ? 'pointer' : 'default',
        zIndex: 1
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
  
  // Generate unique IDs for the filter and shadow
  const filterId = `shadow-blur-${tri.id}`;
  
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
        zIndex: 1
      }}
    >
      <svg 
        width={width + 10} 
        height={height + 10} 
        style={{ 
          position: 'absolute', 
          top: -5, 
          left: -5,
          overflow: 'visible'
        }}
      >
        {isSelected && (
          <>
            <defs>
              <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
              </filter>
            </defs>
            <path
              d={pathData}
              fill="transparent"
              stroke="rgba(0,0,0,0.3)"
              strokeWidth="4"
              transform={`translate(3, 3) rotate(${tri.rotation}, ${width/2}, ${height/2})`}
              filter={`url(#${filterId})`}
              style={{ pointerEvents: 'none' }}
            />
          </>
        )}
        <path
          d={pathData}
          fill={tri.fill}
          stroke={tri.stroke}
          strokeWidth={tri.strokeWidth}
          transform={`rotate(${tri.rotation}, ${width/2}, ${height/2})`}
        />
      </svg>
    </div>
  );
};

const renderLine = (line: Line, isSelected: boolean, activeMode: string) => {
  // For lines, we'll use SVG to render them
  
  // Calculate the bounding box (add some padding for hit detection)
  const padding = 10;
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
  
  // Generate unique ID for shadow filter
  const filterId = `line-shadow-${line.id}`;
  
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
        zIndex: 1
      }}
    >
      <svg 
        width={width} 
        height={height} 
        style={{ 
          position: 'absolute',
          overflow: 'visible'
        }}
      >
        {isSelected && (
          <>
            <defs>
              <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
              </filter>
            </defs>
            <line
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke="rgba(0,0,0,0.3)"
              strokeWidth="6"
              transform="translate(2, 2)"
              filter={`url(#${filterId})`}
              style={{ pointerEvents: 'none' }}
            />
          </>
        )}
        
        {/* Main line */}
        <line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke={line.stroke}
          strokeWidth={line.strokeWidth}
          strokeLinecap="round"
        />
        
        {/* Add small circles at endpoints to make them more visible */}
        <circle cx={startX} cy={startY} r="3" fill={line.stroke} />
        <circle cx={endX} cy={endY} r="3" fill={line.stroke} />
      </svg>
    </div>
  );
};

export default ShapeRenderer; 
