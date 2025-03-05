import React, { useRef, useState, useEffect, useCallback, KeyboardEvent as ReactKeyboardEvent } from 'react';
import ShapeControls from '../ShapeControls';
import CanvasGrid from '../CanvasGrid/index';
import ShapeRenderer from './ShapeRenderer';
import PreviewShape from './PreviewShape';
import CalibrationButton from './CalibrationButton';
import FormulaGraph from '../FormulaGraph';
import FormulaPointInfo from '../FormulaPointInfo';
import { AnyShape, Point, OperationMode, ShapeType, MeasurementUnit } from '@/types/shapes';
import { Formula, FormulaPoint } from '@/types/formula';
import { isGridDragging } from '@/components/CanvasGrid/GridDragHandler';
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
  createHandleRotateStart,
  createHandleKeyDown,
  EventHandlerParams
} from './CanvasEventHandlers';
import { RotateCw } from 'lucide-react';
// Import the service factory hook
import { useServiceFactory } from '@/providers/ServiceProvider';
import { ShapeServiceFactory } from '@/services/ShapeService';

// Add formula support to GeometryCanvas
interface FormulaCanvasProps extends GeometryCanvasProps {
  formulas?: Formula[]; // Use the Formula type from your types folder
  pixelsPerUnit?: number;
  serviceFactory?: ShapeServiceFactory;
}

// Base props for the GeometryCanvas component
interface GeometryCanvasProps {
  shapes: AnyShape[];
  selectedShapeId: string | null;
  activeMode: OperationMode;
  activeShapeType: ShapeType;
  measurementUnit: MeasurementUnit;
  isFullscreen?: boolean;
  gridPosition?: Point | null;
  onShapeSelect: (id: string | null) => void;
  onShapeCreate: (startPoint: Point, endPoint: Point) => string;
  onShapeMove: (id: string, newPosition: Point) => void;
  onShapeResize: (id: string, factor: number) => void;
  onShapeRotate: (id: string, angle: number) => void;
  onModeChange: (mode: OperationMode) => void;
  onMoveAllShapes?: (dx: number, dy: number) => void;
  onGridPositionChange?: (position: Point) => void;
}

// Define an extended FormulaPoint type that includes the additional properties
interface ExtendedFormulaPoint extends FormulaPoint {
  mathX: number;
  mathY: number;
  formula: Formula;
  pointIndex?: number;
  allPoints?: FormulaPoint[];
  navigationStepSize?: number;
}

const GeometryCanvas: React.FC<FormulaCanvasProps> = ({
  formulas = [],
  pixelsPerUnit: externalPixelsPerUnit = 0,
  shapes,
  selectedShapeId,
  activeMode,
  activeShapeType,
  measurementUnit,
  isFullscreen = false,
  gridPosition: externalGridPosition,
  onShapeSelect,
  onShapeCreate,
  onShapeMove,
  onShapeResize,
  onShapeRotate,
  onModeChange,
  onMoveAllShapes,
  onGridPositionChange,
  serviceFactory
}) => {
  // Use the provided serviceFactory or get it from the context
  const serviceFactoryFromContext = useServiceFactory();
  const effectiveServiceFactory = serviceFactory || serviceFactoryFromContext;
  
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
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  
  // Add state for calibration
  const [showCalibration, setShowCalibration] = useState(false);
  
  // State for pixel conversion values with persisted defaults
  const [pixelsPerUnitState, setPixelsPerUnitState] = useState(() => getStoredPixelsPerUnit(measurementUnit || 'cm'));
  const [pixelsPerSmallUnit, setPixelsPerSmallUnit] = useState(() => 
    measurementUnit === 'in' ? getStoredPixelsPerUnit('in') / 10 : getStoredPixelsPerUnit('cm')
  );
  
  // Add a new state for persistent grid position - initialize as null to allow the CanvasGrid to center it
  const [gridPositionState, setGridPositionState] = useState<Point | null>(externalGridPosition || null);
  
  // Add a ref to track if this is the first load
  const isFirstLoad = useRef(true);
  
  // Add state for formula point selection
  const [selectedPoint, setSelectedPoint] = useState<ExtendedFormulaPoint | null>(null);
  
  // Add a ref to track previous measurement unit
  const prevMeasurementUnit = useRef<MeasurementUnit | null>(null);
  
  // Update pixelsPerUnit when measurement unit changes
  useEffect(() => {
    // Check if the measurement unit has changed
    if (measurementUnit !== prevMeasurementUnit.current) {
      console.log(`Measurement unit changed from ${prevMeasurementUnit.current} to ${measurementUnit}`);
      prevMeasurementUnit.current = measurementUnit;
    }
    
    setPixelsPerUnitState(getStoredPixelsPerUnit(measurementUnit));
    setPixelsPerSmallUnit(
      measurementUnit === 'in' 
        ? getStoredPixelsPerUnit('in') / 10 
        : getStoredPixelsPerUnit('cm')
    );
  }, [measurementUnit]);
  
  // Update grid position when external grid position changes
  useEffect(() => {
    if (externalGridPosition) {
      setGridPositionState(externalGridPosition);
    }
  }, [externalGridPosition]);
  
  // Notify parent component when grid position changes
  useEffect(() => {
    if (gridPositionState && onGridPositionChange) {
      onGridPositionChange(gridPositionState);
    }
  }, [gridPositionState, onGridPositionChange]);
  
  // Handle formula point selection
  const handleFormulaPointSelect = useCallback((point: ExtendedFormulaPoint | null) => {
    setSelectedPoint(point);
  }, []);
  
  // Calculate pixels per unit based on measurement unit
  const pixelsPerUnit = externalPixelsPerUnit || pixelsPerUnitState;
  const pixelsPerCm = measurementUnit === 'cm' ? pixelsPerUnit : DEFAULT_PIXELS_PER_CM;
  const pixelsPerInch = measurementUnit === 'in' ? pixelsPerUnit : DEFAULT_PIXELS_PER_INCH;
  
  // Handle calibration update
  const handleCalibrationUpdate = useCallback((newPixelsPerUnit: number) => {
    setPixelsPerUnitState(newPixelsPerUnit);
    
    // Store the new pixels per unit value
    localStorage.setItem(`pixelsPerUnit_${measurementUnit}`, newPixelsPerUnit.toString());
    
    if (measurementUnit === 'in') {
      setPixelsPerSmallUnit(newPixelsPerUnit / 10); // 1/10 inch
    } else {
      setPixelsPerSmallUnit(getStoredPixelsPerUnit('cm')); // for cm
    }
    
    setShowCalibration(false);
  }, [measurementUnit]);

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
    pixelsPerUnit: pixelsPerUnitState,
    pixelsPerSmallUnit,
    measurementUnit,
    gridPosition: gridPositionState,
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
    onModeChange,
    serviceFactory: effectiveServiceFactory
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
    pixelsPerUnit: pixelsPerUnitState,
    pixelsPerSmallUnit,
    measurementUnit,
    gridPosition: gridPositionState,
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
    onModeChange,
    serviceFactory: effectiveServiceFactory
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
    pixelsPerUnit: pixelsPerUnitState,
    pixelsPerSmallUnit,
    measurementUnit,
    gridPosition: gridPositionState,
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
    onModeChange,
    serviceFactory: effectiveServiceFactory
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
    pixelsPerUnit: pixelsPerUnitState,
    pixelsPerSmallUnit,
    measurementUnit,
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
    serviceFactory: effectiveServiceFactory
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
    pixelsPerUnit: pixelsPerUnitState,
    pixelsPerSmallUnit,
    measurementUnit,
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
    serviceFactory: effectiveServiceFactory
  });

  // Toggle calibration tool
  const toggleCalibration = () => {
    setShowCalibration(!showCalibration);
  };

  // Inside the GeometryCanvas component, add a function to handle moving all shapes
  const handleMoveAllShapes = useCallback((dx: number, dy: number) => {
    if (!onMoveAllShapes) return;
    
    // Call the parent component's handler with precise deltas
    onMoveAllShapes(dx, dy);
  }, [onMoveAllShapes]);

  // Handle grid position change
  const handleGridPositionChange = useCallback((newPosition: Point) => {
    setGridPositionState(newPosition);
  }, []);

  // Handle keyboard events for shift key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Ensure the grid is centered when the canvas size changes
  useEffect(() => {
    if (canvasSize.width > 0 && canvasSize.height > 0 && isFirstLoad.current) {
      console.log('GeometryCanvas: First load with valid canvas size, isFirstLoad:', isFirstLoad.current);
      
      // Only set the position if we haven't already loaded from URL
      if (gridPositionState === null) {
        console.log('GeometryCanvas: No grid position from URL, centering grid');
        const centeredPosition = {
          x: Math.round(canvasSize.width / 2),
          y: Math.round(canvasSize.height / 2)
        };
        setGridPositionState(centeredPosition);
      } else {
        console.log('GeometryCanvas: Using grid position from URL:', gridPositionState);
      }
      
      // Mark first load as complete
      isFirstLoad.current = false;
    }
  }, [canvasSize, gridPositionState]);

  // Create keyboard event handler
  const handleKeyDown = createHandleKeyDown({
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
    pixelsPerUnit: pixelsPerUnitState,
    pixelsPerSmallUnit,
    measurementUnit,
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
    serviceFactory: effectiveServiceFactory
  });

  // Set up keyboard event listener
  useEffect(() => {
    // Add event listener for keyboard events
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Render the formulas
  const renderFormulas = () => {
    if (!formulas || formulas.length === 0 || !gridPositionState) {
      return null;
    }
    
    // Use the internal pixelsPerUnit value
    const ppu = externalPixelsPerUnit || pixelsPerUnit;
    
    // Create a grid position key to force re-renders when grid moves
    const gridKey = `${gridPositionState.x.toFixed(1)}-${gridPositionState.y.toFixed(1)}`;
    
    return formulas.map(formula => (
      <FormulaGraph
        key={`${formula.id}-${gridKey}`}
        formula={formula}
        gridPosition={gridPositionState}
        pixelsPerUnit={ppu}
        onPointSelect={handleFormulaPointSelect}
        globalSelectedPoint={selectedPoint}
      />
    ));
  };

  // Helper functions to get shape dimensions using services
  const getShapeWidth = (shape: AnyShape): number => {
    // Get the appropriate service for the shape
    const shapeService = effectiveServiceFactory.getServiceForShape(shape);
    
    // Get the measurements for the shape
    const measurements = shapeService.getMeasurements(shape, measurementUnit);
    
    // Return the width or equivalent measurement
    switch (shape.type) {
      case 'circle':
        return measurements.diameter || 0;
      case 'rectangle':
        return measurements.width || 0;
      case 'triangle':
        // For triangles, use the width measurement
        return measurements.width || 0;
      case 'line':
        // For lines, use the length measurement
        return measurements.length || 0;
      default:
        return 0;
    }
  };

  const getShapeHeight = (shape: AnyShape): number => {
    // Get the appropriate service for the shape
    const shapeService = effectiveServiceFactory.getServiceForShape(shape);
    
    // Get the measurements for the shape
    const measurements = shapeService.getMeasurements(shape, measurementUnit);
    
    // Return the height or equivalent measurement
    switch (shape.type) {
      case 'circle':
        return measurements.diameter || 0;
      case 'rectangle':
        return measurements.height || 0;
      case 'triangle':
        // For triangles, use the height measurement
        return measurements.height || 0;
      case 'line':
        // For lines, calculate height from the vertical distance
        return Math.abs(shape.endPoint.y - shape.startPoint.y);
      default:
        return 0;
    }
  };

  return (
    <div className={`relative w-full h-full bg-white border rounded-lg overflow-hidden ${isFullscreen ? 'shadow-none' : 'shadow-sm'}`}>
      <div 
        ref={canvasRef}
        className="absolute inset-0 overflow-hidden cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <CanvasGrid 
          canvasSize={{ width: canvasSize.width, height: canvasSize.height }}
          pixelsPerCm={pixelsPerUnitState}
          pixelsPerMm={pixelsPerSmallUnit}
          measurementUnit={measurementUnit}
          onMoveAllShapes={handleMoveAllShapes}
          initialPosition={gridPositionState}
          onPositionChange={handleGridPositionChange}
        />
        
        {shapes.map(shape => (
          <ShapeRenderer
            key={shape.id}
            shape={shape}
            isSelected={shape.id === selectedShapeId}
            activeMode={activeMode}
          />
        ))}
        
        {isDrawing && drawStart && drawCurrent && (
          <PreviewShape
            isDrawing={isDrawing}
            drawStart={drawStart}
            drawCurrent={drawCurrent}
            activeShapeType={activeShapeType}
            snapToGrid={isShiftPressed}
            pixelsPerSmallUnit={pixelsPerSmallUnit}
          />
        )}
        
        {selectedShapeId && (
          <ShapeControls
            shape={shapes.find(s => s.id === selectedShapeId)!}
            canvasRef={canvasRef}
            onResizeStart={handleResizeStart}
            onRotateStart={handleRotateStart}
          />
        )}
        {/* Render formulas */}
        {renderFormulas()}
        
        {/* Render formula point info if a point is selected */}
        {selectedPoint && (
          <FormulaPointInfo 
            point={selectedPoint}
            gridPosition={gridPositionState}
            pixelsPerUnit={pixelsPerUnit}
            measurementUnit={measurementUnit}
          />
        )}
      </div>
      
      <div className="absolute bottom-4 right-4">
        <CalibrationButton
          showCalibration={showCalibration}
          toggleCalibration={toggleCalibration}
          measurementUnit={measurementUnit}
          pixelsPerUnit={pixelsPerUnitState}
          onCalibrationComplete={handleCalibrationUpdate}
        />
      </div>
    </div>
  );
};

export default GeometryCanvas;
