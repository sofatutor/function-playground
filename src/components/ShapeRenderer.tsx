import React from 'react';
import { AnyShape, Circle, Rectangle, Triangle, OperationMode } from '@/types/shapes';

interface ShapeRendererProps {
  shape: AnyShape;
  activeMode: OperationMode;
}

const ShapeRenderer: React.FC<ShapeRendererProps> = ({ shape, activeMode }) => {
  switch (shape.type) {
    case 'circle':
      return renderCircle(shape as Circle, activeMode);
    case 'rectangle':
      return renderRectangle(shape as Rectangle, activeMode);
    case 'triangle':
      return renderTriangle(shape as Triangle, activeMode);
    default:
      return null;
  }
};

const renderCircle = (circle: Circle, activeMode: OperationMode) => (
  <div
    key={circle.id}
    className={`absolute rounded-full border-2 transition-shadow ${circle.selected ? 'shadow-md' : ''}`}
    style={{
      left: circle.position.x - circle.radius,
      top: circle.position.y - circle.radius,
      width: circle.radius * 2,
      height: circle.radius * 2,
      backgroundColor: circle.fill,
      borderColor: circle.stroke,
      borderWidth: circle.strokeWidth,
      transform: `rotate(${circle.rotation}rad)`,
      cursor: activeMode === 'select' ? 'pointer' : 'default'
    }}
  />
);

const renderRectangle = (rect: Rectangle, activeMode: OperationMode) => (
  <div
    key={rect.id}
    className={`absolute border-2 transition-shadow ${rect.selected ? 'shadow-md' : ''}`}
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
      cursor: activeMode === 'select' ? 'pointer' : 'default'
    }}
  />
);

const renderTriangle = (tri: Triangle, activeMode: OperationMode) => {
  const minX = Math.min(tri.points[0].x, tri.points[1].x, tri.points[2].x);
  const minY = Math.min(tri.points[0].y, tri.points[1].y, tri.points[2].y);
  const width = Math.max(tri.points[0].x, tri.points[1].x, tri.points[2].x) - minX;
  const height = Math.max(tri.points[0].y, tri.points[1].y, tri.points[2].y) - minY;
  const pathData = `
      M ${tri.points[0].x - minX} ${tri.points[0].y - minY}
      L ${tri.points[1].x - minX} ${tri.points[1].y - minY}
      L ${tri.points[2].x - minX} ${tri.points[2].y - minY}
      Z
    `;
  return (
    <div
      key={tri.id}
      className={`absolute ${tri.selected ? 'shadow-md' : ''}`}
      style={{
        left: minX,
        top: minY,
        width,
        height,
        cursor: activeMode === 'select' ? 'pointer' : 'default'
      }}
    >
      <svg width={width} height={height}>
        <path
          d={pathData}
          fill={tri.fill}
          stroke={tri.stroke}
          strokeWidth={tri.strokeWidth}
          transform={`rotate(${tri.rotation}, ${width / 2}, ${height / 2})`}
        />
      </svg>
    </div>
  );
};

export default ShapeRenderer;
