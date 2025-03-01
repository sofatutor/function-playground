import React from 'react';
import type { AnyShape } from '@/types/shapes';

interface ControlPointProps {
  x: number;
  y: number;
  type: 'resize' | 'rotate';
  onMouseDown: (e: React.MouseEvent) => void;
}

const ControlPoint: React.FC<ControlPointProps> = ({ x, y, type, onMouseDown }) => {
  const isResize = type === 'resize';
  
  return (
    <div
      className={`absolute z-10 w-3 h-3 rounded-full ${
        isResize ? 'bg-white border border-geometry-primary' : 'bg-geometry-secondary'
      } transform -translate-x-1/2 -translate-y-1/2 cursor-${
        isResize ? 'nwse-resize' : 'rotate'
      }`}
      style={{ left: x, top: y }}
      onMouseDown={onMouseDown}
    />
  );
};

interface ShapeControlsProps {
  shape: AnyShape;
  canvasRef: React.RefObject<HTMLDivElement>;
  onResizeStart: (e: React.MouseEvent) => void;
  onRotateStart: (e: React.MouseEvent) => void;
}

const ShapeControls: React.FC<ShapeControlsProps> = ({
  shape,
  canvasRef,
  onResizeStart,
  onRotateStart
}) => {
  const canvasRect = canvasRef.current?.getBoundingClientRect();
  if (!canvasRect) return null;

  // Position calculation depends on shape type
  let controlPoints: { x: number; y: number; type: 'resize' | 'rotate' }[] = [];
  
  switch (shape.type) {
    case 'rectangle': {
      const rect = shape as Extract<AnyShape, { type: 'rectangle' }>;
      // Resize points at corners
      controlPoints = [
        { 
          x: rect.position.x + rect.width, 
          y: rect.position.y + rect.height, 
          type: 'resize' 
        },
        // Rotation control at top middle
        { 
          x: rect.position.x + rect.width / 2, 
          y: rect.position.y - 20, 
          type: 'rotate' 
        }
      ];
      break;
    }
    case 'circle': {
      const circle = shape as Extract<AnyShape, { type: 'circle' }>;
      // Only add resize point for circles, no rotation
      controlPoints = [
        { 
          x: circle.position.x + circle.radius, 
          y: circle.position.y, 
          type: 'resize' 
        }
      ];
      break;
    }
    case 'triangle': {
      const tri = shape as Extract<AnyShape, { type: 'triangle' }>;
      // Resize point at first vertex
      controlPoints = [
        { 
          x: tri.points[1].x, 
          y: tri.points[1].y, 
          type: 'resize' 
        },
        // Rotation control above the shape
        { 
          x: (tri.points[0].x + tri.points[1].x + tri.points[2].x) / 3, 
          y: (tri.points[0].y + tri.points[1].y + tri.points[2].y) / 3 - 30, 
          type: 'rotate' 
        }
      ];
      break;
    }
  }

  // Only render rotation control points if the active mode is 'rotate'
  return (
    <>
      {controlPoints.map((point, index) => (
        <ControlPoint
          key={index}
          x={point.x}
          y={point.y}
          type={point.type}
          onMouseDown={point.type === 'resize' ? onResizeStart : onRotateStart}
        />
      ))}
    </>
  );
};

export default ShapeControls;
