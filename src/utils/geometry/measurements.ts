import { AnyShape, Circle, Rectangle, Triangle, Line, MeasurementUnit } from '@/types/shapes';
import { distanceBetweenPoints } from './common';
import { calculateTriangleArea, calculateTriangleAngles } from './triangle';
import { radiansToDegrees } from './rotation';

// Helper function to convert physical measurements to pixels
export const convertToPixels = (
  value: number, 
  measurementUnit: MeasurementUnit, 
  pixelsPerCm: number, 
  pixelsPerInch: number
): number => {
  if (measurementUnit === 'in') {
    return value * pixelsPerInch;
  }
  return value * pixelsPerCm;
};

// Helper function to convert pixels to physical measurements
export const convertFromPixels = (
  pixels: number, 
  measurementUnit: MeasurementUnit, 
  pixelsPerCm: number, 
  pixelsPerInch: number
): number => {
  if (measurementUnit === 'in') {
    return pixels / pixelsPerInch;
  }
  return pixels / pixelsPerCm;
};

// Get measurements for a shape in the current unit
export const getShapeMeasurements = (
  shape: AnyShape, 
  convertFromPixelsFn: (pixels: number) => number
): Record<string, number> => {
  const measurements: Record<string, number> = {};
  
  switch (shape.type) {
    case 'circle': {
      const circle = shape as Circle;
      const diameter = convertFromPixelsFn(circle.radius * 2);
      const radius = diameter / 2;
      const circumference = Math.PI * diameter;
      const area = Math.PI * radius * radius;
      
      measurements.diameter = parseFloat(diameter.toFixed(2));
      measurements.radius = parseFloat(radius.toFixed(2));
      measurements.circumference = parseFloat(circumference.toFixed(2));
      measurements.area = parseFloat(area.toFixed(2));
      break;
    }
    case 'rectangle': {
      const rect = shape as Rectangle;
      const width = convertFromPixelsFn(rect.width);
      const height = convertFromPixelsFn(rect.height);
      const perimeter = 2 * (width + height);
      const area = width * height;
      
      measurements.width = parseFloat(width.toFixed(2));
      measurements.height = parseFloat(height.toFixed(2));
      measurements.perimeter = parseFloat(perimeter.toFixed(2));
      measurements.area = parseFloat(area.toFixed(2));
      break;
    }
    case 'triangle': {
      const tri = shape as Triangle;
      
      // Calculate side lengths in pixels
      const side1 = distanceBetweenPoints(tri.points[0], tri.points[1]);
      const side2 = distanceBetweenPoints(tri.points[1], tri.points[2]);
      const side3 = distanceBetweenPoints(tri.points[2], tri.points[0]);
      
      // Convert to physical units
      const side1Length = convertFromPixelsFn(side1);
      const side2Length = convertFromPixelsFn(side2);
      const side3Length = convertFromPixelsFn(side3);
      
      // Calculate perimeter
      const perimeter = side1Length + side2Length + side3Length;
      
      // Calculate area using Heron's formula
      const s = perimeter / 2; // Semi-perimeter
      const area = Math.sqrt(s * (s - side1Length) * (s - side2Length) * (s - side3Length));
      
      // Find the longest side
      const longestSide = Math.max(side1Length, side2Length, side3Length);
      
      // Calculate height from the longest side as base
      const height = (2 * area) / longestSide;
      
      // Calculate angles
      const angles = calculateTriangleAngles(side1Length, side2Length, side3Length);
      
      measurements.side1 = parseFloat(side1Length.toFixed(2));
      measurements.side2 = parseFloat(side2Length.toFixed(2));
      measurements.side3 = parseFloat(side3Length.toFixed(2));
      measurements.perimeter = parseFloat(perimeter.toFixed(2));
      measurements.area = parseFloat(area.toFixed(2));
      measurements.height = parseFloat(height.toFixed(2));
      measurements.angle1 = Math.round(angles[0]);
      measurements.angle2 = Math.round(angles[1]);
      measurements.angle3 = Math.round(angles[2]);
      break;
    }
    case 'line': {
      const line = shape as Line;
      
      // Calculate the length in physical units
      const length = convertFromPixelsFn(line.length);
      
      // For a line, we only need to display its length
      measurements.length = parseFloat(length.toFixed(2));
      
      // IMPORTANT: Internal model uses radians, UI displays degrees
      // Convert the line's rotation from radians to degrees for display
      // The rotation property is set using Math.atan2 which returns angles in the range -π to π
      // This means our angles in the UI will be in the range -180° to 180°
      const angle = radiansToDegrees(line.rotation);
      
      measurements.angle = Math.round(angle);
      break;
    }
  }
  
  return measurements;
}; 
