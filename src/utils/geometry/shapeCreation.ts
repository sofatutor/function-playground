import { ShapeType, Point, AnyShape, Circle, Rectangle, Triangle, Line } from '@/types/shapes';
import { generateId, distanceBetweenPoints, DEFAULT_STROKE, DEFAULT_STROKE_WIDTH, getNextShapeColor } from './common';

/**
 * Validates that the input points are valid (not null/undefined and have numeric x,y values)
 * @param startPoint - The starting point for shape creation
 * @param endPoint - The ending point for shape creation
 * @throws Error if points are invalid
 */
const validatePoints = (startPoint: Point, endPoint: Point): void => {
  if (!startPoint || !endPoint) {
    throw new Error('Start and end points must be provided');
  }
  
  if (typeof startPoint.x !== 'number' || typeof startPoint.y !== 'number' ||
      typeof endPoint.x !== 'number' || typeof endPoint.y !== 'number') {
    throw new Error('Points must have numeric x and y coordinates');
  }
};

/**
 * Creates a circle shape from start and end points
 * @param startPoint - The center point of the circle
 * @param endPoint - A point on the circumference of the circle
 * @param id - The unique identifier for the shape
 * @returns A Circle object
 */
export const createCircle = (startPoint: Point, endPoint: Point, id: string): Circle => {
  const radius = distanceBetweenPoints(startPoint, endPoint);
  
  if (radius <= 0) {
    throw new Error('Circle radius must be greater than zero');
  }
  
  return {
    id,
    type: 'circle',
    position: { ...startPoint },
    radius,
    rotation: 0,
    selected: true,
    fill: getNextShapeColor(),
    stroke: DEFAULT_STROKE,
    strokeWidth: DEFAULT_STROKE_WIDTH
  };
};

/**
 * Creates a rectangle shape from start and end points
 * @param startPoint - One corner of the rectangle
 * @param endPoint - The opposite corner of the rectangle
 * @param id - The unique identifier for the shape
 * @returns A Rectangle object
 */
export const createRectangle = (startPoint: Point, endPoint: Point, id: string): Rectangle => {
  const width = Math.abs(endPoint.x - startPoint.x);
  const height = Math.abs(endPoint.y - startPoint.y);
  
  if (width <= 0 || height <= 0) {
    throw new Error('Rectangle dimensions must be greater than zero');
  }
  
  const position = {
    x: Math.min(startPoint.x, endPoint.x),
    y: Math.min(startPoint.y, endPoint.y)
  };
  
  return {
    id,
    type: 'rectangle',
    position,
    width,
    height,
    rotation: 0,
    selected: true,
    fill: getNextShapeColor(),
    stroke: DEFAULT_STROKE,
    strokeWidth: DEFAULT_STROKE_WIDTH
  };
};

/**
 * Creates a triangle shape from start and end points
 * @param startPoint - The starting point for triangle creation
 * @param endPoint - The ending point for triangle creation
 * @param id - The unique identifier for the shape
 * @returns A Triangle object
 */
export const createTriangle = (startPoint: Point, endPoint: Point, id: string): Triangle => {
  // Calculate the width based on the horizontal distance
  const width = Math.abs(endPoint.x - startPoint.x) * 1.2;
  
  if (width <= 0) {
    throw new Error('Triangle dimensions must be greater than zero');
  }
  
  // Determine the direction of the drag (left-to-right or right-to-left)
  const isRightward = endPoint.x >= startPoint.x;
  
  // Calculate the midpoint between start and end points (horizontal only)
  const midX = (startPoint.x + endPoint.x) / 2;
  const topY = Math.min(startPoint.y, endPoint.y) - width/4;
  
  // Create the right angle at the top point (p1)
  const p1 = { 
    x: midX,
    y: topY
  }; // Top point with right angle
  
  // Create the other two points to form a right-angled triangle
  // For a right angle at p1, we need the vectors p1->p2 and p1->p3 to be perpendicular
  
  // Point directly below p1
  const p2 = {
    x: midX,
    y: topY + width
  };
  
  // Point to the right or left of p1 depending on drag direction
  const p3 = {
    x: isRightward ? midX + width : midX - width,
    y: topY
  };
  
  // The position is the center of the triangle
  const position = {
    x: (p1.x + p2.x + p3.x) / 3,
    y: (p1.y + p2.y + p3.y) / 3
  };
  
  return {
    id,
    type: 'triangle',
    position,
    points: [p1, p2, p3],
    rotation: 0,
    selected: true,
    fill: getNextShapeColor(),
    stroke: DEFAULT_STROKE,
    strokeWidth: DEFAULT_STROKE_WIDTH
  };
};

/**
 * Creates a line shape from start and end points
 * @param startPoint - The starting point of the line
 * @param endPoint - The ending point of the line
 * @param id - The unique identifier for the shape
 * @returns A Line object
 */
export const createLine = (startPoint: Point, endPoint: Point, id: string): Line => {
  // Calculate the middle point as the position
  const position = {
    x: (startPoint.x + endPoint.x) / 2,
    y: (startPoint.y + endPoint.y) / 2
  };
  
  // Calculate length using distance formula
  const length = distanceBetweenPoints(startPoint, endPoint);
  
  if (length <= 0) {
    throw new Error('Line length must be greater than zero');
  }
  
  return {
    id,
    type: 'line',
    position,
    startPoint: { ...startPoint },
    endPoint: { ...endPoint },
    length,
    rotation: 0,
    selected: true,
    fill: 'transparent', // Lines don't have fill
    stroke: getNextShapeColor(), // Use a distinct color for lines
    strokeWidth: 2
  };
};

/**
 * Creates a shape based on the provided start and end points and shape type
 * @param startPoint - The starting point for shape creation
 * @param endPoint - The ending point for shape creation
 * @param activeShapeType - The type of shape to create
 * @returns A shape object of the specified type
 * @throws Error if shape type is unsupported or if points are invalid
 */
export const createShape = (
  startPoint: Point, 
  endPoint: Point, 
  activeShapeType: ShapeType
): AnyShape => {
  // Validate input points
  try {
    validatePoints(startPoint, endPoint);
  } catch (error) {
    // Add context to validation errors
    if (error instanceof Error) {
      throw new Error(`Failed to create ${activeShapeType}: ${error.message}`);
    }
    throw error;
  }
  
  // Generate a unique ID for the shape
  const id = generateId();
  
  try {
    switch (activeShapeType) {
      case 'circle':
        return createCircle(startPoint, endPoint, id);
      case 'rectangle':
        return createRectangle(startPoint, endPoint, id);
      case 'triangle':
        return createTriangle(startPoint, endPoint, id);
      case 'line':
        return createLine(startPoint, endPoint, id);
      default:
        throw new Error(`Unsupported shape type: ${activeShapeType}`);
    }
  } catch (error) {
    // Add more context to the error
    if (error instanceof Error) {
      throw new Error(`Failed to create ${activeShapeType}: ${error.message}`);
    }
    throw error;
  }
}; 
