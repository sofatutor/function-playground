import { selectShape } from '@/utils/geometry/shapeOperations';
import { createTestShapes } from '../testUtils';
import { AnyShape } from '@/types/shapes';

describe('Shape Operations - Selection', () => {
  describe('selectShape', () => {
    it('should return the shapes array unchanged', () => {
      // Arrange
      const shapes = createTestShapes();
      const targetId = 'rectangle-1';
      
      // Act
      const result = selectShape(shapes, targetId);
      
      // Assert
      expect(result.length).toBe(shapes.length);
      
      // The shapes array should be a new array (not the same reference)
      expect(result).not.toBe(shapes);
      
      // But the contents should be the same
      expect(result).toEqual(shapes);
    });
    
    it('should handle null ID', () => {
      // Arrange
      const shapes = createTestShapes();
      
      // Act
      const result = selectShape(shapes, null);
      
      // Assert
      expect(result.length).toBe(shapes.length);
      expect(result).toEqual(shapes);
    });
    
    it('should handle non-existent shape ID', () => {
      // Arrange
      const shapes = createTestShapes();
      const nonExistentId = 'non-existent-id';
      
      // Act
      const result = selectShape(shapes, nonExistentId);
      
      // Assert
      expect(result.length).toBe(shapes.length);
      expect(result).toEqual(shapes);
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