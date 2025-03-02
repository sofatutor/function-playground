import { useState, useCallback, useMemo, useEffect } from 'react';
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

export function useShapeOperations() {
  const [shapes, setShapes] = useState<AnyShape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<OperationMode>('select');
  const [activeShapeType, setActiveShapeType] = useState<ShapeType>('rectangle');
  const [measurementUnit, setMeasurementUnit] = useState<MeasurementUnit>('cm');
  const [dragStart, setDragStart] = useState<Point | null>(null);
  
  // Get the calibrated pixels per unit values - add a dependency to force refresh
  const [refreshCalibration, setRefreshCalibration] = useState(0);
  
  // Force refresh of calibration values when component mounts
  useEffect(() => {
    setRefreshCalibration(prev => prev + 1);
  }, []);
  
  // Force refresh of calibration values when measurement unit changes
  useEffect(() => {
    setRefreshCalibration(prev => prev + 1);
  }, [measurementUnit]);
  
  // Get the calibrated pixels per unit values with refresh dependency
  const pixelsPerCm = useMemo(() => getStoredPixelsPerUnit('cm'), [refreshCalibration]);
  const pixelsPerInch = useMemo(() => getStoredPixelsPerUnit('in'), [refreshCalibration]);
  
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
    setShapes(prevShapes => [...prevShapes, newShape]);
    setSelectedShapeId(newShape.id);
    toast.success(`${activeShapeType} created!`);
    return newShape.id;
  }, [activeShapeType]);
  
  // Select a shape
  const handleSelectShape = useCallback((id: string | null) => {
    setShapes(prevShapes => selectShape(prevShapes, id));
    setSelectedShapeId(id);
  }, []);
  
  // Move a shape
  const handleMoveShape = useCallback((id: string, newPosition: Point) => {
    setShapes(prevShapes => moveShape(prevShapes, id, newPosition));
  }, []);
  
  // Resize a shape
  const handleResizeShape = useCallback((id: string, factor: number) => {
    setShapes(prevShapes => resizeShape(prevShapes, id, factor));
  }, []);
  
  // Rotate a shape
  const handleRotateShape = useCallback((id: string, angle: number) => {
    setShapes(prevShapes => rotateShape(prevShapes, id, angle));
  }, []);
  
  // Delete a shape
  const handleDeleteShape = useCallback((id: string) => {
    setShapes(prevShapes => prevShapes.filter(shape => shape.id !== id));
    if (selectedShapeId === id) {
      setSelectedShapeId(null);
    }
    toast.info("Shape deleted");
  }, [selectedShapeId]);
  
  // Delete all shapes
  const handleDeleteAllShapes = useCallback(() => {
    setShapes([]);
    setSelectedShapeId(null);
    toast.info("All shapes cleared");
  }, []);
  
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
    
    setShapes(prevShapes =>
      prevShapes.map(shape => {
        if (shape.id !== selectedShapeId) return shape;
        
        // Use our helper function to update the shape
        return updateShapeFromMeasurement(shape, key, numValue, valueInPixels);
      })
    );
    
    toast.success("Shape updated");
  }, [selectedShapeId, getSelectedShape, handleConvertToPixels]);
  
  return {
    shapes,
    selectedShapeId,
    activeMode,
    activeShapeType,
    measurementUnit,
    setMeasurementUnit,
    dragStart,
    setDragStart,
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
    updateMeasurement: handleUpdateMeasurement
  };
} 