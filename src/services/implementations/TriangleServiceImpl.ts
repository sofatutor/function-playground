import { Triangle, Point, ShapeType, MeasurementUnit } from '@/types/shapes';
import { TriangleService } from '../TriangleService';
import { v4 as uuidv4 } from 'uuid';
import { distanceBetweenPoints } from '@/utils/geometry/common';
import { convertFromPixels } from '@/utils/geometry/measurements';
import { getStoredPixelsPerUnit, getNextShapeColor } from '@/utils/geometry/common';

/**
 * Implementation of the TriangleService interface
 * Provides operations for Triangle shapes
 */
export class TriangleServiceImpl implements TriangleService {
  /**
   * Creates a new shape with the provided parameters
   * @param params Parameters for creating the shape
   * @returns A new Triangle instance
   */
  createShape(params: Record<string, unknown>): Triangle {
    if (params.points) {
      const points = params.points as [Point, Point, Point];
      const color = (params.color as string) || getNextShapeColor();
      const id = (params.id as string) || uuidv4();
      
      return this.createTriangle(points, color, id);
    } else {
      const position = params.position as Point || { x: 0, y: 0 };
      const color = (params.color as string) || getNextShapeColor();
      const id = (params.id as string) || uuidv4();
      
      const points = this.generateDefaultPoints(position);
      return this.createTriangle(points, color, id);
    }
  }
  
  /**
   * Creates a triangle with the specified parameters
   * @param points The three points defining the triangle
   * @param color The color of the triangle (optional)
   * @param id The ID of the triangle (optional)
   * @returns A new Triangle instance
   */
  createTriangle(points: [Point, Point, Point], color?: string, id?: string): Triangle {
    return {
      id: id || uuidv4(),
      type: 'triangle',
      points: [...points] as [Point, Point, Point],
      position: this.calculateCentroid(points),
      rotation: 0,
      selected: false,
      fill: color || getNextShapeColor(),
      stroke: getNextShapeColor(0.9, 0.3, 1.0),
      strokeWidth: 1
    };
  }
  
  /**
   * Generates default points for a triangle based on a position
   * @param position The reference position
   * @returns An array of three points forming a triangle
   */
  private generateDefaultPoints(position: Point): [Point, Point, Point] {
    return [
      { x: position.x, y: position.y - 50 },
      { x: position.x - 50, y: position.y + 50 },
      { x: position.x + 50, y: position.y + 50 }
    ] as [Point, Point, Point];
  }
  
  /**
   * Resizes a shape based on the provided parameters
   * @param shape The shape to resize
   * @param params Resize parameters (e.g., scale)
   * @returns The resized shape
   */
  resizeShape(shape: Triangle, params: Record<string, number>): Triangle {
    let result = { ...shape };
    
    if (params.scale !== undefined) {
      result = this.scaleTriangle(result, params.scale);
    } else {
      const scaleX = params.scaleX !== undefined ? params.scaleX : 1;
      const scaleY = params.scaleY !== undefined ? params.scaleY : 1;
      
      if (scaleX !== 1 || scaleY !== 1) {
        // If we need different scaling in X and Y, we'll use our internal method
        // but maintain the interface contract by using the same scale factor for both
        return this.scaleTriangleInternal(result, scaleX, scaleY);
      }
    }
    
    return result;
  }
  
  /**
   * Rotates a shape by the specified angle
   * @param shape The shape to rotate
   * @param angle The angle to rotate by (in radians)
   * @param center The center point of rotation (optional)
   * @returns The rotated shape
   */
  rotateShape(shape: Triangle, angle: number, center?: Point): Triangle {
    const rotationCenter = center || shape.position;
    const newPoints = shape.points.map(point => this.rotatePoint(point, rotationCenter, angle)) as [Point, Point, Point];
    
    return {
      ...shape,
      points: newPoints,
      rotation: (shape.rotation + angle) % (2 * Math.PI)
    };
  }
  
  /**
   * Rotates a point around a center by an angle
   * @param point The point to rotate
   * @param center The center of rotation
   * @param angle The angle to rotate by (in radians)
   * @returns The rotated point
   */
  private rotatePoint(point: Point, center: Point, angle: number): Point {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
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
  }
  
  /**
   * Moves a shape to a new position
   * @param shape The shape to move
   * @param dx The change in x-coordinate
   * @param dy The change in y-coordinate
   * @returns The moved shape
   */
  moveShape(shape: Triangle, dx: number, dy: number): Triangle {
    const newPoints = shape.points.map(point => ({
      x: point.x + dx,
      y: point.y + dy
    })) as [Point, Point, Point];
    
    return {
      ...shape,
      points: newPoints,
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
  getMeasurements(shape: Triangle, unit: MeasurementUnit): Record<string, number> {
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
    const areaInPixels = this.calculateArea(shape);
    const perimeterInPixels = this.calculatePerimeter(shape);
    const sidesInPixels = this.calculateSideLengths(shape);
    const angles = this.calculateAngles(shape);
    const heightInPixels = this.calculateHeight(shape);
    
    // Convert to the specified unit
    const area = convertAreaFromPixelsFn(areaInPixels);
    const perimeter = convertFromPixelsFn(perimeterInPixels);
    const sides = sidesInPixels.map(side => convertFromPixelsFn(side));
    const height = convertFromPixelsFn(heightInPixels);
    
    return {
      area,
      perimeter,
      side1: sides[0],
      side2: sides[1],
      side3: sides[2],
      angle1: angles[0],
      angle2: angles[1],
      angle3: angles[2],
      height
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
    shape: Triangle, 
    measurementKey: string, 
    newValue: number, 
    originalValue: number,
    unit: MeasurementUnit = 'cm'
  ): Triangle {
    // Get the conversion factor for the current unit
    const pixelsPerUnit = getStoredPixelsPerUnit(unit);
    
    switch (measurementKey) {
      case 'area': {
        // Scale the triangle to achieve the new area
        // Convert the new area from square units to square pixels
        const newAreaInPixels = newValue * pixelsPerUnit * pixelsPerUnit;
        const currentAreaInPixels = this.calculateArea(shape);
        // Calculate scale factor using newAreaInPixels (target area) divided by current area
        const scaleFactor = Math.sqrt(newAreaInPixels / currentAreaInPixels);
        return this.scaleTriangle(shape, scaleFactor);
      }
      case 'perimeter': {
        // Scale the triangle to achieve the new perimeter
        // Convert the new perimeter from units to pixels
        const newPerimeterInPixels = newValue * pixelsPerUnit;
        const currentPerimeterInPixels = this.calculatePerimeter(shape);
        // Calculate scale factor using newPerimeterInPixels (target perimeter) divided by current perimeter
        const scaleFactor = newPerimeterInPixels / currentPerimeterInPixels;
        return this.scaleTriangle(shape, scaleFactor);
      }
      case 'side1':
      case 'side2':
      case 'side3': {
        // Get the index of the side (0, 1, or 2)
        const sideIndex = measurementKey === 'side1' ? 0 : measurementKey === 'side2' ? 1 : 2;
        const sides = this.calculateSideLengths(shape);
        
        // Convert the new side length from units to pixels
        const newSideLengthInPixels = newValue * pixelsPerUnit;
        const scaleFactor = newSideLengthInPixels / sides[sideIndex];
        
        // For simplicity, we'll scale the entire triangle
        // In a more sophisticated implementation, you might want to keep the other sides fixed
        return this.scaleTriangle(shape, scaleFactor);
      }
      case 'height': {
        // Scale the triangle to achieve the new height
        // Convert the new height from units to pixels
        const newHeightInPixels = newValue * pixelsPerUnit;
        const currentHeightInPixels = this.calculateHeight(shape);
        const scaleFactor = newHeightInPixels / currentHeightInPixels;
        // For height, we need to scale only in the Y direction
        return this.scaleTriangleInternal(shape, 1, scaleFactor);
      }
      case 'angle1':
      case 'angle2':
      case 'angle3':
        // Changing angles would require more complex transformations
        // For simplicity, we'll just warn and return the original shape
        console.warn(`Updating angles directly is not supported: ${measurementKey}. Try adjusting sides instead.`);
        return shape;
      default:
        console.warn(`Unhandled measurement key: "${measurementKey}" for triangle. Supported keys are: area, perimeter, side1, side2, side3, height.`);
        return shape;
    }
  }
  
  /**
   * Checks if a point is inside or on the shape
   * @param shape The shape to check
   * @param point The point to test
   * @returns True if the point is inside or on the shape
   */
  containsPoint(shape: Triangle, point: Point): boolean {
    const [p1, p2, p3] = shape.points;
    
    // Calculate barycentric coordinates
    const denominator = ((p2.y - p3.y) * (p1.x - p3.x) + (p3.x - p2.x) * (p1.y - p3.y));
    
    // Avoid division by zero
    if (Math.abs(denominator) < 0.0001) {
      return false;
    }
    
    const a = ((p2.y - p3.y) * (point.x - p3.x) + (p3.x - p2.x) * (point.y - p3.y)) / denominator;
    const b = ((p3.y - p1.y) * (point.x - p3.x) + (p1.x - p3.x) * (point.y - p3.y)) / denominator;
    const c = 1 - a - b;
    
    // Check if point is inside the triangle
    return a >= 0 && a <= 1 && b >= 0 && b <= 1 && c >= 0 && c <= 1;
  }
  
  /**
   * Gets the type of the shape this service handles
   * @returns The shape type
   */
  getShapeType(): ShapeType {
    return 'triangle';
  }
  
  /**
   * Scales the triangle by the specified factor
   * @param triangle The triangle to scale
   * @param scaleFactor The factor to scale by
   * @param center The center point of scaling (defaults to triangle centroid)
   * @returns The scaled triangle
   */
  scaleTriangle(
    triangle: Triangle, 
    scaleFactor: number, 
    center?: Point
  ): Triangle {
    return this.scaleTriangleInternal(triangle, scaleFactor, scaleFactor, center);
  }
  
  /**
   * Internal method to scale the triangle by different factors in x and y directions
   * @param triangle The triangle to scale
   * @param scaleX The factor to scale in the x-direction
   * @param scaleY The factor to scale in the y-direction
   * @param center The center point of scaling (defaults to triangle centroid)
   * @returns The scaled triangle
   */
  private scaleTriangleInternal(
    triangle: Triangle, 
    scaleX: number, 
    scaleY: number, 
    center?: Point
  ): Triangle {
    const scalingCenter = center || triangle.position;
    
    const newPoints = triangle.points.map(point => ({
      x: scalingCenter.x + (point.x - scalingCenter.x) * scaleX,
      y: scalingCenter.y + (point.y - scalingCenter.y) * scaleY
    })) as [Point, Point, Point];
    
    return {
      ...triangle,
      points: newPoints,
      position: this.calculateCentroid(newPoints)
    };
  }
  
  /**
   * Calculates the area of the triangle
   * @param triangle The triangle to calculate area for
   * @returns The area of the triangle
   */
  calculateArea(triangle: Triangle): number {
    const [p1, p2, p3] = triangle.points;
    
    // Using the cross product formula for area
    return Math.abs(
      (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) / 2
    );
  }
  
  /**
   * Calculates the perimeter of the triangle
   * @param triangle The triangle to calculate perimeter for
   * @returns The perimeter of the triangle
   */
  calculatePerimeter(triangle: Triangle): number {
    const sides = this.calculateSideLengths(triangle);
    return sides[0] + sides[1] + sides[2];
  }
  
  /**
   * Calculates the lengths of the three sides of the triangle
   * @param triangle The triangle to calculate side lengths for
   * @returns An array of the three side lengths
   */
  calculateSideLengths(triangle: Triangle): [number, number, number] {
    const [p1, p2, p3] = triangle.points;
    
    const side1 = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    const side2 = Math.sqrt(Math.pow(p3.x - p2.x, 2) + Math.pow(p3.y - p2.y, 2));
    const side3 = Math.sqrt(Math.pow(p1.x - p3.x, 2) + Math.pow(p1.y - p3.y, 2));
    
    return [side1, side2, side3];
  }
  
  /**
   * Calculates the angles of the triangle
   * @param triangle The triangle to calculate angles for
   * @returns The three angles of the triangle in degrees
   */
  calculateAngles(triangle: Triangle): [number, number, number] {
    const [a, b, c] = this.calculateSideLengths(triangle);
    
    // Using the law of cosines to calculate angles
    const angleA = Math.acos((b * b + c * c - a * a) / (2 * b * c));
    const angleB = Math.acos((a * a + c * c - b * b) / (2 * a * c));
    const angleC = Math.acos((a * a + b * b - c * c) / (2 * a * b));
    
    // Convert from radians to degrees
    const angleADegrees = angleA * (180 / Math.PI);
    const angleBDegrees = angleB * (180 / Math.PI);
    const angleCDegrees = angleC * (180 / Math.PI);
    
    return [angleADegrees, angleBDegrees, angleCDegrees];
  }
  
  /**
   * Calculates the height of the triangle
   * @param triangle The triangle to calculate height for
   * @returns The height of the triangle
   */
  calculateHeight(triangle: Triangle): number {
    const area = this.calculateArea(triangle);
    const [base] = this.calculateSideLengths(triangle);
    
    return (2 * area) / base;
  }
  
  /**
   * Calculates the centroid (center of mass) of the triangle
   * @param points The three points of the triangle
   * @returns The centroid point
   */
  calculateCentroid(points: [Point, Point, Point]): Point {
    return {
      x: (points[0].x + points[1].x + points[2].x) / 3,
      y: (points[0].y + points[1].y + points[2].y) / 3
    };
  }
  
  /**
   * Creates an equilateral triangle
   * @param center The center point of the triangle
   * @param sideLength The length of each side
   * @param color The color of the triangle (optional)
   * @param id The ID of the triangle (optional)
   * @returns A new Triangle instance
   */
  createEquilateralTriangle(
    center: Point, 
    sideLength: number, 
    color?: string, 
    id?: string
  ): Triangle {
    const height = (Math.sqrt(3) / 2) * sideLength;
    
    const points: [Point, Point, Point] = [
      { x: center.x, y: center.y - (2/3) * height },
      { x: center.x - sideLength / 2, y: center.y + (1/3) * height },
      { x: center.x + sideLength / 2, y: center.y + (1/3) * height }
    ];
    
    return this.createTriangle(points, color, id);
  }
  
  /**
   * Creates an isosceles triangle
   * @param center The center point of the triangle
   * @param base The length of the base
   * @param height The height of the triangle
   * @param color The color of the triangle (optional)
   * @param id The ID of the triangle (optional)
   * @returns A new Triangle instance
   */
  createIsoscelesTriangle(
    center: Point, 
    base: number, 
    height: number, 
    color?: string, 
    id?: string
  ): Triangle {
    const points: [Point, Point, Point] = [
      { x: center.x, y: center.y - (2/3) * height },
      { x: center.x - base / 2, y: center.y + (1/3) * height },
      { x: center.x + base / 2, y: center.y + (1/3) * height }
    ];
    
    return this.createTriangle(points, color, id);
  }
  
  /**
   * Creates a right triangle
   * @param center The center point of the triangle
   * @param base The length of the base
   * @param height The height of the triangle
   * @param color The color of the triangle (optional)
   * @param id The ID of the triangle (optional)
   * @returns A new Triangle instance
   */
  createRightTriangle(
    center: Point, 
    base: number, 
    height: number, 
    color?: string, 
    id?: string
  ): Triangle {
    // Calculate the centroid of a right triangle
    const cx = (base / 3);
    const cy = (height / 3);
    
    // Calculate the points based on the center
    const points: [Point, Point, Point] = [
      { x: center.x - cx, y: center.y - cy },
      { x: center.x - cx, y: center.y - cy + height },
      { x: center.x - cx + base, y: center.y - cy + height }
    ];
    
    return this.createTriangle(points, color, id);
  }
  
  /**
   * Updates a specific point of the triangle
   * @param triangle The triangle to update
   * @param pointIndex The index of the point to update (0, 1, or 2)
   * @param newPoint The new point coordinates
   * @returns The updated triangle
   */
  updatePoint(triangle: Triangle, pointIndex: number, newPoint: Point): Triangle {
    if (pointIndex < 0 || pointIndex > 2) {
      console.warn(`Invalid point index: ${pointIndex}. Must be 0, 1, or 2.`);
      return triangle;
    }
    
    const newPoints = [...triangle.points] as [Point, Point, Point];
    newPoints[pointIndex] = { ...newPoint };
    
    return {
      ...triangle,
      points: newPoints,
      position: this.calculateCentroid(newPoints)
    };
  }
  
  /**
   * Gets the centroid (center of mass) of the triangle
   * @param triangle The triangle to get centroid for
   * @returns The centroid point of the triangle
   */
  getCentroid(triangle: Triangle): Point {
    return this.calculateCentroid(triangle.points);
  }
  
  /**
   * Checks if the triangle is equilateral
   * @param triangle The triangle to check
   * @returns True if the triangle is equilateral
   */
  isEquilateral(triangle: Triangle): boolean {
    const [a, b, c] = this.calculateSideLengths(triangle);
    
    // Check if all sides are approximately equal
    // Using a small epsilon for floating-point comparison
    const epsilon = 0.0001;
    return (
      Math.abs(a - b) < epsilon &&
      Math.abs(b - c) < epsilon &&
      Math.abs(a - c) < epsilon
    );
  }
  
  /**
   * Checks if the triangle is isosceles
   * @param triangle The triangle to check
   * @returns True if the triangle is isosceles
   */
  isIsosceles(triangle: Triangle): boolean {
    const [a, b, c] = this.calculateSideLengths(triangle);
    
    // Check if at least two sides are approximately equal
    const epsilon = 0.0001;
    return (
      Math.abs(a - b) < epsilon ||
      Math.abs(b - c) < epsilon ||
      Math.abs(a - c) < epsilon
    );
  }
  
  /**
   * Checks if the triangle is right-angled
   * @param triangle The triangle to check
   * @returns True if the triangle is right-angled
   */
  isRightAngled(triangle: Triangle): boolean {
    const [a, b, c] = this.calculateSideLengths(triangle);
    
    // Sort sides to make c the longest
    const sides = [a, b, c].sort((x, y) => x - y);
    const [a2, b2, c2] = sides;
    
    // Check if the Pythagorean theorem holds: a² + b² = c²
    // Using a small epsilon for floating-point comparison
    const epsilon = 0.0001;
    return Math.abs((a2 * a2 + b2 * b2) - (c2 * c2)) < epsilon;
  }
} 