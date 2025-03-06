
import { Point } from '@/types/shapes';

/**
 * Snaps a point to the nearest grid line based on the grid settings
 * 
 * @param point The point to snap
 * @param gridOrigin The origin point of the grid
 * @param gridSize The distance between grid lines in pixels
 * @returns The snapped point
 */
export const snapToGrid = (
  point: Point,
  gridOrigin: Point | null,
  gridSize: number
): Point => {
  if (!gridOrigin || gridSize <= 0) {
    return point;
  }

  // Calculate offset from grid origin
  const dx = point.x - gridOrigin.x;
  const dy = point.y - gridOrigin.y;
  
  // Snap to nearest grid line
  const snappedDx = Math.round(dx / gridSize) * gridSize;
  const snappedDy = Math.round(dy / gridSize) * gridSize;
  
  // Return point in absolute coordinates
  return {
    x: gridOrigin.x + snappedDx,
    y: gridOrigin.y + snappedDy
  };
};
