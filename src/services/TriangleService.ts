import { Point, Triangle } from '@/types/shapes';
import { ShapeService } from './ShapeService';

/**
 * Interface for services that handle operations specific to Triangle shapes
 * Extends the base ShapeService with Triangle-specific methods
 */
export interface TriangleService extends ShapeService<Triangle> {
  /**
   * Creates a triangle with the specified parameters
   * @param points The three points of the triangle
   * @param color The color of the triangle (optional)
   * @param id The ID of the triangle (optional)
   * @returns A new Triangle instance
   */
  createTriangle(points: [Point, Point, Point], color?: string, id?: string): Triangle;
  
  /**
   * Scales the triangle by the specified factor
   * @param triangle The triangle to scale
   * @param scaleFactor The factor to scale by
   * @param center The center point of scaling (defaults to triangle centroid)
   * @returns The scaled triangle
   */
  scaleTriangle(triangle: Triangle, scaleFactor: number, center?: Point): Triangle;
  
  /**
   * Updates a specific point of the triangle
   * @param triangle The triangle to update
   * @param pointIndex The index of the point to update (0, 1, or 2)
   * @param newPoint The new point coordinates
   * @returns The updated triangle
   */
  updatePoint(triangle: Triangle, pointIndex: number, newPoint: Point): Triangle;
  
  /**
   * Calculates the area of the triangle
   * @param triangle The triangle to calculate area for
   * @returns The area of the triangle
   */
  calculateArea(triangle: Triangle): number;
  
  /**
   * Calculates the perimeter of the triangle
   * @param triangle The triangle to calculate perimeter for
   * @returns The perimeter of the triangle
   */
  calculatePerimeter(triangle: Triangle): number;
  
  /**
   * Calculates the lengths of all sides of the triangle
   * @param triangle The triangle to calculate sides for
   * @returns An array of the three side lengths
   */
  calculateSideLengths(triangle: Triangle): [number, number, number];
  
  /**
   * Calculates the angles of the triangle in radians
   * @param triangle The triangle to calculate angles for
   * @returns An array of the three angles in radians
   */
  calculateAngles(triangle: Triangle): [number, number, number];
  
  /**
   * Gets the centroid (center of mass) of the triangle
   * @param triangle The triangle to get centroid for
   * @returns The centroid point of the triangle
   */
  getCentroid(triangle: Triangle): Point;
  
  /**
   * Checks if the triangle is equilateral
   * @param triangle The triangle to check
   * @returns True if the triangle is equilateral
   */
  isEquilateral(triangle: Triangle): boolean;
  
  /**
   * Checks if the triangle is isosceles
   * @param triangle The triangle to check
   * @returns True if the triangle is isosceles
   */
  isIsosceles(triangle: Triangle): boolean;
  
  /**
   * Checks if the triangle is right-angled
   * @param triangle The triangle to check
   * @returns True if the triangle is right-angled
   */
  isRightAngled(triangle: Triangle): boolean;
} 