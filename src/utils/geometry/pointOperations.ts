import { Point } from '@/types/shapes';

/**
 * Calculates the distance between two points
 */
export const distanceBetweenPoints = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

/**
 * Moves a point by a delta
 */
export const movePoint = (point: Point, deltaX: number, deltaY: number): Point => {
  return {
    x: point.x + deltaX,
    y: point.y + deltaY
  };
};

/**
 * Scales a point from a center point by a factor
 */
export const scalePoint = (point: Point, center: Point, factor: number): Point => {
  // Vector from center to point
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  
  // Scale the vector
  const scaledDx = dx * factor;
  const scaledDy = dy * factor;
  
  // Return the new point
  return {
    x: center.x + scaledDx,
    y: center.y + scaledDy
  };
};

/**
 * Rotates a point around a center point by an angle in degrees
 */
export const rotatePoint = (point: Point, center: Point, angleDegrees: number): Point => {
  // Convert angle to radians
  const angleRadians = (angleDegrees * Math.PI) / 180;
  
  // Translate point to origin
  const translatedX = point.x - center.x;
  const translatedY = point.y - center.y;
  
  // Rotate point
  const rotatedX = translatedX * Math.cos(angleRadians) - translatedY * Math.sin(angleRadians);
  const rotatedY = translatedX * Math.sin(angleRadians) + translatedY * Math.cos(angleRadians);
  
  // Translate point back
  return {
    x: rotatedX + center.x,
    y: rotatedY + center.y
  };
};

/**
 * Calculates the midpoint between two points
 */
export const midpoint = (p1: Point, p2: Point): Point => {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2
  };
};

/**
 * Calculates the angle between two points in degrees (0-360)
 */
export const angleBetweenPoints = (p1: Point, p2: Point): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  
  // Calculate angle in radians and convert to degrees
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);
  
  // Normalize to 0-360 range
  if (angle < 0) {
    angle += 360;
  }
  
  return angle;
}; 