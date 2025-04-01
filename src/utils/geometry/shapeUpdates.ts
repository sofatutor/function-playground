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

import { AnyShape, Circle, Rectangle, Triangle, Point, Line, isCircle, isRectangle, isTriangle, isLine } from '@/types/shapes';
import { updateTriangleFromAngle, calculateTriangleAngles, calculateTriangleArea } from './triangle';
import { distanceBetweenPoints } from './common';
import { calculateShapeCenter } from './shapeOperations';
import { degreesToRadians } from './rotation';

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
    radius: valueInPixels,
    originalDimensions: {
      ...circle.originalDimensions,
      radius: valueInPixels
    }
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
    width: valueInPixels,
    originalDimensions: {
      ...rectangle.originalDimensions,
      width: valueInPixels,
      height: rectangle.originalDimensions?.height || rectangle.height
    }
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
    height: valueInPixels,
    originalDimensions: {
      ...rectangle.originalDimensions,
      width: rectangle.originalDimensions?.width || rectangle.width,
      height: valueInPixels
    }
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
    height: newHeight,
    originalDimensions: {
      ...rectangle.originalDimensions,
      width: newWidth,
      height: newHeight
    }
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
  
  // Calculate the new angles after the update
  const newSides = [
    distanceBetweenPoints(newPoints[1], newPoints[2]),
    distanceBetweenPoints(newPoints[0], newPoints[2]),
    distanceBetweenPoints(newPoints[0], newPoints[1])
  ];
  
  const newAngles = calculateTriangleAngles(
    newSides[0],
    newSides[1],
    newSides[2]
  ).map(a => Math.round(a)) as [number, number, number];
  
  // Verify that the angle was updated correctly
  if (Math.abs(newAngles[angleIndex] - intAngleValue) > 5) {
    // Try a more direct approach if the angle wasn't updated correctly
    // Create a completely new triangle with the desired angle
    const remainingAngleSum = 180 - intAngleValue;
    
    // Get the indices of the other two angles
    const otherIndices = [0, 1, 2].filter(i => i !== angleIndex);
    
    // Create a new array of angles
    const targetAngles: [number, number, number] = [...currentAngles] as [number, number, number];
    targetAngles[angleIndex] = intAngleValue;
    
    // Calculate the remaining angles by distributing them proportionally
    const originalOtherSum = currentAngles[otherIndices[0]] + currentAngles[otherIndices[1]];
    
    if (originalOtherSum > 0) {
      // Use the original proportion between the other two angles
      const proportion = currentAngles[otherIndices[0]] / originalOtherSum;
      targetAngles[otherIndices[0]] = Math.max(1, Math.min(178, remainingAngleSum * proportion));
      targetAngles[otherIndices[1]] = 180 - intAngleValue - targetAngles[otherIndices[0]];
    } else {
      // If we can't determine the original proportion, split evenly
      targetAngles[otherIndices[0]] = Math.round(remainingAngleSum / 2);
      targetAngles[otherIndices[1]] = remainingAngleSum - targetAngles[otherIndices[0]];
    }
    
    // Create a new triangle with these angles
    // We'll keep one side fixed (e.g., side1) and recalculate the others
    const side1 = sides[0];
    
    // Convert angles to radians
    const anglesInRadians = targetAngles.map(a => a * (Math.PI / 180));
    
    // Calculate new side lengths using the Law of Sines
    // a/sin(A) = b/sin(B) = c/sin(C)
    const sinA = Math.sin(anglesInRadians[0]);
    const sinB = Math.sin(anglesInRadians[1]);
    const sinC = Math.sin(anglesInRadians[2]);
    
    const side2 = (side1 * sinB) / sinA;
    const side3 = (side1 * sinC) / sinA;
    
    // Reconstruct the triangle with these side lengths
    // Place the first point at the origin
    const p0 = { x: 0, y: 0 };
    
    // Place the second point along the x-axis
    const p1 = { x: side3, y: 0 };
    
    // Calculate the position of the third point using the Law of Cosines
    const angleC = anglesInRadians[2];
    const x2 = side2 * Math.cos(angleC);
    const y2 = side2 * Math.sin(angleC);
    const p2 = { x: x2, y: y2 };
    
    // Create the new triangle
    const reconstructedPoints: [Point, Point, Point] = [p0, p1, p2];
    
    // Calculate the center of the reconstructed triangle
    const reconstructedCenter = {
      x: (p0.x + p1.x + p2.x) / 3,
      y: (p0.y + p1.y + p2.y) / 3
    };
    
    // Calculate the original center
    const originalCenter = {
      x: (triangle.points[0].x + triangle.points[1].x + triangle.points[2].x) / 3,
      y: (triangle.points[0].y + triangle.points[1].y + triangle.points[2].y) / 3
    };
    
    // Translate and scale to match the original center and size
    const finalPoints: [Point, Point, Point] = reconstructedPoints.map(p => ({
      x: originalCenter.x + (p.x - reconstructedCenter.x),
      y: originalCenter.y + (p.y - reconstructedCenter.y)
    })) as [Point, Point, Point];
    
    // Verify the reconstructed angles
    const finalSides = [
      distanceBetweenPoints(finalPoints[1], finalPoints[2]),
      distanceBetweenPoints(finalPoints[0], finalPoints[2]),
      distanceBetweenPoints(finalPoints[0], finalPoints[1])
    ];
    
    const finalAngles = calculateTriangleAngles(
      finalSides[0],
      finalSides[1],
      finalSides[2]
    ).map(a => Math.round(a));
    
    // Use the reconstructed triangle if it's closer to the target angle
    if (Math.abs(finalAngles[angleIndex] - intAngleValue) < Math.abs(newAngles[angleIndex] - intAngleValue)) {
      return {
        ...triangle,
        points: finalPoints,
        originalDimensions: {
          ...triangle.originalDimensions,
          points: finalPoints
        }
      };
    }
  }
  
  return {
    ...triangle,
    points: newPoints,
    originalDimensions: {
      ...triangle.originalDimensions,
      points: newPoints
    }
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
    points: newPoints,
    originalDimensions: {
      ...triangle.originalDimensions,
      points: newPoints
    }
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
    points: newPoints,
    originalDimensions: {
      ...triangle.originalDimensions,
      points: newPoints
    }
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
  // Use the appropriate update function based on the measurement key
  if (measurementKey === 'area') {
    return updateTriangleArea(triangle, valueInPixels);
  } 
  else if (measurementKey === 'perimeter') {
    return updateTrianglePerimeter(triangle, valueInPixels);
  }
  else if (measurementKey.startsWith('side')) {
    // Get the side index (0, 1, or 2)
    const sideIndex = parseInt(measurementKey.slice(-1)) - 1;
    if (sideIndex >= 0 && sideIndex <= 2) {
      // Calculate current side length
      const p1 = triangle.points[sideIndex];
      const p2 = triangle.points[(sideIndex + 1) % 3];
      const currentLength = distanceBetweenPoints(p1, p2);
      
      // Calculate scale factor
      const scaleFactor = valueInPixels / currentLength;
      
      // Scale the triangle from its center
      const center = {
        x: (triangle.points[0].x + triangle.points[1].x + triangle.points[2].x) / 3,
        y: (triangle.points[0].y + triangle.points[1].y + triangle.points[2].y) / 3
      };
      
      // Scale points from center
      const newPoints = triangle.points.map(point => ({
        x: center.x + (point.x - center.x) * scaleFactor,
        y: center.y + (point.y - center.y) * scaleFactor
      })) as [Point, Point, Point];
      
      return {
        ...triangle,
        points: newPoints,
        originalDimensions: {
          ...triangle.originalDimensions,
          points: newPoints
        }
      };
    }
    return updateTriangleAngle(triangle, measurementKey, newValue);
  }
  else if (measurementKey.startsWith('angle')) {
    return updateTriangleAngle(triangle, measurementKey, newValue);
  }
  else {
    console.warn(`Unhandled measurement key: ${measurementKey} for triangle`);
    return triangle;
  }
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
  
  const dx = newEndPoint.x - center.x;
  const dy = newEndPoint.y - center.y;
  
  return {
    ...line,
    startPoint: newStartPoint,
    endPoint: newEndPoint,
    length: valueInPixels,
    originalDimensions: {
      ...line.originalDimensions,
      dx: dx,
      dy: dy
    }
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
  
  // We'll directly use the angle value from the UI
  const uiAngle = newValue;
  
  // Convert to radians for calculations
  const angleRad = degreesToRadians(uiAngle);
  
  // Calculate the current length
  const currentLength = line.length;
  
  // Calculate the half-length (distance from center to endpoint)
  const halfLength = currentLength / 2;
  
  // Calculate new endpoints based on the angle
  // For UI angles (clockwise), we need to adjust the calculation
  // In UI, 0° points right, 90° points down, 180° points left, -90° points up
  const newStartPoint = {
    x: center.x - (Math.cos(angleRad) * halfLength),
    y: center.y - (Math.sin(angleRad) * halfLength)
  };
  
  const newEndPoint = {
    x: center.x + (Math.cos(angleRad) * halfLength),
    y: center.y + (Math.sin(angleRad) * halfLength)
  };
  
  return {
    ...line,
    startPoint: newStartPoint,
    endPoint: newEndPoint,
    rotation: uiAngle, // Store the UI angle directly
    length: currentLength // Ensure length is preserved
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