import { 
  distanceBetweenPoints, 
  movePoint, 
  scalePoint, 
  rotatePoint, 
  midpoint,
  angleBetweenPoints
} from '@/utils/geometry/pointOperations';
import { Point } from '@/types/shapes';

describe('Point Operations', () => {
  describe('distanceBetweenPoints', () => {
    it('should calculate distance between two points correctly', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 3, y: 4 };
      
      // Should be a 3-4-5 triangle, so distance is 5
      expect(distanceBetweenPoints(p1, p2)).toBe(5);
    });
    
    it('should return 0 for the same point', () => {
      const p: Point = { x: 10, y: 20 };
      expect(distanceBetweenPoints(p, p)).toBe(0);
    });
  });
  
  describe('movePoint', () => {
    it('should move a point by the specified delta', () => {
      const point: Point = { x: 10, y: 20 };
      const result = movePoint(point, 5, -10);
      
      expect(result).toEqual({ x: 15, y: 10 });
    });
    
    it('should not modify the original point', () => {
      const point: Point = { x: 10, y: 20 };
      movePoint(point, 5, -10);
      
      expect(point).toEqual({ x: 10, y: 20 });
    });
  });
  
  describe('scalePoint', () => {
    it('should scale a point from a center point by a factor', () => {
      const point: Point = { x: 10, y: 20 };
      const center: Point = { x: 0, y: 0 };
      const result = scalePoint(point, center, 2);
      
      expect(result).toEqual({ x: 20, y: 40 });
    });
    
    it('should handle scaling with a center point other than origin', () => {
      const point: Point = { x: 10, y: 20 };
      const center: Point = { x: 5, y: 10 };
      const result = scalePoint(point, center, 2);
      
      // Vector from center to point is (5, 10)
      // Scaled vector is (10, 20)
      // New point is center + scaled vector = (15, 30)
      expect(result).toEqual({ x: 15, y: 30 });
    });
    
    it('should handle scaling with a factor of 0', () => {
      const point: Point = { x: 10, y: 20 };
      const center: Point = { x: 5, y: 10 };
      const result = scalePoint(point, center, 0);
      
      // Scaling by 0 should collapse the point to the center
      expect(result).toEqual(center);
    });
  });
  
  describe('rotatePoint', () => {
    it('should rotate a point 90 degrees around the origin', () => {
      const point: Point = { x: 10, y: 0 };
      const center: Point = { x: 0, y: 0 };
      const result = rotatePoint(point, center, 90);
      
      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(10, 5);
    });
    
    it('should rotate a point 180 degrees around the origin', () => {
      const point: Point = { x: 10, y: 0 };
      const center: Point = { x: 0, y: 0 };
      const result = rotatePoint(point, center, 180);
      
      expect(result.x).toBeCloseTo(-10, 5);
      expect(result.y).toBeCloseTo(0, 5);
    });
    
    it('should rotate a point around a center point other than origin', () => {
      const point: Point = { x: 15, y: 10 };
      const center: Point = { x: 10, y: 10 };
      const result = rotatePoint(point, center, 90);
      
      // Point is 5 units to the right of center
      // After 90 degree rotation, it should be 5 units down from center
      expect(result.x).toBeCloseTo(10, 5);
      expect(result.y).toBeCloseTo(15, 5);
    });
  });
  
  describe('midpoint', () => {
    it('should calculate the midpoint between two points', () => {
      const p1: Point = { x: 10, y: 20 };
      const p2: Point = { x: 20, y: 40 };
      const result = midpoint(p1, p2);
      
      expect(result).toEqual({ x: 15, y: 30 });
    });
  });
  
  describe('angleBetweenPoints', () => {
    it('should calculate the angle for a horizontal line (0 degrees)', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 10, y: 0 };
      
      expect(angleBetweenPoints(p1, p2)).toBeCloseTo(0, 5);
    });
    
    it('should calculate the angle for a vertical line (90 degrees)', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 0, y: 10 };
      
      expect(angleBetweenPoints(p1, p2)).toBeCloseTo(90, 5);
    });
    
    it('should calculate the angle for a diagonal line (45 degrees)', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 10, y: 10 };
      
      expect(angleBetweenPoints(p1, p2)).toBeCloseTo(45, 5);
    });
    
    it('should normalize angles to the 0-360 range', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: -10, y: -10 };
      
      // This would be -135 degrees, but should be normalized to 225
      expect(angleBetweenPoints(p1, p2)).toBeCloseTo(225, 5);
    });
  });
}); 