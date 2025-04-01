import { Circle, Point, ShapeType, MeasurementUnit } from '@/types/shapes';
import { CircleService } from '../CircleService';
import { v4 as uuidv4 } from 'uuid';
import { distanceBetweenPoints } from '@/utils/geometry/common';
import { convertFromPixels } from '@/utils/geometry/measurements';
import { getStoredPixelsPerUnit, getNextShapeColor } from '@/utils/geometry/common';

/**
 * Implementation of the CircleService interface
 * Provides operations for Circle shapes
 */
export class CircleServiceImpl implements CircleService {
  /**
   * Creates a new shape with the provided parameters
   * @param params Parameters for creating the shape
   * @returns A new Circle instance
   */
  createShape(params: Record<string, unknown>): Circle {
    const position = params.position as Point || { x: 0, y: 0 };
    const radius = (params.radius as number) || 50;
    const color = (params.color as string) || getNextShapeColor();
    const id = (params.id as string) || uuidv4();
    
    return this.createCircle(position, radius, color, id);
  }
  
  /**
   * Creates a circle with the specified parameters
   * @param center The center point of the circle
   * @param radius The radius of the circle
   * @param color The color of the circle (optional)
   * @param id The ID of the circle (optional)
   * @returns A new Circle instance
   */
  createCircle(center: Point, radius: number, color?: string, id?: string): Circle {
    return {
      id: id || uuidv4(),
      type: 'circle',
      position: { ...center },
      radius: Math.max(1, radius), // Ensure minimum radius of 1
      rotation: 0,
      fillColor: color || getNextShapeColor(),
      strokeColor: getNextShapeColor(0.9, 0.3, 1.0),
      opacity: 1
    };
  }
  
  /**
   * Resizes a shape based on the provided parameters
   * @param shape The shape to resize
   * @param params Resize parameters (e.g., radius or scale)
   * @returns The resized shape
   */
  resizeShape(shape: Circle, params: Record<string, number>): Circle {
    if (params.radius) {
      return this.updateRadius(shape, params.radius);
    }
    if (params.scale) {
      return this.scaleCircle(shape, params.scale);
    }
    return shape;
  }
  
  /**
   * Rotates a shape by the specified angle
   * @param shape The shape to rotate
   * @param angle The angle to rotate by (in radians)
   * @returns The rotated shape (circles don't visually change with rotation)
   */
  rotateShape(shape: Circle, _angle: number): Circle {
    // Circles don't visually change with rotation, so we return the same shape
    return shape;
  }
  
  /**
   * Moves a shape to a new position
   * @param shape The shape to move
   * @param dx The change in x-coordinate
   * @param dy The change in y-coordinate
   * @returns The moved shape
   */
  moveShape(shape: Circle, dx: number, dy: number): Circle {
    return {
      ...shape,
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
  getMeasurements(shape: Circle, unit: MeasurementUnit): Record<string, number> {
    // Get the calibrated pixels per unit values
    const pixelsPerCm = getStoredPixelsPerUnit('cm');
    const pixelsPerInch = getStoredPixelsPerUnit('in');
    
    // Create a conversion function
    const convertFromPixelsFn = (pixels: number): number => {
      return convertFromPixels(pixels, unit, pixelsPerCm, pixelsPerInch);
    };
    
    // Create a conversion function for area (square units)
    const convertAreaFromPixelsFn = (pixelsSquared: number): number => {
      if (unit === 'in') {
        return pixelsSquared / (pixelsPerInch * pixelsPerInch);
      }
      return pixelsSquared / (pixelsPerCm * pixelsPerCm);
    };
    
    // Calculate measurements in pixels
    const radiusInPixels = shape.radius;
    const diameterInPixels = radiusInPixels * 2;
    const circumferenceInPixels = 2 * Math.PI * radiusInPixels;
    const areaInPixels = Math.PI * radiusInPixels * radiusInPixels;
    
    // Convert to the specified unit
    const radius = convertFromPixelsFn(radiusInPixels);
    const diameter = convertFromPixelsFn(diameterInPixels);
    const circumference = convertFromPixelsFn(circumferenceInPixels);
    const area = convertAreaFromPixelsFn(areaInPixels);
    
    return {
      radius,
      diameter,
      circumference,
      area
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
    shape: Circle, 
    measurementKey: string, 
    newValue: number, 
    originalValue: number,
    unit: MeasurementUnit = 'cm'
  ): Circle {
    // Get the conversion factor for the current unit
    const pixelsPerUnit = getStoredPixelsPerUnit(unit);
    
    // Variable for area calculation
    let radiusInUnits: number;
    
    switch (measurementKey) {
      case 'radius':
        // The newValue is already in the correct unit, just convert to pixels
        return this.updateRadius(shape, newValue * pixelsPerUnit);
      case 'diameter':
        // Convert diameter to radius, then to pixels
        return this.updateRadius(shape, (newValue / 2) * pixelsPerUnit);
      case 'circumference':
        // C = 2πr, so r = C/(2π)
        return this.updateRadius(shape, (newValue / (2 * Math.PI)) * pixelsPerUnit);
      case 'area':
        // A = πr², so r = √(A/π)
        radiusInUnits = Math.sqrt(newValue / Math.PI);
        return this.updateRadius(shape, radiusInUnits * pixelsPerUnit);
      default:
        console.warn(`Unhandled measurement key: "${measurementKey}" for circle. Supported keys are: radius, diameter, circumference, area.`);
        return shape;
    }
  }
  
  /**
   * Checks if a point is inside or on the shape
   * @param shape The shape to check
   * @param point The point to test
   * @returns True if the point is inside or on the shape
   */
  containsPoint(shape: Circle, point: Point): boolean {
    const distance = distanceBetweenPoints(shape.position, point);
    return distance <= shape.radius;
  }
  
  /**
   * Gets the type of the shape this service handles
   * @returns The shape type
   */
  getShapeType(): ShapeType {
    return 'circle';
  }
  
  /**
   * Scales a circle by the specified factor
   * @param circle The circle to scale
   * @param scaleFactor The factor to scale by
   * @returns The scaled circle
   */
  scaleCircle(circle: Circle, scaleFactor: number): Circle {
    // Store original dimensions if they don't exist yet
    const originalDimensions = circle.originalDimensions || {
      radius: circle.radius
    };
    
    // Scale from original dimensions if they exist, otherwise use current dimensions
    const baseRadius = originalDimensions.radius || circle.radius;
    
    return {
      ...circle,
      radius: baseRadius * scaleFactor,
      originalDimensions: originalDimensions // Preserve original dimensions
    };
  }
  
  /**
   * Updates the radius of a circle
   * @param circle The circle to update
   * @param radius The new radius value
   * @returns The updated circle
   */
  updateRadius(circle: Circle, radius: number): Circle {
    if (radius <= 0) {
      console.warn(`Invalid radius: ${radius}. Using minimum value of 1 pixel instead.`);
      radius = 1; // Set to minimum value instead of returning the original
    }
    
    return {
      ...circle,
      radius,
      originalDimensions: {
        ...circle.originalDimensions,
        radius
      }
    };
  }
  
  /**
   * Calculates the area of the circle
   * @param circle The circle to calculate area for
   * @returns The area of the circle
   */
  calculateArea(circle: Circle): number {
    return Math.PI * circle.radius * circle.radius;
  }
  
  /**
   * Calculates the circumference of the circle
   * @param circle The circle to calculate circumference for
   * @returns The circumference of the circle
   */
  calculateCircumference(circle: Circle): number {
    return 2 * Math.PI * circle.radius;
  }
  
  /**
   * Calculates the diameter of the circle
   * @param circle The circle to calculate diameter for
   * @returns The diameter of the circle
   */
  calculateDiameter(circle: Circle): number {
    return 2 * circle.radius;
  }
} 