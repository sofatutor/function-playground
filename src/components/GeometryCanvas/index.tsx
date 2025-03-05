import React, { useRef, useState, useEffect, useCallback, KeyboardEvent as ReactKeyboardEvent } from 'react';
import ShapeControls from '../ShapeControls';
import CanvasGrid from '../CanvasGrid/index';
import ShapeRenderer from './ShapeRenderer';
import PreviewShape from './PreviewShape';
import CalibrationButton from './CalibrationButton';
import FormulaGraph from '../FormulaGraph';
import FormulaPointInfo from '../FormulaPointInfo';
import { AnyShape, Point, OperationMode, ShapeType, MeasurementUnit } from '@/types/shapes';
import { Formula } from '@/types/formula';
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
  createHandleKeyDown
} from './CanvasEventHandlers';

// Add formula support to GeometryCanvas
interface FormulaCanvasProps extends GeometryCanvasProps {
  formulas?: Formula[]; // Use the Formula type from your types folder
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
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0
  });
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  
  // Add state for calibration
  const [showCalibration, setShowCalibration] = useState(false);
  
  // State for pixel conversion values with persisted defaults
  const [pixelsPerUnit, setPixelsPerUnit] = useState(() => getStoredPixelsPerUnit(measurementUnit || 'cm'));
  const [pixelsPerSmallUnit, setPixelsPerSmallUnit] = useState(() => 
    measurementUnit === 'in' ? getStoredPixelsPerUnit('in') / 10 : DEFAULT_PIXELS_PER_MM
  );
  
  // Add a new state for persistent grid position - initialize as null to allow the CanvasGrid to center it
  const [gridPosition, setGridPosition] = useState<Point | null>(externalGridPosition || null);
  
  // Add state for selected formula point
  const [selectedPoint, setSelectedPoint] = useState<{
    x: number;
    y: number;
    mathX: number;
    mathY: number;
    formula: Formula;
  } | null>(null);
  
  // Add a ref to track if we're clicking on a path
  const clickedOnPathRef = useRef(false);
  
  // Add a function to clear all selected points
  const clearAllSelectedPoints = useCallback(() => {
    // Clear the selected point in the GeometryCanvas
    setSelectedPoint(null);
    
    // Reset the clicked on path flag
    clickedOnPathRef.current = false;
  }, []);
  
  // Effect to update internal grid position when external grid position changes
  useEffect(() => {
    console.log('GeometryCanvas: External grid position changed:', externalGridPosition);
    
    // If externalGridPosition is null, reset internal grid position to null
    if (externalGridPosition === null) {
      console.log('GeometryCanvas: Resetting internal grid position to null');
      setGridPosition(null);
      return;
    }
    
    if (externalGridPosition) {
      // Only update if there's a significant difference to avoid oscillation
      if (!gridPosition || 
          Math.abs(externalGridPosition.x - gridPosition.x) > 1 || 
          Math.abs(externalGridPosition.y - gridPosition.y) > 1) {
        console.log('GeometryCanvas: Updating internal grid position from external');
        setGridPosition(externalGridPosition);
      } else {
        console.log('GeometryCanvas: Ignoring small external grid position change to prevent oscillation');
      }
    }
  }, [externalGridPosition, gridPosition]);
  
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
    
    // Update the pixel values without affecting the grid position
    if (unit === 'in') {
      setPixelsPerUnit(storedValue);
      setPixelsPerSmallUnit(storedValue / 10); // 1/10th of an inch
    } else {
      setPixelsPerUnit(storedValue);
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

  // Update canvas size when the component mounts, window resizes, or fullscreen state changes
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const { width, height } = canvasRef.current.getBoundingClientRect();
        setCanvasSize({ width, height });
      }
    };

    // Initial update
    updateCanvasSize();

    // Add a small delay to ensure DOM has updated after fullscreen change
    const timeoutId = setTimeout(updateCanvasSize, 100);

    // Add resize listener
    window.addEventListener('resize', updateCanvasSize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      clearTimeout(timeoutId);
    };
  }, [isFullscreen]); // Add isFullscreen as a dependency

  // Force canvas size update when fullscreen state changes
  useEffect(() => {
    // First update immediately
    if (canvasRef.current) {
      const { width, height } = canvasRef.current.getBoundingClientRect();
      setCanvasSize({ width, height });
    }
    
    // Then update again after a delay to ensure all DOM changes are complete
    const timeoutId = setTimeout(() => {
      if (canvasRef.current) {
        const { width, height } = canvasRef.current.getBoundingClientRect();
        setCanvasSize({ width, height });
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [isFullscreen]);

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
    pixelsPerUnit,
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
  
  // Clear selected points when a shape is selected
  useEffect(() => {
    if (selectedShapeId) {
      clearAllSelectedPoints();
    }
  }, [selectedShapeId, clearAllSelectedPoints]);

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
    pixelsPerUnit,
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
    pixelsPerUnit,
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
    pixelsPerUnit,
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
    pixelsPerUnit,
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
  
  // Clear selected points when mode changes
  useEffect(() => {
    clearAllSelectedPoints();
  }, [activeMode, clearAllSelectedPoints]);
  
  // Clear selected points when grid position changes
  useEffect(() => {
    if (gridPosition) {
      clearAllSelectedPoints();
    }
  }, [gridPosition, clearAllSelectedPoints]);

  // Handle grid position change
  const handleGridPositionChange = useCallback((newPosition: Point) => {
    console.log('GeometryCanvas: Grid position changed:', newPosition);
    
    // Only update if the position has actually changed
    if (!gridPosition || newPosition.x !== gridPosition.x || newPosition.y !== gridPosition.y) {
      // Debounce the grid position updates for parent notification, but update local state immediately
      if (gridPositionTimeoutRef.current) {
        clearTimeout(gridPositionTimeoutRef.current);
      }
      
      // Update the grid position immediately to ensure formulas update in real-time
      setGridPosition(newPosition);
      
      // Notify parent after a delay to prevent too many updates
      gridPositionTimeoutRef.current = setTimeout(() => {
        // If we have a parent handler for grid position changes, call it
        if (onGridPositionChange) {
          console.log('GeometryCanvas: Notifying parent of grid position change (debounced)');
          onGridPositionChange(newPosition);
        }
        gridPositionTimeoutRef.current = null;
      }, 100); // Reduced from 200ms to 100ms for more responsive updates
    } else {
      console.log('GeometryCanvas: Skipping grid position update (no change)');
    }
  }, [onGridPositionChange, gridPosition]);

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
      if (gridPosition === null) {
        console.log('GeometryCanvas: No grid position from URL, centering grid');
        const centeredPosition = {
          x: Math.round(canvasSize.width / 2),
          y: Math.round(canvasSize.height / 2)
        };
        setGridPosition(centeredPosition);
      } else {
        console.log('GeometryCanvas: Using grid position from URL:', gridPosition);
      }
      
      // Mark first load as complete
      isFirstLoad.current = false;
    }
  }, [canvasSize, gridPosition]);

  // Add keyboard event handlers if they don't exist
  const handleKeyDown = useCallback((e: ReactKeyboardEvent<HTMLDivElement>) => {
    // Add keyboard handling logic if needed
    console.log('Key down:', e.key);
  }, []);
  
  const handleKeyUp = useCallback((e: ReactKeyboardEvent<HTMLDivElement>) => {
    // Add keyboard handling logic if needed
    console.log('Key up:', e.key);
  }, []);

  // Add a ref to track if we're already updating the grid position
  const isUpdatingGridPositionRef = useRef(false);

  // Add a useEffect to log when gridPosition changes
  useEffect(() => {
    console.log('GeometryCanvas: gridPosition changed:', gridPosition);
    
    // Force a re-render of formulas when grid position changes
    // This ensures formulas update smoothly during grid dragging
    if (gridPosition && formulas && formulas.length > 0 && !isUpdatingGridPositionRef.current) {
      // Set the flag to prevent infinite loops
      isUpdatingGridPositionRef.current = true;
      
      // Using requestAnimationFrame to batch updates
      requestAnimationFrame(() => {
        // Clear the flag after the frame is rendered
        isUpdatingGridPositionRef.current = false;
      });
    }
  }, [gridPosition, formulas]);

  // Handle formula point selection
  const handleFormulaPointSelect = (point: {
    x: number;
    y: number;
    mathX: number;
    mathY: number;
    formula: Formula;
  } | null) => {
    console.log('Point selected:', point);
    
    // Clear any existing selection first
    clearAllSelectedPoints();
    
    // Then set the new selection (if any)
    if (point) {
      // Set the clicked on path flag to true
      clickedOnPathRef.current = true;
      setSelectedPoint(point);
    }
  };

  // Effect to log when formulas change
  useEffect(() => {
    if (formulas) {
      console.log(`GeometryCanvas: Formulas updated, count: ${formulas.length}`);
    }
    
    // Clear selected point when formulas change
    setSelectedPoint(null);
  }, [formulas]);

  // Render the formulas
  const renderFormulas = () => {
    if (!formulas || formulas.length === 0 || !gridPosition) {
      return null;
    }
    
    // Use the internal pixelsPerUnit value
    const ppu = externalPixelsPerUnit || pixelsPerUnit;
    
    // Create a grid position key to force re-renders when grid moves
    const gridKey = `${gridPosition.x.toFixed(1)}-${gridPosition.y.toFixed(1)}`;
    
    return formulas.map(formula => (
      <FormulaGraph
        key={`${formula.id}-${gridKey}`}
        formula={formula}
        gridPosition={gridPosition}
        pixelsPerUnit={ppu}
        onPointSelect={handleFormulaPointSelect}
        globalSelectedPoint={selectedPoint}
      />
    ));
  };

  // Helper functions to get shape dimensions
  const getShapeWidth = (shape: AnyShape): number => {
    let xValues: number[] = [];
    
    switch (shape.type) {
      case 'circle':
        return shape.radius * 2;
      case 'rectangle':
        return shape.width;
      case 'triangle':
        // Calculate width from points
        xValues = shape.points.map(p => p.x);
        return Math.max(...xValues) - Math.min(...xValues);
      case 'line':
        // Calculate width from start and end points
        return Math.abs(shape.endPoint.x - shape.startPoint.x);
      default:
        return 0;
    }
  };

  const getShapeHeight = (shape: AnyShape): number => {
    let yValues: number[] = [];
    
    switch (shape.type) {
      case 'circle':
        return shape.radius * 2;
      case 'rectangle':
        return shape.height;
      case 'triangle':
        // Calculate height from points
        yValues = shape.points.map(p => p.y);
        return Math.max(...yValues) - Math.min(...yValues);
      case 'line':
        // Calculate height from start and end points
        return Math.abs(shape.endPoint.y - shape.startPoint.y);
      default:
        return 0;
    }
  };

  // Create a custom mouseUp handler that combines the existing handleMouseUp with point dismissal logic
  const customMouseUpHandler = (e: React.MouseEvent) => {
    // Check if we're in the middle of a grid drag operation BEFORE doing anything else
    if (isGridDragging.value) {
      console.log('GeometryCanvas: Skipping customMouseUpHandler due to grid dragging');
      return; // Exit immediately if grid is being dragged
    }
    
    // Log the value of isGridDragging
    console.log('GeometryCanvas: Before handleMouseUp, isGridDragging.value =', isGridDragging.value);
    
    // Call the original mouseUp handler
    handleMouseUp(e);
    
    // If the click is on a path (part of the formula graph), don't dismiss
    if ((e.target as Element).tagName === 'path') {
      return;
    }
    
    // If the click is on the info box itself, don't dismiss
    const infoBox = document.querySelector('.formula-point-info');
    if (infoBox && infoBox.contains(e.target as Node)) {
      return;
    }
    
    // If we didn't click on a path, dismiss the info box
    if (!clickedOnPathRef.current) {
      clearAllSelectedPoints();
    }
    
    // Reset the flag for the next click
    clickedOnPathRef.current = false;
  };

  // Add a global handler to ensure the isGridDragging flag is properly reset
  useEffect(() => {
    // We're removing the global mouseup handler that resets isGridDragging
    // because it's causing conflicts with the GridDragHandler component.
    // The GridDragHandler will handle resetting isGridDragging itself.
    
    // No longer adding a global mouseup handler here
    
    return () => {
      // No cleanup needed
    };
  }, []);

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
        className="canvas-container relative w-full h-full overflow-hidden"
        style={{ 
          cursor: activeMode === 'move' ? 'move' : 'default'
        }}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={customMouseUpHandler}
        onMouseLeave={customMouseUpHandler}
      >
        {/* Grid - Pass the persistent grid position */}
        <CanvasGrid
          key={`grid-${canvasSize.width > 0 && canvasSize.height > 0 ? 'loaded' : 'loading'}-${isFullscreen ? 'fullscreen' : 'normal'}`}
          canvasSize={canvasSize} 
          pixelsPerCm={pixelsPerUnit} 
          pixelsPerMm={pixelsPerSmallUnit}
          measurementUnit={measurementUnit || 'cm'}
          onMoveAllShapes={handleMoveAllShapes}
          initialPosition={gridPosition}
          onPositionChange={handleGridPositionChange}
        />
        
        {/* Render all shapes */}
        {shapes.map(shape => (
          <div 
            key={shape.id}
            onClick={() => onShapeSelect(shape.id)}
            style={{ cursor: activeMode === 'select' ? 'pointer' : 'default' }}
          >
            <ShapeRenderer
              shape={shape} 
              isSelected={shape.id === selectedShapeId}
              activeMode={activeMode}
            />
            
            {/* Add resize and rotate handlers for selected shapes */}
            {shape.id === selectedShapeId && (
              <>
                {/* Resize handle */}
                <div 
                  className="absolute w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center cursor-nwse-resize"
                  style={{
                    top: shape.position.y,
                    left: shape.position.x + (shape.type === 'circle' ? shape.radius : 'width' in shape ? shape.width : 0),
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10
                  }}
                  onMouseDown={handleResizeStart}
                />
                
                {/* Rotate handle */}
                <div 
                  className="absolute w-6 h-6 bg-green-500 rounded-full flex items-center justify-center cursor-move"
                  style={{
                    top: shape.position.y - (shape.type === 'circle' ? shape.radius : 'height' in shape ? shape.height : 0) - 20,
                    left: shape.position.x,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10
                  }}
                  onMouseDown={handleRotateStart}
                />
              </>
            )}
          </div>
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
        
        {/* Dedicated formula layer with its own SVG */}
        <div className="absolute inset-0" style={{ zIndex: 15, pointerEvents: 'none' }}>
          <svg 
            width="100%" 
            height="100%" 
            style={{ pointerEvents: 'none' }}
          >
            {renderFormulas()}
          </svg>
        </div>
        
        {/* Display formula point info */}
        {selectedPoint && (
          <div className="absolute bottom-4 right-4 w-80 z-50 formula-point-info-container">
            <FormulaPointInfo point={selectedPoint} />
          </div>
        )}
      </div>
    </div>
  );
};

export default GeometryCanvas;
