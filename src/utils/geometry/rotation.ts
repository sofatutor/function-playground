import { Point } from '@/types/shapes';

/**
 * Converts an angle from degrees to radians
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
export const degreesToRadians = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

/**
 * Converts an angle from radians to degrees
 * @param radians Angle in radians
 * @returns Angle in degrees
 */
export const radiansToDegrees = (radians: number): number => {
  return (radians * 180) / Math.PI;
};

/**
 * Normalizes an angle in degrees to the range [-180, 180]
 * @param degrees Angle in degrees
 * @returns Normalized angle in degrees
 */
export const normalizeAngleDegrees = (degrees: number): number => {
  // Handle special cases
  if (Math.abs(degrees) % 360 === 0) {
    return 0; // Multiples of 360 should be exactly 0
  }
  
  // Normalize to [0, 360]
  let normalized = degrees % 360;
  if (normalized < 0) normalized += 360;
  
  // Convert to [-180, 180]
  if (normalized > 180) normalized -= 360;
  
  // Special case: -180 should be represented as -180, not 180
  if (normalized === 180 && degrees < 0) return -180;
  
  return normalized;
};

/**
 * Normalizes an angle in radians to the range [-π, π]
 * @param radians Angle in radians
 * @returns Normalized angle in radians
 */
export const normalizeAngleRadians = (radians: number): number => {
  // Handle special cases
  if (Math.abs(radians) % (2 * Math.PI) < 1e-10) {
    return 0; // Multiples of 2π should be exactly 0
  }
  
  // Normalize to [0, 2π]
  let normalized = radians % (2 * Math.PI);
  if (normalized < 0) normalized += 2 * Math.PI;
  
  // Convert to [-π, π]
  if (normalized > Math.PI) normalized -= 2 * Math.PI;
  
  // Special case: -π should be represented as -π, not π
  if (Math.abs(normalized - Math.PI) < 1e-10 && radians < 0) return -Math.PI;
  
  return normalized;
};

/**
 * Rotates a point around a center point by an angle in radians
 * @param point The point to rotate
 * @param center The center point of rotation
 * @param angleRadians The angle to rotate by in radians
 * @returns The rotated point
 */
export const rotatePointRadians = (
  point: Point, 
  center: Point, 
  angleRadians: number
): Point => {
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);
  
  // Translate point to origin
  const x = point.x - center.x;
  const y = point.y - center.y;
  
  // Rotate point
  const xNew = x * cos - y * sin;
  const yNew = x * sin + y * cos;
  
  // Translate point back
  return {
    x: xNew + center.x,
    y: yNew + center.y
  };
};

/**
 * Rotates a point around a center point by an angle in degrees
 * @param point The point to rotate
 * @param center The center point of rotation
 * @param angleDegrees The angle to rotate by in degrees
 * @returns The rotated point
 */
export const rotatePointDegrees = (
  point: Point, 
  center: Point, 
  angleDegrees: number
): Point => {
  const angleRadians = degreesToRadians(angleDegrees);
  return rotatePointRadians(point, center, angleRadians);
};

/**
 * Calculates the angle between two points in radians
 * @param start The starting point
 * @param end The ending point
 * @returns The angle in radians in the range [-π, π]
 */
export const calculateAngleRadians = (start: Point, end: Point): number => {
  return Math.atan2(end.y - start.y, end.x - start.x);
};

/**
 * Calculates the angle between two points in degrees
 * @param start The starting point
 * @param end The ending point
 * @returns The angle in degrees in the range [-180, 180]
 */
export const calculateAngleDegrees = (start: Point, end: Point): number => {
  const radians = calculateAngleRadians(start, end);
  return radiansToDegrees(radians);
};

/**
 * Converts a mathematical angle (counterclockwise from x-axis) to a UI angle (clockwise from x-axis)
 * @param mathematicalAngle Angle in degrees, counterclockwise from x-axis
 * @returns Angle in degrees, clockwise from x-axis
 */
export const toClockwiseAngle = (mathematicalAngle: number): number => {
  // Special case for 360 degrees
  if (Math.abs(mathematicalAngle) % 360 === 0) {
    return 0;
  }
  // To convert from counterclockwise to clockwise, we negate the angle
  return -mathematicalAngle;
};

/**
 * Converts a UI angle (clockwise from x-axis) to a mathematical angle (counterclockwise from x-axis)
 * @param clockwiseAngle Angle in degrees, clockwise from x-axis
 * @returns Angle in degrees, counterclockwise from x-axis
 */
export const toCounterclockwiseAngle = (clockwiseAngle: number): number => {
  // Special case for 360 degrees
  if (Math.abs(clockwiseAngle) % 360 === 0) {
    return 0;
  }
  // To convert from clockwise to counterclockwise, we negate the angle
  return -clockwiseAngle;
};