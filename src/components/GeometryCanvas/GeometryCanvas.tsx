import React, { useRef, useState, useEffect, useCallback } from 'react';
import ShapeControls from '../ShapeControls';
import CanvasGrid from '../CanvasGrid/index';
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
  createHandleRotateStart,
  createHandleKeyDown
} from './CanvasEventHandlers';
import FormulaGraph from '../FormulaGraph';

// Add formula support to GeometryCanvas
interface FormulaCanvasProps extends GeometryCanvasProps {
  formulas?: any[]; // Use the Formula type from your types folder
  pixelsPerUnit?: number;
}

interface GeometryCanvasProps {
  shapes: AnyShape[];
  selectedShapeId: string | null;
  activeMode: OperationMode;
  activeShapeType: ShapeType;
  measurementUnit: MeasurementUnit;
  isFullscreen?: boolean;
  gridPosition?: Point | null;
  onShapeSelect: (id: string | null) => void;
  onShapeCreate: (start: Point, end: Point) => string;
  onShapeMove: (id: string, newPosition: Point) => void;
  onShapeResize: (id: string, factor: number) => void;
  onShapeRotate: (id: string, angle: number) => void;
  onModeChange?: (mode: OperationMode) => void;
  onMoveAllShapes?: (dx: number, dy: number) => void;
  onGridPositionChange?: (newPosition: Point) => void;
}

const GeometryCanvas: React.FC<FormulaCanvasProps> = ({
  gridPosition,
  formulas = [],
  pixelsPerUnit = 0,
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
  onGridPositionChange
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
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  
  // Add state for calibration
  const [showCalibration, setShowCalibration] = useState(false);
  
  // State for pixel conversion values with persisted defaults
  const [pixelsPerUnitState, setPixelsPerUnitState] = useState(() => getStoredPixelsPerUnit(measurementUnit || 'cm'));
  const [pixelsPerSmallUnit, setPixelsPerSmallUnit] = useState(() => 
    measurementUnit === 'in' ? getStoredPixelsPerUnit('in') / 10 : DEFAULT_PIXELS_PER_MM
  );
  
  // Add a new state for persistent grid position - initialize as null to allow the CanvasGrid to center it
  const [gridPositionState, setGridPositionState] = useState<Point | null>(externalGridPosition || null);
  
  // Effect to update internal grid position when external grid position changes
  useEffect(() => {
    console.log('GeometryCanvas: External grid position changed:', externalGridPosition);
    
    // If externalGridPosition is null, reset internal grid position to null
    if (externalGridPosition === null) {
      console.log('GeometryCanvas: Resetting internal grid position to null');
      setGridPositionState(null);
      return;
    }
    
    if (externalGridPosition) {
      // Only update if there's a significant difference to avoid oscillation
      if (!gridPositionState || 
          Math.abs(externalGridPosition.x - gridPositionState.x) > 1 || 
          Math.abs(externalGridPosition.y - gridPositionState.y) > 1) {
        console.log('GeometryCanvas: Updating internal grid position from external');
        setGridPositionState(externalGridPosition);
      } else {
        console.log('GeometryCanvas: Ignoring small external grid position change to prevent oscillation');
      }
    }
  }, [externalGridPosition, gridPositionState]);
  
  // Add a ref to track if this is the first load
  const isFirstLoad = useRef(true);
  
  // Add a ref for debouncing grid position updates
  const gridPositionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Add state for Alt key
  const [isAltPressed, setIsAltPressed] = useState(false);
  
  // Track Shift and Alt key states
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      }
      if (e.key === 'Alt') {
        setIsAltPressed(true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
      }
      if (e.key === 'Alt') {
        setIsAltPressed(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // Handle calibration completion
  const handleCalibrationComplete = (newPixelsPerUnit: number) => {
    // Store the calibrated value in localStorage
    localStorage.setItem(`pixelsPerUnit_${measurementUnit}`, newPixelsPerUnit.toString());
    
    // Update the state
    setPixelsPerUnitState(newPixelsPerUnit);
    
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
    
    // Update the pixel values without affecting the grid position
    if (unit === 'in') {
      setPixelsPerUnitState(storedValue);
      setPixelsPerSmallUnit(storedValue / 10); // 1/10th of an inch
    } else {
      setPixelsPerUnitState(storedValue);
      setPixelsPerSmallUnit(storedValue / 10); // 1mm = 1/10th of a cm
    }
    
    // We don't need to adjust any positions here since the CanvasGrid component
    // will maintain its position when the unit changes
  }, [measurementUnit]);

  // Clear existing calibration values and use the new defaults
  // This effect should only run once on mount
  useEffect(() => {
    // Only clear if no values exist yet
    if (!localStorage.getItem('pixelsPerUnit_cm') && !localStorage.getItem('pixelsPerUnit_in')) {
      // Set the new default values
      setPixelsPerUnitState(measurementUnit === 'in' ? DEFAULT_PIXELS_PER_INCH : DEFAULT_PIXELS_PER_CM);
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
    onShapeRotate
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
    console.log('GeometryCanvas: Grid position changed:', newPosition);
    
    // Only update if the position has actually changed
    if (!gridPositionState || newPosition.x !== gridPositionState.x || newPosition.y !== gridPositionState.y) {
      // Debounce the grid position updates
      if (gridPositionTimeoutRef.current) {
        clearTimeout(gridPositionTimeoutRef.current);
      }
      
      // Update the grid position immediately
      setGridPositionState(newPosition);
      
      // Notify parent after a delay to prevent too many updates
      gridPositionTimeoutRef.current = setTimeout(() => {
        // If we have a parent handler for grid position changes, call it
        if (onGridPositionChange) {
          console.log('GeometryCanvas: Notifying parent of grid position change (debounced)');
          onGridPositionChange(newPosition);
        }
        gridPositionTimeoutRef.current = null;
      }, 200); // 200ms debounce
    } else {
      console.log('GeometryCanvas: Skipping grid position update (no change)');
    }
  }, [onGridPositionChange, gridPositionState]);

  // Clean up the timeout when the component unmounts
  useEffect(() => {
    return () => {
      if (gridPositionTimeoutRef.current) {
        clearTimeout(gridPositionTimeoutRef.current);
      }
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
    onShapeRotate
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

  // Add a useEffect to log when gridPosition changes
  useEffect(() => {
    console.log('GeometryCanvas: gridPosition changed:', gridPositionState);
  }, [gridPositionState]);

  // Add rendering for formulas
  const renderFormulas = () => {
    if (!formulas || formulas.length === 0 || !gridPositionState) return null;
    
    return (
      <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
        {formulas.map(formula => (
          <FormulaGraph
            key={formula.id}
            formula={formula}
            gridPosition={gridPositionState}
            pixelsPerUnit={pixelsPerUnitState}
          />
        ))}
      </svg>
    );
  };

  return (
    <div className="relative w-full h-full">
      {/* Calibration button and tool */}
      <CalibrationButton
        showCalibration={showCalibration}
        toggleCalibration={toggleCalibration}
        measurementUnit={measurementUnit}
        pixelsPerUnit={pixelsPerUnitState}
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
        {/* Grid - Pass the persistent grid position */}
        <CanvasGrid 
          key={`grid-${canvasSize.width > 0 && canvasSize.height > 0 ? 'loaded' : 'loading'}`}
          canvasSize={canvasSize} 
          pixelsPerCm={pixelsPerUnitState} 
          pixelsPerMm={pixelsPerSmallUnit}
          measurementUnit={measurementUnit || 'cm'}
          onMoveAllShapes={onMoveAllShapes}
          initialPosition={gridPositionState}
          onPositionChange={handleGridPositionChange}
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
          snapToGrid={isShiftPressed && !isAltPressed}
          pixelsPerSmallUnit={pixelsPerSmallUnit}
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
        {/* Render formulas */}
        {renderFormulas()}
      </div>
    </div>
  );
};

export default GeometryCanvas;
