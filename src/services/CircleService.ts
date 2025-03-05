import { Circle, Point } from '@/types/shapes';
import { ShapeService } from './ShapeService';

/**
 * Interface for services that handle operations specific to Circle shapes
 * Extends the base ShapeService with Circle-specific methods
 */
export interface CircleService extends ShapeService<Circle> {
  /**
   * Creates a circle with the specified parameters
   * @param center The center point of the circle
   * @param radius The radius of the circle
   * @param color The color of the circle (optional)
   * @param id The ID of the circle (optional)
   * @returns A new Circle instance
   */
  createCircle(center: Point, radius: number, color?: string, id?: string): Circle;
  
  /**
   * Scales the circle by the specified factor
   * @param circle The circle to scale
   * @param scaleFactor The factor to scale by
   * @param center The center point of scaling (defaults to circle center)
   * @returns The scaled circle
   */
  scaleCircle(circle: Circle, scaleFactor: number, center?: Point): Circle;
  
  /**
   * Updates the radius of the circle
   * @param circle The circle to update
   * @param radius The new radius
   * @returns The updated circle
   */
  updateRadius(circle: Circle, radius: number): Circle;
  
  /**
   * Calculates the area of the circle
   * @param circle The circle to calculate area for
   * @returns The area of the circle
   */
  calculateArea(circle: Circle): number;
  
  /**
   * Calculates the circumference of the circle
   * @param circle The circle to calculate circumference for
   * @returns The circumference of the circle
   */
  calculateCircumference(circle: Circle): number;
  
  /**
   * Calculates the diameter of the circle
   * @param circle The circle to calculate diameter for
   * @returns The diameter of the circle
   */
  calculateDiameter(circle: Circle): number;
} 