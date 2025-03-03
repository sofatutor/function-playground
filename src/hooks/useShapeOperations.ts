import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { 
  AnyShape, Point, ShapeType, OperationMode, MeasurementUnit
} from '@/types/shapes';
import { toast } from 'sonner';

// Import utility functions
import { getStoredPixelsPerUnit } from '@/utils/geometry/common';
import { createShape } from '@/utils/geometry/shapeCreation';
import { selectShape, moveShape, resizeShape, rotateShape } from '@/utils/geometry/shapeOperations';
import { getShapeMeasurements, convertToPixels, convertFromPixels } from '@/utils/geometry/measurements';
import { updateShapeFromMeasurement } from '@/utils/geometry/shapeUpdates';
// Import URL encoding utilities
import { 
  updateUrlWithShapes, 
  getShapesFromUrl, 
  getGridPositionFromUrl 
} from '@/utils/urlEncoding';
import { snapToGrid, isSignificantGridChange, getGridModifiers } from '@/utils/grid/gridUtils';

export function useShapeOperations() {
  const [shapes, setShapes] = useState<AnyShape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<OperationMode>('select');
  const [activeShapeType, setActiveShapeType] = useState<ShapeType>('rectangle');
  const [measurementUnit, setMeasurementUnit] = useState<MeasurementUnit>('cm');
  const [dragStart, setDragStart] = useState<Point | null>(null);
  
  // Add state for grid position
  const [gridPosition, setGridPosition] = useState<Point | null>(null);
  
  // Get the calibrated pixels per unit values - add a dependency to force refresh
  const [refreshCalibration, setRefreshCalibration] = useState(0);
  
  // Add a ref to track if we've loaded from URL
  const hasLoadedFromUrl = useRef(false);
  
  // Add a ref to track if we're currently dragging the grid
  const isDraggingGrid = useRef(false);
  // Add a ref for the grid position update timeout
  const gridUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Load shapes and grid position from URL when component mounts
  useEffect(() => {
    if (hasLoadedFromUrl.current) {
      console.log('useShapeOperations: Already loaded from URL, skipping');
      return;
    }
    
    console.log('useShapeOperations: Loading shapes and grid position from URL');
    
    // Load shapes from URL
    const shapesFromUrl = getShapesFromUrl();
    if (shapesFromUrl && shapesFromUrl.length > 0) {
      console.log('useShapeOperations: Loaded shapes from URL:', shapesFromUrl.length, 'shapes');
      setShapes(shapesFromUrl);
      toast.success(`Loaded ${shapesFromUrl.length} shapes from URL`);
    } else {
      console.log('useShapeOperations: No shapes found in URL');
    }
    
    // Load grid position from URL
    const gridPositionFromUrl = getGridPositionFromUrl();
    if (gridPositionFromUrl) {
      console.log('useShapeOperations: Loaded grid position from URL:', gridPositionFromUrl);
      // Ensure we set the grid position with the exact values from the URL
      setGridPosition({
        x: gridPositionFromUrl.x,
        y: gridPositionFromUrl.y
      });
    } else {
      console.log('useShapeOperations: No grid position found in URL');
      // Important: Don't set a default grid position here, let the CanvasGrid component handle it
    }
    
    // Mark as loaded from URL
    hasLoadedFromUrl.current = true;
  }, []);
  
  // Update URL whenever shapes or grid position change, but only after initial load
  useEffect(() => {
    // Skip the first render to avoid overwriting the URL before we've loaded from it
    if (!hasLoadedFromUrl.current) {
      console.log('useShapeOperations: Skipping URL update until loaded from URL');
      return;
    }
    
    // Only update URL if we have shapes or a grid position
    if (shapes.length > 0 || gridPosition) {
      // Use a debounce to prevent too many URL updates
      if (gridUpdateTimeoutRef.current) {
        clearTimeout(gridUpdateTimeoutRef.current);
      }
      
      gridUpdateTimeoutRef.current = setTimeout(() => {
        console.log('useShapeOperations: Updating URL with shapes and grid position');
        updateUrlWithShapes(shapes, gridPosition);
        gridUpdateTimeoutRef.current = null;
      }, 100);
    }
    
    return () => {
      if (gridUpdateTimeoutRef.current) {
        clearTimeout(gridUpdateTimeoutRef.current);
      }
    };
  }, [shapes, gridPosition]);
  
  // Force refresh of calibration values when component mounts
  useEffect(() => {
    setRefreshCalibration(prev => prev + 1);
  }, []);
  
  // Force refresh of calibration values when measurement unit changes
  useEffect(() => {
    setRefreshCalibration(prev => prev + 1);
  }, [measurementUnit]);
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pixelsPerCm = useMemo(() => getStoredPixelsPerUnit('cm'), [refreshCalibration]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pixelsPerInch = useMemo(() => getStoredPixelsPerUnit('in'), [refreshCalibration]);
  // Calculate pixelsPerMm (1 cm = 10 mm)
  const pixelsPerMm = useMemo(() => pixelsPerCm / 10, [pixelsPerCm]);
  
  // Dynamic conversion functions that use the calibrated values
  const pixelsToCm = useCallback((pixels: number): number => {
    return pixels / pixelsPerCm;
  }, [pixelsPerCm]);
  
  const pixelsToInches = useCallback((pixels: number): number => {
    return pixels / pixelsPerInch;
  }, [pixelsPerInch]);
  
  // Create a new shape
  const handleCreateShape = useCallback((startPoint: Point, endPoint: Point) => {
    const newShape = createShape(startPoint, endPoint, activeShapeType);
    setShapes(prevShapes => {
      const updatedShapes = [...prevShapes, newShape];
      // Update URL with the new shapes
      updateUrlWithShapes(updatedShapes, gridPosition);
      return updatedShapes;
    });
    setSelectedShapeId(newShape.id);
    toast.success(`${activeShapeType} created!`);
    return newShape.id;
  }, [activeShapeType, gridPosition]);
  
  // Select a shape
  const handleSelectShape = useCallback((id: string | null) => {
    setShapes(prevShapes => selectShape(prevShapes, id));
    setSelectedShapeId(id);
  }, []);
  
  // Replace the existing snapToGrid function with our new utility
  const handleSnapToGrid = useCallback((position: Point, useSmallUnit = true): Point => {
    return snapToGrid(
      position,
      gridPosition,
      useSmallUnit,
      measurementUnit,
      pixelsPerCm,
      pixelsPerMm,
      pixelsPerInch
    );
  }, [gridPosition, measurementUnit, pixelsPerCm, pixelsPerMm, pixelsPerInch]);
  
  // Update the move shape function to handle triangles properly
  const handleMoveShape = useCallback((id: string, newPosition: Point) => {
    // Get keyboard modifiers from the current event
    const event = window.event as KeyboardEvent | MouseEvent | undefined;
    const { shiftPressed, altPressed } = getGridModifiers(event);
    
    // Only apply snapping if shift is pressed and alt is not pressed
    if (shiftPressed && !altPressed) {
      // Find the shape we're moving
      const shape = shapes.find(s => s.id === id);
      if (shape) {
        let finalPosition = { ...newPosition };
        
        // Apply different snapping logic based on shape type
        if (shape.type === 'circle') {
          // For circles, we want to snap the left and top edges
          // Calculate the left and top edge positions
          const leftEdge = { x: newPosition.x - shape.radius, y: newPosition.y };
          const topEdge = { x: newPosition.x, y: newPosition.y - shape.radius };
          
          // Snap the edges to the grid
          const snappedLeftEdge = handleSnapToGrid(leftEdge);
          const snappedTopEdge = handleSnapToGrid(topEdge);
          
          // Adjust the position to maintain the snapped edges
          finalPosition = {
            x: snappedLeftEdge.x + shape.radius,
            y: snappedTopEdge.y + shape.radius
          };
        } else if (shape.type === 'rectangle') {
          // For rectangles, just snap the center for simplicity
          finalPosition = handleSnapToGrid(newPosition);
          
          console.log('Rectangle snapping (center only):', {
            original: newPosition,
            final: finalPosition
          });
        } else if (shape.type === 'triangle') {
          // For triangles, snap the center point
          finalPosition = handleSnapToGrid(newPosition);
          
          console.log('Triangle snapping:', {
            original: newPosition,
            final: finalPosition
          });
        } else {
          // For other shapes, just snap the center
          finalPosition = handleSnapToGrid(newPosition);
        }
        
        // Update the shapes with the snapped position
        setShapes(prevShapes => {
          const updatedShapes = moveShape(prevShapes, id, finalPosition);
          // Update URL with the new shape positions
          updateUrlWithShapes(updatedShapes, gridPosition);
          return updatedShapes;
        });
        
        return;
      }
    }
    
    // If no snapping or shape not found, just move normally
    setShapes(prevShapes => {
      const updatedShapes = moveShape(prevShapes, id, newPosition);
      // Update URL with the new shape positions
      updateUrlWithShapes(updatedShapes, gridPosition);
      return updatedShapes;
    });
  }, [gridPosition, handleSnapToGrid, shapes]);
  
  // Resize a shape
  const handleResizeShape = useCallback((id: string, factor: number) => {
    setShapes(prevShapes => {
      const updatedShapes = resizeShape(prevShapes, id, factor);
      // Update URL with the resized shapes
      updateUrlWithShapes(updatedShapes, gridPosition);
      return updatedShapes;
    });
  }, [gridPosition]);
  
  // Rotate a shape
  const handleRotateShape = useCallback((id: string, angle: number) => {
    setShapes(prevShapes => {
      const updatedShapes = rotateShape(prevShapes, id, angle);
      // Update URL with the rotated shapes
      updateUrlWithShapes(updatedShapes, gridPosition);
      return updatedShapes;
    });
  }, [gridPosition]);
  
  // Delete a shape
  const handleDeleteShape = useCallback((id: string) => {
    setShapes(prevShapes => {
      const updatedShapes = prevShapes.filter(shape => shape.id !== id);
      // Update URL after deleting the shape
      updateUrlWithShapes(updatedShapes, gridPosition);
      return updatedShapes;
    });
    if (selectedShapeId === id) {
      setSelectedShapeId(null);
    }
    toast.info("Shape deleted");
  }, [selectedShapeId, gridPosition]);

  // Delete all shapes
  const handleDeleteAllShapes = useCallback(() => {
    setShapes([]);
    setSelectedShapeId(null);
    // Reset grid position to null (center of canvas)
    setGridPosition(null);
    // Clear shapes and grid position from URL
    updateUrlWithShapes([], null);
    toast.info("All shapes cleared");
  }, []);
  
  // Update the grid position update function to use our new utility
  const updateGridPosition = useCallback((newPosition: Point) => {
    console.log('useShapeOperations: Updating grid position:', newPosition);
    
    // Check if the change is significant enough to update
    if (isSignificantGridChange(newPosition, gridPosition)) {
      setGridPosition(newPosition);
    } else {
      console.log('useShapeOperations: Ignoring small grid position change to prevent oscillation');
    }
  }, [gridPosition]);
  
  // Convert physical measurements to pixels based on the current unit
  const handleConvertToPixels = useCallback((value: number): number => {
    return convertToPixels(value, measurementUnit, pixelsPerCm, pixelsPerInch);
  }, [measurementUnit, pixelsPerCm, pixelsPerInch]);
  
  // Convert pixels to physical measurements based on the current unit
  const handleConvertFromPixels = useCallback((pixels: number): number => {
    return convertFromPixels(pixels, measurementUnit, pixelsPerCm, pixelsPerInch);
  }, [measurementUnit, pixelsPerCm, pixelsPerInch]);
  
  // Get measurements for a shape in the current unit
  const handleGetShapeMeasurements = useCallback((shape: AnyShape) => {
    return getShapeMeasurements(shape, handleConvertFromPixels);
  }, [handleConvertFromPixels]);
  
  // Get the selected shape
  const getSelectedShape = useCallback(() => {
    if (!selectedShapeId) return null;
    return shapes.find(shape => shape.id === selectedShapeId) || null;
  }, [shapes, selectedShapeId]);
  
  // Update shape based on measurement changes
  const handleUpdateMeasurement = useCallback((key: string, value: string) => {
    if (!selectedShapeId) return;
    
    // Parse the input value to a number
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      toast.error("Please enter a valid positive number");
      return;
    }
    
    const selectedShape = getSelectedShape();
    if (!selectedShape) return;
    
    // Convert the value to pixels if needed
    const valueInPixels = handleConvertToPixels(numValue);
    
    setShapes(prevShapes => {
      const updatedShapes = prevShapes.map(shape => {
        if (shape.id !== selectedShapeId) return shape;
        
        // Use our helper function to update the shape
        return updateShapeFromMeasurement(shape, key, numValue, valueInPixels);
      });
      
      // Update URL with the updated shapes
      updateUrlWithShapes(updatedShapes, gridPosition);
      return updatedShapes;
    });
    
    toast.success("Shape updated");
  }, [selectedShapeId, getSelectedShape, handleConvertToPixels, gridPosition]);
  
  // Function to share the current canvas state via URL
  const shareCanvasUrl = useCallback(() => {
    // Create a URL with the current shapes and grid position
    updateUrlWithShapes(shapes, gridPosition);
    
    // Copy the URL to clipboard
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        toast.success("URL copied to clipboard! Share it to restore this canvas.");
      })
      .catch(() => {
        toast.error("Failed to copy URL to clipboard");
      });
  }, [shapes, gridPosition]);
  
  return {
    shapes,
    selectedShapeId,
    activeMode,
    activeShapeType,
    measurementUnit,
    setMeasurementUnit,
    dragStart,
    setDragStart,
    gridPosition,
    updateGridPosition,
    createShape: handleCreateShape,
    selectShape: handleSelectShape,
    moveShape: handleMoveShape,
    resizeShape: handleResizeShape,
    rotateShape: handleRotateShape,
    deleteShape: handleDeleteShape,
    deleteAllShapes: handleDeleteAllShapes,
    setActiveMode,
    setActiveShapeType,
    getShapeMeasurements: handleGetShapeMeasurements,
    getSelectedShape,
    updateShapeFromMeasurement,
    updateMeasurement: handleUpdateMeasurement,
    shareCanvasUrl,
    snapToGrid: handleSnapToGrid
  };
} 