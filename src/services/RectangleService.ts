import { Point, Rectangle } from '@/types/shapes';
import { ShapeService } from './ShapeService';

/**
 * Interface for services that handle operations specific to Rectangle shapes
 * Extends the base ShapeService with Rectangle-specific methods
 */
export interface RectangleService extends ShapeService<Rectangle> {
  /**
   * Creates a rectangle with the specified parameters
   * @param position The top-left position of the rectangle
   * @param width The width of the rectangle
   * @param height The height of the rectangle
   * @param color The color of the rectangle (optional)
   * @param id The ID of the rectangle (optional)
   * @returns A new Rectangle instance
   */
  createRectangle(
    position: Point, 
    width: number, 
    height: number, 
    color?: string, 
    id?: string
  ): Rectangle;
  
  /**
   * Scales the rectangle by the specified factors
   * @param rectangle The rectangle to scale
   * @param scaleX The factor to scale width by
   * @param scaleY The factor to scale height by
   * @param center The center point of scaling (defaults to rectangle center)
   * @returns The scaled rectangle
   */
  scaleRectangle(
    rectangle: Rectangle, 
    scaleX: number, 
    scaleY: number, 
    center?: Point
  ): Rectangle;
  
  /**
   * Updates the width of the rectangle
   * @param rectangle The rectangle to update
   * @param width The new width
   * @param maintainAspectRatio Whether to maintain the aspect ratio
   * @returns The updated rectangle
   */
  updateWidth(
    rectangle: Rectangle, 
    width: number, 
    maintainAspectRatio?: boolean
  ): Rectangle;
  
  /**
   * Updates the height of the rectangle
   * @param rectangle The rectangle to update
   * @param height The new height
   * @param maintainAspectRatio Whether to maintain the aspect ratio
   * @returns The updated rectangle
   */
  updateHeight(
    rectangle: Rectangle, 
    height: number, 
    maintainAspectRatio?: boolean
  ): Rectangle;
  
  /**
   * Calculates the area of the rectangle
   * @param rectangle The rectangle to calculate area for
   * @returns The area of the rectangle
   */
  calculateArea(rectangle: Rectangle): number;
  
  /**
   * Calculates the perimeter of the rectangle
   * @param rectangle The rectangle to calculate perimeter for
   * @returns The perimeter of the rectangle
   */
  calculatePerimeter(rectangle: Rectangle): number;
  
  /**
   * Calculates the diagonal length of the rectangle
   * @param rectangle The rectangle to calculate diagonal for
   * @returns The diagonal length of the rectangle
   */
  calculateDiagonal(rectangle: Rectangle): number;
  
  /**
   * Gets the center point of the rectangle
   * @param rectangle The rectangle to get center for
   * @returns The center point of the rectangle
   */
  getCenter(rectangle: Rectangle): Point;
} 