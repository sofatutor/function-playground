import { AnyShape, Point, Triangle } from '@/types/shapes';

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
    
    if (shape.type === 'triangle') {
      // For triangles, we need to update each point
      const tri = shape as Triangle;
      const deltaX = newPosition.x - tri.position.x;
      const deltaY = newPosition.y - tri.position.y;
      
      // Move each point by the same delta
      const newPoints: [Point, Point, Point] = [
        { x: tri.points[0].x + deltaX, y: tri.points[0].y + deltaY },
        { x: tri.points[1].x + deltaX, y: tri.points[1].y + deltaY },
        { x: tri.points[2].x + deltaX, y: tri.points[2].y + deltaY }
      ];
      
      return {
        ...shape,
        position: newPosition,
        points: newPoints
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
    
    switch (shape.type) {
      case 'circle':
        return {
          ...shape,
          radius: shape.radius * factor
        };
      case 'rectangle':
        return {
          ...shape,
          width: shape.width * factor,
          height: shape.height * factor
        };
      case 'triangle': {
        const triangle = shape as Triangle;
        const center = triangle.position;
        const newPoints = triangle.points.map(point => ({
          x: center.x + (point.x - center.x) * factor,
          y: center.y + (point.y - center.y) * factor
        })) as [Point, Point, Point];
        
        return {
          ...triangle,
          points: newPoints
        };
      }
      default:
        return shape;
    }
  });
};

// Function to rotate a shape
export const rotateShape = (shapes: AnyShape[], id: string, angle: number): AnyShape[] => {
  return shapes.map(shape => 
    shape.id === id 
      ? { ...shape, rotation: angle } 
      : shape
  );
}; 