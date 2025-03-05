import { Rectangle, Point, ShapeType, MeasurementUnit } from '@/types/shapes';
import { RectangleService } from '../RectangleService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Implementation of the RectangleService interface
 * Provides operations for Rectangle shapes
 */
export class RectangleServiceImpl implements RectangleService {
  /**
   * Creates a new shape with the provided parameters
   * @param params Parameters for creating the shape
   * @returns A new Rectangle instance
   */
  createShape(params: Record<string, unknown>): Rectangle {
    const position = params.position as Point || { x: 0, y: 0 };
    const width = (params.width as number) || 100;
    const height = (params.height as number) || 80;
    const color = (params.color as string) || '#4CAF50';
    const id = (params.id as string) || uuidv4();
    
    return this.createRectangle(position, width, height, color, id);
  }
  
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
  ): Rectangle {
    return {
      id: id || uuidv4(),
      type: 'rectangle',
      position: { ...position },
      width: Math.max(1, width), // Ensure minimum width of 1
      height: Math.max(1, height), // Ensure minimum height of 1
      rotation: 0,
      selected: false,
      fill: color || '#4CAF50',
      stroke: '#000000',
      strokeWidth: 1
    };
  }
  
  /**
   * Resizes a shape based on the provided parameters
   * @param shape The shape to resize
   * @param params Resize parameters (e.g., width, height)
   * @returns The resized shape
   */
  resizeShape(shape: Rectangle, params: Record<string, number>): Rectangle {
    let result = { ...shape };
    
    if (params.width !== undefined) {
      result = this.updateWidth(result, params.width);
    }
    
    if (params.height !== undefined) {
      result = this.updateHeight(result, params.height);
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
  rotateShape(shape: Rectangle, angle: number, center?: Point): Rectangle {
    // For simplicity, we're just updating the rotation property
    // In a real implementation, you might need to adjust the position based on the center of rotation
    return {
      ...shape,
      rotation: (shape.rotation + angle) % (2 * Math.PI)
    };
  }
  
  /**
   * Moves a shape to a new position
   * @param shape The shape to move
   * @param dx The change in x-coordinate
   * @param dy The change in y-coordinate
   * @returns The moved shape
   */
  moveShape(shape: Rectangle, dx: number, dy: number): Rectangle {
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
  getMeasurements(shape: Rectangle, unit: MeasurementUnit): Record<string, number> {
    // For simplicity, we're not doing unit conversion here
    // In a real implementation, you would convert from pixels to the specified unit
    const width = shape.width;
    const height = shape.height;
    const area = width * height;
    const perimeter = 2 * (width + height);
    const diagonal = Math.sqrt(width * width + height * height);
    
    return {
      width,
      height,
      area,
      perimeter,
      diagonal
    };
  }
  
  /**
   * Updates a shape based on a measurement change
   * @param shape The shape to update
   * @param measurementKey The measurement being changed
   * @param newValue The new value for the measurement
   * @param originalValue The original value (for calculating scale factors)
   * @returns The updated shape
   */
  updateFromMeasurement(
    shape: Rectangle, 
    measurementKey: string, 
    newValue: number, 
    originalValue: number
  ): Rectangle {
    switch (measurementKey) {
      case 'width':
        return this.updateWidth(shape, newValue);
      case 'height':
        return this.updateHeight(shape, newValue);
      case 'area': {
        // For area, we'll maintain the aspect ratio
        const aspectRatio = shape.width / shape.height;
        const newHeight = Math.sqrt(newValue / aspectRatio);
        const newWidth = newHeight * aspectRatio;
        return {
          ...shape,
          width: newWidth,
          height: newHeight
        };
      }
      case 'perimeter': {
        // For perimeter, we'll maintain the aspect ratio
        const aspectRatio = shape.width / shape.height;
        // P = 2w + 2h, with w = aspectRatio * h
        // P = 2(aspectRatio * h) + 2h = 2h(aspectRatio + 1)
        // h = P / (2(aspectRatio + 1))
        const newHeight = newValue / (2 * (aspectRatio + 1));
        const newWidth = aspectRatio * newHeight;
        return {
          ...shape,
          width: newWidth,
          height: newHeight
        };
      }
      case 'diagonal': {
        // For diagonal, we'll maintain the aspect ratio
        // d² = w² + h², with w = aspectRatio * h
        // d² = (aspectRatio * h)² + h² = h²(aspectRatio² + 1)
        // h = d / √(aspectRatio² + 1)
        const aspectRatio = shape.width / shape.height;
        const newHeight = newValue / Math.sqrt(aspectRatio * aspectRatio + 1);
        const newWidth = aspectRatio * newHeight;
        return {
          ...shape,
          width: newWidth,
          height: newHeight
        };
      }
      default:
        console.warn(`Unhandled measurement update: ${measurementKey} for rectangle`);
        return shape;
    }
  }
  
  /**
   * Checks if a point is inside or on the shape
   * @param shape The shape to check
   * @param point The point to test
   * @returns True if the point is inside or on the shape
   */
  containsPoint(shape: Rectangle, point: Point): boolean {
    // For simplicity, we're not handling rotation
    // In a real implementation, you would need to account for the rotation
    const { x, y } = point;
    const { position, width, height } = shape;
    
    return (
      x >= position.x &&
      x <= position.x + width &&
      y >= position.y &&
      y <= position.y + height
    );
  }
  
  /**
   * Gets the type of the shape this service handles
   * @returns The shape type
   */
  getShapeType(): ShapeType {
    return 'rectangle';
  }
  
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
  ): Rectangle {
    // For simplicity, we're just scaling the dimensions
    // In a real implementation, you might need to adjust the position based on the center of scaling
    return {
      ...rectangle,
      width: rectangle.width * scaleX,
      height: rectangle.height * scaleY
    };
  }
  
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
    maintainAspectRatio = false
  ): Rectangle {
    if (width <= 0) {
      console.warn(`Invalid width: ${width}. Must be greater than 0.`);
      return rectangle;
    }
    
    if (maintainAspectRatio) {
      const aspectRatio = rectangle.width / rectangle.height;
      const newHeight = width / aspectRatio;
      
      return {
        ...rectangle,
        width,
        height: newHeight
      };
    }
    
    return {
      ...rectangle,
      width
    };
  }
  
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
    maintainAspectRatio = false
  ): Rectangle {
    if (height <= 0) {
      console.warn(`Invalid height: ${height}. Must be greater than 0.`);
      return rectangle;
    }
    
    if (maintainAspectRatio) {
      const aspectRatio = rectangle.width / rectangle.height;
      const newWidth = height * aspectRatio;
      
      return {
        ...rectangle,
        width: newWidth,
        height
      };
    }
    
    return {
      ...rectangle,
      height
    };
  }
  
  /**
   * Calculates the area of the rectangle
   * @param rectangle The rectangle to calculate area for
   * @returns The area of the rectangle
   */
  calculateArea(rectangle: Rectangle): number {
    return rectangle.width * rectangle.height;
  }
  
  /**
   * Calculates the perimeter of the rectangle
   * @param rectangle The rectangle to calculate perimeter for
   * @returns The perimeter of the rectangle
   */
  calculatePerimeter(rectangle: Rectangle): number {
    return 2 * (rectangle.width + rectangle.height);
  }
  
  /**
   * Calculates the diagonal length of the rectangle
   * @param rectangle The rectangle to calculate diagonal for
   * @returns The diagonal length of the rectangle
   */
  calculateDiagonal(rectangle: Rectangle): number {
    return Math.sqrt(rectangle.width * rectangle.width + rectangle.height * rectangle.height);
  }
  
  /**
   * Gets the center point of the rectangle
   * @param rectangle The rectangle to get center for
   * @returns The center point of the rectangle
   */
  getCenter(rectangle: Rectangle): Point {
    return {
      x: rectangle.position.x + rectangle.width / 2,
      y: rectangle.position.y + rectangle.height / 2
    };
  }
} 