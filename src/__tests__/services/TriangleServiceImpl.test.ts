import { Triangle, Point } from '@/types/shapes';
import { TriangleServiceImpl } from '@/services/implementations/TriangleServiceImpl';
import * as commonUtils from '@/utils/geometry/common';

// Mock the getStoredPixelsPerUnit function
jest.mock('@/utils/geometry/common', () => ({
  ...jest.requireActual('@/utils/geometry/common'),
  getStoredPixelsPerUnit: jest.fn().mockReturnValue(60) // Mock 60 pixels per unit
}));

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
    
    // Reset the mock before each test
    jest.clearAllMocks();
    (commonUtils.getStoredPixelsPerUnit as jest.Mock).mockReturnValue(60);
  });

  describe('createShape', () => {
    it('should create a triangle with default values when no params provided', () => {
      const shape = service.createShape({});
      
      expect(shape.type).toBe('triangle');
      expect(shape.points).toHaveLength(3);
      expect(shape.fill).toMatch(/^rgba\(\d+, \d+, \d+, \d+(\.\d+)?\)$/);
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
      
      // Since measurements are converted to cm, we need to compare with the converted values
      // The conversion is done in the service, so we need to use the same conversion here
      const pixelsPerCm = 60; // This is the default conversion rate in the service
      
      // Get the side lengths in pixels and convert them to cm
      const sideLengths = service.calculateSideLengths(triangle);
      const sideLengthsInCm = sideLengths.map(side => side / pixelsPerCm);
      
      // Calculate the area in pixels first
      const s = (sideLengths[0] + sideLengths[1] + sideLengths[2]) / 2;
      const areaInPixels = Math.sqrt(
        s * (s - sideLengths[0]) * (s - sideLengths[1]) * (s - sideLengths[2])
      );
      // Then convert to cm² by dividing by pixelsPerCm²
      const areaInCm = areaInPixels / (pixelsPerCm * pixelsPerCm);
      
      expect(measurements.area).toBeCloseTo(areaInCm);
      expect(measurements.perimeter).toBeCloseTo(sideLengthsInCm[0] + sideLengthsInCm[1] + sideLengthsInCm[2]);
      
      // Check that side lengths are converted correctly
      expect(measurements.side1).toBeCloseTo(sideLengthsInCm[0]);
      expect(measurements.side2).toBeCloseTo(sideLengthsInCm[1]);
      expect(measurements.side3).toBeCloseTo(sideLengthsInCm[2]);
      
      // Check that angles are calculated correctly
      const angles = service.calculateAngles(triangle);
      expect(measurements.angle1).toBeCloseTo(angles[0]);
      expect(measurements.angle2).toBeCloseTo(angles[1]);
      expect(measurements.angle3).toBeCloseTo(angles[2]);
      
      // Check that height is converted correctly
      const heightInPixels = service.calculateHeight(triangle);
      const heightInCm = heightInPixels / pixelsPerCm;
      expect(measurements.height).toBeCloseTo(heightInCm);
    });
  });

  describe('updateFromMeasurement', () => {
    const pixelsPerUnit = 60;
    
    it('should update area correctly by scaling the triangle', () => {
      const originalArea = service.calculateArea(triangle);
      const newArea = originalArea * 2;
      
      // Convert the new area to pixels
      const newAreaInPixels = newArea * pixelsPerUnit * pixelsPerUnit;
      
      const updated = service.updateFromMeasurement(triangle, 'area', newArea, originalArea);
      
      // The area should be scaled by the factor that includes the unit conversion
      expect(service.calculateArea(updated)).toBeCloseTo(newAreaInPixels);
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

  describe('calculateAngles', () => {
    it('should return angles in degrees that sum to approximately 180', () => {
      const angles = service.calculateAngles(triangle);
      
      // Check that we have three angles
      expect(angles).toHaveLength(3);
      
      // Check that each angle is in degrees (between 0 and 180)
      angles.forEach(angle => {
        expect(angle).toBeGreaterThan(0);
        expect(angle).toBeLessThan(180);
      });
      
      // Check that the sum of angles is approximately 180 degrees
      const sum = angles.reduce((acc, angle) => acc + angle, 0);
      expect(sum).toBeCloseTo(180, 1); // Allow for small floating point errors
    });
    
    it('should calculate correct angles for a right triangle', () => {
      // Create a 3-4-5 right triangle
      const rightTrianglePoints: [Point, Point, Point] = [
        { x: 0, y: 0 },
        { x: 3, y: 0 },
        { x: 0, y: 4 }
      ];
      const rightTriangle = service.createTriangle(rightTrianglePoints, '#ff0000');
      
      const angles = service.calculateAngles(rightTriangle);
      
      // One angle should be 90 degrees (π/2 radians)
      expect(angles.some(angle => Math.abs(angle - 90) < 0.1)).toBe(true);
      
      // The other two angles should be approximately 36.87 and 53.13 degrees
      expect(angles.some(angle => Math.abs(angle - 36.87) < 0.1)).toBe(true);
      expect(angles.some(angle => Math.abs(angle - 53.13) < 0.1)).toBe(true);
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