import { Rectangle, Point } from '@/types/shapes';
import { RectangleServiceImpl } from '@/services/implementations/RectangleServiceImpl';

describe('RectangleServiceImpl', () => {
  let service: RectangleServiceImpl;
  let rectangle: Rectangle;

  beforeEach(() => {
    service = new RectangleServiceImpl();
    rectangle = service.createRectangle(
      { x: 100, y: 100 },
      200,
      100,
      '#ff0000'
    );
  });

  describe('createShape', () => {
    it('should create a rectangle with default values when no params provided', () => {
      const shape = service.createShape({});
      
      expect(shape.type).toBe('rectangle');
      expect(shape.width).toBe(100);
      expect(shape.height).toBe(80);
      expect(shape.position).toEqual({ x: 0, y: 0 });
      expect(shape.fill).toBe('#4CAF50');
    });

    it('should create a rectangle with provided values', () => {
      const shape = service.createShape({
        position: { x: 50, y: 50 },
        width: 150,
        height: 75,
        color: '#0000ff'
      });
      
      expect(shape.type).toBe('rectangle');
      expect(shape.width).toBe(150);
      expect(shape.height).toBe(75);
      expect(shape.position).toEqual({ x: 50, y: 50 });
      expect(shape.fill).toBe('#0000ff');
    });
  });

  describe('createRectangle', () => {
    it('should create a rectangle with the specified parameters', () => {
      const position = { x: 50, y: 50 };
      const width = 100;
      const height = 50;
      const color = '#00ff00';
      
      const rect = service.createRectangle(position, width, height, color);
      
      expect(rect.type).toBe('rectangle');
      expect(rect.position).toEqual(position);
      expect(rect.width).toBe(width);
      expect(rect.height).toBe(height);
      expect(rect.fill).toBe(color);
      expect(rect.rotation).toBe(0);
      expect(rect.selected).toBe(false);
    });

    it('should ensure minimum width and height of 1', () => {
      const rect = service.createRectangle({ x: 0, y: 0 }, -10, -5);
      
      expect(rect.width).toBe(1);
      expect(rect.height).toBe(1);
    });
  });

  describe('resizeShape', () => {
    it('should update width when width param is provided', () => {
      const resized = service.resizeShape(rectangle, { width: 300 });
      
      expect(resized.width).toBe(300);
      expect(resized.height).toBe(rectangle.height);
    });

    it('should update height when height param is provided', () => {
      const resized = service.resizeShape(rectangle, { height: 150 });
      
      expect(resized.width).toBe(rectangle.width);
      expect(resized.height).toBe(150);
    });

    it('should update both width and height when both params are provided', () => {
      const resized = service.resizeShape(rectangle, { width: 300, height: 150 });
      
      expect(resized.width).toBe(300);
      expect(resized.height).toBe(150);
    });
  });

  describe('rotateShape', () => {
    it('should update the rotation property', () => {
      const angle = Math.PI / 4; // 45 degrees
      const rotated = service.rotateShape(rectangle, angle);
      
      expect(rotated.rotation).toBe(angle);
    });

    it('should handle full rotation (2π)', () => {
      const angle = 2 * Math.PI;
      const rotated = service.rotateShape(rectangle, angle);
      
      expect(rotated.rotation).toBe(0);
    });
  });

  describe('moveShape', () => {
    it('should update the position by the specified delta', () => {
      const dx = 50;
      const dy = -25;
      const moved = service.moveShape(rectangle, dx, dy);
      
      expect(moved.position.x).toBe(rectangle.position.x + dx);
      expect(moved.position.y).toBe(rectangle.position.y + dy);
    });
  });

  describe('getMeasurements', () => {
    it('should return correct measurements for a rectangle', () => {
      const measurements = service.getMeasurements(rectangle, 'cm');
      
      expect(measurements.width).toBe(rectangle.width);
      expect(measurements.height).toBe(rectangle.height);
      expect(measurements.area).toBe(rectangle.width * rectangle.height);
      expect(measurements.perimeter).toBe(2 * (rectangle.width + rectangle.height));
      expect(measurements.diagonal).toBe(Math.sqrt(rectangle.width * rectangle.width + rectangle.height * rectangle.height));
    });
  });

  describe('updateFromMeasurement', () => {
    it('should update width correctly', () => {
      const newWidth = 250;
      const updated = service.updateFromMeasurement(rectangle, 'width', newWidth, rectangle.width);
      
      expect(updated.width).toBe(newWidth);
      expect(updated.height).toBe(rectangle.height);
    });

    it('should update height correctly', () => {
      const newHeight = 150;
      const updated = service.updateFromMeasurement(rectangle, 'height', newHeight, rectangle.height);
      
      expect(updated.width).toBe(rectangle.width);
      expect(updated.height).toBe(newHeight);
    });

    it('should update area while maintaining aspect ratio', () => {
      const originalArea = rectangle.width * rectangle.height;
      const newArea = originalArea * 2;
      const updated = service.updateFromMeasurement(rectangle, 'area', newArea, originalArea);
      
      const aspectRatio = rectangle.width / rectangle.height;
      const expectedHeight = Math.sqrt(newArea / aspectRatio);
      const expectedWidth = expectedHeight * aspectRatio;
      
      expect(updated.width).toBeCloseTo(expectedWidth);
      expect(updated.height).toBeCloseTo(expectedHeight);
      expect(updated.width * updated.height).toBeCloseTo(newArea);
    });

    it('should update perimeter while maintaining aspect ratio', () => {
      const originalPerimeter = 2 * (rectangle.width + rectangle.height);
      const newPerimeter = originalPerimeter * 1.5;
      const updated = service.updateFromMeasurement(rectangle, 'perimeter', newPerimeter, originalPerimeter);
      
      const aspectRatio = rectangle.width / rectangle.height;
      expect(2 * (updated.width + updated.height)).toBeCloseTo(newPerimeter);
      expect(updated.width / updated.height).toBeCloseTo(aspectRatio);
    });

    it('should update diagonal while maintaining aspect ratio', () => {
      const originalDiagonal = Math.sqrt(rectangle.width * rectangle.width + rectangle.height * rectangle.height);
      const newDiagonal = originalDiagonal * 1.5;
      const updated = service.updateFromMeasurement(rectangle, 'diagonal', newDiagonal, originalDiagonal);
      
      const aspectRatio = rectangle.width / rectangle.height;
      expect(Math.sqrt(updated.width * updated.width + updated.height * updated.height)).toBeCloseTo(newDiagonal);
      expect(updated.width / updated.height).toBeCloseTo(aspectRatio);
    });

    it('should return the original shape for unhandled measurement keys', () => {
      const updated = service.updateFromMeasurement(rectangle, 'unknown', 100, 0);
      
      expect(updated).toEqual(rectangle);
    });
  });

  describe('containsPoint', () => {
    it('should return true for a point inside the rectangle', () => {
      const point: Point = { x: rectangle.position.x + 10, y: rectangle.position.y + 10 };
      
      expect(service.containsPoint(rectangle, point)).toBe(true);
    });

    it('should return true for a point on the edge of the rectangle', () => {
      const point: Point = { x: rectangle.position.x + rectangle.width, y: rectangle.position.y };
      
      expect(service.containsPoint(rectangle, point)).toBe(true);
    });

    it('should return false for a point outside the rectangle', () => {
      const point: Point = { x: rectangle.position.x + rectangle.width + 10, y: rectangle.position.y };
      
      expect(service.containsPoint(rectangle, point)).toBe(false);
    });
  });

  describe('getShapeType', () => {
    it('should return "rectangle"', () => {
      expect(service.getShapeType()).toBe('rectangle');
    });
  });

  describe('scaleRectangle', () => {
    it('should scale the rectangle by the specified factors', () => {
      const scaleX = 1.5;
      const scaleY = 2;
      const scaled = service.scaleRectangle(rectangle, scaleX, scaleY);
      
      expect(scaled.width).toBe(rectangle.width * scaleX);
      expect(scaled.height).toBe(rectangle.height * scaleY);
    });
  });

  describe('updateWidth', () => {
    it('should update the width', () => {
      const newWidth = 300;
      const updated = service.updateWidth(rectangle, newWidth);
      
      expect(updated.width).toBe(newWidth);
      expect(updated.height).toBe(rectangle.height);
    });

    it('should maintain aspect ratio when specified', () => {
      const newWidth = 300;
      const aspectRatio = rectangle.width / rectangle.height;
      const updated = service.updateWidth(rectangle, newWidth, true);
      
      expect(updated.width).toBe(newWidth);
      expect(updated.height).toBeCloseTo(newWidth / aspectRatio);
    });

    it('should not update width if value is invalid', () => {
      const updated = service.updateWidth(rectangle, -50);
      
      expect(updated).toEqual(rectangle);
    });
  });

  describe('updateHeight', () => {
    it('should update the height', () => {
      const newHeight = 150;
      const updated = service.updateHeight(rectangle, newHeight);
      
      expect(updated.width).toBe(rectangle.width);
      expect(updated.height).toBe(newHeight);
    });

    it('should maintain aspect ratio when specified', () => {
      const newHeight = 150;
      const aspectRatio = rectangle.width / rectangle.height;
      const updated = service.updateHeight(rectangle, newHeight, true);
      
      expect(updated.height).toBe(newHeight);
      expect(updated.width).toBeCloseTo(newHeight * aspectRatio);
    });

    it('should not update height if value is invalid', () => {
      const updated = service.updateHeight(rectangle, -50);
      
      expect(updated).toEqual(rectangle);
    });
  });

  describe('calculateArea', () => {
    it('should return the correct area', () => {
      expect(service.calculateArea(rectangle)).toBe(rectangle.width * rectangle.height);
    });
  });

  describe('calculatePerimeter', () => {
    it('should return the correct perimeter', () => {
      expect(service.calculatePerimeter(rectangle)).toBe(2 * (rectangle.width + rectangle.height));
    });
  });

  describe('calculateDiagonal', () => {
    it('should return the correct diagonal length', () => {
      expect(service.calculateDiagonal(rectangle)).toBe(
        Math.sqrt(rectangle.width * rectangle.width + rectangle.height * rectangle.height)
      );
    });
  });

  describe('getCenter', () => {
    it('should return the center point of the rectangle', () => {
      const center = service.getCenter(rectangle);
      
      expect(center.x).toBe(rectangle.position.x + rectangle.width / 2);
      expect(center.y).toBe(rectangle.position.y + rectangle.height / 2);
    });
  });
}); 