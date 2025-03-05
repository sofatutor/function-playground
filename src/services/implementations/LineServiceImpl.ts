import { Line, Point, ShapeType, MeasurementUnit } from '@/types/shapes';
import { LineService } from '../LineService';
import { v4 as uuidv4 } from 'uuid';
import { convertFromPixels } from '@/utils/geometry/measurements';
import { getStoredPixelsPerUnit, getNextShapeColor } from '@/utils/geometry/common';
import { 
  rotatePointRadians, 
  calculateAngleRadians, 
  degreesToRadians, 
  radiansToDegrees,
  normalizeAngleRadians,
  toClockwiseAngle,
  toCounterclockwiseAngle
} from '@/utils/geometry/rotation';

/**
 * Implementation of the LineService interface
 * Provides operations for Line shapes
 */
export class LineServiceImpl implements LineService {
  /**
   * Creates a new shape with the provided parameters
   * @param params Parameters for creating the shape
   * @returns A new Line instance
   */
  createShape(params: Record<string, unknown>): Line {
    const start = params.start as Point || { x: 0, y: 0 };
    const end = params.end as Point || { x: 100, y: 100 };
    
    // If a color is provided, use it; otherwise get a new color with full opacity
    const color = params.color as string || getNextShapeColor(0.9, 0.4, 1.0);
    
    const id = params.id as string || uuidv4();
    
    return this.createLine(start, end, color, id);
  }
  
  /**
   * Creates a line with the specified parameters
   * @param start The starting point of the line
   * @param end The ending point of the line
   * @param color The color of the line (optional)
   * @param id The ID of the line (optional)
   * @returns A new Line instance
   */
  createLine(start: Point, end: Point, color?: string, id?: string): Line {
    const length = this.calculateLengthFromPoints(start, end);
    
    // If a color is provided, use it; otherwise get a new color with full opacity
    const lineColor = color || getNextShapeColor(0.9, 0.4, 1.0);
    
    return {
      id: id || uuidv4(),
      type: 'line',
      startPoint: { ...start },
      endPoint: { ...end },
      position: this.calculateMidpoint(start, end),
      rotation: this.calculateAngleFromPoints(start, end),
      selected: false,
      stroke: lineColor,
      strokeWidth: 3,
      fill: 'transparent',
      length
    };
  }
  
  /**
   * Resizes a shape based on the provided parameters
   * @param shape The shape to resize
   * @param params Resize parameters (e.g., scale)
   * @returns The resized shape
   */
  resizeShape(shape: Line, params: Record<string, number>): Line {
    if (params.scale !== undefined) {
      return this.scaleLine(shape, params.scale);
    }
    
    // If no scale is provided, return the original shape
    return shape;
  }
  
  /**
   * Rotates a shape by the specified angle
   * @param shape The shape to rotate
   * @param angle The angle to rotate by (in radians)
   * @param center The center point of rotation (optional)
   * @returns The rotated shape
   */
  rotateShape(shape: Line, angle: number, center?: Point): Line {
    const rotationCenter = center || shape.position;
    
    // Rotate the start and end points around the center
    const newStart = rotatePointRadians(shape.startPoint, rotationCenter, angle);
    const newEnd = rotatePointRadians(shape.endPoint, rotationCenter, angle);
    const length = this.calculateLengthFromPoints(newStart, newEnd);
    
    // Normalize the rotation angle to keep it in the range [-π, π]
    const newRotation = normalizeAngleRadians(shape.rotation + angle);
    
    return {
      ...shape,
      startPoint: newStart,
      endPoint: newEnd,
      position: this.calculateMidpoint(newStart, newEnd),
      rotation: newRotation,
      length
    };
  }
  
  /**
   * Moves a shape to a new position
   * @param shape The shape to move
   * @param dx The change in x-coordinate
   * @param dy The change in y-coordinate
   * @returns The moved shape
   */
  moveShape(shape: Line, dx: number, dy: number): Line {
    return {
      ...shape,
      startPoint: {
        x: shape.startPoint.x + dx,
        y: shape.startPoint.y + dy
      },
      endPoint: {
        x: shape.endPoint.x + dx,
        y: shape.endPoint.y + dy
      },
      position: {
        x: shape.position.x + dx,
        y: shape.position.y + dy
      }
    };
  }
  
  /**
   * Gets all available measurements for the shape
   * @param shape The shape to measure
   * @param unit The unit to use for measurements
   * @returns A record of measurement names and their values
   */
  getMeasurements(shape: Line, unit: MeasurementUnit): Record<string, number> {
    // Get the calibrated pixels per unit values
    const pixelsPerCm = getStoredPixelsPerUnit('cm');
    const pixelsPerInch = getStoredPixelsPerUnit('in');
    
    // Create a conversion function
    const convertFromPixelsFn = (pixels: number): number => {
      return convertFromPixels(pixels, unit, pixelsPerCm, pixelsPerInch);
    };
    
    // Calculate measurements in pixels
    const lengthInPixels = shape.length;
    
    // Get angle in radians
    const angleRadians = this.calculateAngle(shape);
    
    // Convert angle to degrees (counterclockwise)
    const angleDegreesCounterclockwise = radiansToDegrees(angleRadians);
    
    // Convert to clockwise angle for UI display
    const angleDegreesClockwise = toClockwiseAngle(angleDegreesCounterclockwise);
    
    // Convert length to the specified unit
    const length = convertFromPixelsFn(lengthInPixels);
    
    return {
      length,
      angle: angleDegreesClockwise
    };
  }
  
  /**
   * Updates a shape based on a measurement change
   * @param shape The shape to update
   * @param measurementKey The measurement being changed
   * @param newValue The new value for the measurement
   * @param originalValue The original value (for calculating scale factors)
   * @param unit The unit of the measurement
   * @returns The updated shape
   */
  updateFromMeasurement(
    shape: Line, 
    measurementKey: string, 
    newValue: number, 
    originalValue: number,
    unit: MeasurementUnit = 'cm'
  ): Line {
    // Get the conversion factor for the current unit
    const pixelsPerUnit = getStoredPixelsPerUnit(unit);
    
    switch (measurementKey) {
      case 'length': {
        // Convert the new length from units to pixels
        const newLengthInPixels = newValue * pixelsPerUnit;
        const currentLength = this.calculateLength(shape);
        const scaleFactor = newLengthInPixels / currentLength;
        return this.scaleLine(shape, scaleFactor);
      }
      case 'angle': {
        // IMPORTANT: UI works with degrees (clockwise), internal model uses radians (counterclockwise)
        // newValue is in degrees (clockwise from UI)
        
        // Convert UI angle (clockwise) to mathematical angle (counterclockwise)
        const newValueCounterclockwise = toCounterclockwiseAngle(newValue);
        
        // Get current angle in radians from the shape
        const currentAngleRadians = this.calculateAngle(shape);
        
        // Convert current angle to degrees (counterclockwise)
        const currentAngleDegreesCounterclockwise = radiansToDegrees(currentAngleRadians);
        
        // Calculate the difference in degrees (in counterclockwise direction)
        const angleDifferenceDegrees = newValueCounterclockwise - currentAngleDegreesCounterclockwise;
        
        // Convert the difference back to radians for the rotation operation
        const angleDifferenceRadians = degreesToRadians(angleDifferenceDegrees);
        
        // Apply the rotation
        return this.rotateShape(shape, angleDifferenceRadians);
      }
      default:
        console.warn(`Unhandled measurement key: "${measurementKey}" for line. Supported keys are: length, angle.`);
        return shape;
    }
  }
  
  /**
   * Checks if a point is inside or on the shape
   * @param shape The shape to check
   * @param point The point to test
   * @returns True if the point is on the line
   */
  containsPoint(shape: Line, point: Point): boolean {
    // For a line, we check if the point is close enough to the line segment
    const distance = this.distanceToPoint(shape, point);
    
    // Consider the point on the line if it's within a small threshold
    const threshold = 5; // 5 pixels
    return distance <= threshold;
  }
  
  /**
   * Gets the type of the shape this service handles
   * @returns The shape type
   */
  getShapeType(): ShapeType {
    return 'line';
  }
  
  /**
   * Scales the line by the specified factor
   * @param line The line to scale
   * @param scaleFactor The factor to scale by
   * @param center The center point of scaling (defaults to line midpoint)
   * @returns The scaled line
   */
  scaleLine(line: Line, scaleFactor: number, center?: Point): Line {
    const scalingCenter = center || line.position;
    
    // Scale the start and end points from the center
    const newStart = {
      x: scalingCenter.x + (line.startPoint.x - scalingCenter.x) * scaleFactor,
      y: scalingCenter.y + (line.startPoint.y - scalingCenter.y) * scaleFactor
    };
    
    const newEnd = {
      x: scalingCenter.x + (line.endPoint.x - scalingCenter.x) * scaleFactor,
      y: scalingCenter.y + (line.endPoint.y - scalingCenter.y) * scaleFactor
    };
    
    const length = this.calculateLengthFromPoints(newStart, newEnd);
    
    return {
      ...line,
      startPoint: newStart,
      endPoint: newEnd,
      position: this.calculateMidpoint(newStart, newEnd),
      length
    };
  }
  
  /**
   * Updates the start point of the line
   * @param line The line to update
   * @param start The new start point
   * @returns The updated line
   */
  updateStart(line: Line, start: Point): Line {
    const length = this.calculateLengthFromPoints(start, line.endPoint);
    
    return {
      ...line,
      startPoint: { ...start },
      position: this.calculateMidpoint(start, line.endPoint),
      length
    };
  }
  
  /**
   * Updates the end point of the line
   * @param line The line to update
   * @param end The new end point
   * @returns The updated line
   */
  updateEnd(line: Line, end: Point): Line {
    const length = this.calculateLengthFromPoints(line.startPoint, end);
    
    return {
      ...line,
      endPoint: { ...end },
      position: this.calculateMidpoint(line.startPoint, end),
      length
    };
  }
  
  /**
   * Calculates the length of the line
   * @param line The line to calculate length for
   * @returns The length of the line
   */
  calculateLength(line: Line): number {
    return line.length;
  }
  
  /**
   * Calculates the length between two points
   * @param start The starting point
   * @param end The ending point
   * @returns The length between the points
   */
  private calculateLengthFromPoints(start: Point, end: Point): number {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * Calculates the angle of the line in radians
   * @param line The line to calculate angle for
   * @returns The angle of the line in radians
   */
  calculateAngle(line: Line): number {
    return this.calculateAngleFromPoints(line.startPoint, line.endPoint);
  }
  
  /**
   * Calculates the angle between two points in radians
   * @param start The starting point
   * @param end The ending point
   * @returns The angle in radians
   */
  private calculateAngleFromPoints(start: Point, end: Point): number {
    return calculateAngleRadians(start, end);
  }
  
  /**
   * Gets the midpoint of the line
   * @param line The line to get midpoint for
   * @returns The midpoint of the line
   */
  getMidpoint(line: Line): Point {
    return this.calculateMidpoint(line.startPoint, line.endPoint);
  }
  
  /**
   * Calculates the midpoint between two points
   * @param p1 The first point
   * @param p2 The second point
   * @returns The midpoint
   */
  private calculateMidpoint(p1: Point, p2: Point): Point {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2
    };
  }
  
  /**
   * Extends the line by a specified distance
   * @param line The line to extend
   * @param distance The distance to extend by
   * @param fromStart Whether to extend from the start point (true) or end point (false)
   * @returns The extended line
   */
  extendLine(line: Line, distance: number, fromStart: boolean): Line {
    const angle = this.calculateAngle(line);
    
    if (fromStart) {
      // Extend from start point in the opposite direction
      const newStart = {
        x: line.startPoint.x - Math.cos(angle) * distance,
        y: line.startPoint.y - Math.sin(angle) * distance
      };
      
      return this.updateStart(line, newStart);
    } else {
      // Extend from end point in the same direction
      const newEnd = {
        x: line.endPoint.x + Math.cos(angle) * distance,
        y: line.endPoint.y + Math.sin(angle) * distance
      };
      
      return this.updateEnd(line, newEnd);
    }
  }
  
  /**
   * Calculates the slope of the line
   * @param line The line to calculate slope for
   * @returns The slope of the line, or Infinity for vertical lines
   */
  calculateSlope(line: Line): number {
    const dx = line.endPoint.x - line.startPoint.x;
    
    // Avoid division by zero for vertical lines
    if (Math.abs(dx) < 0.0001) {
      return Infinity;
    }
    
    const dy = line.endPoint.y - line.startPoint.y;
    return dy / dx;
  }
  
  /**
   * Calculates the perpendicular distance from a point to the line
   * @param line The line to calculate distance from
   * @param point The point to calculate distance to
   * @returns The perpendicular distance from the point to the line
   */
  distanceToPoint(line: Line, point: Point): number {
    const { startPoint, endPoint } = line;
    
    // For a line segment, we need to check if the closest point is on the segment
    const lengthSquared = Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2);
    
    // If the line is just a point, return the distance to that point
    if (lengthSquared === 0) {
      return Math.sqrt(Math.pow(point.x - startPoint.x, 2) + Math.pow(point.y - startPoint.y, 2));
    }
    
    // Calculate the projection of the point onto the line
    const t = Math.max(0, Math.min(1, (
      (point.x - startPoint.x) * (endPoint.x - startPoint.x) + 
      (point.y - startPoint.y) * (endPoint.y - startPoint.y)
    ) / lengthSquared));
    
    // Calculate the closest point on the line segment
    const closestPoint = {
      x: startPoint.x + t * (endPoint.x - startPoint.x),
      y: startPoint.y + t * (endPoint.y - startPoint.y)
    };
    
    // Return the distance to the closest point
    return Math.sqrt(
      Math.pow(point.x - closestPoint.x, 2) + 
      Math.pow(point.y - closestPoint.y, 2)
    );
  }
} 