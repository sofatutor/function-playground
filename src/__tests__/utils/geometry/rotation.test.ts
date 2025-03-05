import {
  degreesToRadians,
  radiansToDegrees,
  normalizeAngleDegrees,
  normalizeAngleRadians,
  rotatePointRadians,
  rotatePointDegrees,
  calculateAngleRadians,
  calculateAngleDegrees,
  toClockwiseAngle,
  toCounterclockwiseAngle
} from '@/utils/geometry/rotation';

describe('Rotation Utilities', () => {
  describe('degreesToRadians', () => {
    it('should convert degrees to radians correctly', () => {
      expect(degreesToRadians(0)).toBeCloseTo(0);
      expect(degreesToRadians(90)).toBeCloseTo(Math.PI / 2);
      expect(degreesToRadians(180)).toBeCloseTo(Math.PI);
      expect(degreesToRadians(270)).toBeCloseTo(3 * Math.PI / 2);
      expect(degreesToRadians(360)).toBeCloseTo(2 * Math.PI);
      expect(degreesToRadians(-90)).toBeCloseTo(-Math.PI / 2);
    });
  });

  describe('radiansToDegrees', () => {
    it('should convert radians to degrees correctly', () => {
      expect(radiansToDegrees(0)).toBeCloseTo(0);
      expect(radiansToDegrees(Math.PI / 2)).toBeCloseTo(90);
      expect(radiansToDegrees(Math.PI)).toBeCloseTo(180);
      expect(radiansToDegrees(3 * Math.PI / 2)).toBeCloseTo(270);
      expect(radiansToDegrees(2 * Math.PI)).toBeCloseTo(360);
      expect(radiansToDegrees(-Math.PI / 2)).toBeCloseTo(-90);
    });
  });

  describe('normalizeAngleDegrees', () => {
    it('should normalize angles to the range [-180, 180]', () => {
      expect(normalizeAngleDegrees(0)).toBe(0);
      expect(normalizeAngleDegrees(90)).toBe(90);
      expect(normalizeAngleDegrees(180)).toBe(180);
      expect(normalizeAngleDegrees(181)).toBe(-179);
      expect(normalizeAngleDegrees(270)).toBe(-90);
      expect(normalizeAngleDegrees(360)).toBe(0);
      expect(normalizeAngleDegrees(450)).toBe(90);
      expect(normalizeAngleDegrees(-90)).toBe(-90);
      expect(normalizeAngleDegrees(-180)).toBe(-180);
      expect(normalizeAngleDegrees(-270)).toBe(90);
      expect(normalizeAngleDegrees(-360)).toBe(0);
    });
  });

  describe('normalizeAngleRadians', () => {
    it('should normalize angles to the range [-π, π]', () => {
      expect(normalizeAngleRadians(0)).toBeCloseTo(0);
      expect(normalizeAngleRadians(Math.PI / 2)).toBeCloseTo(Math.PI / 2);
      expect(normalizeAngleRadians(Math.PI)).toBeCloseTo(Math.PI);
      expect(normalizeAngleRadians(Math.PI + 0.1)).toBeCloseTo(-Math.PI + 0.1);
      expect(normalizeAngleRadians(3 * Math.PI / 2)).toBeCloseTo(-Math.PI / 2);
      expect(normalizeAngleRadians(2 * Math.PI)).toBeCloseTo(0);
      expect(normalizeAngleRadians(5 * Math.PI / 2)).toBeCloseTo(Math.PI / 2);
      expect(normalizeAngleRadians(-Math.PI / 2)).toBeCloseTo(-Math.PI / 2);
      expect(normalizeAngleRadians(-Math.PI)).toBeCloseTo(-Math.PI);
      expect(normalizeAngleRadians(-3 * Math.PI / 2)).toBeCloseTo(Math.PI / 2);
      expect(normalizeAngleRadians(-2 * Math.PI)).toBeCloseTo(0);
    });
  });

  describe('rotatePointRadians', () => {
    it('should rotate a point around a center by an angle in radians', () => {
      const point = { x: 10, y: 0 };
      const center = { x: 0, y: 0 };
      
      // Rotate 90 degrees (π/2 radians) counterclockwise
      const rotated90 = rotatePointRadians(point, center, Math.PI / 2);
      expect(rotated90.x).toBeCloseTo(0);
      expect(rotated90.y).toBeCloseTo(10);
      
      // Rotate 180 degrees (π radians) counterclockwise
      const rotated180 = rotatePointRadians(point, center, Math.PI);
      expect(rotated180.x).toBeCloseTo(-10);
      expect(rotated180.y).toBeCloseTo(0);
      
      // Rotate 270 degrees (3π/2 radians) counterclockwise
      const rotated270 = rotatePointRadians(point, center, 3 * Math.PI / 2);
      expect(rotated270.x).toBeCloseTo(0);
      expect(rotated270.y).toBeCloseTo(-10);
      
      // Rotate 360 degrees (2π radians) counterclockwise (back to original)
      const rotated360 = rotatePointRadians(point, center, 2 * Math.PI);
      expect(rotated360.x).toBeCloseTo(10);
      expect(rotated360.y).toBeCloseTo(0);
    });
    
    it('should rotate a point around a non-origin center', () => {
      const point = { x: 10, y: 5 };
      const center = { x: 5, y: 5 };
      
      // Rotate 90 degrees (π/2 radians) counterclockwise
      const rotated = rotatePointRadians(point, center, Math.PI / 2);
      expect(rotated.x).toBeCloseTo(5);
      expect(rotated.y).toBeCloseTo(10);
    });
  });

  describe('rotatePointDegrees', () => {
    it('should rotate a point around a center by an angle in degrees', () => {
      const point = { x: 10, y: 0 };
      const center = { x: 0, y: 0 };
      
      // Rotate 90 degrees counterclockwise
      const rotated90 = rotatePointDegrees(point, center, 90);
      expect(rotated90.x).toBeCloseTo(0);
      expect(rotated90.y).toBeCloseTo(10);
      
      // Rotate 180 degrees counterclockwise
      const rotated180 = rotatePointDegrees(point, center, 180);
      expect(rotated180.x).toBeCloseTo(-10);
      expect(rotated180.y).toBeCloseTo(0);
    });
  });

  describe('calculateAngleRadians', () => {
    it('should calculate the angle between two points in radians', () => {
      const start = { x: 0, y: 0 };
      
      // Point to the right (0 radians)
      expect(calculateAngleRadians(start, { x: 10, y: 0 })).toBeCloseTo(0);
      
      // Point upward (π/2 radians)
      expect(calculateAngleRadians(start, { x: 0, y: 10 })).toBeCloseTo(Math.PI / 2);
      
      // Point to the left (π radians)
      expect(calculateAngleRadians(start, { x: -10, y: 0 })).toBeCloseTo(Math.PI);
      
      // Point downward (-π/2 radians)
      expect(calculateAngleRadians(start, { x: 0, y: -10 })).toBeCloseTo(-Math.PI / 2);
    });
  });

  describe('calculateAngleDegrees', () => {
    it('should calculate the angle between two points in degrees', () => {
      const start = { x: 0, y: 0 };
      
      // Point to the right (0 degrees)
      expect(calculateAngleDegrees(start, { x: 10, y: 0 })).toBeCloseTo(0);
      
      // Point upward (90 degrees)
      expect(calculateAngleDegrees(start, { x: 0, y: 10 })).toBeCloseTo(90);
      
      // Point to the left (180 degrees)
      expect(calculateAngleDegrees(start, { x: -10, y: 0 })).toBeCloseTo(180);
      
      // Point downward (-90 degrees)
      expect(calculateAngleDegrees(start, { x: 0, y: -10 })).toBeCloseTo(-90);
    });
  });

  describe('toClockwiseAngle', () => {
    it('should convert counterclockwise angles to clockwise angles', () => {
      expect(toClockwiseAngle(0)).toBeCloseTo(0);
      expect(toClockwiseAngle(90)).toBe(-90);
      expect(toClockwiseAngle(180)).toBe(-180);
      expect(toClockwiseAngle(-90)).toBe(90);
      expect(toClockwiseAngle(270)).toBe(-270);
      expect(toClockwiseAngle(360)).toBeCloseTo(0);
    });
  });

  describe('toCounterclockwiseAngle', () => {
    it('should convert clockwise angles to counterclockwise angles', () => {
      expect(toCounterclockwiseAngle(0)).toBeCloseTo(0);
      expect(toCounterclockwiseAngle(90)).toBe(-90);
      expect(toCounterclockwiseAngle(180)).toBe(-180);
      expect(toCounterclockwiseAngle(-90)).toBe(90);
      expect(toCounterclockwiseAngle(270)).toBe(-270);
      expect(toCounterclockwiseAngle(360)).toBeCloseTo(0);
    });
  });
}); 