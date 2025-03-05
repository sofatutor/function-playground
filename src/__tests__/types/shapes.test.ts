import {
  AnyShape,
  Circle,
  Rectangle,
  Triangle,
  Line,
  isCircle,
  isRectangle,
  isTriangle,
  isLine,
  hasWidthAndHeight,
  hasPoints,
  hasEndpoints,
  hasRadius,
  castShape,
  ShapeType
} from '@/types/shapes';

describe('Shape Type Guards', () => {
  // Create test shapes
  const circle: Circle = {
    id: 'circle1',
    type: 'circle',
    position: { x: 100, y: 100 },
    radius: 50,
    rotation: 0,
    selected: false,
    fill: 'red',
    stroke: 'black',
    strokeWidth: 1
  };

  const rectangle: Rectangle = {
    id: 'rect1',
    type: 'rectangle',
    position: { x: 200, y: 200 },
    width: 100,
    height: 80,
    rotation: 0,
    selected: false,
    fill: 'blue',
    stroke: 'black',
    strokeWidth: 1
  };

  const triangle: Triangle = {
    id: 'tri1',
    type: 'triangle',
    position: { x: 300, y: 300 },
    points: [
      { x: 300, y: 250 },
      { x: 350, y: 350 },
      { x: 250, y: 350 }
    ],
    rotation: 0,
    selected: false,
    fill: 'green',
    stroke: 'black',
    strokeWidth: 1
  };

  const line: Line = {
    id: 'line1',
    type: 'line',
    position: { x: 400, y: 400 },
    startPoint: { x: 350, y: 350 },
    endPoint: { x: 450, y: 450 },
    length: 141.42, // √((450-350)² + (450-350)²) = √(100² + 100²) = √20000 ≈ 141.42
    rotation: 45,
    selected: false,
    fill: 'none',
    stroke: 'black',
    strokeWidth: 1
  };

  // Tests for isCircle
  describe('isCircle', () => {
    it('should return true for Circle shapes', () => {
      expect(isCircle(circle)).toBe(true);
    });

    it('should return false for non-Circle shapes', () => {
      expect(isCircle(rectangle)).toBe(false);
      expect(isCircle(triangle)).toBe(false);
      expect(isCircle(line)).toBe(false);
    });
  });

  // Tests for isRectangle
  describe('isRectangle', () => {
    it('should return true for Rectangle shapes', () => {
      expect(isRectangle(rectangle)).toBe(true);
    });

    it('should return false for non-Rectangle shapes', () => {
      expect(isRectangle(circle)).toBe(false);
      expect(isRectangle(triangle)).toBe(false);
      expect(isRectangle(line)).toBe(false);
    });
  });

  // Tests for isTriangle
  describe('isTriangle', () => {
    it('should return true for Triangle shapes', () => {
      expect(isTriangle(triangle)).toBe(true);
    });

    it('should return false for non-Triangle shapes', () => {
      expect(isTriangle(circle)).toBe(false);
      expect(isTriangle(rectangle)).toBe(false);
      expect(isTriangle(line)).toBe(false);
    });
  });

  // Tests for isLine
  describe('isLine', () => {
    it('should return true for Line shapes', () => {
      expect(isLine(line)).toBe(true);
    });

    it('should return false for non-Line shapes', () => {
      expect(isLine(circle)).toBe(false);
      expect(isLine(rectangle)).toBe(false);
      expect(isLine(triangle)).toBe(false);
    });
  });

  // Tests for property-based type guards
  describe('Property-based type guards', () => {
    it('should correctly identify shapes with width and height', () => {
      expect(hasWidthAndHeight(rectangle)).toBe(true);
      expect(hasWidthAndHeight(circle)).toBe(false);
      expect(hasWidthAndHeight(triangle)).toBe(false);
      expect(hasWidthAndHeight(line)).toBe(false);
    });

    it('should correctly identify shapes with points', () => {
      expect(hasPoints(triangle)).toBe(true);
      expect(hasPoints(circle)).toBe(false);
      expect(hasPoints(rectangle)).toBe(false);
      expect(hasPoints(line)).toBe(false);
    });

    it('should correctly identify shapes with endpoints', () => {
      expect(hasEndpoints(line)).toBe(true);
      expect(hasEndpoints(circle)).toBe(false);
      expect(hasEndpoints(rectangle)).toBe(false);
      expect(hasEndpoints(triangle)).toBe(false);
    });

    it('should correctly identify shapes with radius', () => {
      expect(hasRadius(circle)).toBe(true);
      expect(hasRadius(rectangle)).toBe(false);
      expect(hasRadius(triangle)).toBe(false);
      expect(hasRadius(line)).toBe(false);
    });
  });

  // Tests for castShape utility
  describe('castShape', () => {
    it('should correctly cast shapes to their specific types', () => {
      const castCircle = castShape(circle, 'circle');
      expect(castCircle).not.toBeNull();
      if (castCircle) {
        expect(castCircle.radius).toBe(50);
      }

      const castRectangle = castShape(rectangle, 'rectangle');
      expect(castRectangle).not.toBeNull();
      if (castRectangle) {
        expect(castRectangle.width).toBe(100);
        expect(castRectangle.height).toBe(80);
      }

      const castTriangle = castShape(triangle, 'triangle');
      expect(castTriangle).not.toBeNull();
      if (castTriangle) {
        expect(castTriangle.points.length).toBe(3);
      }

      const castLine = castShape(line, 'line');
      expect(castLine).not.toBeNull();
      if (castLine) {
        expect(castLine.length).toBeCloseTo(141.42, 1);
      }
    });

    it('should return null when trying to cast to the wrong type', () => {
      expect(castShape(circle, 'rectangle')).toBeNull();
      expect(castShape(rectangle, 'triangle')).toBeNull();
      expect(castShape(triangle, 'line')).toBeNull();
      expect(castShape(line, 'circle')).toBeNull();
    });

    it('should return null for null or undefined inputs', () => {
      expect(castShape(null, 'circle')).toBeNull();
      expect(castShape(undefined, 'rectangle')).toBeNull();
    });
  });

  // Test type narrowing with type guards
  describe('Type narrowing with type guards', () => {
    it('should allow access to specific properties after type guard check', () => {
      const shapes: AnyShape[] = [circle, rectangle, triangle, line];
      
      shapes.forEach(shape => {
        if (isCircle(shape)) {
          // TypeScript should know this is a Circle now
          expect(shape.radius).toBeDefined();
        } else if (isRectangle(shape)) {
          // TypeScript should know this is a Rectangle now
          expect(shape.width).toBeDefined();
          expect(shape.height).toBeDefined();
        } else if (isTriangle(shape)) {
          // TypeScript should know this is a Triangle now
          expect(shape.points.length).toBe(3);
        } else if (isLine(shape)) {
          // TypeScript should know this is a Line now
          expect(shape.startPoint).toBeDefined();
          expect(shape.endPoint).toBeDefined();
          expect(shape.length).toBeDefined();
        }
      });
    });
  });
}); 