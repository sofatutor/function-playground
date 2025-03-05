/**
 * Shape Updates Module
 * 
 * This module contains utility functions for updating shapes based on measurement changes.
 * It handles updating various properties of different shape types (circle, rectangle, triangle, line)
 * when a measurement value is changed by the user.
 */

import { AnyShape, Circle, Rectangle, Triangle, Point, Line, ShapeType, Shape } from '@/types/shapes';
import { updateTriangleFromSideLength, updateTriangleFromAngle, calculateTriangleAngles } from './triangle';
import { distanceBetweenPoints } from './common';
import { calculateShapeCenter } from './shapeOperations';

/**
 * Updates a shape based on a measurement change
 * @param shape The shape to update
 * @param measurementKey The key of the measurement being changed
 * @param newValue The new value in the current unit
 * @param valueInPixels The new value converted to pixels
 * @returns A new shape with the updated measurement
 */
export const updateShapeFromMeasurement = (
  shape: AnyShape | null | undefined,
  measurementKey: string,
  newValue: number,
  valueInPixels: number
): AnyShape => {
  // Validate inputs
  if (!shape || !measurementKey || typeof newValue !== 'number' || typeof valueInPixels !== 'number') {
    console.warn('Invalid parameters provided to updateShapeFromMeasurement');
    return shape || {} as AnyShape;
  }

  // Handle different shape types
  switch (shape.type) {
    case 'circle':
      return updateCircleFromMeasurement(shape as Circle, measurementKey, valueInPixels);
    case 'rectangle':
      return updateRectangleFromMeasurement(shape as Rectangle, measurementKey, valueInPixels);
    case 'triangle':
      return updateTriangleFromMeasurement(shape as Triangle, measurementKey, newValue, valueInPixels);
    case 'line':
      return updateLineFromMeasurement(shape as Line, measurementKey, newValue, valueInPixels);
    default:
      console.warn(`Unhandled shape type: ${(shape as Shape).type}`);
      return shape;
  }
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
      return {
        ...circle,
        radius: valueInPixels
      };
    case 'diameter':
      return {
        ...circle,
        radius: valueInPixels / 2
      };
    case 'circumference':
      // C = 2πr, so r = C/(2π)
      return {
        ...circle,
        radius: valueInPixels / (2 * Math.PI)
      };
    case 'area':
      // A = πr², so r = √(A/π)
      return {
        ...circle,
        radius: Math.sqrt(valueInPixels / Math.PI)
      };
    default:
      console.warn(`Unhandled measurement update: ${measurementKey} for shape type circle`);
      return circle;
  }
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
      return {
        ...rectangle,
        width: valueInPixels
      };
    case 'height':
      return {
        ...rectangle,
        height: valueInPixels
      };
    case 'area': {
      // For area, we'll maintain the aspect ratio
      const aspectRatio = rectangle.width / rectangle.height;
      const newHeight = Math.sqrt(valueInPixels / aspectRatio);
      const newWidth = newHeight * aspectRatio;
      return {
        ...rectangle,
        width: newWidth,
        height: newHeight
      };
    }
    case 'perimeter': {
      // For perimeter, we'll maintain the aspect ratio
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
    }
    case 'diagonal': {
      // For diagonal, we'll maintain the aspect ratio
      // d² = w² + h², with w = aspectRatio * h
      // d² = (aspectRatio * h)² + h² = h²(aspectRatio² + 1)
      // h = d / √(aspectRatio² + 1)
      const aspectRatio = rectangle.width / rectangle.height;
      const newHeight = valueInPixels / Math.sqrt(aspectRatio * aspectRatio + 1);
      const newWidth = aspectRatio * newHeight;
      return {
        ...rectangle,
        width: newWidth,
        height: newHeight
      };
    }
    default:
      console.warn(`Unhandled measurement update: ${measurementKey} for shape type rectangle`);
      return rectangle;
  }
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
    const sideIndex = parseInt(measurementKey.slice(-1)) - 1;
    return updateTriangleFromSideLength(triangle, sideIndex, valueInPixels);
  }
  // Handle angle updates
  else if (measurementKey === 'angle1' || measurementKey === 'angle2' || measurementKey === 'angle3') {
    // Ensure the angle value is an integer
    const intAngleValue = Math.round(newValue);
    
    // Validate the angle is within range
    if (intAngleValue <= 0 || intAngleValue >= 180) {
      console.warn(`Invalid angle value: ${intAngleValue}. Must be between 0 and 180.`);
      return triangle;
    }
    
    // Get the angle index (0, 1, or 2)
    const angleIndex = parseInt(measurementKey.slice(-1)) - 1;
    
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
  }
  // Handle area updates
  else if (measurementKey === 'area') {
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
  }
  // Handle perimeter updates
  else if (measurementKey === 'perimeter') {
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
  }
  
  console.warn(`Unhandled measurement update: ${measurementKey} for shape type triangle`);
  return triangle;
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
  } else if (measurementKey === 'angle') {
    const center = line.position;
    
    // Use the exact angle value provided by the user
    const angleValue = newValue;
    
    // Convert angle to radians
    const angleRad = (angleValue * Math.PI) / 180;
    
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
      rotation: angleValue
    };
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