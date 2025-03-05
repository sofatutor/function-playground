import { AnyShape, Point, ShapeType } from '@/types/shapes';
import { MeasurementUnit } from '@/types/shapes';

/**
 * Interface for shape services that handle operations on specific shape types
 * Each shape type (Circle, Rectangle, Triangle, Line) will have its own service implementation
 */
export interface ShapeService<T extends AnyShape> {
  /**
   * Creates a new shape of the specific type
   * @param params Parameters needed to create the shape
   * @returns A new shape instance
   */
  createShape(params: Record<string, unknown>): T;
  
  /**
   * Resizes a shape based on the provided parameters
   * @param shape The shape to resize
   * @param params Resize parameters (e.g., width, height, radius)
   * @returns The resized shape
   */
  resizeShape(shape: T, params: Record<string, number>): T;
  
  /**
   * Rotates a shape by the specified angle
   * @param shape The shape to rotate
   * @param angle The angle to rotate by (in radians)
   * @param center The center point of rotation
   * @returns The rotated shape
   */
  rotateShape(shape: T, angle: number, center?: Point): T;
  
  /**
   * Moves a shape to a new position
   * @param shape The shape to move
   * @param dx The change in x-coordinate
   * @param dy The change in y-coordinate
   * @returns The moved shape
   */
  moveShape(shape: T, dx: number, dy: number): T;
  
  /**
   * Gets all available measurements for the shape
   * @param shape The shape to measure
   * @param unit The unit to use for measurements
   * @returns A record of measurement names and their values
   */
  getMeasurements(shape: T, unit: MeasurementUnit): Record<string, number>;
  
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
    shape: T, 
    measurementKey: string, 
    newValue: number, 
    originalValue: number,
    unit?: MeasurementUnit
  ): T;
  
  /**
   * Checks if a point is inside or on the shape
   * @param shape The shape to check
   * @param point The point to test
   * @returns True if the point is inside or on the shape
   */
  containsPoint(shape: T, point: Point): boolean;
  
  /**
   * Gets the type of the shape this service handles
   * @returns The shape type
   */
  getShapeType(): ShapeType;
}

/**
 * Factory interface for creating shape services
 */
export interface ShapeServiceFactory {
  /**
   * Gets the appropriate service for a given shape
   * @param shapeType The type of shape
   * @returns The service for the specified shape type
   */
  getService<T extends AnyShape>(shapeType: ShapeType): ShapeService<T>;
  
  /**
   * Gets the appropriate service for a given shape instance
   * @param shape The shape instance
   * @returns The service for the shape's type
   */
  getServiceForShape<T extends AnyShape>(shape: AnyShape): ShapeService<T>;
} 