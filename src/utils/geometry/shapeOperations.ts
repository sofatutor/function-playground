
import { AnyShape, Point, Triangle, Line } from '@/types/shapes';
import { distanceBetweenPoints } from './common';

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
    
    if (shape.type === 'line') {
      // For lines, we need to update both start and end points
      const line = shape as Line;
      const deltaX = newPosition.x - line.position.x;
      const deltaY = newPosition.y - line.position.y;
      
      const newStartPoint = {
        x: line.startPoint.x + deltaX,
        y: line.startPoint.y + deltaY
      };
      
      const newEndPoint = {
        x: line.endPoint.x + deltaX,
        y: line.endPoint.y + deltaY
      };
      
      return {
        ...shape,
        position: newPosition,
        startPoint: newStartPoint,
        endPoint: newEndPoint
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
      case 'line': {
        const line = shape as Line;
        const center = line.position;
        
        // Scale the start and end points from the center
        const newStartPoint = {
          x: center.x + (line.startPoint.x - center.x) * factor,
          y: center.y + (line.startPoint.y - center.y) * factor
        };
        
        const newEndPoint = {
          x: center.x + (line.endPoint.x - center.x) * factor,
          y: center.y + (line.endPoint.y - center.y) * factor
        };
        
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
      
      // Convert angle from degrees to radians
      const angleRad = (angle * Math.PI) / 180;
      const cos = Math.cos(angleRad);
      const sin = Math.sin(angleRad);
      
      // Rotate start point around center
      const startX = line.startPoint.x - center.x;
      const startY = line.startPoint.y - center.y;
      const rotatedStartX = startX * cos - startY * sin;
      const rotatedStartY = startX * sin + startY * cos;
      
      // Rotate end point around center
      const endX = line.endPoint.x - center.x;
      const endY = line.endPoint.y - center.y;
      const rotatedEndX = endX * cos - endY * sin;
      const rotatedEndY = endX * sin + endY * cos;
      
      // Create new points
      const newStartPoint = {
        x: rotatedStartX + center.x,
        y: rotatedStartY + center.y
      };
      
      const newEndPoint = {
        x: rotatedEndX + center.x,
        y: rotatedEndY + center.y
      };
      
      return {
        ...line,
        startPoint: newStartPoint,
        endPoint: newEndPoint,
        rotation: angle
      };
    }
    
    return { 
      ...shape, 
      rotation: angle 
    };
  });
}; 
