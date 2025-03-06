import { AnyShape, Circle, Rectangle, Triangle, Line, Point, ShapeType } from '@/types/shapes';
import { distanceBetweenPoints } from './pointOperations';

/**
 * Gets the center point of a shape
 */
export const getShapeCenter = (shape: AnyShape): Point => {
  switch (shape.type) {
    case 'circle':
    case 'rectangle':
      return shape.position;
    case 'triangle': {
      const triangle = shape as Triangle;
      // Calculate the centroid of the triangle
      const x = (triangle.points[0].x + triangle.points[1].x + triangle.points[2].x) / 3;
      const y = (triangle.points[0].y + triangle.points[1].y + triangle.points[2].y) / 3;
      return { x, y };
    }
    case 'line': {
      const line = shape as Line;
      // Calculate the midpoint of the line
      const x = (line.startPoint.x + line.endPoint.x) / 2;
      const y = (line.startPoint.y + line.endPoint.y) / 2;
      return { x, y };
    }
    default:
      // This should never happen with proper type checking
      console.warn(`Unknown shape type: ${(shape as { type: string }).type}`);
      return { x: 0, y: 0 };
  }
};

/**
 * Calculates the area of a shape
 */
export const calculateShapeArea = (shape: AnyShape): number => {
  switch (shape.type) {
    case 'circle': {
      const circle = shape as Circle;
      return Math.PI * circle.radius * circle.radius;
    }
    case 'rectangle': {
      const rectangle = shape as Rectangle;
      return rectangle.width * rectangle.height;
    }
    case 'triangle': {
      const triangle = shape as Triangle;
      // Calculate the area using the cross product method
      const [p1, p2, p3] = triangle.points;
      return Math.abs((p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) / 2);
    }
    case 'line':
      return 0; // Lines have no area
    default:
      // This should never happen with proper type checking
      console.warn(`Unknown shape type: ${(shape as { type: string }).type}`);
      return 0;
  }
};

/**
 * Calculates the perimeter of a shape
 */
export const calculateShapePerimeter = (shape: AnyShape): number => {
  switch (shape.type) {
    case 'circle': {
      const circle = shape as Circle;
      return 2 * Math.PI * circle.radius;
    }
    case 'rectangle': {
      const rectangle = shape as Rectangle;
      return 2 * (rectangle.width + rectangle.height);
    }
    case 'triangle': {
      const triangle = shape as Triangle;
      const [p1, p2, p3] = triangle.points;
      const side1 = distanceBetweenPoints(p1, p2);
      const side2 = distanceBetweenPoints(p2, p3);
      const side3 = distanceBetweenPoints(p3, p1);
      return side1 + side2 + side3;
    }
    case 'line': {
      const line = shape as Line;
      return line.length;
    }
    default:
      // This should never happen with proper type checking
      console.warn(`Unknown shape type: ${(shape as { type: string }).type}`);
      return 0;
  }
};

/**
 * Checks if a point is inside a shape
 */
export const isPointInShape = (shape: AnyShape, point: Point): boolean => {
  switch (shape.type) {
    case 'circle': {
      const circle = shape as Circle;
      const distance = distanceBetweenPoints(circle.position, point);
      return distance <= circle.radius;
    }
    case 'rectangle': {
      const rect = shape as Rectangle;
      // Account for rotation if needed
      if (rect.rotation !== 0) {
        // For rotated rectangles, this is more complex
        // This is a simplified approach that doesn't handle rotation
        return false;
      }
      
      // For non-rotated rectangles
      return (
        point.x >= rect.position.x &&
        point.x <= rect.position.x + rect.width &&
        point.y >= rect.position.y &&
        point.y <= rect.position.y + rect.height
      );
    }
    case 'triangle': {
      const tri = shape as Triangle;
      const [p1, p2, p3] = tri.points;
      
      // Calculate barycentric coordinates
      const denominator = ((p2.y - p3.y) * (p1.x - p3.x) + (p3.x - p2.x) * (p1.y - p3.y));
      const a = ((p2.y - p3.y) * (point.x - p3.x) + (p3.x - p2.x) * (point.y - p3.y)) / denominator;
      const b = ((p3.y - p1.y) * (point.x - p3.x) + (p1.x - p3.x) * (point.y - p3.y)) / denominator;
      const c = 1 - a - b;
      
      // If all coordinates are between 0 and 1, the point is inside the triangle
      return a >= 0 && a <= 1 && b >= 0 && b <= 1 && c >= 0 && c <= 1;
    }
    case 'line': {
      // Lines have no area, so a point can't be inside a line
      // But we can check if the point is very close to the line
      const line = shape as Line;
      const { startPoint, endPoint } = line;
      
      // Calculate the distance from the point to the line
      const lineLength = distanceBetweenPoints(startPoint, endPoint);
      if (lineLength === 0) return false;
      
      // Calculate the area of the triangle formed by the point and the line
      const area = Math.abs(
        (endPoint.y - startPoint.y) * point.x -
        (endPoint.x - startPoint.x) * point.y +
        endPoint.x * startPoint.y -
        endPoint.y * startPoint.x
      ) / 2;
      
      // The height of the triangle is the distance from the point to the line
      const distance = (2 * area) / lineLength;
      
      // Check if the distance is less than a threshold (e.g., 5 pixels)
      const threshold = 5;
      return distance <= threshold;
    }
    default:
      // This should never happen with proper type checking
      console.warn(`Unknown shape type: ${(shape as { type: string }).type}`);
      return false;
  }
}; 