import { resizeShape } from '@/utils/geometry/shapeOperations';
import { createTestCircle, createTestRectangle, createTestTriangle, createTestLine, pointsAreEqual } from '../testUtils';
import { Point } from '@/types/shapes';

describe('Shape Operations - Resizing', () => {
  describe('resizeShape', () => {
    it('should resize a circle by scaling its radius', () => {
      // Arrange
      const circle = createTestCircle();
      const shapes = [circle];
      const factor = 2.0; // Double the size
      
      // Act
      const result = resizeShape(shapes, circle.id, factor);
      
      // Assert
      expect(result.length).toBe(1);
      
      // Position should remain unchanged
      expect(result[0].position).toEqual(circle.position);
      
      // Radius should be scaled by the factor
      if (result[0].type === 'circle') {
        expect(result[0].radius).toBe(circle.radius * factor);
      }
    });
    
    it('should resize a rectangle by scaling its width and height', () => {
      // Arrange
      const rectangle = createTestRectangle();
      const shapes = [rectangle];
      const factor = 1.5; // Scale by 1.5
      
      // Act
      const result = resizeShape(shapes, rectangle.id, factor);
      
      // Assert
      expect(result.length).toBe(1);
      
      // Position should remain unchanged
      expect(result[0].position).toEqual(rectangle.position);
      
      // Width and height should be scaled by the factor
      if (result[0].type === 'rectangle') {
        expect(result[0].width).toBe(rectangle.width * factor);
        expect(result[0].height).toBe(rectangle.height * factor);
      }
    });
    
    it('should resize a triangle by scaling its points from the center', () => {
      // Arrange
      const triangle = createTestTriangle();
      const shapes = [triangle];
      const factor = 2.0; // Double the size
      const center = triangle.position;
      
      // Act
      const result = resizeShape(shapes, triangle.id, factor);
      
      // Assert
      expect(result.length).toBe(1);
      
      // Position should remain unchanged
      expect(result[0].position).toEqual(triangle.position);
      
      // Points should be scaled from the center
      if (result[0].type === 'triangle') {
        const resizedTriangle = result[0];
        
        // Check each point has been scaled correctly from the center
        for (let i = 0; i < 3; i++) {
          const originalPoint = triangle.points[i];
          const resizedPoint = resizedTriangle.points[i];
          
          // Calculate expected point after scaling from center
          const expectedX = center.x + (originalPoint.x - center.x) * factor;
          const expectedY = center.y + (originalPoint.y - center.y) * factor;
          const expectedPoint = { x: expectedX, y: expectedY };
          
          expect(pointsAreEqual(resizedPoint, expectedPoint)).toBe(true);
        }
      }
    });
    
    it('should resize a line by scaling its start and end points from the center', () => {
      // Arrange
      const line = createTestLine();
      const shapes = [line];
      const factor = 0.5; // Half the size
      const center = line.position;
      
      // Act
      const result = resizeShape(shapes, line.id, factor);
      
      // Assert
      expect(result.length).toBe(1);
      
      // Position should remain unchanged
      expect(result[0].position).toEqual(line.position);
      
      // Start and end points should be scaled from the center
      if (result[0].type === 'line') {
        const resizedLine = result[0];
        
        // Calculate expected points after scaling from center
        const expectedStartX = center.x + (line.startPoint.x - center.x) * factor;
        const expectedStartY = center.y + (line.startPoint.y - center.y) * factor;
        const expectedStart = { x: expectedStartX, y: expectedStartY };
        
        const expectedEndX = center.x + (line.endPoint.x - center.x) * factor;
        const expectedEndY = center.y + (line.endPoint.y - center.y) * factor;
        const expectedEnd = { x: expectedEndX, y: expectedEndY };
        
        expect(pointsAreEqual(resizedLine.startPoint, expectedStart)).toBe(true);
        expect(pointsAreEqual(resizedLine.endPoint, expectedEnd)).toBe(true);
        
        // Length should be scaled by the factor
        expect(resizedLine.length).toBeCloseTo(line.length * factor, 2);
      }
    });
    
    it('should not modify other shapes when resizing a specific shape', () => {
      // Arrange
      const circle = createTestCircle({ id: 'circle-1' });
      const rectangle = createTestRectangle({ id: 'rectangle-1' });
      const shapes = [circle, rectangle];
      const factor = 2.0;
      
      // Act
      const result = resizeShape(shapes, circle.id, factor);
      
      // Assert
      expect(result.length).toBe(2);
      
      // Circle should be resized
      const resizedCircle = result.find(s => s.id === circle.id);
      if (resizedCircle?.type === 'circle') {
        expect(resizedCircle.radius).toBe(circle.radius * factor);
      }
      
      // Rectangle should remain unchanged
      const unchangedRectangle = result.find(s => s.id === rectangle.id);
      if (unchangedRectangle?.type === 'rectangle') {
        expect(unchangedRectangle.width).toBe(rectangle.width);
        expect(unchangedRectangle.height).toBe(rectangle.height);
      }
    });
    
    it('should handle a factor of 1.0 (no change)', () => {
      // Arrange
      const rectangle = createTestRectangle();
      const shapes = [rectangle];
      const factor = 1.0; // No change
      
      // Act
      const result = resizeShape(shapes, rectangle.id, factor);
      
      // Assert
      expect(result.length).toBe(1);
      
      // Shape should remain unchanged
      if (result[0].type === 'rectangle') {
        expect(result[0].width).toBe(rectangle.width);
        expect(result[0].height).toBe(rectangle.height);
      }
    });
    
    it('should handle negative factors by using absolute value', () => {
      // Arrange
      const circle = createTestCircle();
      const shapes = [circle];
      const factor = -2.0; // Negative factor
      
      // Act
      const result = resizeShape(shapes, circle.id, factor);
      
      // Assert
      expect(result.length).toBe(1);
      
      // Radius should be scaled by the absolute value of the factor
      if (result[0].type === 'circle') {
        expect(result[0].radius).toBe(circle.radius * Math.abs(factor));
      }
    });
    
    it('should handle non-existent shape ID', () => {
      // Arrange
      const shapes = [createTestCircle()];
      const nonExistentId = 'non-existent-id';
      const factor = 2.0;
      
      // Act
      const result = resizeShape(shapes, nonExistentId, factor);
      
      // Assert
      expect(result).toEqual(shapes); // Should return the original array unchanged
    });
    
    it('should handle empty shapes array', () => {
      // Arrange
      const shapes = [];
      const factor = 2.0;
      
      // Act
      const result = resizeShape(shapes, 'some-id', factor);
      
      // Assert
      expect(result).toEqual([]); // Should return an empty array
    });
  });
}); 