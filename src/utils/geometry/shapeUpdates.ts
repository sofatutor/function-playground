/**
 * Shape Updates Module
 * 
 * This module contains utility functions for updating shapes based on measurement changes.
 * It handles updating various properties of different shape types (circle, rectangle, triangle, line)
 * when a measurement value is changed by the user.
 * 
 * The module is organized into shape-specific update functions, with a main entry point
 * `updateShapeFromMeasurement` that routes to the appropriate handler based on shape type.
 */

import { AnyShape, Circle, Rectangle, Triangle, Point, Line, ShapeType, Shape, isCircle, isRectangle, isTriangle, isLine } from '@/types/shapes';
import { updateTriangleFromSideLength, updateTriangleFromAngle, calculateTriangleAngles } from './triangle';
import { distanceBetweenPoints } from './common';
import { calculateShapeCenter } from './shapeOperations';
import { degreesToRadians, toCounterclockwiseAngle } from './rotation';

// Type for measurement update handlers
type MeasurementUpdateHandler<T extends AnyShape> = (shape: T, measurementKey: string, newValue: number, valueInPixels: number) => T;

/**
 * Updates a shape based on a measurement change
 * @param shape The shape to update
 * @param measurementKey The key of the measurement being changed
 * @param newValue The new value in the current unit
 * @param valueInPixels The new value converted to pixels
 * @returns A new shape with the updated measurement
 * @throws Error if invalid parameters are provided
 */
export const updateShapeFromMeasurement = (
  shape: AnyShape | null | undefined,
  measurementKey: string,
  newValue: number,
  valueInPixels: number
): AnyShape => {
  // Validate inputs
  if (!shape) {
    throw new Error('Cannot update a null or undefined shape');
  }
  
  if (!measurementKey) {
    throw new Error('Measurement key is required');
  }
  
  if (typeof newValue !== 'number' || isNaN(newValue)) {
    throw new Error(`Invalid measurement value: ${newValue}`);
  }
  
  if (typeof valueInPixels !== 'number' || isNaN(valueInPixels)) {
    throw new Error(`Invalid pixel value: ${valueInPixels}`);
  }

  // Use type guards to determine shape type and call the appropriate handler
  if (isCircle(shape)) {
    return updateCircleFromMeasurement(shape, measurementKey, valueInPixels);
  } else if (isRectangle(shape)) {
    return updateRectangleFromMeasurement(shape, measurementKey, valueInPixels);
  } else if (isTriangle(shape)) {
    return updateTriangleFromMeasurement(shape, measurementKey, newValue, valueInPixels);
  } else if (isLine(shape)) {
    return updateLineFromMeasurement(shape, measurementKey, newValue, valueInPixels);
  } else {
    // At this point, shape is of an unknown type, so we need to cast it to access the type property
    const unknownShape = shape as unknown as { type: string };
    console.warn(`Unhandled shape type: ${unknownShape.type}`);
    return shape;
  }
};

// Circle measurement update handlers

/**
 * Updates a circle's radius
 * @param circle The circle to update
 * @param valueInPixels The new radius value in pixels
 * @returns A new circle with the updated radius
 */
const updateCircleRadius = (circle: Circle, valueInPixels: number): Circle => {
  if (valueInPixels <= 0) {
    console.warn(`Invalid radius value: ${valueInPixels}. Must be greater than 0.`);
    return circle;
  }
  
  return {
    ...circle,
    radius: valueInPixels
  };
};

/**
 * Updates a circle's diameter
 * @param circle The circle to update
 * @param valueInPixels The new diameter value in pixels
 * @returns A new circle with the updated radius based on the diameter
 */
const updateCircleDiameter = (circle: Circle, valueInPixels: number): Circle => {
  if (valueInPixels <= 0) {
    console.warn(`Invalid diameter value: ${valueInPixels}. Must be greater than 0.`);
    return circle;
  }
  
  return {
    ...circle,
    radius: valueInPixels / 2
  };
};

/**
 * Updates a circle's circumference
 * @param circle The circle to update
 * @param valueInPixels The new circumference value in pixels
 * @returns A new circle with the updated radius based on the circumference
 */
const updateCircleCircumference = (circle: Circle, valueInPixels: number): Circle => {
  if (valueInPixels <= 0) {
    console.warn(`Invalid circumference value: ${valueInPixels}. Must be greater than 0.`);
    return circle;
  }
  
  // C = 2πr, so r = C/(2π)
  return {
    ...circle,
    radius: valueInPixels / (2 * Math.PI)
  };
};

/**
 * Updates a circle's area
 * @param circle The circle to update
 * @param valueInPixels The new area value in pixels
 * @returns A new circle with the updated radius based on the area
 */
const updateCircleArea = (circle: Circle, valueInPixels: number): Circle => {
  if (valueInPixels <= 0) {
    console.warn(`Invalid area value: ${valueInPixels}. Must be greater than 0.`);
    return circle;
  }
  
  // A = πr², so r = √(A/π)
  return {
    ...circle,
    radius: Math.sqrt(valueInPixels / Math.PI)
  };
};

/**
 * Updates a circle based on a measurement change
 * @param circle The circle to update
 * @param measurementKey The key of the measurement being changed
 * @param valueInPixels The new value in pixels
 * @returns A new circle with the updated measurement
 */
const updateCircleFromMeasurement = (
  circle: Circle,
  measurementKey: string,
  valueInPixels: number
): Circle => {
  switch (measurementKey) {
    case 'radius':
      return updateCircleRadius(circle, valueInPixels);
    case 'diameter':
      return updateCircleDiameter(circle, valueInPixels);
    case 'circumference':
      return updateCircleCircumference(circle, valueInPixels);
    case 'area':
      return updateCircleArea(circle, valueInPixels);
    default:
      console.warn(`Unhandled measurement update: ${measurementKey} for shape type circle`);
      return circle;
  }
};

// Rectangle measurement update handlers

/**
 * Updates a rectangle's width
 * @param rectangle The rectangle to update
 * @param valueInPixels The new width value in pixels
 * @returns A new rectangle with the updated width
 */
const updateRectangleWidth = (rectangle: Rectangle, valueInPixels: number): Rectangle => {
  if (valueInPixels <= 0) {
    console.warn(`Invalid width value: ${valueInPixels}. Must be greater than 0.`);
    return rectangle;
  }
  
  return {
    ...rectangle,
    width: valueInPixels
  };
};

/**
 * Updates a rectangle's height
 * @param rectangle The rectangle to update
 * @param valueInPixels The new height value in pixels
 * @returns A new rectangle with the updated height
 */
const updateRectangleHeight = (rectangle: Rectangle, valueInPixels: number): Rectangle => {
  if (valueInPixels <= 0) {
    console.warn(`Invalid height value: ${valueInPixels}. Must be greater than 0.`);
    return rectangle;
  }
  
  return {
    ...rectangle,
    height: valueInPixels
  };
};

/**
 * Updates a rectangle's area while maintaining aspect ratio
 * @param rectangle The rectangle to update
 * @param valueInPixels The new area value in pixels
 * @returns A new rectangle with the updated dimensions based on the area
 */
const updateRectangleArea = (rectangle: Rectangle, valueInPixels: number): Rectangle => {
  if (valueInPixels <= 0) {
    console.warn(`Invalid area value: ${valueInPixels}. Must be greater than 0.`);
    return rectangle;
  }
  
  const aspectRatio = rectangle.width / rectangle.height;
  const newHeight = Math.sqrt(valueInPixels / aspectRatio);
  const newWidth = newHeight * aspectRatio;
  
  return {
    ...rectangle,
    width: newWidth,
    height: newHeight
  };
};

/**
 * Updates a rectangle's perimeter while maintaining aspect ratio
 * @param rectangle The rectangle to update
 * @param valueInPixels The new perimeter value in pixels
 * @returns A new rectangle with the updated dimensions based on the perimeter
 */
const updateRectanglePerimeter = (rectangle: Rectangle, valueInPixels: number): Rectangle => {
  if (valueInPixels <= 0) {
    console.warn(`Invalid perimeter value: ${valueInPixels}. Must be greater than 0.`);
    return rectangle;
  }
  
  const aspectRatio = rectangle.width / rectangle.height;
  // P = 2w + 2h, with w = aspectRatio * h
  // P = 2(aspectRatio * h) + 2h = 2h(aspectRatio + 1)
  // h = P / (2(aspectRatio + 1))
  const newHeight = valueInPixels / (2 * (aspectRatio + 1));
  const newWidth = aspectRatio * newHeight;
  
  return {
    ...rectangle,
    width: newWidth,
    height: newHeight
  };
};

/**
 * Updates a rectangle's diagonal while maintaining aspect ratio
 * @param rectangle The rectangle to update
 * @param valueInPixels The new diagonal value in pixels
 * @returns A new rectangle with the updated dimensions based on the diagonal
 */
const updateRectangleDiagonal = (rectangle: Rectangle, valueInPixels: number): Rectangle => {
  if (valueInPixels <= 0) {
    console.warn(`Invalid diagonal value: ${valueInPixels}. Must be greater than 0.`);
    return rectangle;
  }
  
  const aspectRatio = rectangle.width / rectangle.height;
  // d² = w² + h², with w = aspectRatio * h
  // d² = (aspectRatio * h)² + h² = h²(aspectRatio² + 1)
  // h = d / √(aspectRatio² + 1)
  const newHeight = valueInPixels / Math.sqrt(aspectRatio * aspectRatio + 1);
  const newWidth = aspectRatio * newHeight;
  
  return {
    ...rectangle,
    width: newWidth,
    height: newHeight
  };
};

/**
 * Updates a rectangle based on a measurement change
 * @param rectangle The rectangle to update
 * @param measurementKey The key of the measurement being changed
 * @param valueInPixels The new value in pixels
 * @returns A new rectangle with the updated measurement
 */
const updateRectangleFromMeasurement = (
  rectangle: Rectangle,
  measurementKey: string,
  valueInPixels: number
): Rectangle => {
  switch (measurementKey) {
    case 'width':
      return updateRectangleWidth(rectangle, valueInPixels);
    case 'height':
      return updateRectangleHeight(rectangle, valueInPixels);
    case 'area':
      return updateRectangleArea(rectangle, valueInPixels);
    case 'perimeter':
      return updateRectanglePerimeter(rectangle, valueInPixels);
    case 'diagonal':
      return updateRectangleDiagonal(rectangle, valueInPixels);
    default:
      console.warn(`Unhandled measurement update: ${measurementKey} for shape type rectangle`);
      return rectangle;
  }
};

// Triangle measurement update handlers

/**
 * Updates a triangle based on a side length change
 * @param triangle The triangle to update
 * @param measurementKey The key of the measurement being changed
 * @param valueInPixels The new value in pixels
 * @returns A new triangle with the updated side length
 */
const updateTriangleSideLength = (
  triangle: Triangle,
  measurementKey: string,
  valueInPixels: number
): Triangle => {
  if (valueInPixels <= 0) {
    console.warn(`Invalid side length value: ${valueInPixels}. Must be greater than 0.`);
    return triangle;
  }
  
  const sideIndex = parseInt(measurementKey.slice(-1)) - 1;
  if (sideIndex < 0 || sideIndex > 2) {
    console.warn(`Invalid side index: ${sideIndex}. Must be 0, 1, or 2.`);
    return triangle;
  }
  
  return updateTriangleFromSideLength(triangle, sideIndex, valueInPixels);
};

/**
 * Updates a triangle based on an angle change
 * @param triangle The triangle to update
 * @param measurementKey The key of the measurement being changed
 * @param newValue The new angle value in degrees
 * @returns A new triangle with the updated angle
 */
const updateTriangleAngle = (
  triangle: Triangle,
  measurementKey: string,
  newValue: number
): Triangle => {
  // Ensure the angle value is an integer
  const intAngleValue = Math.round(newValue);
  
  // Validate the angle is within range
  if (intAngleValue <= 0 || intAngleValue >= 180) {
    console.warn(`Invalid angle value: ${intAngleValue}. Must be between 0 and 180.`);
    return triangle;
  }
  
  // Get the angle index (0, 1, or 2)
  const angleIndex = parseInt(measurementKey.slice(-1)) - 1;
  if (angleIndex < 0 || angleIndex > 2) {
    console.warn(`Invalid angle index: ${angleIndex}. Must be 0, 1, or 2.`);
    return triangle;
  }
  
  // Calculate the current side lengths
  const sides = [
    distanceBetweenPoints(triangle.points[1], triangle.points[2]),
    distanceBetweenPoints(triangle.points[0], triangle.points[2]),
    distanceBetweenPoints(triangle.points[0], triangle.points[1])
  ];
  
  // Calculate the current angles
  const currentAngles = calculateTriangleAngles(
    sides[0],
    sides[1],
    sides[2]
  ).map(a => Math.round(a)) as [number, number, number];
  
  // Update the triangle points based on the new angle
  const newPoints = updateTriangleFromAngle(
    triangle.points,
    angleIndex,
    intAngleValue,
    currentAngles
  );
  
  return {
    ...triangle,
    points: newPoints
  };
};

/**
 * Updates a triangle based on an area change
 * @param triangle The triangle to update
 * @param valueInPixels The new area value in pixels
 * @returns A new triangle with the updated area
 */
const updateTriangleArea = (
  triangle: Triangle,
  valueInPixels: number
): Triangle => {
  if (valueInPixels <= 0) {
    console.warn(`Invalid area value: ${valueInPixels}. Must be greater than 0.`);
    return triangle;
  }
  
  // For area, we'll scale the triangle uniformly
  const currentArea = calculateTriangleArea(triangle.points);
  const scaleFactor = Math.sqrt(valueInPixels / currentArea);
  
  // Scale the points from the center
  const center = calculateShapeCenter(triangle);
  
  const newPoints: [Point, Point, Point] = triangle.points.map(point => ({
    x: center.x + (point.x - center.x) * scaleFactor,
    y: center.y + (point.y - center.y) * scaleFactor
  })) as [Point, Point, Point];
  
  return {
    ...triangle,
    points: newPoints
  };
};

/**
 * Updates a triangle based on a perimeter change
 * @param triangle The triangle to update
 * @param valueInPixels The new perimeter value in pixels
 * @returns A new triangle with the updated perimeter
 */
const updateTrianglePerimeter = (
  triangle: Triangle,
  valueInPixels: number
): Triangle => {
  if (valueInPixels <= 0) {
    console.warn(`Invalid perimeter value: ${valueInPixels}. Must be greater than 0.`);
    return triangle;
  }
  
  // For perimeter, we'll scale the triangle uniformly
  const currentPerimeter = calculateTrianglePerimeter(triangle.points);
  const scaleFactor = valueInPixels / currentPerimeter;
  
  // Scale the points from the center
  const center = calculateShapeCenter(triangle);
  
  const newPoints: [Point, Point, Point] = triangle.points.map(point => ({
    x: center.x + (point.x - center.x) * scaleFactor,
    y: center.y + (point.y - center.y) * scaleFactor
  })) as [Point, Point, Point];
  
  return {
    ...triangle,
    points: newPoints
  };
};

/**
 * Updates a triangle based on a measurement change
 * @param triangle The triangle to update
 * @param measurementKey The key of the measurement being changed
 * @param newValue The new value in the current unit
 * @param valueInPixels The new value in pixels
 * @returns A new triangle with the updated measurement
 */
const updateTriangleFromMeasurement = (
  triangle: Triangle,
  measurementKey: string,
  newValue: number,
  valueInPixels: number
): Triangle => {
  // Handle side length updates
  if (measurementKey === 'side1' || measurementKey === 'side2' || measurementKey === 'side3') {
    return updateTriangleSideLength(triangle, measurementKey, valueInPixels);
  }
  // Handle angle updates
  else if (measurementKey === 'angle1' || measurementKey === 'angle2' || measurementKey === 'angle3') {
    return updateTriangleAngle(triangle, measurementKey, newValue);
  }
  // Handle area updates
  else if (measurementKey === 'area') {
    return updateTriangleArea(triangle, valueInPixels);
  }
  // Handle perimeter updates
  else if (measurementKey === 'perimeter') {
    return updateTrianglePerimeter(triangle, valueInPixels);
  }
  
  console.warn(`Unhandled measurement update: ${measurementKey} for shape type triangle`);
  return triangle;
};

// Line measurement update handlers

/**
 * Updates a line based on a length change
 * @param line The line to update
 * @param valueInPixels The new length value in pixels
 * @returns A new line with the updated length
 */
const updateLineLength = (
  line: Line,
  valueInPixels: number
): Line => {
  if (valueInPixels <= 0) {
    console.warn(`Invalid length value: ${valueInPixels}. Must be greater than 0.`);
    return line;
  }
  
  const currentLength = line.length;
  const scaleFactor = valueInPixels / currentLength;
  
  // Scale the line from its center
  const center = line.position;
  
  // Calculate new endpoints by scaling from the center
  const newStartPoint = {
    x: center.x + (line.startPoint.x - center.x) * scaleFactor,
    y: center.y + (line.startPoint.y - center.y) * scaleFactor
  };
  
  const newEndPoint = {
    x: center.x + (line.endPoint.x - center.x) * scaleFactor,
    y: center.y + (line.endPoint.y - center.y) * scaleFactor
  };
  
  return {
    ...line,
    startPoint: newStartPoint,
    endPoint: newEndPoint,
    length: valueInPixels
  };
};

/**
 * Updates a line based on an angle change
 * @param line The line to update
 * @param newValue The new angle value in degrees (clockwise from UI)
 * @returns A new line with the updated angle
 */
const updateLineAngle = (
  line: Line,
  newValue: number
): Line => {
  const center = line.position;
  
  // Convert UI angle (clockwise) to mathematical angle (counterclockwise)
  const newValueCounterclockwise = toCounterclockwiseAngle(newValue);
  
  // Convert angle from degrees (counterclockwise) to radians (counterclockwise)
  const angleRad = degreesToRadians(newValueCounterclockwise);
  
  // Calculate the current length
  const currentLength = line.length;
  
  // Calculate the half-length (distance from center to endpoint)
  const halfLength = currentLength / 2;
  
  // Calculate new endpoints based on the angle
  const newStartPoint = {
    x: center.x - Math.cos(angleRad) * halfLength,
    y: center.y - Math.sin(angleRad) * halfLength
  };
  
  const newEndPoint = {
    x: center.x + Math.cos(angleRad) * halfLength,
    y: center.y + Math.sin(angleRad) * halfLength
  };
  
  return {
    ...line,
    startPoint: newStartPoint,
    endPoint: newEndPoint,
    rotation: newValue // Store rotation in degrees in the model (clockwise from UI)
  };
};

/**
 * Updates a line based on a measurement change
 * @param line The line to update
 * @param measurementKey The key of the measurement being changed
 * @param newValue The new value in the current unit
 * @param valueInPixels The new value in pixels
 * @returns A new line with the updated measurement
 */
const updateLineFromMeasurement = (
  line: Line,
  measurementKey: string,
  newValue: number,
  valueInPixels: number
): Line => {
  if (measurementKey === 'length') {
    return updateLineLength(line, valueInPixels);
  } else if (measurementKey === 'angle') {
    return updateLineAngle(line, newValue);
  }
  
  console.warn(`Unhandled measurement update: ${measurementKey} for shape type line`);
  return line;
};

/**
 * Helper function to calculate triangle area
 * @param points The three points of the triangle
 * @returns The area of the triangle
 */
const calculateTriangleArea = (points: [Point, Point, Point]): number => {
  const [a, b, c] = points;
  return 0.5 * Math.abs((a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)));
};

/**
 * Helper function to calculate triangle perimeter
 * @param points The three points of the triangle
 * @returns The perimeter of the triangle
 */
const calculateTrianglePerimeter = (points: [Point, Point, Point]): number => {
  return (
    distanceBetweenPoints(points[0], points[1]) +
    distanceBetweenPoints(points[1], points[2]) +
    distanceBetweenPoints(points[2], points[0])
  );
}; 