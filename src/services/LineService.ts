import { Line, Point } from '@/types/shapes';
import { ShapeService } from './ShapeService';

/**
 * Interface for services that handle operations specific to Line shapes
 * Extends the base ShapeService with Line-specific methods
 */
export interface LineService extends ShapeService<Line> {
  /**
   * Creates a line with the specified parameters
   * @param start The starting point of the line
   * @param end The ending point of the line
   * @param color The color of the line (optional)
   * @param id The ID of the line (optional)
   * @returns A new Line instance
   */
  createLine(start: Point, end: Point, color?: string, id?: string): Line;
  
  /**
   * Scales the line by the specified factor
   * @param line The line to scale
   * @param scaleFactor The factor to scale by
   * @param center The center point of scaling (defaults to line midpoint)
   * @returns The scaled line
   */
  scaleLine(line: Line, scaleFactor: number, center?: Point): Line;
  
  /**
   * Updates the start point of the line
   * @param line The line to update
   * @param start The new start point
   * @returns The updated line
   */
  updateStart(line: Line, start: Point): Line;
  
  /**
   * Updates the end point of the line
   * @param line The line to update
   * @param end The new end point
   * @returns The updated line
   */
  updateEnd(line: Line, end: Point): Line;
  
  /**
   * Calculates the length of the line
   * @param line The line to calculate length for
   * @returns The length of the line
   */
  calculateLength(line: Line): number;
  
  /**
   * Calculates the angle of the line in radians
   * @param line The line to calculate angle for
   * @returns The angle of the line in radians
   */
  calculateAngle(line: Line): number;
  
  /**
   * Gets the midpoint of the line
   * @param line The line to get midpoint for
   * @returns The midpoint of the line
   */
  getMidpoint(line: Line): Point;
  
  /**
   * Extends the line by a specified distance
   * @param line The line to extend
   * @param distance The distance to extend by
   * @param fromStart Whether to extend from the start point (true) or end point (false)
   * @returns The extended line
   */
  extendLine(line: Line, distance: number, fromStart: boolean): Line;
  
  /**
   * Calculates the slope of the line
   * @param line The line to calculate slope for
   * @returns The slope of the line, or Infinity for vertical lines
   */
  calculateSlope(line: Line): number;
  
  /**
   * Calculates the perpendicular distance from a point to the line
   * @param line The line to calculate distance from
   * @param point The point to calculate distance to
   * @returns The perpendicular distance from the point to the line
   */
  distanceToPoint(line: Line, point: Point): number;
} 