import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { 
  AnyShape, Point, ShapeType, OperationMode, MeasurementUnit
} from '@/types/shapes';
import { toast } from 'sonner';

// Import utility functions
import { getStoredPixelsPerUnit } from '@/utils/geometry/common';
import { getShapeMeasurements, convertToPixels, convertFromPixels } from '@/utils/geometry/measurements';
// Import URL encoding utilities
import { 
  updateUrlWithShapes, 
  getShapesFromUrl, 
  getGridPositionFromUrl 
} from '@/utils/urlEncoding';
import { snapToGrid, isSignificantGridChange, getGridModifiers } from '@/utils/grid/gridUtils';

// Import service factory
import { useServiceFactory } from '@/providers/ServiceProvider';

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
  
  // Get the service factory
  const serviceFactory = useServiceFactory();
  
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
      }, 300);
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
    // Get the appropriate service for the active shape type
    const shapeService = serviceFactory.getService(activeShapeType);
    
    // Create shape parameters based on shape type
    let params: Record<string, unknown>;
    
    switch (activeShapeType) {
      case 'circle': {
        // For circles, calculate center and radius from start and end points
        const center = startPoint;
        const radius = Math.sqrt(
          Math.pow(endPoint.x - startPoint.x, 2) + 
          Math.pow(endPoint.y - startPoint.y, 2)
        );
        params = { center, radius };
        break;
      }
      case 'rectangle': {
        // For rectangles, calculate position, width, and height
        const position = {
          x: Math.min(startPoint.x, endPoint.x),
          y: Math.min(startPoint.y, endPoint.y)
        };
        const width = Math.abs(endPoint.x - startPoint.x);
        const height = Math.abs(endPoint.y - startPoint.y);
        params = { position, width, height };
        break;
      }
      case 'triangle': {
        // For triangles, create a right triangle with the right angle at the bottom left
        const points: [Point, Point, Point] = [
          { x: startPoint.x, y: startPoint.y }, // Top point
          { x: startPoint.x, y: endPoint.y },   // Bottom left (right angle)
          { x: endPoint.x, y: endPoint.y }      // Bottom right
        ];
        const position = {
          x: (points[0].x + points[1].x + points[2].x) / 3,
          y: (points[0].y + points[1].y + points[2].y) / 3
        };
        params = { points, position };
        break;
      }
      case 'line': {
        // For lines, use start and end points directly
        params = { 
          start: startPoint, 
          end: endPoint,
          position: {
            x: (startPoint.x + endPoint.x) / 2,
            y: (startPoint.y + endPoint.y) / 2
          }
        };
        break;
      }
      default:
        throw new Error(`Unsupported shape type: ${activeShapeType}`);
    }
    
    // Create the new shape using the service
    const newShape = shapeService.createShape(params);
    
    setShapes(prevShapes => {
      const updatedShapes = [...prevShapes, newShape];
      // Update URL with the new shapes
      updateUrlWithShapes(updatedShapes, gridPosition);
      return updatedShapes;
    });
    
    setSelectedShapeId(newShape.id);
    toast.success(`${activeShapeType} created!`);
    return newShape.id;
  }, [activeShapeType, gridPosition, serviceFactory]);
  
  // Select a shape
  const handleSelectShape = useCallback((id: string | null) => {
    setShapes(prevShapes => 
      prevShapes.map(shape => ({
        ...shape,
        selected: shape.id === id
      }))
    );
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
  
  // Update the move shape function to use our services
  const handleMoveShape = useCallback((id: string, newPosition: Point) => {
    // Get keyboard modifiers from the current event
    const event = window.event as KeyboardEvent | MouseEvent | undefined;
    const { shiftPressed, altPressed } = getGridModifiers(event);
    
    // Find the shape we're moving
    const shape = shapes.find(s => s.id === id);
    if (!shape) return;
    
    // Get the service for this shape
    const shapeService = serviceFactory.getServiceForShape(shape);
    
    // Only apply snapping if shift is pressed and alt is not pressed
    if (shiftPressed && !altPressed) {
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
      } else {
        // For other shapes, just snap the center
        finalPosition = handleSnapToGrid(newPosition);
      }
      
      // Calculate the delta between the original position and the final position
      const dx = finalPosition.x - shape.position.x;
      const dy = finalPosition.y - shape.position.y;
      
      // Update the shapes with the snapped position
      setShapes(prevShapes => {
        const updatedShapes = prevShapes.map(s => {
          if (s.id !== id) return s;
          return shapeService.moveShape(s, dx, dy);
        });
        
        // Update URL with the new shape positions
        updateUrlWithShapes(updatedShapes, gridPosition);
        return updatedShapes;
      });
      
      return;
    }
    
    // If no snapping or shape not found, calculate the delta and move normally
    const dx = newPosition.x - shape.position.x;
    const dy = newPosition.y - shape.position.y;
    
    setShapes(prevShapes => {
      const updatedShapes = prevShapes.map(s => {
        if (s.id !== id) return s;
        return shapeService.moveShape(s, dx, dy);
      });
      
      // Update URL with the new shape positions
      updateUrlWithShapes(updatedShapes, gridPosition);
      return updatedShapes;
    });
  }, [gridPosition, handleSnapToGrid, shapes, serviceFactory]);
  
  // Resize a shape using the service
  const handleResizeShape = useCallback((id: string, factor: number) => {
    setShapes(prevShapes => {
      const updatedShapes = prevShapes.map(shape => {
        if (shape.id !== id) return shape;
        
        // Get the service for this shape
        const shapeService = serviceFactory.getServiceForShape(shape);
        
        // Use the service to resize the shape
        return shapeService.resizeShape(shape, { scale: factor });
      });
      
      // Update URL with the resized shapes
      updateUrlWithShapes(updatedShapes, gridPosition);
      return updatedShapes;
    });
  }, [gridPosition, serviceFactory]);
  
  // Rotate a shape using the service
  const handleRotateShape = useCallback((id: string, angle: number) => {
    setShapes(prevShapes => {
      const updatedShapes = prevShapes.map(shape => {
        if (shape.id !== id) return shape;
        
        // Get the service for this shape
        const shapeService = serviceFactory.getServiceForShape(shape);
        
        // Use the service to rotate the shape
        return shapeService.rotateShape(shape, angle);
      });
      
      // Update URL with the rotated shapes
      updateUrlWithShapes(updatedShapes, gridPosition);
      return updatedShapes;
    });
  }, [gridPosition, serviceFactory]);
  
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
    // Don't reset grid position to preserve formulas/plots at their current position
    // setGridPosition(null);
    // Update URL with empty shapes but keep the current grid position
    updateUrlWithShapes([], gridPosition);
    toast.info("All shapes cleared, plots preserved");
  }, [gridPosition]);
  
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
  
  // Get measurements for a shape using the service
  const handleGetShapeMeasurements = useCallback((shape: AnyShape) => {
    // Get the service for this shape
    const shapeService = serviceFactory.getServiceForShape(shape);
    
    // Use the service to get measurements
    return shapeService.getMeasurements(shape, measurementUnit);
  }, [serviceFactory, measurementUnit]);
  
  // Get the selected shape
  const getSelectedShape = useCallback(() => {
    if (!selectedShapeId) return null;
    return shapes.find(shape => shape.id === selectedShapeId) || null;
  }, [shapes, selectedShapeId]);
  
  // Update shape based on measurement changes using the service
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
    
    // Get the service for this shape
    const shapeService = serviceFactory.getServiceForShape(selectedShape);
    
    // Get the current measurements to find the original value
    const currentMeasurements = shapeService.getMeasurements(selectedShape, measurementUnit);
    const originalValue = currentMeasurements[key] || 0;
    
    setShapes(prevShapes => {
      const updatedShapes = prevShapes.map(shape => {
        if (shape.id !== selectedShapeId) return shape;
        
        // Use the service to update the shape from measurement
        return shapeService.updateFromMeasurement(
          shape,
          key,
          numValue,
          originalValue,
          measurementUnit
        );
      });
      
      // Update URL with the updated shapes
      updateUrlWithShapes(updatedShapes, gridPosition);
      return updatedShapes;
    });
    
    toast.success("Shape updated");
  }, [selectedShapeId, getSelectedShape, measurementUnit, gridPosition, serviceFactory]);
  
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
    updateMeasurement: handleUpdateMeasurement,
    shareCanvasUrl,
    snapToGrid: handleSnapToGrid
  };
} 