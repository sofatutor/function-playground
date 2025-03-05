import { AnyShape, Point, Triangle, Line } from '@/types/shapes';
import { distanceBetweenPoints, movePoint, scalePoint, rotatePoint } from './pointOperations';

// Function to select a shape
export const selectShape = (shapes: AnyShape[], id: string | null): AnyShape[] => {
  return shapes.map(shape => ({
    ...shape,
    selected: shape.id === id
  }));
};

// Function to move a shape
export const moveShape = (shapes: AnyShape[], id: string, newPosition: Point): AnyShape[] => {
  return shapes.map(shape => {
    if (shape.id !== id) return shape;
    
    // Calculate the delta between current and new position
    const deltaX = newPosition.x - shape.position.x;
    const deltaY = newPosition.y - shape.position.y;
    
    if (shape.type === 'triangle') {
      // For triangles, we need to update each point
      const tri = shape as Triangle;
      
      // Move each point by the same delta
      const newPoints: [Point, Point, Point] = [
        movePoint(tri.points[0], deltaX, deltaY),
        movePoint(tri.points[1], deltaX, deltaY),
        movePoint(tri.points[2], deltaX, deltaY)
      ];
      
      return {
        ...shape,
        position: newPosition,
        points: newPoints
      };
    }
    
    if (shape.type === 'line') {
      // For lines, we need to update both start and end points
      const line = shape as Line;
      
      return {
        ...shape,
        position: newPosition,
        startPoint: movePoint(line.startPoint, deltaX, deltaY),
        endPoint: movePoint(line.endPoint, deltaX, deltaY)
      };
    }
    
    // For other shapes, just update the position
    return { ...shape, position: newPosition };
  });
};

// Function to resize a shape
export const resizeShape = (shapes: AnyShape[], id: string, factor: number): AnyShape[] => {
  return shapes.map(shape => {
    if (shape.id !== id) return shape;
    
    // Use absolute value of factor to ensure positive scaling
    const absFactor = Math.abs(factor);
    
    switch (shape.type) {
      case 'circle':
        return {
          ...shape,
          radius: shape.radius * absFactor
        };
      case 'rectangle':
        return {
          ...shape,
          width: shape.width * absFactor,
          height: shape.height * absFactor
        };
      case 'triangle': {
        const triangle = shape as Triangle;
        const center = triangle.position;
        const newPoints = triangle.points.map(point => 
          scalePoint(point, center, absFactor)
        ) as [Point, Point, Point];
        
        return {
          ...triangle,
          points: newPoints
        };
      }
      case 'line': {
        const line = shape as Line;
        const center = line.position;
        
        // Scale the start and end points from the center
        const newStartPoint = scalePoint(line.startPoint, center, absFactor);
        const newEndPoint = scalePoint(line.endPoint, center, absFactor);
        
        // Calculate the new length
        const newLength = distanceBetweenPoints(newStartPoint, newEndPoint);
        
        return {
          ...line,
          startPoint: newStartPoint,
          endPoint: newEndPoint,
          length: newLength
        };
      }
      default:
        return shape;
    }
  });
};

// Function to rotate a shape
export const rotateShape = (shapes: AnyShape[], id: string, angle: number): AnyShape[] => {
  return shapes.map(shape => {
    if (shape.id !== id) return shape;
    
    if (shape.type === 'line') {
      const line = shape as Line;
      const center = line.position;
      
      return {
        ...line,
        startPoint: rotatePoint(line.startPoint, center, angle),
        endPoint: rotatePoint(line.endPoint, center, angle),
        rotation: angle
      };
    }
    
    return { 
      ...shape, 
      rotation: angle 
    };
  });
}; 
