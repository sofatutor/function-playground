import { Triangle, Point } from '@/types/shapes';
import { TriangleServiceImpl } from '@/services/implementations/TriangleServiceImpl';

describe('TriangleServiceImpl', () => {
  let service: TriangleServiceImpl;
  let triangle: Triangle;
  let trianglePoints: [Point, Point, Point];

  beforeEach(() => {
    service = new TriangleServiceImpl();
    trianglePoints = [
      { x: 100, y: 100 },
      { x: 200, y: 100 },
      { x: 150, y: 50 }
    ];
    triangle = service.createTriangle(trianglePoints, '#ff0000');
  });

  describe('createShape', () => {
    it('should create a triangle with default values when no params provided', () => {
      const shape = service.createShape({});
      
      expect(shape.type).toBe('triangle');
      expect(shape.points).toHaveLength(3);
      expect(shape.fill).toBe('#2196F3');
    });

    it('should create a triangle with provided values', () => {
      const points: [Point, Point, Point] = [
        { x: 50, y: 50 },
        { x: 150, y: 50 },
        { x: 100, y: 150 }
      ];
      
      const shape = service.createShape({
        points,
        color: '#0000ff'
      });
      
      expect(shape.type).toBe('triangle');
      expect(shape.points).toEqual(points);
      expect(shape.fill).toBe('#0000ff');
    });
  });

  describe('createTriangle', () => {
    it('should create a triangle with the specified parameters', () => {
      const points: [Point, Point, Point] = [
        { x: 50, y: 50 },
        { x: 150, y: 50 },
        { x: 100, y: 150 }
      ];
      const color = '#00ff00';
      
      const t = service.createTriangle(points, color);
      
      expect(t.type).toBe('triangle');
      expect(t.points).toEqual(points);
      expect(t.fill).toBe(color);
      expect(t.rotation).toBe(0);
      expect(t.selected).toBe(false);
    });

    it('should create a triangle with the given points', () => {
      // Create a degenerate triangle (all points in a line)
      const t = service.createTriangle(
        [
          { x: 100, y: 100 },
          { x: 200, y: 100 },
          { x: 150, y: 100 }
        ],
        '#FF0000'
      );
      
      // The implementation doesn't adjust points, so area will be 0 for collinear points
      const area = service.calculateArea(t);
      expect(area).toBe(0);
      
      // Verify other properties
      expect(t.fill).toBe('#FF0000');
      expect(t.type).toBe('triangle');
      expect(t.points).toHaveLength(3);
      expect(t.rotation).toBe(0);
    });
  });

  describe('resizeShape', () => {
    it('should scale the triangle when scale param is provided', () => {
      const scale = 1.5;
      const originalArea = service.calculateArea(triangle);
      const resized = service.resizeShape(triangle, { scale });
      
      // Area should scale by square of the scale factor
      expect(service.calculateArea(resized)).toBeCloseTo(originalArea * scale * scale);
    });
  });

  describe('rotateShape', () => {
    it('should rotate the triangle by the specified angle', () => {
      const angle = Math.PI / 4; // 45 degrees
      const rotated = service.rotateShape(triangle, angle);
      
      expect(rotated.rotation).toBeCloseTo(triangle.rotation + angle);
    });
  });

  describe('moveShape', () => {
    it('should update all points by the specified delta', () => {
      const dx = 50;
      const dy = -25;
      const moved = service.moveShape(triangle, dx, dy);
      
      for (let i = 0; i < 3; i++) {
        expect(moved.points[i].x).toBe(triangle.points[i].x + dx);
        expect(moved.points[i].y).toBe(triangle.points[i].y + dy);
      }
    });
  });

  describe('getMeasurements', () => {
    it('should return correct measurements for a triangle', () => {
      const measurements = service.getMeasurements(triangle, 'cm');
      
      expect(measurements.area).toBeCloseTo(service.calculateArea(triangle));
      expect(measurements.perimeter).toBeCloseTo(service.calculatePerimeter(triangle));
    });
  });

  describe('updateFromMeasurement', () => {
    it('should update area correctly by scaling the triangle', () => {
      const originalArea = service.calculateArea(triangle);
      const newArea = originalArea * 2;
      const updated = service.updateFromMeasurement(triangle, 'area', newArea, originalArea);
      
      expect(service.calculateArea(updated)).toBeCloseTo(newArea);
    });

    it('should return the original shape for unhandled measurement keys', () => {
      const updated = service.updateFromMeasurement(triangle, 'unknown', 100, 0);
      
      expect(updated).toEqual(triangle);
    });
  });

  describe('containsPoint', () => {
    it('should return true for a point inside the triangle', () => {
      const point: Point = { 
        x: (triangle.points[0].x + triangle.points[1].x + triangle.points[2].x) / 3,
        y: (triangle.points[0].y + triangle.points[1].y + triangle.points[2].y) / 3
      };
      
      expect(service.containsPoint(triangle, point)).toBe(true);
    });

    it('should return false for a point outside the triangle', () => {
      const point: Point = { x: 50, y: 50 };
      
      expect(service.containsPoint(triangle, point)).toBe(false);
    });
  });

  describe('getShapeType', () => {
    it('should return "triangle"', () => {
      expect(service.getShapeType()).toBe('triangle');
    });
  });

  describe('scaleTriangle', () => {
    it('should scale the triangle by the specified factor', () => {
      const scaleFactor = 1.5;
      const originalArea = service.calculateArea(triangle);
      const scaled = service.scaleTriangle(triangle, scaleFactor);
      
      // Area should scale by square of the scale factor
      expect(service.calculateArea(scaled)).toBeCloseTo(originalArea * scaleFactor * scaleFactor);
    });
  });

  describe('calculateArea', () => {
    it('should return the correct area', () => {
      // Using the shoelace formula to calculate the expected area
      const points = triangle.points;
      let area = 0;
      for (let i = 0; i < 3; i++) {
        const j = (i + 1) % 3;
        area += points[i].x * points[j].y;
        area -= points[j].x * points[i].y;
      }
      area = Math.abs(area) / 2;
      
      expect(service.calculateArea(triangle)).toBeCloseTo(area);
    });
  });

  describe('calculatePerimeter', () => {
    it('should return the correct perimeter', () => {
      const points = triangle.points;
      let perimeter = 0;
      for (let i = 0; i < 3; i++) {
        const j = (i + 1) % 3;
        perimeter += Math.sqrt(
          Math.pow(points[j].x - points[i].x, 2) +
          Math.pow(points[j].y - points[i].y, 2)
        );
      }
      
      expect(service.calculatePerimeter(triangle)).toBeCloseTo(perimeter);
    });
  });

  describe('getCentroid', () => {
    it('should return the correct centroid', () => {
      const points = triangle.points;
      const expectedCentroid = {
        x: (points[0].x + points[1].x + points[2].x) / 3,
        y: (points[0].y + points[1].y + points[2].y) / 3
      };
      
      expect(service.getCentroid(triangle)).toEqual(expectedCentroid);
    });
  });
}); 