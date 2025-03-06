import { AnyShape, ShapeType, isCircle, isLine, isRectangle, isTriangle } from '@/types/shapes';
import { CircleService } from './CircleService';
import { LineService } from './LineService';
import { RectangleService } from './RectangleService';
import { ShapeService, ShapeServiceFactory } from './ShapeService';
import { TriangleService } from './TriangleService';

/**
 * Factory class for creating and retrieving shape services
 * Implements the ShapeServiceFactory interface
 */
export class DefaultShapeServiceFactory implements ShapeServiceFactory {
  private circleService: CircleService;
  private rectangleService: RectangleService;
  private triangleService: TriangleService;
  private lineService: LineService;
  
  /**
   * Creates a new ShapeServiceFactory with the provided services
   * @param circleService The service for circle operations
   * @param rectangleService The service for rectangle operations
   * @param triangleService The service for triangle operations
   * @param lineService The service for line operations
   */
  constructor(
    circleService: CircleService,
    rectangleService: RectangleService,
    triangleService: TriangleService,
    lineService: LineService
  ) {
    this.circleService = circleService;
    this.rectangleService = rectangleService;
    this.triangleService = triangleService;
    this.lineService = lineService;
  }
  
  /**
   * Gets the appropriate service for a given shape type
   * @param shapeType The type of shape
   * @returns The service for the specified shape type
   * @throws Error if the shape type is not supported
   */
  getService<T extends AnyShape>(shapeType: ShapeType): ShapeService<T> {
    switch (shapeType) {
      case 'circle':
        return this.circleService as unknown as ShapeService<T>;
      case 'rectangle':
        return this.rectangleService as unknown as ShapeService<T>;
      case 'triangle':
        return this.triangleService as unknown as ShapeService<T>;
      case 'line':
        return this.lineService as unknown as ShapeService<T>;
      default:
        throw new Error(`Unsupported shape type: ${shapeType}`);
    }
  }
  
  /**
   * Gets the appropriate service for a given shape instance
   * @param shape The shape instance
   * @returns The service for the shape's type
   * @throws Error if the shape type is not supported
   */
  getServiceForShape<T extends AnyShape>(shape: AnyShape): ShapeService<T> {
    if (isCircle(shape)) {
      return this.circleService as unknown as ShapeService<T>;
    } else if (isRectangle(shape)) {
      return this.rectangleService as unknown as ShapeService<T>;
    } else if (isTriangle(shape)) {
      return this.triangleService as unknown as ShapeService<T>;
    } else if (isLine(shape)) {
      return this.lineService as unknown as ShapeService<T>;
    } else {
      const unknownShape = shape as unknown as { type: string };
      throw new Error(`Unsupported shape type: ${unknownShape.type}`);
    }
  }
} 