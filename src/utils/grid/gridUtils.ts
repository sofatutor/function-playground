import { Point, MeasurementUnit } from '@/types/shapes';

/**
 * Snaps a point to the nearest grid line
 * 
 * @param point The point to snap
 * @param gridPosition The origin of the grid
 * @param pixelsPerUnit The number of pixels per unit (mm, cm, inch)
 * @param useSmallUnit Whether to use small units (mm) or large units (cm/inch)
 * @param measurementUnit The current measurement unit
 * @param pixelsPerCm Pixels per cm
 * @param pixelsPerMm Pixels per mm
 * @param pixelsPerInch Pixels per inch
 * @returns The snapped point
 */
export const snapToGrid = (
  point: Point,
  gridPosition: Point | null,
  useSmallUnit = true,
  measurementUnit: MeasurementUnit = 'cm',
  pixelsPerCm: number = 0,
  pixelsPerMm: number = 0,
  pixelsPerInch: number = 0
): Point => {
  // Choose the appropriate grid size based on the unit
  const gridSize = useSmallUnit 
    ? pixelsPerMm 
    : (measurementUnit === 'cm' ? pixelsPerCm : pixelsPerInch);
  
  // If grid size is invalid, return the original point
  if (!gridSize || gridSize <= 0) {
    return point;
  }
  
  // If no grid position is provided, use (0,0)
  const origin = gridPosition || { x: 0, y: 0 };
  
  // Calculate the offset from the origin
  const offsetX = point.x - origin.x;
  const offsetY = point.y - origin.y;
  
  // Round to the nearest grid line
  const snappedOffsetX = Math.round(offsetX / gridSize) * gridSize;
  const snappedOffsetY = Math.round(offsetY / gridSize) * gridSize;
  
  // Add the origin back to get the final position
  return {
    x: snappedOffsetX + origin.x,
    y: snappedOffsetY + origin.y
  };
};

/**
 * Determines if a grid position change is significant enough to update
 * 
 * @param newPosition The new grid position
 * @param currentPosition The current grid position
 * @param threshold The minimum change threshold (in pixels)
 * @returns Whether the change is significant
 */
export const isSignificantGridChange = (
  newPosition: Point,
  currentPosition: Point | null,
  threshold: number = 1
): boolean => {
  if (!currentPosition) return true;
  
  return Math.abs(newPosition.x - currentPosition.x) > threshold || 
         Math.abs(newPosition.y - currentPosition.y) > threshold;
};

/**
 * Handles keyboard modifiers for grid operations
 * 
 * @param event The keyboard event
 * @returns Object containing modifier states
 */
export const getGridModifiers = (event: KeyboardEvent | MouseEvent | React.MouseEvent | undefined) => {
  if (!event) return { shiftPressed: false, altPressed: false };
  
  return {
    shiftPressed: 'shiftKey' in event ? event.shiftKey : false,
    altPressed: 'altKey' in event ? event.altKey : false
  };
}; 