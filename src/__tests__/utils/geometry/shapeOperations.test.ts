import { selectShape } from '@/utils/geometry/shapeOperations';
import { createTestShapes } from '../testUtils';
import { AnyShape } from '@/types/shapes';

describe('Shape Operations - Selection', () => {
  describe('selectShape', () => {
    it('should select a shape by ID', () => {
      // Arrange
      const shapes = createTestShapes();
      const targetId = 'rectangle-1';
      
      // Act
      const result = selectShape(shapes, targetId);
      
      // Assert
      expect(result.length).toBe(shapes.length);
      
      // The target shape should be selected
      const selectedShape = result.find(shape => shape.id === targetId);
      expect(selectedShape).toBeDefined();
      expect(selectedShape?.selected).toBe(true);
      
      // All other shapes should not be selected
      const otherShapes = result.filter(shape => shape.id !== targetId);
      otherShapes.forEach(shape => {
        expect(shape.selected).toBe(false);
      });
    });
    
    it('should deselect all shapes when null ID is provided', () => {
      // Arrange
      const shapes = createTestShapes().map(shape => ({
        ...shape,
        selected: true
      }));
      
      // Act
      const result = selectShape(shapes, null);
      
      // Assert
      expect(result.length).toBe(shapes.length);
      
      // All shapes should be deselected
      result.forEach(shape => {
        expect(shape.selected).toBe(false);
      });
    });
    
    it('should handle non-existent shape ID', () => {
      // Arrange
      const shapes = createTestShapes();
      const nonExistentId = 'non-existent-id';
      
      // Act
      const result = selectShape(shapes, nonExistentId);
      
      // Assert
      expect(result.length).toBe(shapes.length);
      
      // All shapes should be deselected
      result.forEach(shape => {
        expect(shape.selected).toBe(false);
      });
    });
    
    it('should handle empty shapes array', () => {
      // Arrange
      const shapes: AnyShape[] = [];
      
      // Act
      const result = selectShape(shapes, 'some-id');
      
      // Assert
      expect(result).toEqual([]);
    });
  });
}); 