import { Circle, Point } from '@/types/shapes';
import { CircleServiceImpl } from '@/services/implementations/CircleServiceImpl';
import * as commonUtils from '@/utils/geometry/common';

// Mock the getStoredPixelsPerUnit function
jest.mock('@/utils/geometry/common', () => ({
  ...jest.requireActual('@/utils/geometry/common'),
  getStoredPixelsPerUnit: jest.fn().mockReturnValue(60) // Mock 60 pixels per unit
}));

describe('CircleServiceImpl', () => {
  let service: CircleServiceImpl;
  let circle: Circle;

  beforeEach(() => {
    service = new CircleServiceImpl();
    circle = {
      id: '1',
      type: 'circle',
      position: { x: 100, y: 100 },
      radius: 50,
      rotation: 0,
      selected: false,
      fill: '#4CAF50',
      stroke: '#000000',
      strokeWidth: 1
    };
    
    // Reset the mock before each test
    jest.clearAllMocks();
    (commonUtils.getStoredPixelsPerUnit as jest.Mock).mockReturnValue(60);
  });

  describe('createShape', () => {
    it('should create a circle with default values when no params provided', () => {
      const shape = service.createShape({});
      
      expect(shape.type).toBe('circle');
      expect(shape.radius).toBe(50);
      expect(shape.position).toEqual({ x: 0, y: 0 });
      expect(shape.fill).toMatch(/^rgba\(\d+, \d+, \d+, \d+(\.\d+)?\)$/);
    });

    it('should create a circle with provided values', () => {
      const shape = service.createShape({
        center: { x: 50, y: 50 },
        radius: 75,
        color: '#0000ff'
      });
      
      expect(shape.type).toBe('circle');
      expect(shape.radius).toBe(75);
      expect(shape.position).toEqual({ x: 50, y: 50 });
      expect(shape.fill).toBe('#0000ff');
    });
  });

  describe('createCircle', () => {
    it('should create a circle with the specified parameters', () => {
      const center = { x: 50, y: 50 };
      const radius = 25;
      const color = '#00ff00';
      
      const c = service.createCircle(center, radius, color);
      
      expect(c.type).toBe('circle');
      expect(c.position).toEqual(center);
      expect(c.radius).toBe(radius);
      expect(c.fill).toBe(color);
      expect(c.rotation).toBe(0);
      expect(c.selected).toBe(false);
    });

    it('should ensure minimum radius of 1', () => {
      const c = service.createCircle({ x: 0, y: 0 }, -10);
      
      expect(c.radius).toBe(1);
    });
  });

  describe('resizeShape', () => {
    it('should update radius when radius param is provided', () => {
      const resized = service.resizeShape(circle, { radius: 75 });
      
      expect(resized.radius).toBe(75);
    });

    it('should scale the circle when scale param is provided', () => {
      const scale = 1.5;
      const resized = service.resizeShape(circle, { scale });
      
      expect(resized.radius).toBe(circle.radius * scale);
    });
  });

  describe('rotateShape', () => {
    it('should return the same circle since rotation does not affect circles', () => {
      const angle = Math.PI / 4; // 45 degrees
      const rotated = service.rotateShape(circle, angle);
      
      expect(rotated).toEqual(circle);
    });
  });

  describe('moveShape', () => {
    it('should update the position by the specified delta', () => {
      const dx = 50;
      const dy = -25;
      const moved = service.moveShape(circle, dx, dy);
      
      expect(moved.position.x).toBe(circle.position.x + dx);
      expect(moved.position.y).toBe(circle.position.y + dy);
    });
  });

  describe('getMeasurements', () => {
    it('should return correct measurements for a circle', () => {
      const measurements = service.getMeasurements(circle, 'cm');
      
      const pixelsPerCm = 60; // This is the default conversion rate in the service
      
      const radiusInCm = circle.radius / pixelsPerCm;
      const areaInPixels = Math.PI * circle.radius * circle.radius;
      const areaInCm = areaInPixels / (pixelsPerCm * pixelsPerCm);
      
      expect(measurements.radius).toBeCloseTo(radiusInCm);
      expect(measurements.diameter).toBeCloseTo(2 * radiusInCm);
      expect(measurements.circumference).toBeCloseTo(2 * Math.PI * radiusInCm);
      expect(measurements.area).toBeCloseTo(areaInCm);
    });
  });

  describe('updateFromMeasurement', () => {
    it('should update radius correctly', () => {
      const newRadius = 75;
      const pixelsPerUnit = 60;
      const updated = service.updateFromMeasurement(circle, 'radius', newRadius, circle.radius);
      
      // The radius should be updated to the new value in pixels
      expect(updated.radius).toBe(newRadius * pixelsPerUnit);
    });

    it('should update diameter correctly', () => {
      const newDiameter = 150;
      const pixelsPerUnit = 60;
      const updated = service.updateFromMeasurement(circle, 'diameter', newDiameter, 2 * circle.radius);
      
      // The radius should be updated to half the diameter in pixels
      expect(updated.radius).toBe((newDiameter / 2) * pixelsPerUnit);
    });

    it('should update circumference correctly', () => {
      const newCircumference = 2 * Math.PI * 75;
      const pixelsPerUnit = 60;
      const updated = service.updateFromMeasurement(
        circle, 
        'circumference', 
        newCircumference, 
        2 * Math.PI * circle.radius
      );
      
      // The radius should be updated to C/(2π) in pixels
      expect(updated.radius).toBeCloseTo((newCircumference / (2 * Math.PI)) * pixelsPerUnit);
    });

    it('should update area correctly', () => {
      const newArea = Math.PI * 75 * 75;
      const pixelsPerUnit = 60;
      const updated = service.updateFromMeasurement(
        circle, 
        'area', 
        newArea, 
        Math.PI * circle.radius * circle.radius
      );
      
      // The radius should be updated to √(A/π) in pixels
      expect(updated.radius).toBeCloseTo(Math.sqrt(newArea / Math.PI) * pixelsPerUnit);
    });

    it('should return the original shape for unhandled measurement keys', () => {
      const updated = service.updateFromMeasurement(circle, 'unknown', 100, 0);
      
      expect(updated).toEqual(circle);
    });
  });

  describe('containsPoint', () => {
    it('should return true for a point inside the circle', () => {
      const point: Point = { x: circle.position.x + 10, y: circle.position.y + 10 };
      
      expect(service.containsPoint(circle, point)).toBe(true);
    });

    it('should return true for a point on the edge of the circle', () => {
      const point: Point = { 
        x: circle.position.x + circle.radius, 
        y: circle.position.y 
      };
      
      expect(service.containsPoint(circle, point)).toBe(true);
    });

    it('should return false for a point outside the circle', () => {
      const point: Point = { 
        x: circle.position.x + circle.radius + 10, 
        y: circle.position.y 
      };
      
      expect(service.containsPoint(circle, point)).toBe(false);
    });
  });

  describe('getShapeType', () => {
    it('should return "circle"', () => {
      expect(service.getShapeType()).toBe('circle');
    });
  });

  describe('scaleCircle', () => {
    it('should scale the circle by the specified factor', () => {
      const scaleFactor = 1.5;
      const scaled = service.scaleCircle(circle, scaleFactor);
      
      expect(scaled.radius).toBe(circle.radius * scaleFactor);
    });
  });

  describe('updateRadius', () => {
    it('should update radius correctly', () => {
      const newRadius = 75;
      const updated = service.updateRadius(circle, newRadius);
      
      expect(updated.radius).toBe(newRadius);
    });
    
    it('should use minimum value of 1 when radius is invalid', () => {
      const updated = service.updateRadius(circle, -10);
      
      // Expect radius to be set to minimum value of 1
      expect(updated.radius).toBe(1);
    });
  });

  describe('calculateArea', () => {
    it('should return the correct area', () => {
      expect(service.calculateArea(circle)).toBeCloseTo(Math.PI * circle.radius * circle.radius);
    });
  });

  describe('calculateCircumference', () => {
    it('should return the correct circumference', () => {
      expect(service.calculateCircumference(circle)).toBeCloseTo(2 * Math.PI * circle.radius);
    });
  });

  describe('calculateDiameter', () => {
    it('should return the correct diameter', () => {
      expect(service.calculateDiameter(circle)).toBe(2 * circle.radius);
    });
  });
}); 