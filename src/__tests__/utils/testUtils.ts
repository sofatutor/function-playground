import { AnyShape, Circle, Rectangle, Triangle, Line, Point } from '@/types/shapes';

/**
 * Creates a test circle with the given properties
 */
export const createTestCircle = (
  overrides: Partial<Circle> = {}
): Circle => {
  return {
    id: 'test-circle-1',
    type: 'circle',
    position: { x: 100, y: 100 },
    radius: 50,
    rotation: 0,
    selected: false,
    fill: '#e0e0e0',
    stroke: '#000000',
    strokeWidth: 1,
    ...overrides
  };
};

/**
 * Creates a test rectangle with the given properties
 */
export const createTestRectangle = (
  overrides: Partial<Rectangle> = {}
): Rectangle => {
  return {
    id: 'test-rectangle-1',
    type: 'rectangle',
    position: { x: 100, y: 100 },
    width: 100,
    height: 80,
    rotation: 0,
    selected: false,
    fill: '#e0e0e0',
    stroke: '#000000',
    strokeWidth: 1,
    ...overrides
  };
};

/**
 * Creates a test triangle with the given properties
 */
export const createTestTriangle = (
  overrides: Partial<Triangle> = {}
): Triangle => {
  const defaultPoints: [Point, Point, Point] = [
    { x: 100, y: 50 },
    { x: 50, y: 150 },
    { x: 150, y: 150 }
  ];
  
  return {
    id: 'test-triangle-1',
    type: 'triangle',
    position: { x: 100, y: 100 },
    points: defaultPoints,
    rotation: 0,
    selected: false,
    fill: '#e0e0e0',
    stroke: '#000000',
    strokeWidth: 1,
    ...overrides
  };
};

/**
 * Creates a test line with the given properties
 */
export const createTestLine = (
  overrides: Partial<Line> = {}
): Line => {
  return {
    id: 'test-line-1',
    type: 'line',
    position: { x: 100, y: 100 },
    startPoint: { x: 50, y: 50 },
    endPoint: { x: 150, y: 150 },
    length: 141.42, // √((150-50)² + (150-50)²)
    rotation: 0,
    selected: false,
    fill: 'transparent',
    stroke: '#9b87f5',
    strokeWidth: 2,
    ...overrides
  };
};

/**
 * Creates an array of test shapes
 */
export const createTestShapes = (): AnyShape[] => {
  return [
    createTestCircle({ id: 'circle-1' }),
    createTestRectangle({ id: 'rectangle-1' }),
    createTestTriangle({ id: 'triangle-1' }),
    createTestLine({ id: 'line-1' })
  ];
};

/**
 * Compares two points with a tolerance for floating point errors
 */
export const pointsAreEqual = (
  point1: Point,
  point2: Point,
  tolerance = 0.001
): boolean => {
  return (
    Math.abs(point1.x - point2.x) < tolerance &&
    Math.abs(point1.y - point2.y) < tolerance
  );
};

/**
 * Compares two shapes with a tolerance for floating point errors
 */
export const shapesAreEqual = (
  shape1: AnyShape,
  shape2: AnyShape,
  tolerance = 0.001
): boolean => {
  if (shape1.type !== shape2.type) return false;
  if (shape1.id !== shape2.id) return false;
  
  // Compare common properties
  if (!pointsAreEqual(shape1.position, shape2.position, tolerance)) return false;
  if (Math.abs(shape1.rotation - shape2.rotation) > tolerance) return false;
  
  // Compare type-specific properties
  switch (shape1.type) {
    case 'circle':
      return Math.abs((shape1 as Circle).radius - (shape2 as Circle).radius) < tolerance;
    
    case 'rectangle':
      return (
        Math.abs((shape1 as Rectangle).width - (shape2 as Rectangle).width) < tolerance &&
        Math.abs((shape1 as Rectangle).height - (shape2 as Rectangle).height) < tolerance
      );
    
    case 'triangle': {
      const tri1 = shape1 as Triangle;
      const tri2 = shape2 as Triangle;
      return (
        pointsAreEqual(tri1.points[0], tri2.points[0], tolerance) &&
        pointsAreEqual(tri1.points[1], tri2.points[1], tolerance) &&
        pointsAreEqual(tri1.points[2], tri2.points[2], tolerance)
      );
    }
    
    case 'line': {
      const line1 = shape1 as Line;
      const line2 = shape2 as Line;
      return (
        pointsAreEqual(line1.startPoint, line2.startPoint, tolerance) &&
        pointsAreEqual(line1.endPoint, line2.endPoint, tolerance) &&
        Math.abs(line1.length - line2.length) < tolerance
      );
    }
    
    default:
      return false;
  }
}; 