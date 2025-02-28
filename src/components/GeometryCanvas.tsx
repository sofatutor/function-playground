
import React, { useRef, useState, useEffect } from 'react';
import ShapeControls from './ShapeControls';
import { AnyShape, Circle, Rectangle, Triangle, Point, OperationMode } from '@/types/shapes';

interface GeometryCanvasProps {
  shapes: AnyShape[];
  selectedShapeId: string | null;
  activeMode: OperationMode;
  onShapeSelect: (id: string | null) => void;
  onShapeCreate: (start: Point, end: Point) => string;
  onShapeMove: (id: string, newPosition: Point) => void;
  onShapeResize: (id: string, factor: number) => void;
  onShapeRotate: (id: string, angle: number) => void;
}

const GeometryCanvas: React.FC<GeometryCanvasProps> = ({
  shapes,
  selectedShapeId,
  activeMode,
  onShapeSelect,
  onShapeCreate,
  onShapeMove,
  onShapeResize,
  onShapeRotate
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<Point | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<Point | null>(null);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [originalPosition, setOriginalPosition] = useState<Point | null>(null);
  const [resizeStart, setResizeStart] = useState<Point | null>(null);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [rotateStart, setRotateStart] = useState<Point | null>(null);
  const [originalRotation, setOriginalRotation] = useState<number>(0);

  // Clean up any ongoing operations when the active mode changes
  useEffect(() => {
    setIsDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
    setDragStart(null);
    setOriginalPosition(null);
    setResizeStart(null);
    setOriginalSize(null);
    setRotateStart(null);
    setOriginalRotation(0);
  }, [activeMode]);

  const getCanvasPoint = (e: React.MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const getShapeAtPosition = (point: Point): AnyShape | null => {
    // Check shapes in reverse order (top-most first)
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      
      switch (shape.type) {
        case 'circle': {
          const circle = shape as Circle;
          const distance = Math.sqrt(
            Math.pow(point.x - circle.position.x, 2) + 
            Math.pow(point.y - circle.position.y, 2)
          );
          if (distance <= circle.radius) {
            return shape;
          }
          break;
        }
        case 'rectangle': {
          const rect = shape as Rectangle;
          if (
            point.x >= rect.position.x && 
            point.x <= rect.position.x + rect.width &&
            point.y >= rect.position.y && 
            point.y <= rect.position.y + rect.height
          ) {
            return shape;
          }
          break;
        }
        case 'triangle': {
          // Simple point-in-triangle test
          const tri = shape as Triangle;
          const [a, b, c] = tri.points;
          
          // Calculate barycentric coordinates
          const d = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
          
          // Calculate barycentric coordinates
          const alpha = ((b.y - c.y) * (point.x - c.x) + (c.x - b.x) * (point.y - c.y)) / d;
          const beta = ((c.y - a.y) * (point.x - c.x) + (a.x - c.x) * (point.y - c.y)) / d;
          const gamma = 1 - alpha - beta;
          
          if (alpha >= 0 && beta >= 0 && gamma >= 0) {
            return shape;
          }
          break;
        }
      }
    }
    
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent default to avoid text selection
    e.preventDefault();
    
    const point = getCanvasPoint(e);
    
    switch (activeMode) {
      case 'select': {
        const shape = getShapeAtPosition(point);
        onShapeSelect(shape ? shape.id : null);
        break;
      }
      case 'create': {
        setIsDrawing(true);
        setDrawStart(point);
        setDrawCurrent(point);
        break;
      }
      case 'move': {
        if (!selectedShapeId) break;
        
        const shape = shapes.find(s => s.id === selectedShapeId);
        if (!shape) break;
        
        setDragStart(point);
        setOriginalPosition(shape.position);
        break;
      }
      default:
        break;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const point = getCanvasPoint(e);
    
    switch (activeMode) {
      case 'create': {
        if (!isDrawing || !drawStart) break;
        setDrawCurrent(point);
        break;
      }
      case 'move': {
        if (!dragStart || !originalPosition || !selectedShapeId) break;
        
        const deltaX = point.x - dragStart.x;
        const deltaY = point.y - dragStart.y;
        
        onShapeMove(selectedShapeId, {
          x: originalPosition.x + deltaX,
          y: originalPosition.y + deltaY
        });
        break;
      }
      case 'resize': {
        if (!resizeStart || originalSize === null || !selectedShapeId) break;
        
        const selectedShape = shapes.find(s => s.id === selectedShapeId);
        if (!selectedShape) break;
        
        const initialVector = {
          x: resizeStart.x - selectedShape.position.x,
          y: resizeStart.y - selectedShape.position.y
        };
        
        const currentVector = {
          x: point.x - selectedShape.position.x,
          y: point.y - selectedShape.position.y
        };
        
        const initialMagnitude = Math.sqrt(initialVector.x * initialVector.x + initialVector.y * initialVector.y);
        const currentMagnitude = Math.sqrt(currentVector.x * currentVector.x + currentVector.y * currentVector.y);
        
        const scale = currentMagnitude / initialMagnitude;
        
        onShapeResize(selectedShapeId, scale);
        break;
      }
      case 'rotate': {
        if (!rotateStart || !selectedShapeId) break;
        
        const selectedShape = shapes.find(s => s.id === selectedShapeId);
        if (!selectedShape) break;
        
        const center = selectedShape.position;
        
        const initialAngle = Math.atan2(
          rotateStart.y - center.y,
          rotateStart.x - center.x
        );
        
        const currentAngle = Math.atan2(
          point.y - center.y,
          point.x - center.x
        );
        
        let angleDiff = currentAngle - initialAngle;
        const newRotation = (originalRotation + angleDiff) % (Math.PI * 2);
        
        onShapeRotate(selectedShapeId, newRotation);
        break;
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (activeMode === 'create' && isDrawing && drawStart && drawCurrent) {
      // Only create shape if the user has dragged a minimum distance
      const distance = Math.sqrt(
        Math.pow(drawCurrent.x - drawStart.x, 2) + 
        Math.pow(drawCurrent.y - drawStart.y, 2)
      );
      
      if (distance > 5) {
        onShapeCreate(drawStart, drawCurrent);
      }
    }
    
    // Reset all interaction states
    setIsDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
    setDragStart(null);
    setOriginalPosition(null);
    setResizeStart(null);
    setOriginalSize(null);
    setRotateStart(null);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!selectedShapeId) return;
    
    const point = getCanvasPoint(e);
    const selectedShape = shapes.find(s => s.id === selectedShapeId);
    
    if (!selectedShape) return;
    
    let initialSize = 0;
    
    switch (selectedShape.type) {
      case 'circle':
        initialSize = (selectedShape as Circle).radius;
        break;
      case 'rectangle':
        initialSize = Math.max(
          (selectedShape as Rectangle).width,
          (selectedShape as Rectangle).height
        );
        break;
      case 'triangle':
        // Use average distance from center to vertices
        const tri = selectedShape as Triangle;
        const center = {
          x: (tri.points[0].x + tri.points[1].x + tri.points[2].x) / 3,
          y: (tri.points[0].y + tri.points[1].y + tri.points[2].y) / 3
        };
        
        initialSize = (
          Math.sqrt(Math.pow(tri.points[0].x - center.x, 2) + Math.pow(tri.points[0].y - center.y, 2)) +
          Math.sqrt(Math.pow(tri.points[1].x - center.x, 2) + Math.pow(tri.points[1].y - center.y, 2)) +
          Math.sqrt(Math.pow(tri.points[2].x - center.x, 2) + Math.pow(tri.points[2].y - center.y, 2))
        ) / 3;
        break;
    }
    
    setActiveMode('resize' as OperationMode);
    setResizeStart(point);
    setOriginalSize(initialSize);
  };

  const handleRotateStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!selectedShapeId) return;
    
    const point = getCanvasPoint(e);
    const selectedShape = shapes.find(s => s.id === selectedShapeId);
    
    if (!selectedShape) return;
    
    setActiveMode('rotate' as OperationMode);
    setRotateStart(point);
    setOriginalRotation(selectedShape.rotation);
  };

  const setActiveMode = (mode: OperationMode) => {
    // This is just for internal canvas mode changes, doesn't replace the parent component's state
    // It's only used to switch modes during operations like resize/rotate
  };

  const renderShape = (shape: AnyShape) => {
    switch (shape.type) {
      case 'circle':
        return renderCircle(shape as Circle);
      case 'rectangle':
        return renderRectangle(shape as Rectangle);
      case 'triangle':
        return renderTriangle(shape as Triangle);
      default:
        return null;
    }
  };

  const renderCircle = (circle: Circle) => {
    return (
      <div
        key={circle.id}
        className={`absolute rounded-full border-2 transition-shadow ${
          circle.selected ? 'shadow-md' : ''
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
          cursor: activeMode === 'select' ? 'pointer' : 'default'
        }}
      />
    );
  };

  const renderRectangle = (rect: Rectangle) => {
    return (
      <div
        key={rect.id}
        className={`absolute border-2 transition-shadow ${
          rect.selected ? 'shadow-md' : ''
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
          cursor: activeMode === 'select' ? 'pointer' : 'default'
        }}
      />
    );
  };

  const renderTriangle = (tri: Triangle) => {
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
            transform={`rotate(${tri.rotation}, ${width/2}, ${height/2})`}
          />
        </svg>
      </div>
    );
  };

  const renderPreviewShape = () => {
    if (!isDrawing || !drawStart || !drawCurrent) return null;
    
    const minX = Math.min(drawStart.x, drawCurrent.x);
    const minY = Math.min(drawStart.y, drawCurrent.y);
    const width = Math.abs(drawCurrent.x - drawStart.x);
    const height = Math.abs(drawCurrent.y - drawStart.y);
    
    switch (activeMode) {
      case 'create': {
        switch (activeShape?.type) {
          case 'circle': {
            const radius = Math.sqrt(
              Math.pow(drawCurrent.x - drawStart.x, 2) + 
              Math.pow(drawCurrent.y - drawStart.y, 2)
            );
            return (
              <div
                className="absolute rounded-full border-2 border-dashed"
                style={{
                  left: drawStart.x - radius,
                  top: drawStart.y - radius,
                  width: radius * 2,
                  height: radius * 2,
                  borderColor: 'rgba(85, 91, 110, 0.6)',
                  backgroundColor: 'rgba(190, 227, 219, 0.2)'
                }}
              />
            );
          }
          case 'rectangle':
            return (
              <div
                className="absolute border-2 border-dashed"
                style={{
                  left: minX,
                  top: minY,
                  width,
                  height,
                  borderColor: 'rgba(85, 91, 110, 0.6)',
                  backgroundColor: 'rgba(190, 227, 219, 0.2)'
                }}
              />
            );
          case 'triangle': {
            // Create an equilateral triangle based on the drag distance and angle
            const distance = Math.sqrt(
              Math.pow(drawCurrent.x - drawStart.x, 2) + 
              Math.pow(drawCurrent.y - drawStart.y, 2)
            );
            
            const angle = Math.atan2(
              drawCurrent.y - drawStart.y,
              drawCurrent.x - drawStart.x
            );
            
            const p1 = drawStart;
            const p2 = {
              x: drawStart.x + distance * Math.cos(angle),
              y: drawStart.y + distance * Math.sin(angle)
            };
            const p3 = {
              x: drawStart.x + distance * Math.cos(angle + (2 * Math.PI / 3)),
              y: drawStart.y + distance * Math.sin(angle + (2 * Math.PI / 3))
            };
            
            // Calculate bounding box
            const boxMinX = Math.min(p1.x, p2.x, p3.x);
            const boxMinY = Math.min(p1.y, p2.y, p3.y);
            const boxMaxX = Math.max(p1.x, p2.x, p3.x);
            const boxMaxY = Math.max(p1.y, p2.y, p3.y);
            
            const boxWidth = boxMaxX - boxMinX;
            const boxHeight = boxMaxY - boxMinY;
            
            // Create SVG path for the triangle
            const pathData = `
              M ${p1.x - boxMinX} ${p1.y - boxMinY}
              L ${p2.x - boxMinX} ${p2.y - boxMinY}
              L ${p3.x - boxMinX} ${p3.y - boxMinY}
              Z
            `;
            
            return (
              <div
                className="absolute"
                style={{
                  left: boxMinX,
                  top: boxMinY,
                  width: boxWidth,
                  height: boxHeight
                }}
              >
                <svg width={boxWidth} height={boxHeight}>
                  <path
                    d={pathData}
                    fill="rgba(190, 227, 219, 0.2)"
                    stroke="rgba(85, 91, 110, 0.6)"
                    strokeWidth={2}
                    strokeDasharray="5,5"
                  />
                </svg>
              </div>
            );
          }
          default:
            return null;
        }
      }
      default:
        return null;
    }
  };

  // Find the currently active shape type for drawing preview
  const activeShape = shapes.find(s => s.type === activeMode);

  return (
    <div 
      ref={canvasRef}
      className="canvas-container relative w-full h-[500px]"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {shapes.map(shape => renderShape(shape))}
      {renderPreviewShape()}
      
      {selectedShapeId && (
        <ShapeControls
          shape={shapes.find(s => s.id === selectedShapeId)!}
          canvasRef={canvasRef}
          onResizeStart={handleResizeStart}
          onRotateStart={handleRotateStart}
        />
      )}
    </div>
  );
};

export default GeometryCanvas;
