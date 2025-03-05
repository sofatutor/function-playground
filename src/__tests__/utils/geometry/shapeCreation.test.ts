import { createShape, createCircle, createRectangle, createTriangle, createLine } from '@/utils/geometry/shapeCreation';
import { Point, ShapeType } from '@/types/shapes';
import * as commonUtils from '@/utils/geometry/common';
import { distanceBetweenPoints } from '@/utils/geometry/common';

describe('Shape Operations - Creation', () => {
  // Helper function to generate a unique ID for testing
  const originalGenerateId = jest.requireActual('@/utils/geometry/common').generateId;
  
  beforeEach(() => {
    // Mock the generateId function to return a predictable ID for testing
    jest.spyOn(commonUtils, 'generateId').mockImplementation(() => 'test-id');
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  describe('createShape', () => {
    it('should create a circle with correct properties', () => {
      // Arrange
      const startPoint: Point = { x: 100, y: 100 };
      const endPoint: Point = { x: 150, y: 150 };
      const shapeType: ShapeType = 'circle';
      
      // Calculate expected radius
      const expectedRadius = distanceBetweenPoints(startPoint, endPoint);
      
      // Act
      const result = createShape(startPoint, endPoint, shapeType);
      
      // Assert
      expect(result).toEqual({
        id: 'test-id',
        type: 'circle',
        position: startPoint,
        radius: expectedRadius,
        rotation: 0,
        selected: true,
        fill: expect.any(String),
        stroke: expect.any(String),
        strokeWidth: expect.any(Number)
      });
    });
    
    it('should create a rectangle with correct properties', () => {
      // Arrange
      const startPoint: Point = { x: 100, y: 100 };
      const endPoint: Point = { x: 200, y: 150 };
      const shapeType: ShapeType = 'rectangle';
      
      // Act
      const result = createShape(startPoint, endPoint, shapeType);
      
      // Assert
      expect(result).toEqual({
        id: 'test-id',
        type: 'rectangle',
        position: { x: 100, y: 100 }, // Min x and y
        width: 100, // |200 - 100|
        height: 50, // |150 - 100|
        rotation: 0,
        selected: true,
        fill: expect.any(String),
        stroke: expect.any(String),
        strokeWidth: expect.any(Number)
      });
    });
    
    it('should create a rectangle correctly when end point is above and to the left of start point', () => {
      // Arrange
      const startPoint: Point = { x: 200, y: 200 };
      const endPoint: Point = { x: 100, y: 100 };
      const shapeType: ShapeType = 'rectangle';
      
      // Act
      const result = createShape(startPoint, endPoint, shapeType);
      
      // Assert
      expect(result).toEqual({
        id: 'test-id',
        type: 'rectangle',
        position: { x: 100, y: 100 }, // Min x and y
        width: 100, // |200 - 100|
        height: 100, // |200 - 100|
        rotation: 0,
        selected: true,
        fill: expect.any(String),
        stroke: expect.any(String),
        strokeWidth: expect.any(Number)
      });
    });
    
    it('should create a triangle with correct properties', () => {
      // Arrange
      const startPoint: Point = { x: 100, y: 100 };
      const endPoint: Point = { x: 200, y: 200 };
      const shapeType: ShapeType = 'triangle';
      
      // Act
      const result = createShape(startPoint, endPoint, shapeType);
      
      // Assert
      expect(result).toEqual({
        id: 'test-id',
        type: 'triangle',
        position: expect.any(Object), // Position is calculated as center of triangle
        points: expect.any(Array), // Points are calculated based on start and end
        rotation: 0,
        selected: true,
        fill: expect.any(String),
        stroke: expect.any(String),
        strokeWidth: expect.any(Number)
      });
      
      // Check that we have 3 points
      expect(result.type).toBe('triangle');
      if (result.type === 'triangle') {
        expect(result.points.length).toBe(3);
      }
    });
    
    it('should create a line with correct properties', () => {
      // Arrange
      const startPoint: Point = { x: 100, y: 100 };
      const endPoint: Point = { x: 200, y: 200 };
      const shapeType: ShapeType = 'line';
      
      // Calculate expected length
      const expectedLength = distanceBetweenPoints(startPoint, endPoint);
      
      // Act
      const result = createShape(startPoint, endPoint, shapeType);
      
      // Assert
      expect(result).toEqual({
        id: 'test-id',
        type: 'line',
        position: { x: 150, y: 150 }, // Midpoint between start and end
        startPoint: startPoint,
        endPoint: endPoint,
        length: expectedLength,
        rotation: 0,
        selected: true,
        fill: expect.any(String),
        stroke: expect.any(String),
        strokeWidth: expect.any(Number)
      });
    });
    
    it('should throw an error for unsupported shape type', () => {
      // Arrange
      const startPoint: Point = { x: 100, y: 100 };
      const endPoint: Point = { x: 200, y: 200 };
      const invalidShapeType = 'invalid' as ShapeType;
      
      // Act & Assert
      expect(() => {
        createShape(startPoint, endPoint, invalidShapeType);
      }).toThrow(`Failed to create ${invalidShapeType}: Unsupported shape type: ${invalidShapeType}`);
    });
    
    it('should throw an error when start or end point is missing', () => {
      // Arrange
      const startPoint: Point = { x: 100, y: 100 };
      const nullEndPoint = null as unknown as Point;
      const shapeType: ShapeType = 'circle';
      
      // Act & Assert
      expect(() => {
        createShape(startPoint, nullEndPoint, shapeType);
      }).toThrow('Failed to create circle: Start and end points must be provided');
    });
    
    it('should throw an error when points have non-numeric coordinates', () => {
      // Arrange
      const startPoint: Point = { x: 100, y: 100 };
      const invalidEndPoint = { x: 'invalid' as unknown as number, y: 200 };
      const shapeType: ShapeType = 'circle';
      
      // Act & Assert
      expect(() => {
        createShape(startPoint, invalidEndPoint as Point, shapeType);
      }).toThrow('Failed to create circle: Points must have numeric x and y coordinates');
    });
  });
  
  describe('createCircle', () => {
    it('should throw an error when radius is zero', () => {
      // Arrange
      const startPoint: Point = { x: 100, y: 100 };
      const endPoint: Point = { x: 100, y: 100 }; // Same point, zero radius
      
      // Act & Assert
      expect(() => {
        createCircle(startPoint, endPoint, 'test-id');
      }).toThrow('Circle radius must be greater than zero');
    });
  });
  
  describe('createRectangle', () => {
    it('should throw an error when width or height is zero', () => {
      // Arrange
      const startPoint: Point = { x: 100, y: 100 };
      const endPoint: Point = { x: 100, y: 200 }; // Zero width
      
      // Act & Assert
      expect(() => {
        createRectangle(startPoint, endPoint, 'test-id');
      }).toThrow('Rectangle dimensions must be greater than zero');
    });
  });
  
  describe('createTriangle', () => {
    it('should throw an error when dimensions are too small', () => {
      // Arrange
      const startPoint: Point = { x: 100, y: 100 };
      const endPoint: Point = { x: 100, y: 100 }; // Same point, zero width
      
      // Act & Assert
      expect(() => {
        createTriangle(startPoint, endPoint, 'test-id');
      }).toThrow('Triangle dimensions must be greater than zero');
    });
  });
  
  describe('createLine', () => {
    it('should throw an error when length is zero', () => {
      // Arrange
      const startPoint: Point = { x: 100, y: 100 };
      const endPoint: Point = { x: 100, y: 100 }; // Same point, zero length
      
      // Act & Assert
      expect(() => {
        createLine(startPoint, endPoint, 'test-id');
      }).toThrow('Line length must be greater than zero');
    });
  });
}); 