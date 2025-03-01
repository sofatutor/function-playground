import React, { useRef, useState, useEffect } from 'react';
import ShapeControls from './ShapeControls';
import CanvasGrid from './CanvasGrid';
import CalibrationTool from './CalibrationTool';
import { AnyShape, Circle, Rectangle, Triangle, Point, OperationMode, ShapeType, MeasurementUnit } from '@/types/shapes';

interface GeometryCanvasProps {
  shapes: AnyShape[];
  selectedShapeId: string | null;
  activeMode: OperationMode;
  activeShapeType: ShapeType;
  measurementUnit: MeasurementUnit;
  isFullscreen?: boolean;
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
  activeShapeType,
  measurementUnit,
  isFullscreen = false,
  onShapeSelect,
  onShapeCreate,
  onShapeMove,
  onShapeResize,
  onShapeRotate
}) => {
  console.log('GeometryCanvas received props:', { 
    shapes, 
    selectedShapeId, 
    activeMode,
    activeShapeType,
    measurementUnit: measurementUnit, 
    measurementUnitType: typeof measurementUnit 
  });
  
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
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  
  // Add state for calibration
  const [showCalibration, setShowCalibration] = useState(false);
  
  // Default physical measurements constants (in pixels)
  // Standard 96 DPI: 1cm = 37.8px, 1mm = 3.78px, 1in = 96px
  const DEFAULT_PIXELS_PER_CM = 60;
  const DEFAULT_PIXELS_PER_MM = 6;
  const DEFAULT_PIXELS_PER_INCH = 152.4;
  
  // Use localStorage to persist calibration values
  const getStoredPixelsPerUnit = (unit: MeasurementUnit): number => {
    const storedValue = localStorage.getItem(`pixelsPerUnit_${unit}`);
    if (storedValue) {
      return parseFloat(storedValue);
    }
    return unit === 'cm' ? DEFAULT_PIXELS_PER_CM : DEFAULT_PIXELS_PER_INCH;
  };
  
  // State for pixel conversion values with persisted defaults
  const [pixelsPerUnit, setPixelsPerUnit] = useState(() => getStoredPixelsPerUnit(measurementUnit || 'cm'));
  const [pixelsPerSmallUnit, setPixelsPerSmallUnit] = useState(() => 
    measurementUnit === 'in' ? getStoredPixelsPerUnit('in') / 10 : DEFAULT_PIXELS_PER_MM
  );
  
  // Handle calibration completion
  const handleCalibrationComplete = (newPixelsPerUnit: number) => {
    console.log('Calibration complete, new value:', newPixelsPerUnit);
    
    // Store the calibrated value in localStorage
    localStorage.setItem(`pixelsPerUnit_${measurementUnit}`, newPixelsPerUnit.toString());
    
    // Update the state
    setPixelsPerUnit(newPixelsPerUnit);
    
    // Update small unit value
    if (measurementUnit === 'in') {
      setPixelsPerSmallUnit(newPixelsPerUnit / 10); // 1/10th of an inch
    } else {
      // For cm, we need to update mm (1/10th of a cm)
      setPixelsPerSmallUnit(newPixelsPerUnit / 10);
      localStorage.setItem('pixelsPerUnit_mm', (newPixelsPerUnit / 10).toString());
    }
    
    // Hide the calibration tool
    setShowCalibration(false);
  };
  
  // Update pixel values when measurement unit changes
  useEffect(() => {
    console.log('Measurement unit changed to:', measurementUnit, 'Type:', typeof measurementUnit);
    // Default to 'cm' if measurementUnit is undefined
    const unit = measurementUnit || 'cm';
    
    // Get the stored calibration value for this unit
    const storedValue = getStoredPixelsPerUnit(unit);
    
    if (unit === 'in') {
      console.log('Setting pixels for inches');
      setPixelsPerUnit(storedValue);
      setPixelsPerSmallUnit(storedValue / 10); // 1/10th of an inch
    } else {
      console.log('Setting pixels for centimeters');
      setPixelsPerUnit(storedValue);
      setPixelsPerSmallUnit(storedValue / 10); // 1mm = 1/10th of a cm
    }
  }, [measurementUnit]);

  // Clear existing calibration values and use the new defaults
  useEffect(() => {
    // Clear existing calibration values
    localStorage.removeItem('pixelsPerUnit_cm');
    localStorage.removeItem('pixelsPerUnit_in');
    localStorage.removeItem('pixelsPerUnit_mm');
    
    // Set the new default values
    setPixelsPerUnit(measurementUnit === 'in' ? DEFAULT_PIXELS_PER_INCH : DEFAULT_PIXELS_PER_CM);
    setPixelsPerSmallUnit(measurementUnit === 'in' ? DEFAULT_PIXELS_PER_INCH / 10 : DEFAULT_PIXELS_PER_MM);
    
    console.log('Using new default calibration values:', {
      cm: DEFAULT_PIXELS_PER_CM,
      in: DEFAULT_PIXELS_PER_INCH,
      mm: DEFAULT_PIXELS_PER_MM
    });
  }, []); // Run only once on component mount

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

  // Measure canvas on mount and resize
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const { width, height } = canvasRef.current.getBoundingClientRect();
        console.log('Canvas size updated:', { width, height });
        setCanvasSize({ width, height });
      }
    };
    
    // Initial update
    updateCanvasSize();
    
    // Update after a short delay to ensure the DOM has fully rendered
    const initialTimeout = setTimeout(updateCanvasSize, 100);
    
    // Set up a periodic check for size changes
    const intervalCheck = setInterval(updateCanvasSize, 500);
    
    // Update on window resize
    window.addEventListener('resize', updateCanvasSize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      clearTimeout(initialTimeout);
      clearInterval(intervalCheck);
    };
  }, [measurementUnit, pixelsPerUnit, pixelsPerSmallUnit]);

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
        
        if (shape) {
          // If a shape is clicked, select it and prepare for potential movement
          onShapeSelect(shape.id);
          setDragStart(point);
          
          // Store the original position for calculating movement delta
          const selectedShape = shapes.find(s => s.id === shape.id);
          if (selectedShape) {
            setOriginalPosition(selectedShape.position);
          }
        } else {
          // If clicking on empty space, deselect
          onShapeSelect(null);
        }
        break;
      }
      case 'create': {
        setIsDrawing(true);
        setDrawStart(point);
        setDrawCurrent(point);
        break;
      }
      case 'resize': {
        // Keep existing resize functionality
        if (!selectedShapeId) break;
        
        const shape = shapes.find(s => s.id === selectedShapeId);
        if (!shape) break;
        
        setResizeStart(point);
        break;
      }
      case 'rotate': {
        // Keep existing rotate functionality
        if (!selectedShapeId) break;
        
        const shape = shapes.find(s => s.id === selectedShapeId);
        if (!shape) break;
        
        setRotateStart(point);
        setOriginalRotation(shape.rotation);
        break;
      }
      default:
        break;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const point = getCanvasPoint(e);
    
    switch (activeMode) {
      case 'select': {
        // If we have a drag start and original position, we're moving a selected shape
        if (dragStart && originalPosition && selectedShapeId) {
          const deltaX = point.x - dragStart.x;
          const deltaY = point.y - dragStart.y;
          
          // Only start moving if the mouse has moved a minimum distance
          const dragDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          if (dragDistance > 3) {
            onShapeMove(selectedShapeId, {
              x: originalPosition.x + deltaX,
              y: originalPosition.y + deltaY
            });
          }
        }
        break;
      }
      case 'create': {
        if (!isDrawing || !drawStart) break;
        setDrawCurrent(point);
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
        
        // Calculate angle between center and current mouse position
        const currentAngle = Math.atan2(point.y - center.y, point.x - center.x);
        const initialAngle = Math.atan2(rotateStart.y - center.y, rotateStart.x - center.x);
        
        // Calculate angle difference and apply to original rotation
        const angleDiff = currentAngle - initialAngle;
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
    setOriginalRotation(0);
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
      case 'triangle': {
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
          cursor: activeMode === 'select' ? 'pointer' : 'default'
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
          {tri.selected && (
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

  const renderPreviewShape = () => {
    if (!isDrawing || !drawStart || !drawCurrent) return null;
    
    const minX = Math.min(drawStart.x, drawCurrent.x);
    const minY = Math.min(drawStart.y, drawCurrent.y);
    const width = Math.abs(drawCurrent.x - drawStart.x);
    const height = Math.abs(drawCurrent.y - drawStart.y);
    
    if (activeMode === 'create') {
      switch (activeShapeType) {
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
          // Create a right-angled triangle to match the one created in useShapeOperations
          const distance = Math.sqrt(
            Math.pow(drawCurrent.x - drawStart.x, 2) + 
            Math.pow(drawCurrent.y - drawStart.y, 2)
          );
          
          const angle = Math.atan2(
            drawCurrent.y - drawStart.y,
            drawCurrent.x - drawStart.x
          );
          
          // First point (start point)
          const p1 = drawStart;
          // Second point (end point)
          const p2 = {
            x: drawStart.x + distance * Math.cos(angle),
            y: drawStart.y + distance * Math.sin(angle)
          };
          // Third point (perpendicular to create right angle at p1)
          const p3 = {
            x: drawStart.x + distance * Math.sin(angle), // Use sin for x to create perpendicular direction
            y: drawStart.y - distance * Math.cos(angle)  // Use negative cos for y to create perpendicular direction
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
    return null;
  };

  // Render the grid using the CanvasGrid component
  const renderGrid = () => {
    console.log('Rendering grid with:', { pixelsPerUnit, pixelsPerSmallUnit, measurementUnit });
    // Default to 'cm' if measurementUnit is undefined
    const unit = measurementUnit || 'cm';
    
    return (
      <CanvasGrid 
        key={`grid-${unit}-${pixelsPerUnit}`}
        canvasSize={canvasSize} 
        pixelsPerCm={pixelsPerUnit} 
        pixelsPerMm={pixelsPerSmallUnit}
        measurementUnit={unit}
      />
    );
  };

  // Add a toggle for the calibration tool
  const toggleCalibration = () => {
    setShowCalibration(!showCalibration);
  };

  return (
    <div className="relative w-full h-full">
      {/* Calibration button */}
      <div className="absolute top-2 right-2 z-10">
        <button
          className="btn-tool"
          onClick={toggleCalibration}
          title="Calibrate Screen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
      </div>
      
      {/* Calibration tool */}
      {showCalibration && (
        <div className="absolute top-14 right-2 z-10 w-80">
          <CalibrationTool
            measurementUnit={measurementUnit || 'cm'}
            onCalibrationComplete={handleCalibrationComplete}
            defaultPixelsPerUnit={pixelsPerUnit}
          />
        </div>
      )}
      
      <div
        ref={canvasRef}
        className={`canvas-container ${activeMode === 'move' ? 'cursor-move' : ''}`}
        style={{ height: isFullscreen ? 'calc(100vh - 120px)' : '500px' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {renderGrid()}
        {shapes.map(renderShape)}
        {renderPreviewShape()}
        
        {/* Controls */}
        {selectedShapeId && (
          <ShapeControls
            shape={shapes.find(s => s.id === selectedShapeId)!}
            canvasRef={canvasRef}
            onResizeStart={handleResizeStart}
            onRotateStart={handleRotateStart}
          />
        )}
      </div>
    </div>
  );
};

export default GeometryCanvas;
