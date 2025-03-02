import React, { useRef, useState, useEffect, useCallback } from 'react';
import ShapeControls from '../ShapeControls';
import CanvasGrid from '../CanvasGrid';
import ShapeRenderer from './ShapeRenderer';
import PreviewShape from './PreviewShape';
import CalibrationButton from './CalibrationButton';
import { AnyShape, Point, OperationMode, ShapeType, MeasurementUnit } from '@/types/shapes';
import { 
  getStoredPixelsPerUnit, 
  DEFAULT_PIXELS_PER_CM, 
  DEFAULT_PIXELS_PER_MM, 
  DEFAULT_PIXELS_PER_INCH 
} from './CanvasUtils';
import {
  createHandleMouseDown,
  createHandleMouseMove,
  createHandleMouseUp,
  createHandleResizeStart,
  createHandleRotateStart
} from './CanvasEventHandlers';

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
  onModeChange?: (mode: OperationMode) => void;
  onMoveAllShapes?: (dx: number, dy: number) => void;
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
  onShapeRotate,
  onModeChange,
  onMoveAllShapes
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
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  
  // Add state for calibration
  const [showCalibration, setShowCalibration] = useState(false);
  
  // State for pixel conversion values with persisted defaults
  const [pixelsPerUnit, setPixelsPerUnit] = useState(() => getStoredPixelsPerUnit(measurementUnit || 'cm'));
  const [pixelsPerSmallUnit, setPixelsPerSmallUnit] = useState(() => 
    measurementUnit === 'in' ? getStoredPixelsPerUnit('in') / 10 : DEFAULT_PIXELS_PER_MM
  );
  
  // Handle calibration completion
  const handleCalibrationComplete = (newPixelsPerUnit: number) => {
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
    // Default to 'cm' if measurementUnit is undefined
    const unit = measurementUnit || 'cm';
    
    // Get the stored calibration value for this unit
    const storedValue = getStoredPixelsPerUnit(unit);
    
    if (unit === 'in') {
      setPixelsPerUnit(storedValue);
      setPixelsPerSmallUnit(storedValue / 10); // 1/10th of an inch
    } else {
      setPixelsPerUnit(storedValue);
      setPixelsPerSmallUnit(storedValue / 10); // 1mm = 1/10th of a cm
    }
  }, [measurementUnit]);

  // Clear existing calibration values and use the new defaults
  // This effect should only run once on mount
  useEffect(() => {
    // Only clear if no values exist yet
    if (!localStorage.getItem('pixelsPerUnit_cm') && !localStorage.getItem('pixelsPerUnit_in')) {
      // Set the new default values
      setPixelsPerUnit(measurementUnit === 'in' ? DEFAULT_PIXELS_PER_INCH : DEFAULT_PIXELS_PER_CM);
      setPixelsPerSmallUnit(measurementUnit === 'in' ? DEFAULT_PIXELS_PER_INCH / 10 : DEFAULT_PIXELS_PER_MM);
    }
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
        setCanvasSize({ width, height });
      }
    };
    
    // Debounced resize handler for better performance
    let resizeTimer: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateCanvasSize, 100);
    };
    
    // Initial update
    updateCanvasSize();
    
    // Update after a short delay to ensure the DOM has fully rendered
    const initialTimeout = setTimeout(updateCanvasSize, 100);
    
    // Update on window resize with debouncing
    window.addEventListener('resize', debouncedResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(initialTimeout);
      clearTimeout(resizeTimer);
    };
  }, []); // Only run on mount, not on every prop change

  // Create event handlers using the factory functions
  const handleMouseDown = createHandleMouseDown({
    canvasRef,
    shapes,
    activeMode,
    activeShapeType,
    selectedShapeId,
    isDrawing,
    drawStart,
    drawCurrent,
    dragStart,
    originalPosition,
    resizeStart,
    originalSize,
    rotateStart,
    originalRotation,
    setIsDrawing,
    setDrawStart,
    setDrawCurrent,
    setDragStart,
    setOriginalPosition,
    setResizeStart,
    setOriginalSize,
    setRotateStart,
    setOriginalRotation,
    onShapeSelect,
    onShapeCreate,
    onShapeMove,
    onShapeResize,
    onShapeRotate
  });

  const handleMouseMove = createHandleMouseMove({
    canvasRef,
    shapes,
    activeMode,
    activeShapeType,
    selectedShapeId,
    isDrawing,
    drawStart,
    drawCurrent,
    dragStart,
    originalPosition,
    resizeStart,
    originalSize,
    rotateStart,
    originalRotation,
    setIsDrawing,
    setDrawStart,
    setDrawCurrent,
    setDragStart,
    setOriginalPosition,
    setResizeStart,
    setOriginalSize,
    setRotateStart,
    setOriginalRotation,
    onShapeSelect,
    onShapeCreate,
    onShapeMove,
    onShapeResize,
    onShapeRotate
  });

  const handleMouseUp = createHandleMouseUp({
    canvasRef,
    shapes,
    activeMode,
    activeShapeType,
    selectedShapeId,
    isDrawing,
    drawStart,
    drawCurrent,
    dragStart,
    originalPosition,
    resizeStart,
    originalSize,
    rotateStart,
    originalRotation,
    setIsDrawing,
    setDrawStart,
    setDrawCurrent,
    setDragStart,
    setOriginalPosition,
    setResizeStart,
    setOriginalSize,
    setRotateStart,
    setOriginalRotation,
    onShapeSelect,
    onShapeCreate,
    onShapeMove,
    onShapeResize,
    onShapeRotate,
    onModeChange
  });

  const handleResizeStart = createHandleResizeStart({
    canvasRef,
    shapes,
    activeMode,
    activeShapeType,
    selectedShapeId,
    isDrawing,
    drawStart,
    drawCurrent,
    dragStart,
    originalPosition,
    resizeStart,
    originalSize,
    rotateStart,
    originalRotation,
    setIsDrawing,
    setDrawStart,
    setDrawCurrent,
    setDragStart,
    setOriginalPosition,
    setResizeStart,
    setOriginalSize,
    setRotateStart,
    setOriginalRotation,
    onShapeSelect,
    onShapeCreate,
    onShapeMove,
    onShapeResize,
    onShapeRotate
  });

  const handleRotateStart = createHandleRotateStart({
    canvasRef,
    shapes,
    activeMode,
    activeShapeType,
    selectedShapeId,
    isDrawing,
    drawStart,
    drawCurrent,
    dragStart,
    originalPosition,
    resizeStart,
    originalSize,
    rotateStart,
    originalRotation,
    setIsDrawing,
    setDrawStart,
    setDrawCurrent,
    setDragStart,
    setOriginalPosition,
    setResizeStart,
    setOriginalSize,
    setRotateStart,
    setOriginalRotation,
    onShapeSelect,
    onShapeCreate,
    onShapeMove,
    onShapeResize,
    onShapeRotate
  });

  // Toggle calibration tool
  const toggleCalibration = () => {
    setShowCalibration(!showCalibration);
  };

  // Inside the GeometryCanvas component, add a new function to handle moving all shapes
  const handleMoveAllShapes = useCallback((dx: number, dy: number) => {
    if (!onMoveAllShapes) return;
    
    // Call the parent component's handler with precise deltas
    onMoveAllShapes(dx, dy);
  }, [onMoveAllShapes]);

  return (
    <div className="relative w-full h-full">
      {/* Calibration button and tool */}
      <CalibrationButton
        showCalibration={showCalibration}
        toggleCalibration={toggleCalibration}
        measurementUnit={measurementUnit}
        pixelsPerUnit={pixelsPerUnit}
        onCalibrationComplete={handleCalibrationComplete}
      />
      
      <div
        ref={canvasRef}
        className={`canvas-container ${activeMode === 'move' ? 'cursor-move' : ''} flex-grow relative`}
        style={{ 
          minHeight: isFullscreen ? 'calc(100vh - 120px)' : '400px',
          overflow: 'hidden' // Ensure content doesn't overflow
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Grid */}
        <CanvasGrid 
          key={`grid-${measurementUnit || 'cm'}-${pixelsPerUnit}`}
          canvasSize={canvasSize} 
          pixelsPerCm={pixelsPerUnit} 
          pixelsPerMm={pixelsPerSmallUnit}
          measurementUnit={measurementUnit || 'cm'}
          onMoveAllShapes={handleMoveAllShapes}
        />
        
        {/* Render all shapes */}
        {shapes.map(shape => (
          <ShapeRenderer 
            key={shape.id} 
            shape={shape} 
            isSelected={shape.id === selectedShapeId}
            activeMode={activeMode}
          />
        ))}
        
        {/* Preview shape while drawing */}
        <PreviewShape
          isDrawing={isDrawing}
          drawStart={drawStart}
          drawCurrent={drawCurrent}
          activeShapeType={activeShapeType}
        />
        
        {/* Controls for selected shape */}
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