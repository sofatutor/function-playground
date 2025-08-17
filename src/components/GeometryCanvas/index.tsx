import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import CanvasGrid from '../CanvasGrid/index';
import ShapeLayers from './ShapeLayers';
import FormulaLayer from './FormulaLayer';
import UnifiedInfoPanel from '../UnifiedInfoPanel';
import { AnyShape, Point, OperationMode, ShapeType, MeasurementUnit } from '@/types/shapes';
import { Formula } from '@/types/formula';
import { getStoredCalibrationValue } from '@/utils/calibrationHelper';
import { CANVAS_SIZE_DEBOUNCE_MS, Z_INDEX } from '@/utils/constants';
import { logger } from '@/utils/logging';
import { GridZoomProvider, useGridZoom } from '@/contexts/GridZoomContext';
import { useGridSync } from '@/hooks/useGridSync';
import { useFormulaSelection } from '@/hooks/useFormulaSelection';
import { useMeasurementsPanel } from '@/hooks/useMeasurementsPanel';
import {
  createHandleMouseDown,
  createHandleMouseMove,
  createHandleMouseUp,
} from './CanvasEventHandlers';

interface FormulaCanvasProps extends GeometryCanvasProps {
  formulas?: Formula[];
  pixelsPerUnit?: number;
  canvasTools?: React.ReactNode;
  isNonInteractive?: boolean;
  showZoomControls?: boolean;
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
  onShapeDelete?: (id: string) => void;
  onModeChange?: (mode: OperationMode) => void;
  onMoveAllShapes?: (dx: number, dy: number) => void;
  onGridPositionChange?: (newPosition: Point) => void;
  onMeasurementUpdate?: (id: string, key: string, value: number) => void;
  onFormulaSelect?: (formulaId: string) => void;
}

const GeometryCanvas: React.FC<FormulaCanvasProps> = (props) => {
  return (
    <GridZoomProvider>
      <GeometryCanvasInner {...props} />
    </GridZoomProvider>
  );
};

const GeometryCanvasInner: React.FC<FormulaCanvasProps> = ({
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
  onShapeCreate: _onShapeCreate,
  onShapeMove: _onShapeMove,
  onShapeResize: _onShapeResize,
  onShapeRotate: _onShapeRotate,
  onShapeDelete: _onShapeDelete,
  onModeChange,
  onMoveAllShapes,
  onGridPositionChange,
  onMeasurementUpdate,
  onFormulaSelect,
  canvasTools,
  isNonInteractive = false,
  showZoomControls = true
}) => {
  const { zoomFactor } = useGridZoom();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Drawing state - RESTORED from original implementation
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<Point | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<Point | null>(null);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [originalPosition, setOriginalPosition] = useState<Point | null>(null);
  const [resizeStart, setResizeStart] = useState<Point | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(1);
  const [rotateStart, setRotateStart] = useState<Point | null>(null);
  const [originalRotation, setOriginalRotation] = useState<number>(0);
  
  // Canvas size state
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  
  // Keyboard state
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  
  // Use custom hooks
  const { gridPosition, handleGridPositionChange } = useGridSync({
    onGridPositionChange,
    externalGridPosition,
  });
  
  const {
    selectedPoint,
    clearAllSelectedPoints,
    handleFormulaPointSelect,
  } = useFormulaSelection({ onFormulaSelect, onModeChange });
  
  const { selectedShape, selectedShapeMeasurements, handleMeasurementUpdate: rawHandleMeasurementUpdate } = useMeasurementsPanel({
    shapes,
    selectedShapeId,
    measurementUnit,
    pixelsPerUnit: externalPixelsPerUnit || getStoredCalibrationValue(measurementUnit),
    onMeasurementUpdate,
  });
  
  // Convert the measurement update handler to handle string values as expected by UnifiedInfoPanel
  const handleMeasurementUpdate = useCallback((key: string, value: string) => {
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      rawHandleMeasurementUpdate(key, numericValue);
    }
  }, [rawHandleMeasurementUpdate]);
  
  // Memoized calculations
  const pixelsPerUnit = useMemo(() => {
    return externalPixelsPerUnit || getStoredCalibrationValue(measurementUnit);
  }, [externalPixelsPerUnit, measurementUnit]);
  
  const zoomedPixelsPerUnit = useMemo(() => {
    return pixelsPerUnit * zoomFactor;
  }, [pixelsPerUnit, zoomFactor]);
  
  const pixelsPerSmallUnit = useMemo(() => {
    return zoomedPixelsPerUnit / 10; // for backward compatibility with original event handlers
  }, [zoomedPixelsPerUnit]);

  const scaledShapes = useMemo(() => {
    return shapes.map(shape => ({
      ...shape,
      position: {
        x: shape.position.x * zoomFactor,
        y: shape.position.y * zoomFactor
      }
    }));
  }, [shapes, zoomFactor]);
  
  // Effect to log when formulas change
  useEffect(() => {
    if (formulas) {
      logger.debug(`GeometryCanvas: Formulas updated, count: ${formulas.length}`);
    }
    
    // Clear selected point when formulas change
    clearAllSelectedPoints();
  }, [formulas, clearAllSelectedPoints]);
  
  // Clear selected points when mode changes
  useEffect(() => {
    clearAllSelectedPoints();
  }, [activeMode, clearAllSelectedPoints]);
  
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
      }, CANVAS_SIZE_DEBOUNCE_MS);
    };
    
    updateCanvasSize();
    
    window.addEventListener('resize', debouncedResize);
    
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimer);
    };
  }, []);
  
  // Track Shift key state
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
  
  // Clean up any ongoing operations when the active mode changes
  useEffect(() => {
    setIsDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
  }, [activeMode]);
  
  // Memoized event handlers
  const handleMoveAllShapes = useCallback((dx: number, dy: number) => {
    if (!onMoveAllShapes) return;
    onMoveAllShapes(dx, dy);
  }, [onMoveAllShapes]);
  
  const handleShapeSelect = useCallback((shapeId: string) => {
    if (onShapeSelect) {
      onShapeSelect(shapeId);
    }
    // Clear any selected formula point when selecting a shape
    clearAllSelectedPoints();
  }, [onShapeSelect, clearAllSelectedPoints]);

  // Create mouse event handlers - RESTORED from original implementation
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
    onShapeSelect: handleShapeSelect,
    onShapeCreate: _onShapeCreate,
    onShapeMove: _onShapeMove,
    onShapeResize: _onShapeResize,
    onShapeRotate: _onShapeRotate,
    onModeChange,
    serviceFactory: undefined // not passed from props
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
    onShapeSelect: handleShapeSelect,
    onShapeCreate: _onShapeCreate,
    onShapeMove: _onShapeMove,
    onShapeResize: _onShapeResize,
    onShapeRotate: _onShapeRotate,
    onModeChange,
    serviceFactory: undefined
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
    zoomFactor,
    setIsDrawing,
    setDrawStart,
    setDrawCurrent,
    setDragStart,
    setOriginalPosition,
    setResizeStart,
    setOriginalSize,
    setRotateStart,
    setOriginalRotation,
    onShapeSelect: handleShapeSelect,
    onShapeCreate: _onShapeCreate,
    onShapeMove: _onShapeMove,
    onShapeResize: _onShapeResize,
    onShapeRotate: _onShapeRotate,
    onModeChange,
    serviceFactory: undefined
  });
  
  return (
    <div className="relative w-full h-full">
      <div 
        id="geometry-canvas"
        ref={canvasRef}
        className="canvas-container relative w-full h-full overflow-hidden"
        style={{ 
          cursor: activeMode === 'move' ? 'move' : 'default',
          pointerEvents: isNonInteractive ? 'none' : 'auto'
        }}
        tabIndex={0}
        onMouseDown={isNonInteractive ? undefined : handleMouseDown}
        onMouseMove={isNonInteractive ? undefined : handleMouseMove}
        onMouseUp={isNonInteractive ? undefined : handleMouseUp}
        onClick={isNonInteractive ? undefined : (e) => {
          // If the click is on a path (part of the formula graph), don't dismiss
          if ((e.target as Element).tagName === 'path') {
            return;
          }
          
          // Otherwise, clear any selected formula point
          clearAllSelectedPoints();
        }}
      >
        {/* Render canvas tools */}
        {canvasTools}
        
        {/* Grid - Pass the zoomed pixel values */}
        <CanvasGrid
          key={`grid-${canvasSize.width > 0 && canvasSize.height > 0 ? 'loaded' : 'loading'}-${isFullscreen ? 'fullscreen' : 'normal'}`}
          canvasSize={canvasSize} 
          pixelsPerCm={zoomedPixelsPerUnit} 
          pixelsPerMm={zoomedPixelsPerUnit / 10} // approximate conversion for backward compatibility
          measurementUnit={measurementUnit || 'cm'}
          onMoveAllShapes={handleMoveAllShapes}
          initialPosition={gridPosition}
          onPositionChange={handleGridPositionChange}
          showZoomControls={showZoomControls}
          isNonInteractive={isNonInteractive}
        />
        
        {/* Render shapes using the new ShapeLayers component */}
        <ShapeLayers
          scaledShapes={scaledShapes}
          selectedShapeId={selectedShapeId}
          activeMode={activeMode}
          isNonInteractive={isNonInteractive}
          onShapeSelect={handleShapeSelect}
          isDrawing={isDrawing}
          drawStart={drawStart}
          drawCurrent={drawCurrent}
          activeShapeType={activeShapeType}
        />
        
        {/* Render formulas using the new FormulaLayer component */}
        <FormulaLayer
          formulas={formulas}
          gridPosition={gridPosition}
          zoomedPixelsPerUnit={zoomedPixelsPerUnit}
          selectedPoint={selectedPoint}
          onPointSelect={handleFormulaPointSelect}
        />
        
        {/* Display unified info panel - hidden in noninteractive mode */}
        {!isNonInteractive && (selectedPoint || selectedShapeId) && (
          <div 
            className="absolute w-80 unified-info-panel-container bottom-4 right-4 z-40 transition-all duration-200 ease-in-out"
            style={{ zIndex: Z_INDEX.UI_CONTROLS }}
          >
            <UnifiedInfoPanel 
              // Point info props
              point={selectedPoint ? {
                ...selectedPoint,
                navigationStepSize: isShiftPressed ? 1.0 : selectedPoint.navigationStepSize,
                isValid: true
              } : null}
              _gridPosition={gridPosition}
              _pixelsPerUnit={zoomedPixelsPerUnit}
              onNavigatePoint={(direction) => {
                // Navigation would be implemented here with the new hooks
                logger.debug('Navigate point:', direction);
              }}
              
              // Shape info props
              selectedShape={selectedShape}
              measurements={selectedShapeMeasurements || {}}
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