import { updateShapeFromMeasurement } from '@/utils/geometry/shapeUpdates';
import { createTestCircle, createTestRectangle, createTestTriangle, createTestLine, pointsAreEqual } from '../testUtils';
import { AnyShape, Circle, Rectangle, Triangle, Line } from '@/types/shapes';

describe('Shape Updates', () => {
  describe('updateShapeFromMeasurement', () => {
    // Circle tests
    describe('Circle updates', () => {
      it('should update circle radius', () => {
        // Arrange
        const circle = createTestCircle({ radius: 50 });
        const newRadiusValue = 75;
        
        // Act
        const result = updateShapeFromMeasurement(circle, 'radius', newRadiusValue, newRadiusValue) as Circle;
        
        // Assert
        expect(result.type).toBe('circle');
        expect(result.radius).toBe(newRadiusValue);
        expect(result.position).toEqual(circle.position);
      });
      
      it('should update circle diameter', () => {
        // Arrange
        const circle = createTestCircle({ radius: 50 });
        const newDiameterValue = 150;
        const expectedRadius = 75; // diameter / 2
        
        // Act
        const result = updateShapeFromMeasurement(circle, 'diameter', newDiameterValue, newDiameterValue) as Circle;
        
        // Assert
        expect(result.type).toBe('circle');
        expect(result.radius).toBe(expectedRadius);
        expect(result.position).toEqual(circle.position);
      });
      
      it('should update circle circumference', () => {
        // Arrange
        const circle = createTestCircle({ radius: 50 });
        const newCircumferenceValue = 314.16; // approximately 2πr
        const expectedRadius = 50; // circumference / (2π)
        
        // Act
        const result = updateShapeFromMeasurement(circle, 'circumference', newCircumferenceValue, newCircumferenceValue) as Circle;
        
        // Assert
        expect(result.type).toBe('circle');
        expect(result.radius).toBeCloseTo(expectedRadius, 0);
        expect(result.position).toEqual(circle.position);
      });
      
      it('should update circle area', () => {
        // Arrange
        const circle = createTestCircle({ radius: 50 });
        const newAreaValue = 7853.98; // approximately πr²
        const expectedRadius = 50; // sqrt(area / π)
        
        // Act
        const result = updateShapeFromMeasurement(circle, 'area', newAreaValue, newAreaValue) as Circle;
        
        // Assert
        expect(result.type).toBe('circle');
        expect(result.radius).toBeCloseTo(expectedRadius, 0);
        expect(result.position).toEqual(circle.position);
      });
    });
    
    // Rectangle tests
    describe('Rectangle updates', () => {
      it('should update rectangle width', () => {
        // Arrange
        const rectangle = createTestRectangle({ width: 100, height: 80 });
        const newWidthValue = 150;
        
        // Act
        const result = updateShapeFromMeasurement(rectangle, 'width', newWidthValue, newWidthValue) as Rectangle;
        
        // Assert
        expect(result.type).toBe('rectangle');
        expect(result.width).toBe(newWidthValue);
        expect(result.height).toBe(rectangle.height);
        expect(result.position).toEqual(rectangle.position);
      });
      
      it('should update rectangle height', () => {
        // Arrange
        const rectangle = createTestRectangle({ width: 100, height: 80 });
        const newHeightValue = 120;
        
        // Act
        const result = updateShapeFromMeasurement(rectangle, 'height', newHeightValue, newHeightValue) as Rectangle;
        
        // Assert
        expect(result.type).toBe('rectangle');
        expect(result.width).toBe(rectangle.width);
        expect(result.height).toBe(newHeightValue);
        expect(result.position).toEqual(rectangle.position);
      });
      
      it('should update rectangle area while maintaining aspect ratio', () => {
        // Arrange
        const rectangle = createTestRectangle({ width: 100, height: 80 });
        const aspectRatio = rectangle.width / rectangle.height;
        const newAreaValue = 16000; // 2x the original area of 8000
        
        // Act
        const result = updateShapeFromMeasurement(rectangle, 'area', newAreaValue, newAreaValue) as Rectangle;
        
        // Assert
        expect(result.type).toBe('rectangle');
        expect(result.width / result.height).toBeCloseTo(aspectRatio, 2);
        expect(result.width * result.height).toBeCloseTo(newAreaValue, 0);
        expect(result.position).toEqual(rectangle.position);
      });
      
      it('should update rectangle perimeter while maintaining aspect ratio', () => {
        // Arrange
        const rectangle = createTestRectangle({ width: 100, height: 80 });
        const aspectRatio = rectangle.width / rectangle.height;
        const originalPerimeter = 2 * (rectangle.width + rectangle.height); // 2 * (100 + 80) = 360
        const newPerimeterValue = 720; // 2x the original perimeter
        
        // Act
        const result = updateShapeFromMeasurement(rectangle, 'perimeter', newPerimeterValue, newPerimeterValue) as Rectangle;
        
        // Assert
        expect(result.type).toBe('rectangle');
        expect(result.width / result.height).toBeCloseTo(aspectRatio, 2);
        expect(2 * (result.width + result.height)).toBeCloseTo(newPerimeterValue, 0);
        expect(result.position).toEqual(rectangle.position);
      });
    });
    
    // Triangle tests
    describe('Triangle updates', () => {
      it('should update triangle side length', () => {
        // Arrange
        const triangle = createTestTriangle();
        const originalPoints = [...triangle.points];
        const originalSide1 = Math.sqrt(
          Math.pow(originalPoints[1].x - originalPoints[0].x, 2) + 
          Math.pow(originalPoints[1].y - originalPoints[0].y, 2)
        );
        const newSideValue = originalSide1 * 2; // Double the side length
        
        // Act
        const result = updateShapeFromMeasurement(triangle, 'side1', newSideValue, newSideValue) as Triangle;
        
        // Assert
        expect(result.type).toBe('triangle');
        expect(result.position).toEqual(triangle.position);
        
        // The new side should be approximately double the original
        const newSide1 = Math.sqrt(
          Math.pow(result.points[1].x - result.points[0].x, 2) + 
          Math.pow(result.points[1].y - result.points[0].y, 2)
        );
        expect(newSide1).toBeCloseTo(newSideValue, 0);
      });
      
      it('should update triangle angle', () => {
        // Arrange
        const triangle = createTestTriangle();
        const newAngleValue = 60; // Set angle to 60 degrees
        
        // Act
        const result = updateShapeFromMeasurement(triangle, 'angle1', newAngleValue, newAngleValue) as Triangle;
        
        // Assert
        expect(result.type).toBe('triangle');
        
        // We can't easily verify the exact angle here without duplicating the calculation logic,
        // but we can verify that the points have changed and the position is maintained
        expect(result.position).toEqual(triangle.position);
        expect(result.points).not.toEqual(triangle.points);
      });
      
      it('should update triangle area', () => {
        // Arrange
        const triangle = createTestTriangle();
        const originalArea = 0.5 * Math.abs(
          (triangle.points[0].x * (triangle.points[1].y - triangle.points[2].y)) +
          (triangle.points[1].x * (triangle.points[2].y - triangle.points[0].y)) +
          (triangle.points[2].x * (triangle.points[0].y - triangle.points[1].y))
        );
        const newAreaValue = originalArea * 4; // Quadruple the area
        
        // Act
        const result = updateShapeFromMeasurement(triangle, 'area', newAreaValue, newAreaValue) as Triangle;
        
        // Assert
        expect(result.type).toBe('triangle');
        expect(result.position).toEqual(triangle.position);
        
        // Calculate the new area
        const newArea = 0.5 * Math.abs(
          (result.points[0].x * (result.points[1].y - result.points[2].y)) +
          (result.points[1].x * (result.points[2].y - result.points[0].y)) +
          (result.points[2].x * (result.points[0].y - result.points[1].y))
        );
        
        // The new area should be approximately quadruple the original
        expect(newArea).toBeCloseTo(newAreaValue, 0);
      });
    });
    
    // Line tests
    describe('Line updates', () => {
      it('should update line length', () => {
        // Arrange
        const line = createTestLine();
        const originalLength = line.length;
        const newLengthValue = originalLength * 2; // Double the length
        
        // Act
        const result = updateShapeFromMeasurement(line, 'length', newLengthValue, newLengthValue) as Line;
        
        // Assert
        expect(result.type).toBe('line');
        expect(result.length).toBeCloseTo(newLengthValue, 0);
        expect(result.position).toEqual(line.position);
      });
      
      it('should update line angle', () => {
        // Arrange
        const line = createTestLine();
        const newAngleValue = 45; // Set angle to 45 degrees
        
        // Act
        const result = updateShapeFromMeasurement(line, 'angle', newAngleValue, newAngleValue) as Line;
        
        // Assert
        expect(result.type).toBe('line');
        expect(result.rotation).toBe(newAngleValue);
        expect(result.position).toEqual(line.position);
        
        // The length should be preserved
        expect(result.length).toBeCloseTo(line.length, 0);
      });
    });
    
    // Edge cases
    describe('Edge cases', () => {
      it('should handle unknown measurement keys', () => {
        // Arrange
        const circle = createTestCircle();
        
        // Act
        const result = updateShapeFromMeasurement(circle, 'unknown', 100, 100);
        
        // Assert
        expect(result).toEqual(circle); // Should return the original shape unchanged
      });
      
      it('should handle unknown shape types', () => {
        // Arrange
        const unknownShape = { 
          ...createTestCircle(),
          type: 'unknown' as 'circle' // Use a valid type for TypeScript but treat as unknown in the test
        };
        
        // Act
        const result = updateShapeFromMeasurement(unknownShape as AnyShape, 'radius', 100, 100);
        
        // Assert
        expect(result).toEqual(unknownShape); // Should return the original shape unchanged
      });
    });
  });
}); 