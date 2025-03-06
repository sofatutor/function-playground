import { Line, Point } from '@/types/shapes';
import { LineServiceImpl } from '@/services/implementations/LineServiceImpl';
import * as commonUtils from '@/utils/geometry/common';
import { degreesToRadians, radiansToDegrees, toCounterclockwiseAngle } from '@/utils/geometry/rotation';

// Mock the getStoredPixelsPerUnit function
jest.mock('@/utils/geometry/common', () => ({
  ...jest.requireActual('@/utils/geometry/common'),
  getStoredPixelsPerUnit: jest.fn().mockReturnValue(60) // Mock 60 pixels per unit
}));

describe('LineServiceImpl', () => {
  let service: LineServiceImpl;
  let line: Line;

  beforeEach(() => {
    service = new LineServiceImpl();
    line = service.createLine(
      { x: 100, y: 100 },
      { x: 200, y: 200 },
      '#ff0000'
    );
    
    // Reset the mock before each test
    jest.clearAllMocks();
    (commonUtils.getStoredPixelsPerUnit as jest.Mock).mockReturnValue(60);
  });

  describe('createShape', () => {
    it('should create a line with default values when no params provided', () => {
      const shape = service.createShape({});
      
      expect(shape.type).toBe('line');
      expect(shape.startPoint).toEqual({ x: 0, y: 0 });
      expect(shape.endPoint).toEqual({ x: 100, y: 100 });
      expect(shape.fill).toBe('transparent');
      expect(shape.stroke).toMatch(/^rgba\(\d+, \d+, \d+, \d+(\.\d+)?\)$/);
    });

    it('should create a line with provided values', () => {
      const shape = service.createShape({
        start: { x: 50, y: 50 },
        end: { x: 150, y: 150 },
        color: '#0000ff'
      });
      
      expect(shape.type).toBe('line');
      expect(shape.startPoint).toEqual({ x: 50, y: 50 });
      expect(shape.endPoint).toEqual({ x: 150, y: 150 });
      expect(shape.stroke).toBe('#0000ff');
    });
  });

  describe('createLine', () => {
    it('should create a line with the specified parameters', () => {
      const startPoint = { x: 50, y: 50 };
      const endPoint = { x: 150, y: 150 };
      const color = '#00ff00';
      
      const l = service.createLine(startPoint, endPoint, color);
      
      expect(l.type).toBe('line');
      expect(l.startPoint).toEqual(startPoint);
      expect(l.endPoint).toEqual(endPoint);
      expect(l.stroke).toBe(color);
      expect(l.fill).toBe('transparent');
    });

    it('should calculate length correctly', () => {
      const startPoint = { x: 100, y: 100 };
      const endPoint = { x: 200, y: 200 };
      const l = service.createLine(startPoint, endPoint);
      
      const expectedLength = Math.sqrt(
        Math.pow(endPoint.x - startPoint.x, 2) +
        Math.pow(endPoint.y - startPoint.y, 2)
      );
      
      expect(l.length).toBeCloseTo(expectedLength);
    });
  });

  describe('resizeShape', () => {
    it('should scale the line when scale param is provided', () => {
      const scale = 1.5;
      const originalLength = service.calculateLength(line);
      const resized = service.resizeShape(line, { scale });
      
      expect(service.calculateLength(resized)).toBeCloseTo(originalLength * scale);
    });
  });

  describe('rotateShape', () => {
    it('should rotate the line by the specified angle', () => {
      const angle = Math.PI / 4; // 45 degrees
      const rotated = service.rotateShape(line, angle);
      
      expect(rotated.rotation).toBeCloseTo(line.rotation + angle);
    });
  });

  describe('moveShape', () => {
    it('should update both points by the specified delta', () => {
      const dx = 50;
      const dy = -25;
      const moved = service.moveShape(line, dx, dy);
      
      expect(moved.startPoint.x).toBe(line.startPoint.x + dx);
      expect(moved.startPoint.y).toBe(line.startPoint.y + dy);
      expect(moved.endPoint.x).toBe(line.endPoint.x + dx);
      expect(moved.endPoint.y).toBe(line.endPoint.y + dy);
    });
  });

  describe('getMeasurements', () => {
    it('should return correct measurements for a line', () => {
      const pixelsPerCm = 60;
      jest.spyOn(commonUtils, 'getStoredPixelsPerUnit').mockReturnValue(pixelsPerCm);
      
      const measurements = service.getMeasurements(line, 'cm');
      const lengthInPixels = service.calculateLength(line);
      const lengthInCm = lengthInPixels / pixelsPerCm;
      
      expect(measurements.length).toBeCloseTo(lengthInCm);
      // The angle in measurements is in degrees, but calculateAngle returns radians
      // So we need to convert the radians to degrees for comparison
      const angleInDegrees = measurements.angle;
      const angleInRadians = service.calculateAngle(line);
      
      // For this specific test, we know the line is at 45 degrees (from 100,100 to 200,200)
      // In the mathematical system, this is 45 degrees counterclockwise
      // In the UI system (clockwise), this becomes -45 degrees
      
      // We expect the angle to be -45 degrees
      expect(angleInDegrees).toBeCloseTo(-45);
    });
  });

  describe('updateFromMeasurement', () => {
    const pixelsPerUnit = 60;
    
    it('should update length correctly', () => {
      const newLength = 200;
      const updated = service.updateFromMeasurement(line, 'length', newLength, service.calculateLength(line));
      
      // The length should be updated to the new value in pixels
      expect(service.calculateLength(updated)).toBeCloseTo(newLength * pixelsPerUnit);
    });

    it('should update angle correctly', () => {
      const newAngle = 45; // 45 degrees
      const updated = service.updateFromMeasurement(line, 'angle', newAngle, service.calculateAngle(line));
      
      // Convert the expected angle to radians in counterclockwise direction
      const expectedAngleRadians = degreesToRadians(toCounterclockwiseAngle(newAngle));
      
      // Get the actual angle in radians
      const actualAngleRadians = service.calculateAngle(updated);
      
      // Compare the angles
      expect(actualAngleRadians).toBeCloseTo(expectedAngleRadians);
    });

    it('should return the original shape for unhandled measurement keys', () => {
      const updated = service.updateFromMeasurement(line, 'unknown', 100, 0);
      
      expect(updated).toEqual(line);
    });
  });

  describe('containsPoint', () => {
    it('should return true for a point on the line', () => {
      const point: Point = { x: 150, y: 150 }; // Midpoint of the line
      
      expect(service.containsPoint(line, point)).toBe(true);
    });

    it('should return false for a point not on the line', () => {
      const point: Point = { x: 50, y: 200 };
      
      expect(service.containsPoint(line, point)).toBe(false);
    });
  });

  describe('getShapeType', () => {
    it('should return "line"', () => {
      expect(service.getShapeType()).toBe('line');
    });
  });

  describe('scaleLine', () => {
    it('should scale the line by the specified factor', () => {
      const scaleFactor = 1.5;
      const originalLength = service.calculateLength(line);
      const scaled = service.scaleLine(line, scaleFactor);
      
      expect(service.calculateLength(scaled)).toBeCloseTo(originalLength * scaleFactor);
    });
  });

  describe('calculateLength', () => {
    it('should return the correct length', () => {
      const expectedLength = Math.sqrt(
        Math.pow(line.endPoint.x - line.startPoint.x, 2) +
        Math.pow(line.endPoint.y - line.startPoint.y, 2)
      );
      
      expect(service.calculateLength(line)).toBeCloseTo(expectedLength);
    });
  });

  describe('calculateAngle', () => {
    it('should return the correct angle', () => {
      const expectedAngle = Math.atan2(
        line.endPoint.y - line.startPoint.y,
        line.endPoint.x - line.startPoint.x
      );
      
      expect(service.calculateAngle(line)).toBeCloseTo(expectedAngle);
    });
  });

  describe('getMidpoint', () => {
    it('should return the correct midpoint', () => {
      const expectedMidpoint = {
        x: (line.startPoint.x + line.endPoint.x) / 2,
        y: (line.startPoint.y + line.endPoint.y) / 2
      };
      
      expect(service.getMidpoint(line)).toEqual(expectedMidpoint);
    });
  });
}); 