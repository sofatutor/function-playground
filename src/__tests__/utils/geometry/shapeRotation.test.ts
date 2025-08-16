import { rotateShape } from '@/utils/geometry/shapeOperations';
import { createTestCircle, createTestRectangle, createTestTriangle, createTestLine } from '../testUtils';

describe('Shape Operations - Rotation', () => {
  describe('rotateShape', () => {
    it('should rotate a circle by setting its rotation property', () => {
      // Arrange
      const circle = createTestCircle();
      const shapes = [circle];
      const angle = 45; // 45 degrees
      
      // Act
      const result = rotateShape(shapes, circle.id, angle);
      
      // Assert
      expect(result.length).toBe(1);
      expect(result[0].rotation).toBe(angle);
      
      // Position should remain unchanged
      expect(result[0].position).toEqual(circle.position);
      
      // For circles, only the rotation property changes
      if (result[0].type === 'circle') {
        expect(result[0].radius).toBe(circle.radius);
      }
    });
    
    it('should rotate a rectangle by setting its rotation property', () => {
      // Arrange
      const rectangle = createTestRectangle();
      const shapes = [rectangle];
      const angle = 90; // 90 degrees
      
      // Act
      const result = rotateShape(shapes, rectangle.id, angle);
      
      // Assert
      expect(result.length).toBe(1);
      expect(result[0].rotation).toBe(angle);
      
      // Position should remain unchanged
      expect(result[0].position).toEqual(rectangle.position);
      
      // For rectangles, dimensions should remain unchanged
      if (result[0].type === 'rectangle') {
        expect(result[0].width).toBe(rectangle.width);
        expect(result[0].height).toBe(rectangle.height);
      }
    });
    
    it('should rotate a triangle by setting its rotation property', () => {
      // Arrange
      const triangle = createTestTriangle();
      const shapes = [triangle];
      const angle = 180; // 180 degrees
      
      // Act
      const result = rotateShape(shapes, triangle.id, angle);
      
      // Assert
      expect(result.length).toBe(1);
      expect(result[0].rotation).toBe(angle);
      
      // Position should remain unchanged
      expect(result[0].position).toEqual(triangle.position);
    });
    
    it('should rotate a line by updating its start and end points', () => {
      // Arrange
      const line = createTestLine();
      const shapes = [line];
      const angle = 90; // 90 degrees
      
      // Act
      const result = rotateShape(shapes, line.id, angle);
      
      // Assert
      expect(result.length).toBe(1);
      expect(result[0].rotation).toBe(angle);
      
      // Position should remain unchanged
      expect(result[0].position).toEqual(line.position);
      
      // For lines, start and end points should be rotated
      if (result[0].type === 'line') {
        const rotatedLine = result[0];
        
        // The line should still have the same length
        expect(rotatedLine.length).toBeCloseTo(line.length, 2);
        
        // The start and end points should be different after rotation
        expect(rotatedLine.startPoint).not.toEqual(line.startPoint);
        expect(rotatedLine.endPoint).not.toEqual(line.endPoint);
      }
    });
    
    it('should not modify other shapes when rotating a specific shape', () => {
      // Arrange
      const circle = createTestCircle({ id: 'circle-1' });
      const rectangle = createTestRectangle({ id: 'rectangle-1' });
      const shapes = [circle, rectangle];
      const angle = 45; // 45 degrees
      
      // Act
      const result = rotateShape(shapes, circle.id, angle);
      
      // Assert
      expect(result.length).toBe(2);
      
      // Circle should be rotated
      const rotatedCircle = result.find(s => s.id === circle.id);
      expect(rotatedCircle?.rotation).toBe(angle);
      
      // Rectangle should remain unchanged
      const unchangedRectangle = result.find(s => s.id === rectangle.id);
      expect(unchangedRectangle?.rotation).toBe(rectangle.rotation);
    });
    
    it('should handle negative angles', () => {
      // Arrange
      const rectangle = createTestRectangle();
      const shapes = [rectangle];
      const angle = -45; // -45 degrees
      
      // Act
      const result = rotateShape(shapes, rectangle.id, angle);
      
      // Assert
      expect(result.length).toBe(1);
      expect(result[0].rotation).toBe(angle);
    });
    
    it('should handle angles greater than 360 degrees', () => {
      // Arrange
      const rectangle = createTestRectangle();
      const shapes = [rectangle];
      const angle = 405; // 405 degrees (equivalent to 45 degrees)
      
      // Act
      const result = rotateShape(shapes, rectangle.id, angle);
      
      // Assert
      expect(result.length).toBe(1);
      expect(result[0].rotation).toBe(angle);
    });
    
    it('should handle non-existent shape ID', () => {
      // Arrange
      const shapes = [createTestCircle()];
      const nonExistentId = 'non-existent-id';
      const angle = 45;
      
      // Act
      const result = rotateShape(shapes, nonExistentId, angle);
      
      // Assert
      expect(result).toEqual(shapes); // Should return the original array unchanged
    });
    
    it('should handle empty shapes array', () => {
      // Arrange
      const shapes = [];
      const angle = 45;
      
      // Act
      const result = rotateShape(shapes, 'some-id', angle);
      
      // Assert
      expect(result).toEqual([]); // Should return an empty array
    });
  });
}); 