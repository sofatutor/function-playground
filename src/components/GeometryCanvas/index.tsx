import React, { useRef, useState, useEffect, useCallback, KeyboardEvent as ReactKeyboardEvent } from 'react';
import CanvasGrid from '../CanvasGrid/index';
import ShapeRenderer from './ShapeRenderer';
import PreviewShape from './PreviewShape';
import CalibrationButton from './CalibrationButton';
import FormulaGraph from '../FormulaGraph';
import UnifiedInfoPanel from '../UnifiedInfoPanel';
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
  createHandleKeyDown
} from './CanvasEventHandlers';
import { RotateCw } from 'lucide-react';
import { ShapeServiceFactory } from '@/services/ShapeService';
import { getShapeMeasurements } from '@/utils/geometry/measurements';

// Add formula support to GeometryCanvas
interface FormulaCanvasProps extends GeometryCanvasProps {
  formulas?: Formula[]; // Use the Formula type from your types folder
  pixelsPerUnit?: number;
  serviceFactory?: ShapeServiceFactory;
}

interface GeometryCanvasProps {
  shapes: AnyShape[];
  selectedShapeId: string | null;
  activeMode: OperationMode;
  activeShapeType: ShapeType;
  measurementUnit: MeasurementUnit;
  isFullscreen?: boolean;
  gridPosition: Point | null;
  onShapeSelect: (id: string | null) => void;
  onShapeCreate: (start: Point, end: Point) => string;
  onShapeMove: (id: string, newPosition: Point) => void;
  onShapeResize: (id: string, factor: number) => void;
  onShapeRotate: (id: string, angle: number) => void;
  onModeChange?: (mode: OperationMode) => void;
  onMoveAllShapes?: (dx: number, dy: number) => void;
  onGridPositionChange?: (newPosition: Point) => void;
  onMeasurementUpdate?: (key: string, value: string) => void;
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
  gridPosition: externalGridPosition = null,
  onShapeSelect,
  onShapeCreate,
  onShapeMove,
  onShapeResize,
  onShapeRotate,
  onModeChange,
  onMoveAllShapes,
  onGridPositionChange,
  serviceFactory,
  onMeasurementUpdate
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
    pointIndex?: number;
    allPoints?: FormulaPoint[];
    navigationStepSize?: number;
    isValid: boolean;
  } | null>(null);
  
  // Add state to track the current point index and all points for the selected formula
  const [currentPointInfo, setCurrentPointInfo] = useState<{
    formulaId: string;
    pointIndex: number;
    allPoints: FormulaPoint[];
  } | null>(null);
  
  // Add a ref to track if we're clicking on a path
  const clickedOnPathRef = useRef(false);
  
  // Add a function to clear all selected points
  const clearAllSelectedPoints = useCallback(() => {
    // Clear the selected point in the GeometryCanvas
    setSelectedPoint(null);
    
    // Clear the current point info
    setCurrentPointInfo(null);
    
    // Reset the clicked on path flag
    clickedOnPathRef.current = false;
  }, []);
  
  // Function to navigate to the next/previous point
  const navigateFormulaPoint = useCallback((direction: 'next' | 'previous', isShiftPressed = false) => {
    console.log('navigateFormulaPoint called with direction:', direction, 'shift:', isShiftPressed);
    
    if (!selectedPoint) {
      console.log('No selectedPoint, returning');
      return;
    }
    
    // Get the current point's mathematical X coordinate
    const currentMathX = selectedPoint.mathX;
    
    // Round to 4 decimal places to handle floating point precision issues
    const roundedCurrentX = Math.round(currentMathX * 10000) / 10000;
    console.log('Current mathX (rounded):', roundedCurrentX);
    
    // Determine the step size based on whether Shift is pressed
    // When Shift is pressed, we temporarily use 1.0, but we don't change the stored value
    const currentStepSize = selectedPoint.navigationStepSize || 0.1;
    const stepSize = isShiftPressed ? 1.0 : currentStepSize;
    console.log('Using step size:', stepSize, isShiftPressed ? '(Shift pressed)' : '');
    
    // Determine the target X coordinate based on direction
    let targetMathX;
    
    if (direction === 'previous') {
      // When going left, we want the previous increment
      targetMathX = Math.floor(roundedCurrentX / stepSize) * stepSize;
      if (Math.abs(targetMathX - roundedCurrentX) < 0.0001) {
        targetMathX -= stepSize;
      }
    } else { // next
      // When going right, we want the next increment
      targetMathX = Math.ceil(roundedCurrentX / stepSize) * stepSize;
      if (Math.abs(targetMathX - roundedCurrentX) < 0.0001) {
        targetMathX += stepSize;
      }
    }
    
    // Round to ensure we get exact increments
    targetMathX = Math.round(targetMathX / stepSize) * stepSize;
    
    // Round to 4 decimal places to handle floating point precision issues
    targetMathX = Math.round(targetMathX * 10000) / 10000;
    
    console.log('Final target mathX:', targetMathX.toFixed(4));
    
    // Get the formula expression
    const formula = selectedPoint.formula;
    const expression = formula.expression;
    
    try {
      // Create a function from the expression
      const fn = new Function('x', `
        try {
          const Math = window.Math;
          return ${expression};
        } catch (e) {
          return NaN;
        }
      `);
      
      // Evaluate the function at the target X
      const targetMathY = fn(targetMathX);
      
      // Check if the result is valid
      if (isNaN(targetMathY) || !isFinite(targetMathY)) {
        console.log('Evaluated Y is not valid, cannot navigate');
        return;
      }
      
      // Apply the formula's scale factor
      const scaledMathY = targetMathY * formula.scaleFactor;
      
      // Convert from mathematical coordinates to canvas coordinates
      const targetCanvasX = (gridPosition?.x || 0) + targetMathX * pixelsPerUnit;
      const targetCanvasY = (gridPosition?.y || 0) - scaledMathY * pixelsPerUnit;
      
      console.log('Evaluated formula at x =', targetMathX.toFixed(4), 'y =', targetMathY.toFixed(4));
      console.log('After scale factor:', formula.scaleFactor, 'y =', scaledMathY.toFixed(4));
      console.log('Canvas coordinates:', targetCanvasX.toFixed(4), targetCanvasY.toFixed(4));
      
      // Create a new selected point with all the necessary information
      const newSelectedPoint = {
        ...selectedPoint,
        x: targetCanvasX,
        y: targetCanvasY,
        mathX: targetMathX,
        mathY: scaledMathY,
        navigationStepSize: currentStepSize, // Preserve the original step size
        isValid: true
      };
      
      // Update the selected point
      setSelectedPoint(newSelectedPoint);
      
      // Focus the canvas to ensure keyboard events continue to work
      if (canvasRef.current) {
        canvasRef.current.focus();
      }
    } catch (error) {
      console.error('Error evaluating formula:', error);
    }
  }, [selectedPoint, gridPosition, pixelsPerUnit, isShiftPressed]);
  
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
      console.log('Key down:', e.key);
      
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      }
      if (e.key === 'Alt') {
        setIsAltPressed(true);
      }
      
      // Note: Arrow key handling for formula point navigation is now done in the canvas onKeyDown handler
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
      }
      if (e.key === 'Alt') {
        setIsAltPressed(false);
      }
    };
    
    // Add event listeners to the window
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Clean up event listeners on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // Create a keyboard event handler for shape movement
  const handleShapeKeyDown = createHandleKeyDown({
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
    gridPosition,
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
    serviceFactory
  });
  
  // Function to focus the canvas container
  const focusCanvas = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.focus();
    }
  }, [canvasRef]);

  // Handle shape selection with focus
  const handleShapeSelect = useCallback((id: string) => {
    // Focus the canvas container so keyboard events work
    focusCanvas();
    
    // Call the original onShapeSelect function
    onShapeSelect(id);
  }, [onShapeSelect, focusCanvas]);
  
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
      resizeTimer = setTimeout(() => {
        updateCanvasSize();
        // Add a second update after a short delay to catch any post-resize adjustments
        setTimeout(updateCanvasSize, 100);
      }, 100);
    };
    
    // Initial update
    updateCanvasSize();
    
    // Update after a short delay to ensure the DOM has fully rendered
    const initialTimeout = setTimeout(updateCanvasSize, 100);
    
    // Add another update after a longer delay to catch any late layout changes
    const secondTimeout = setTimeout(updateCanvasSize, 500);
    
    // Update on window resize with debouncing
    window.addEventListener('resize', debouncedResize);
    
    // Also update on scroll events, as they might affect the viewport
    window.addEventListener('scroll', debouncedResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('scroll', debouncedResize);
      clearTimeout(initialTimeout);
      clearTimeout(secondTimeout);
      clearTimeout(resizeTimer);
    };
  }, []); // Only run on mount, not on every prop change

  // Create mouse event handlers
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
    gridPosition,
    setIsDrawing,
    setDrawStart,
    setDrawCurrent,
    setDragStart,
    setOriginalPosition,
    setResizeStart,
    setOriginalSize,
    setRotateStart,
    setOriginalRotation,
    onShapeSelect: (id: string | null) => {
      // Focus the canvas when a shape is selected
      if (id !== null) {
        focusCanvas();
      }
      onShapeSelect(id);
    },
    onShapeCreate,
    onShapeMove,
    onShapeResize,
    onShapeRotate,
    onModeChange,
    serviceFactory
  });
  
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
    pixelsPerUnit,
    pixelsPerSmallUnit,
    measurementUnit,
    gridPosition,
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
  
  // Simple key up handler
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
  
  // Clear selected points when a shape is selected
  useEffect(() => {
    if (selectedShapeId) {
      clearAllSelectedPoints();
    }
  }, [selectedShapeId, clearAllSelectedPoints]);

  // Handle mouse move
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
    gridPosition,
    setIsDrawing,
    setDrawStart,
    setDrawCurrent,
    setDragStart,
    setOriginalPosition,
    setResizeStart,
    setOriginalSize,
    setRotateStart,
    setOriginalRotation,
    onShapeSelect: (id: string | null) => {
      // Focus the canvas when a shape is selected during mouse move
      if (id !== null) {
        focusCanvas();
      }
      onShapeSelect(id);
    },
    onShapeCreate,
    onShapeMove,
    onShapeResize,
    onShapeRotate,
    onModeChange,
    serviceFactory
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
    gridPosition,
    setIsDrawing,
    setDrawStart,
    setDrawCurrent,
    setDragStart,
    setOriginalPosition,
    setResizeStart,
    setOriginalSize,
    setRotateStart,
    setOriginalRotation,
    onShapeSelect: (id: string | null) => {
      // Focus the canvas when a shape is selected during mouse up
      if (id !== null) {
        focusCanvas();
      }
      onShapeSelect(id);
    },
    onShapeCreate,
    onShapeMove,
    onShapeResize,
    onShapeRotate,
    onModeChange,
    serviceFactory
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
    onShapeSelect: (id: string | null) => {
      // Focus the canvas when a shape is selected for resizing
      if (id !== null) {
        focusCanvas();
      }
      onShapeSelect(id);
    },
    onShapeCreate,
    onShapeMove,
    onShapeResize,
    onShapeRotate,
    onModeChange,
    serviceFactory
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
    onShapeSelect: (id: string | null) => {
      // Focus the canvas when a shape is selected for rotation
      if (id !== null) {
        focusCanvas();
      }
      onShapeSelect(id);
    },
    onShapeCreate,
    onShapeMove,
    onShapeResize,
    onShapeRotate,
    onModeChange,
    serviceFactory
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

  // Handle formula point selection
  const handleFormulaPointSelect = (point: {
    x: number;
    y: number;
    mathX: number;
    mathY: number;
    formula: Formula;
    pointIndex?: number;
    allPoints?: FormulaPoint[];
    navigationStepSize?: number;
    isValid: boolean;
  } | null) => {
    console.log('Point selected:', point);
    
    // Clear any existing selection first
    clearAllSelectedPoints();
    
    // Then set the new selection (if any)
    if (point) {
      // Set the clicked on path flag to true
      clickedOnPathRef.current = true;
      
      // Always ensure navigationStepSize has a default value
      const pointWithStepSize = {
        ...point,
        navigationStepSize: point.navigationStepSize || 0.1,
        isValid: true
      };
      
      setSelectedPoint(pointWithStepSize);
      
      // Store the current point index and all points if provided
      if (point.pointIndex !== undefined && point.allPoints) {
        setCurrentPointInfo({
          formulaId: point.formula.id,
          pointIndex: point.pointIndex,
          allPoints: point.allPoints
        });
      } else {
        setCurrentPointInfo(null);
      }
      
      // Focus the canvas to enable keyboard navigation
      if (canvasRef.current) {
        console.log('Focusing canvas element');
        canvasRef.current.focus();
      } else {
        console.log('Canvas ref is null, cannot focus');
      }
    } else {
      setCurrentPointInfo(null);
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
    
    console.log(`Rendering ${formulas.length} formulas:`, formulas.map(f => f.id));
    
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
    
    // Only process point dismissal for mouseup events, not mouseleave
    if (e.type === 'mouseup') {
      // If the click is on a path (part of the formula graph), don't dismiss
      if ((e.target as Element).tagName === 'path') {
        // We're clicking on a path, so we'll set the flag but not dismiss
        clickedOnPathRef.current = true;
        return;
      }
      
      // If the click is on the info box itself, don't dismiss
      const infoBox = document.querySelector('.formula-point-info');
      if (infoBox && infoBox.contains(e.target as Node)) {
        return;
      }
      
      // If the click is on the tool button or its container, don't dismiss
      const toolButton = document.querySelector('.btn-tool');
      if (toolButton && (toolButton === e.target || toolButton.contains(e.target as Node))) {
        return;
      }
      
      // At this point, we know we clicked somewhere else on the canvas
      // So we should dismiss the info box immediately
      clearAllSelectedPoints();
      
      // Reset the flag for the next click
      clickedOnPathRef.current = false;
    }
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

  // Effect to focus the canvas when selectedPoint changes
  useEffect(() => {
    if (selectedPoint && canvasRef.current) {
      console.log('selectedPoint changed, focusing canvas');
      canvasRef.current.focus();
    }
  }, [selectedPoint]);

  // Get measurements for the selected shape
  const getMeasurementsForSelectedShape = (): Record<string, string> => {
    if (!selectedShapeId) return {};
    
    const selectedShape = shapes.find(s => s.id === selectedShapeId);
    if (!selectedShape) return {};
    
    // Convert pixels to the current measurement unit
    const convertFromPixels = (pixels: number): number => {
      return pixels / (externalPixelsPerUnit || pixelsPerUnit);
    };
    
    // Get the measurements as numbers
    const measurementsAsNumbers = getShapeMeasurements(selectedShape, convertFromPixels);
    
    // Convert to strings for display
    const measurementsAsStrings: Record<string, string> = {};
    Object.entries(measurementsAsNumbers).forEach(([key, value]) => {
      measurementsAsStrings[key] = value.toString();
    });
    
    return measurementsAsStrings;
  };
  
  // Handle measurement updates
  const handleMeasurementUpdate = (key: string, value: string): void => {
    if (!selectedShapeId) return;
    
    // Instead of trying to handle the update internally, pass it to the parent component
    // The parent component has access to the shape services that know how to properly update each shape type
    if (onMeasurementUpdate) {
      onMeasurementUpdate(key, value);
      return;
    }
    
    // If no onMeasurementUpdate is provided, fall back to the basic implementation
    const selectedShape = shapes.find(s => s.id === selectedShapeId);
    if (!selectedShape) return;
    
    // Convert the value to a number
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return;
    
    // Convert from measurement unit to pixels
    const convertToPixels = (unitValue: number): number => {
      return unitValue * (externalPixelsPerUnit || pixelsPerUnit);
    };
    
    // Create a copy of the shape to modify
    const updatedShape = { ...selectedShape };
    
    // Update the shape based on the measurement key
    switch (key) {
      case 'width':
        if ('width' in updatedShape) {
          updatedShape.width = convertToPixels(numericValue);
        }
        break;
      case 'height':
        if ('height' in updatedShape) {
          updatedShape.height = convertToPixels(numericValue);
        }
        break;
      case 'radius':
        if ('radius' in updatedShape) {
          updatedShape.radius = convertToPixels(numericValue);
        }
        break;
      case 'diameter':
        if ('radius' in updatedShape) {
          // Diameter is twice the radius
          updatedShape.radius = convertToPixels(numericValue) / 2;
        }
        break;
      case 'circumference':
        if ('radius' in updatedShape) {
          // Circumference = 2πr, so r = C/(2π)
          updatedShape.radius = convertToPixels(numericValue) / (2 * Math.PI);
        }
        break;
      case 'angle':
        if ('rotation' in updatedShape) {
          updatedShape.rotation = numericValue;
        }
        break;
    }
    
    // Update the shape in the parent component
    if (onShapeResize && 'width' in updatedShape && 'width' in selectedShape) {
      // For width/height changes, calculate the resize factor
      const widthFactor = updatedShape.width / selectedShape.width;
      onShapeResize(selectedShapeId, widthFactor);
    } else if (onShapeResize && 'radius' in updatedShape && 'radius' in selectedShape) {
      // For radius changes, calculate the resize factor
      const radiusFactor = updatedShape.radius / selectedShape.radius;
      onShapeResize(selectedShapeId, radiusFactor);
    } else if (onShapeRotate && 'rotation' in updatedShape && 'rotation' in selectedShape) {
      // For rotation changes
      onShapeRotate(selectedShapeId, updatedShape.rotation);
    } else if (key.startsWith('side') || key.startsWith('angle') || key === 'length') {
      // For triangle sides, angles, and line lengths, we need a special approach
      // Trigger a small movement to force a redraw with the updated shape
      onShapeMove(selectedShapeId, { x: 0, y: 0 });
    }
  };

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
        onKeyDown={(e) => {
          console.log('Canvas keydown:', e.key);
          
          // Handle arrow keys for formula point navigation
          if (selectedPoint) {
            if (e.key === 'ArrowLeft') {
              console.log('Canvas ArrowLeft pressed, shift:', e.shiftKey);
              e.preventDefault();
              navigateFormulaPoint('previous', e.shiftKey);
            } else if (e.key === 'ArrowRight') {
              console.log('Canvas ArrowRight pressed, shift:', e.shiftKey);
              e.preventDefault();
              navigateFormulaPoint('next', e.shiftKey);
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              // Handle up/down arrow keys to adjust the navigation step size
              e.preventDefault();
              
              // Get the current step size
              const currentStepSize = selectedPoint.navigationStepSize || 0.1;
              
              // Calculate the new step size
              let newStepSize = currentStepSize;
              if (e.key === 'ArrowUp') {
                // Increase step size
                newStepSize = Math.min(1.0, currentStepSize + 0.01);
              } else {
                // Decrease step size
                newStepSize = Math.max(0.01, currentStepSize - 0.01);
              }
              
              console.log(`Adjusting step size from ${currentStepSize} to ${newStepSize}`);
              
              // Update the selected point with the new step size
              setSelectedPoint({
                ...selectedPoint,
                navigationStepSize: newStepSize
              });
            }
          } else if (selectedShapeId) {
            // If a shape is selected and no formula point is selected, use the shape movement handler
            handleShapeKeyDown(e as unknown as KeyboardEvent);
          }
        }}
        onKeyUp={handleKeyUp}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={customMouseUpHandler}
        onMouseLeave={customMouseUpHandler}
        onClick={(e) => {
          // Focus the canvas container when clicking on it
          focusCanvas();
          
          // If the click is on a path (part of the formula graph), don't dismiss
          if ((e.target as Element).tagName === 'path') {
            return;
          }
          
          // If we clicked on a path in this render cycle, don't dismiss
          if (clickedOnPathRef.current) {
            return;
          }
          
          // Otherwise, clear any selected formula point
          clearAllSelectedPoints();
          
          // Reset the flag for the next click
          clickedOnPathRef.current = false;
        }}
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
            onClick={() => handleShapeSelect(shape.id)}
            style={{ cursor: activeMode === 'select' ? 'pointer' : 'default' }}
          >
            <ShapeRenderer
              shape={shape} 
              isSelected={shape.id === selectedShapeId}
              activeMode={activeMode}
            />
            
            {/* Add rotate handlers for selected shapes only when in rotate mode */}
            {shape.id === selectedShapeId && activeMode === 'rotate' && (
              <>
                {/* Rotate handle */}
                <div 
                  className="absolute flex items-center justify-center"
                  style={{
                    top: shape.position.y - (shape.type === 'circle' ? shape.radius : 'height' in shape ? shape.height : 0) - 20,
                    left: shape.position.x,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10,
                    width: '24px',
                    height: '24px',
                    cursor: 'ew-resize'
                  }}
                  onMouseDown={handleRotateStart}
                >
                  <div className="w-5 h-5 bg-white border-2 border-geometry-primary rounded-full flex items-center justify-center">
                    <RotateCw size={12} className="text-geometry-primary" />
                  </div>
                </div>
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
        
        {/* Display unified info panel */}
        {(selectedPoint || selectedShapeId) && (
          <div 
            className="absolute w-80 unified-info-panel-container"
            style={{
              bottom: '1rem',
              right: showCalibration ? 'calc(20rem + 1rem)' : '1rem',
              zIndex: 60,
              transition: 'right 0.2s ease-in-out'
            }}
          >
            <UnifiedInfoPanel 
              // Point info props
              point={selectedPoint ? {
                ...selectedPoint,
                navigationStepSize: isShiftPressed ? 1.0 : selectedPoint.navigationStepSize,
                isValid: true
              } : null}
              gridPosition={gridPosition}
              pixelsPerUnit={pixelsPerUnit}
              
              // Shape info props
              selectedShape={selectedShapeId ? shapes.find(s => s.id === selectedShapeId) || null : null}
              measurements={selectedShapeId ? getMeasurementsForSelectedShape() : {}}
              measurementUnit={measurementUnit || 'cm'}
              onMeasurementUpdate={handleMeasurementUpdate}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default GeometryCanvas;
