import { useCallback, useMemo } from 'react';
import { AnyShape, MeasurementUnit } from '@/types/shapes';
import { getShapeMeasurements, convertFromPixels } from '@/utils/geometry/measurements';

interface UseMeasurementsPanelOptions {
  shapes: AnyShape[];
  selectedShapeId: string | null;
  measurementUnit: MeasurementUnit;
  pixelsPerUnit: number;
  onMeasurementUpdate?: (id: string, key: string, value: number) => void;
}

/**
 * Hook for managing measurements panel read/update operations
 */
export const useMeasurementsPanel = ({
  shapes,
  selectedShapeId,
  measurementUnit,
  pixelsPerUnit,
  onMeasurementUpdate,
}: UseMeasurementsPanelOptions) => {
  
  // Get measurements for the selected shape
  const selectedShapeMeasurements = useMemo(() => {
    if (!selectedShapeId) return null;
    
    const selectedShape = shapes.find(shape => shape.id === selectedShapeId);
    if (!selectedShape) return null;
    
    // Create a converter function based on the measurement unit and pixels per unit
    const converter = (pixels: number) => {
      if (measurementUnit === 'in') {
        return pixels / pixelsPerUnit; // Assuming pixelsPerUnit is for inches when unit is 'in'
      }
      return pixels / pixelsPerUnit; // For 'cm' and other units
    };
    
    const measurements = getShapeMeasurements(selectedShape, converter);
    
    // Convert numeric measurements to string format expected by UI
    const stringMeasurements: Record<string, string> = {};
    Object.entries(measurements).forEach(([key, value]) => {
      stringMeasurements[key] = value.toFixed(2);
    });
    
    return stringMeasurements;
  }, [shapes, selectedShapeId, measurementUnit, pixelsPerUnit]);

  // Handle measurement updates
  const handleMeasurementUpdate = useCallback((key: string, value: number) => {
    if (!selectedShapeId || !onMeasurementUpdate) return;
    
    onMeasurementUpdate(selectedShapeId, key, value);
  }, [selectedShapeId, onMeasurementUpdate]);

  // Get the currently selected shape
  const selectedShape = useMemo(() => {
    if (!selectedShapeId) return null;
    return shapes.find(shape => shape.id === selectedShapeId) || null;
  }, [shapes, selectedShapeId]);

  return {
    selectedShape,
    selectedShapeMeasurements,
    handleMeasurementUpdate,
  };
};