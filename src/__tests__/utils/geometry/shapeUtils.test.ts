import { 
  getShapeCenter, 
  calculateShapeArea, 
  calculateShapePerimeter, 
  isPointInShape 
} from '@/utils/geometry/shapeUtils';
import { Circle, Rectangle, Triangle, Line, Point } from '@/types/shapes';

describe('Shape Utilities', () => {
  describe('getShapeCenter', () => {
    it('should return the position for a circle', () => {
      const circle: Circle = {
        id: '1',
        type: 'circle',
        position: { x: 10, y: 20 },
        radius: 5,
        rotation: 0,
        selected: false,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 1
      };
      
      expect(getShapeCenter(circle)).toEqual({ x: 10, y: 20 });
    });
    
    it('should return the position for a rectangle', () => {
      const rectangle: Rectangle = {
        id: '1',
        type: 'rectangle',
        position: { x: 10, y: 20 },
        width: 30,
        height: 40,
        rotation: 0,
        selected: false,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 1
      };
      
      expect(getShapeCenter(rectangle)).toEqual({ x: 10, y: 20 });
    });
    
    it('should calculate the centroid for a triangle', () => {
      const triangle: Triangle = {
        id: '1',
        type: 'triangle',
        position: { x: 0, y: 0 },
        points: [
          { x: 0, y: 0 },
          { x: 30, y: 0 },
          { x: 0, y: 30 }
        ],
        rotation: 0,
        selected: false,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 1
      };
      
      // Centroid of a triangle is the average of the three points
      expect(getShapeCenter(triangle)).toEqual({ x: 10, y: 10 });
    });
    
    it('should calculate the midpoint for a line', () => {
      const line: Line = {
        id: '1',
        type: 'line',
        position: { x: 0, y: 0 },
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 30, y: 30 },
        length: Math.sqrt(1800),
        rotation: 0,
        selected: false,
        fill: 'transparent',
        stroke: 'black',
        strokeWidth: 1
      };
      
      // Midpoint of a line is the average of the start and end points
      expect(getShapeCenter(line)).toEqual({ x: 15, y: 15 });
    });
  });
  
  describe('calculateShapeArea', () => {
    it('should calculate the area of a circle', () => {
      const circle: Circle = {
        id: '1',
        type: 'circle',
        position: { x: 10, y: 20 },
        radius: 5,
        rotation: 0,
        selected: false,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 1
      };
      
      // Area of a circle = π * r²
      expect(calculateShapeArea(circle)).toBeCloseTo(Math.PI * 25, 5);
    });
    
    it('should calculate the area of a rectangle', () => {
      const rectangle: Rectangle = {
        id: '1',
        type: 'rectangle',
        position: { x: 10, y: 20 },
        width: 30,
        height: 40,
        rotation: 0,
        selected: false,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 1
      };
      
      // Area of a rectangle = width * height
      expect(calculateShapeArea(rectangle)).toBe(1200);
    });
    
    it('should calculate the area of a triangle', () => {
      const triangle: Triangle = {
        id: '1',
        type: 'triangle',
        position: { x: 0, y: 0 },
        points: [
          { x: 0, y: 0 },
          { x: 30, y: 0 },
          { x: 0, y: 30 }
        ],
        rotation: 0,
        selected: false,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 1
      };
      
      // Area of this triangle = (base * height) / 2 = (30 * 30) / 2 = 450
      expect(calculateShapeArea(triangle)).toBe(450);
    });
    
    it('should return 0 for the area of a line', () => {
      const line: Line = {
        id: '1',
        type: 'line',
        position: { x: 0, y: 0 },
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 30, y: 30 },
        length: Math.sqrt(1800),
        rotation: 0,
        selected: false,
        fill: 'transparent',
        stroke: 'black',
        strokeWidth: 1
      };
      
      expect(calculateShapeArea(line)).toBe(0);
    });
  });
  
  describe('calculateShapePerimeter', () => {
    it('should calculate the perimeter of a circle', () => {
      const circle: Circle = {
        id: '1',
        type: 'circle',
        position: { x: 10, y: 20 },
        radius: 5,
        rotation: 0,
        selected: false,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 1
      };
      
      // Perimeter of a circle = 2 * π * r
      expect(calculateShapePerimeter(circle)).toBeCloseTo(2 * Math.PI * 5, 5);
    });
    
    it('should calculate the perimeter of a rectangle', () => {
      const rectangle: Rectangle = {
        id: '1',
        type: 'rectangle',
        position: { x: 10, y: 20 },
        width: 30,
        height: 40,
        rotation: 0,
        selected: false,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 1
      };
      
      // Perimeter of a rectangle = 2 * (width + height)
      expect(calculateShapePerimeter(rectangle)).toBe(2 * (30 + 40));
    });
    
    it('should calculate the perimeter of a triangle', () => {
      const triangle: Triangle = {
        id: '1',
        type: 'triangle',
        position: { x: 0, y: 0 },
        points: [
          { x: 0, y: 0 },
          { x: 30, y: 0 },
          { x: 0, y: 30 }
        ],
        rotation: 0,
        selected: false,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 1
      };
      
      // Perimeter = sum of all sides
      // Side 1 = 30, Side 2 = 30, Side 3 = sqrt(1800) ≈ 42.43
      const side3 = Math.sqrt(30*30 + 30*30);
      expect(calculateShapePerimeter(triangle)).toBeCloseTo(30 + 30 + side3, 5);
    });
    
    it('should return the length for the perimeter of a line', () => {
      const line: Line = {
        id: '1',
        type: 'line',
        position: { x: 0, y: 0 },
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 30, y: 30 },
        length: Math.sqrt(1800),
        rotation: 0,
        selected: false,
        fill: 'transparent',
        stroke: 'black',
        strokeWidth: 1
      };
      
      expect(calculateShapePerimeter(line)).toBe(Math.sqrt(1800));
    });
  });
  
  describe('isPointInShape', () => {
    it('should return true if a point is inside a circle', () => {
      const circle: Circle = {
        id: '1',
        type: 'circle',
        position: { x: 10, y: 20 },
        radius: 5,
        rotation: 0,
        selected: false,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 1
      };
      
      // Point inside the circle
      expect(isPointInShape(circle, { x: 12, y: 22 })).toBe(true);
      
      // Point outside the circle
      expect(isPointInShape(circle, { x: 20, y: 30 })).toBe(false);
    });
    
    it('should return true if a point is inside a rectangle', () => {
      const rectangle: Rectangle = {
        id: '1',
        type: 'rectangle',
        position: { x: 10, y: 20 },
        width: 30,
        height: 40,
        rotation: 0,
        selected: false,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 1
      };
      
      // Point inside the rectangle
      expect(isPointInShape(rectangle, { x: 15, y: 25 })).toBe(true);
      
      // Point outside the rectangle
      expect(isPointInShape(rectangle, { x: 5, y: 15 })).toBe(false);
    });
    
    it('should return true if a point is inside a triangle', () => {
      const triangle: Triangle = {
        id: '1',
        type: 'triangle',
        position: { x: 0, y: 0 },
        points: [
          { x: 0, y: 0 },
          { x: 30, y: 0 },
          { x: 0, y: 30 }
        ],
        rotation: 0,
        selected: false,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 1
      };
      
      // Point inside the triangle
      expect(isPointInShape(triangle, { x: 5, y: 5 })).toBe(true);
      
      // Point outside the triangle
      expect(isPointInShape(triangle, { x: 20, y: 20 })).toBe(false);
    });
    
    it('should return true if a point is close to a line', () => {
      const line: Line = {
        id: '1',
        type: 'line',
        position: { x: 0, y: 0 },
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 30, y: 30 },
        length: Math.sqrt(1800),
        rotation: 0,
        selected: false,
        fill: 'transparent',
        stroke: 'black',
        strokeWidth: 1
      };
      
      // Point on the line
      expect(isPointInShape(line, { x: 15, y: 15 })).toBe(true);
      
      // Point far from the line
      expect(isPointInShape(line, { x: 0, y: 30 })).toBe(false);
    });
  });
}); 