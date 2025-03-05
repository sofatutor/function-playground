import { moveShape } from '@/utils/geometry/shapeOperations';
import { createTestCircle, createTestRectangle, createTestTriangle, createTestLine, pointsAreEqual } from '../testUtils';
import { Point } from '@/types/shapes';

describe('Shape Operations - Movement', () => {
  describe('moveShape', () => {
    it('should move a circle to a new position', () => {
      // Arrange
      const circle = createTestCircle();
      const shapes = [circle];
      const newPosition: Point = { x: 200, y: 200 };
      
      // Act
      const result = moveShape(shapes, circle.id, newPosition);
      
      // Assert
      expect(result.length).toBe(1);
      expect(result[0].position).toEqual(newPosition);
    });
    
    it('should move a rectangle to a new position', () => {
      // Arrange
      const rectangle = createTestRectangle();
      const shapes = [rectangle];
      const newPosition: Point = { x: 200, y: 200 };
      
      // Act
      const result = moveShape(shapes, rectangle.id, newPosition);
      
      // Assert
      expect(result.length).toBe(1);
      expect(result[0].position).toEqual(newPosition);
    });
    
    it('should move a triangle and update all its points', () => {
      // Arrange
      const triangle = createTestTriangle();
      const shapes = [triangle];
      const originalPoints = [...triangle.points];
      const originalPosition = { ...triangle.position };
      
      // Move 50 pixels to the right and 30 pixels down
      const deltaX = 50;
      const deltaY = 30;
      const newPosition: Point = { 
        x: originalPosition.x + deltaX, 
        y: originalPosition.y + deltaY 
      };
      
      // Act
      const result = moveShape(shapes, triangle.id, newPosition);
      
      // Assert
      expect(result.length).toBe(1);
      expect(result[0].position).toEqual(newPosition);
      
      // Check that all points were moved by the same delta
      const movedTriangle = result[0] as typeof triangle;
      for (let i = 0; i < 3; i++) {
        const expectedPoint = {
          x: originalPoints[i].x + deltaX,
          y: originalPoints[i].y + deltaY
        };
        expect(pointsAreEqual(movedTriangle.points[i], expectedPoint)).toBe(true);
      }
    });
    
    it('should move a line and update its start and end points', () => {
      // Arrange
      const line = createTestLine();
      const shapes = [line];
      const originalStartPoint = { ...line.startPoint };
      const originalEndPoint = { ...line.endPoint };
      const originalPosition = { ...line.position };
      
      // Move 50 pixels to the right and 30 pixels down
      const deltaX = 50;
      const deltaY = 30;
      const newPosition: Point = { 
        x: originalPosition.x + deltaX, 
        y: originalPosition.y + deltaY 
      };
      
      // Act
      const result = moveShape(shapes, line.id, newPosition);
      
      // Assert
      expect(result.length).toBe(1);
      expect(result[0].position).toEqual(newPosition);
      
      // Check that start and end points were moved by the same delta
      const movedLine = result[0] as typeof line;
      const expectedStartPoint = {
        x: originalStartPoint.x + deltaX,
        y: originalStartPoint.y + deltaY
      };
      const expectedEndPoint = {
        x: originalEndPoint.x + deltaX,
        y: originalEndPoint.y + deltaY
      };
      
      expect(pointsAreEqual(movedLine.startPoint, expectedStartPoint)).toBe(true);
      expect(pointsAreEqual(movedLine.endPoint, expectedEndPoint)).toBe(true);
    });
    
    it('should not modify other shapes when moving a specific shape', () => {
      // Arrange
      const circle = createTestCircle({ id: 'circle-1' });
      const rectangle = createTestRectangle({ id: 'rectangle-1' });
      const shapes = [circle, rectangle];
      const originalRectanglePosition = { ...rectangle.position };
      const newCirclePosition: Point = { x: 200, y: 200 };
      
      // Act
      const result = moveShape(shapes, circle.id, newCirclePosition);
      
      // Assert
      expect(result.length).toBe(2);
      
      // Circle should be moved
      const movedCircle = result.find(s => s.id === circle.id);
      expect(movedCircle?.position).toEqual(newCirclePosition);
      
      // Rectangle should remain unchanged
      const unchangedRectangle = result.find(s => s.id === rectangle.id);
      expect(unchangedRectangle?.position).toEqual(originalRectanglePosition);
    });
    
    it('should handle non-existent shape ID', () => {
      // Arrange
      const shapes = [createTestCircle()];
      const nonExistentId = 'non-existent-id';
      const newPosition: Point = { x: 200, y: 200 };
      
      // Act
      const result = moveShape(shapes, nonExistentId, newPosition);
      
      // Assert
      expect(result).toEqual(shapes); // Should return the original array unchanged
    });
    
    it('should handle empty shapes array', () => {
      // Arrange
      const shapes = [];
      const newPosition: Point = { x: 200, y: 200 };
      
      // Act
      const result = moveShape(shapes, 'some-id', newPosition);
      
      // Assert
      expect(result).toEqual([]); // Should return an empty array
    });
  });
}); 