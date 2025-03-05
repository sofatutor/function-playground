import { Rectangle, Point, ShapeType, MeasurementUnit } from '@/types/shapes';
import { RectangleService } from '../RectangleService';
import { v4 as uuidv4 } from 'uuid';
import { convertFromPixels } from '@/utils/geometry/measurements';
import { getStoredPixelsPerUnit, getNextShapeColor } from '@/utils/geometry/common';

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
    const color = (params.color as string) || getNextShapeColor();
    const id = (params.id as string) || uuidv4();
    const rotation = (params.rotation as number) || 0;
    
    return this.createRectangle(position, width, height, color, id, rotation);
  }
  
  /**
   * Creates a rectangle with the specified parameters
   * @param position The top-left position of the rectangle
   * @param width The width of the rectangle
   * @param height The height of the rectangle
   * @param color The color of the rectangle (optional)
   * @param id The ID of the rectangle (optional)
   * @param rotation The rotation angle in radians (optional)
   * @returns A new Rectangle instance
   */
  createRectangle(
    position: Point, 
    width: number, 
    height: number, 
    color?: string, 
    id?: string,
    rotation?: number
  ): Rectangle {
    return {
      id: id || uuidv4(),
      type: 'rectangle',
      position: { ...position },
      width: Math.max(1, width), // Ensure minimum width of 1
      height: Math.max(1, height), // Ensure minimum height of 1
      rotation: rotation || 0,
      selected: false,
      fill: color || getNextShapeColor(),
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
    const widthInPixels = shape.width;
    const heightInPixels = shape.height;
    const perimeterInPixels = 2 * (widthInPixels + heightInPixels);
    const areaInPixels = widthInPixels * heightInPixels;
    const diagonalInPixels = Math.sqrt(widthInPixels * widthInPixels + heightInPixels * heightInPixels);
    
    // Convert to the specified unit
    const width = convertFromPixelsFn(widthInPixels);
    const height = convertFromPixelsFn(heightInPixels);
    const perimeter = convertFromPixelsFn(perimeterInPixels);
    const area = convertAreaFromPixelsFn(areaInPixels);
    const diagonal = convertFromPixelsFn(diagonalInPixels);
    
    return {
      width,
      height,
      perimeter,
      area,
      diagonal
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
    shape: Rectangle, 
    measurementKey: string, 
    newValue: number, 
    originalValue: number,
    unit: MeasurementUnit = 'cm'
  ): Rectangle {
    // Get the conversion factor for the current unit
    const pixelsPerUnit = getStoredPixelsPerUnit(unit);
    
    switch (measurementKey) {
      case 'width': {
        // Convert width from units to pixels
        const newWidthInPixels = newValue * pixelsPerUnit;
        return this.updateWidth(shape, newWidthInPixels);
      }
      case 'height': {
        // Convert height from units to pixels
        const newHeightInPixels = newValue * pixelsPerUnit;
        return this.updateHeight(shape, newHeightInPixels);
      }
      case 'area': {
        // Convert area from square units to square pixels
        const newAreaInPixels = newValue * pixelsPerUnit * pixelsPerUnit;
        const currentArea = this.calculateArea(shape);
        
        // Calculate scale factor using square root of area ratio
        const scaleFactor = Math.sqrt(newAreaInPixels / currentArea);
        
        // Scale both width and height by the same factor to maintain aspect ratio
        return this.scaleRectangle(shape, scaleFactor, scaleFactor);
      }
      case 'perimeter': {
        // Convert perimeter from units to pixels
        const newPerimeterInPixels = newValue * pixelsPerUnit;
        const currentPerimeter = this.calculatePerimeter(shape);
        
        // Calculate scale factor using perimeter ratio
        const scaleFactor = newPerimeterInPixels / currentPerimeter;
        
        // Scale both width and height by the same factor to maintain aspect ratio
        return this.scaleRectangle(shape, scaleFactor, scaleFactor);
      }
      case 'diagonal': {
        // Convert diagonal from units to pixels
        const newDiagonalInPixels = newValue * pixelsPerUnit;
        const currentDiagonal = this.calculateDiagonal(shape);
        
        // Calculate scale factor using diagonal ratio
        const scaleFactor = newDiagonalInPixels / currentDiagonal;
        
        // Scale both width and height by the same factor to maintain aspect ratio
        return this.scaleRectangle(shape, scaleFactor, scaleFactor);
      }
      default:
        console.warn(`Unhandled measurement key: "${measurementKey}" for rectangle. Supported keys are: width, height, area, perimeter, diagonal.`);
        return shape;
    }
  }
  
  /**
   * Gets the pixels per unit for the current measurement unit
   * @returns The number of pixels per unit
   */
  private getPixelsPerUnit(): number {
    // Get the current measurement unit from the application context
    // For now, we'll use a fixed value of 'cm' as the default unit
    const measurementUnit = 'cm';
    
    // Get the pixels per unit for the current measurement unit
    return getStoredPixelsPerUnit(measurementUnit);
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
   * Updates the width of a rectangle
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
      console.warn(`Invalid width: ${width}. Using minimum value of 1 pixel instead.`);
      width = 1; // Set to minimum value instead of returning the original
    }
    
    if (maintainAspectRatio) {
      const aspectRatio = rectangle.height / rectangle.width;
      const newHeight = width * aspectRatio;
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
   * Updates the height of a rectangle
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
      console.warn(`Invalid height: ${height}. Using minimum value of 1 pixel instead.`);
      height = 1; // Set to minimum value instead of returning the original
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