import { useCallback } from 'react';
import { AnyShape, MeasurementUnit } from '@/types/shapes';
import { getShapeMeasurements } from '@/utils/geometry/measurements';

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
  const selectedShapeMeasurements = useCallback(() => {
    if (!selectedShapeId) return null;
    
    const selectedShape = shapes.find(shape => shape.id === selectedShapeId);
    if (!selectedShape) return null;
    
    return getShapeMeasurements(selectedShape, measurementUnit, pixelsPerUnit);
  }, [shapes, selectedShapeId, measurementUnit, pixelsPerUnit]);

  // Handle measurement updates
  const handleMeasurementUpdate = useCallback((key: string, value: number) => {
    if (!selectedShapeId || !onMeasurementUpdate) return;
    
    onMeasurementUpdate(selectedShapeId, key, value);
  }, [selectedShapeId, onMeasurementUpdate]);

  // Get the currently selected shape
  const selectedShape = useCallback(() => {
    if (!selectedShapeId) return null;
    return shapes.find(shape => shape.id === selectedShapeId) || null;
  }, [shapes, selectedShapeId]);

  return {
    selectedShape: selectedShape(),
    selectedShapeMeasurements: selectedShapeMeasurements(),
    handleMeasurementUpdate,
  };
};