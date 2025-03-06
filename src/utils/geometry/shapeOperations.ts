/**
 * Shape Operations Module
 * 
 * This module contains utility functions for manipulating shapes in the geometry application.
 * Functions include selecting, moving, resizing, and rotating shapes.
 */

import { AnyShape, Circle, Rectangle, Triangle, Line, Point } from '@/types/shapes';
import { distanceBetweenPoints, movePoint, scalePoint, rotatePoint } from './pointOperations';

/**
 * Validates that the shapes array and shapeId are valid
 * @param shapes Array of shapes to validate
 * @param shapeId ID of the shape to find
 * @returns The found shape or undefined if not found
 */
const findShapeById = (shapes: AnyShape[], shapeId: string | null): AnyShape | undefined => {
  if (!shapes || !Array.isArray(shapes)) {
    return undefined;
  }
  
  if (shapeId === null) {
    return undefined;
  }
  
  return shapes.find(shape => shape.id === shapeId);
};

/**
 * Selects a shape by ID and deselects all others
 * @param shapes Array of shapes
 * @param shapeId ID of the shape to select, or null to deselect all
 * @returns New array with updated selection states
 */
export const selectShape = (shapes: AnyShape[], shapeId: string | null): AnyShape[] => {
  if (!shapes || !Array.isArray(shapes) || shapes.length === 0) {
    return [];
  }
  
  return shapes.map(shape => ({
    ...shape,
    selected: shape.id === shapeId
  }));
};

/**
 * Calculates the center point of a shape
 * @param shape Any shape
 * @returns The center point
 */
export const calculateShapeCenter = (shape: AnyShape): Point => {
  switch (shape.type) {
    case 'circle':
    case 'rectangle':
      return shape.position;
    case 'triangle': {
      // Calculate centroid of the triangle
      const { points } = shape as Triangle;
      const x = (points[0].x + points[1].x + points[2].x) / 3;
      const y = (points[0].y + points[1].y + points[2].y) / 3;
      return { x, y };
    }
    case 'line': {
      // Calculate midpoint of the line
      const { startPoint, endPoint } = shape as Line;
      const x = (startPoint.x + endPoint.x) / 2;
      const y = (startPoint.y + endPoint.y) / 2;
      return { x, y };
    }
    default:
      // This should never happen with proper type checking
      return { x: 0, y: 0 };
  }
};

/**
 * Moves a shape to a new position
 * @param shapes Array of shapes
 * @param shapeId ID of the shape to move
 * @param newPosition New position for the shape
 * @returns New array with the moved shape
 */
export const moveShape = (shapes: AnyShape[], shapeId: string, newPosition: Point): AnyShape[] => {
  if (!shapes || !Array.isArray(shapes) || shapes.length === 0) {
    return [];
  }
  
  if (!newPosition || typeof newPosition.x !== 'number' || typeof newPosition.y !== 'number') {
    return shapes;
  }
  
  const targetShape = findShapeById(shapes, shapeId);
  if (!targetShape) {
    return shapes;
  }
  
  return shapes.map(shape => {
    if (shape.id !== shapeId) {
      return shape;
    }
    
    // Calculate the delta between current and new position
    const dx = newPosition.x - shape.position.x;
    const dy = newPosition.y - shape.position.y;
    
    switch (shape.type) {
      case 'circle':
        return {
          ...shape,
          position: newPosition
        };
      case 'rectangle':
        return {
          ...shape,
          position: newPosition
        };
      case 'triangle': {
        // Move all points by the delta
        const newPoints: [Point, Point, Point] = [
          { x: shape.points[0].x + dx, y: shape.points[0].y + dy },
          { x: shape.points[1].x + dx, y: shape.points[1].y + dy },
          { x: shape.points[2].x + dx, y: shape.points[2].y + dy }
        ];
        
        return {
          ...shape,
          position: newPosition,
          points: newPoints
        };
      }
      case 'line': {
        // Move start and end points by the delta
        return {
          ...shape,
          position: newPosition,
          startPoint: {
            x: shape.startPoint.x + dx,
            y: shape.startPoint.y + dy
          },
          endPoint: {
            x: shape.endPoint.x + dx,
            y: shape.endPoint.y + dy
          }
        };
      }
      default:
        return shape;
    }
  });
};

/**
 * Resizes a shape by a scaling factor
 * @param shapes Array of shapes
 * @param shapeId ID of the shape to resize
 * @param factor Scaling factor (1.0 = no change, > 1.0 = enlarge, < 1.0 = shrink)
 * @returns New array with the resized shape
 */
export const resizeShape = (shapes: AnyShape[], shapeId: string, factor: number): AnyShape[] => {
  if (!shapes || !Array.isArray(shapes) || shapes.length === 0) {
    return [];
  }
  
  if (typeof factor !== 'number' || isNaN(factor)) {
    return shapes;
  }
  
  // Use absolute value for factor to prevent negative scaling
  const scaleFactor = Math.abs(factor);
  
  // If factor is 1.0, no change is needed
  if (scaleFactor === 1.0) {
    return shapes;
  }
  
  const targetShape = findShapeById(shapes, shapeId);
  if (!targetShape) {
    return shapes;
  }
  
  return shapes.map(shape => {
    if (shape.id !== shapeId) {
      return shape;
    }
    
    switch (shape.type) {
      case 'circle': {
        return {
          ...shape,
          radius: shape.radius * scaleFactor
        };
      }
      case 'rectangle': {
        return {
          ...shape,
          width: shape.width * scaleFactor,
          height: shape.height * scaleFactor
        };
      }
      case 'triangle': {
        const center = shape.position; // Use the position as the center for triangles
        
        // Scale each point from the center
        const newPoints: [Point, Point, Point] = shape.points.map(point => {
          // Vector from center to point
          const dx = point.x - center.x;
          const dy = point.y - center.y;
          
          // Scale the vector
          const scaledDx = dx * scaleFactor;
          const scaledDy = dy * scaleFactor;
          
          // New point position
          return {
            x: center.x + scaledDx,
            y: center.y + scaledDy
          };
        }) as [Point, Point, Point];
        
        return {
          ...shape,
          points: newPoints
        };
      }
      case 'line': {
        const center = calculateShapeCenter(shape);
        
        // Scale start and end points from the center
        const startVector = {
          x: shape.startPoint.x - center.x,
          y: shape.startPoint.y - center.y
        };
        
        const endVector = {
          x: shape.endPoint.x - center.x,
          y: shape.endPoint.y - center.y
        };
        
        const newStartPoint = {
          x: center.x + startVector.x * scaleFactor,
          y: center.y + startVector.y * scaleFactor
        };
        
        const newEndPoint = {
          x: center.x + endVector.x * scaleFactor,
          y: center.y + endVector.y * scaleFactor
        };
        
        // Calculate new length
        const dx = newEndPoint.x - newStartPoint.x;
        const dy = newEndPoint.y - newStartPoint.y;
        const newLength = Math.sqrt(dx * dx + dy * dy);
        
        return {
          ...shape,
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

/**
 * Rotates a shape by a specified angle
 * @param shapes Array of shapes
 * @param shapeId ID of the shape to rotate
 * @param angle Rotation angle in radians
 * @returns New array with the rotated shape
 */
export const rotateShape = (shapes: AnyShape[], shapeId: string, angle: number): AnyShape[] => {
  if (!shapes || !Array.isArray(shapes) || shapes.length === 0) {
    return [];
  }
  
  if (typeof angle !== 'number' || isNaN(angle)) {
    return shapes;
  }
  
  const targetShape = findShapeById(shapes, shapeId);
  if (!targetShape) {
    return shapes;
  }
  
  return shapes.map(shape => {
    if (shape.id !== shapeId) {
      return shape;
    }
    
    // For all shapes, update the rotation property
    const rotatedShape = {
      ...shape,
      rotation: angle
    };
    
    // For lines, we also need to update the start and end points
    if (shape.type === 'line') {
      const center = calculateShapeCenter(shape);
      const angleInRadians = (angle * Math.PI) / 180;
      
      // Rotate start point
      const startDx = shape.startPoint.x - center.x;
      const startDy = shape.startPoint.y - center.y;
      const startRotatedX = center.x + startDx * Math.cos(angleInRadians) - startDy * Math.sin(angleInRadians);
      const startRotatedY = center.y + startDx * Math.sin(angleInRadians) + startDy * Math.cos(angleInRadians);
      
      // Rotate end point
      const endDx = shape.endPoint.x - center.x;
      const endDy = shape.endPoint.y - center.y;
      const endRotatedX = center.x + endDx * Math.cos(angleInRadians) - endDy * Math.sin(angleInRadians);
      const endRotatedY = center.y + endDx * Math.sin(angleInRadians) + endDy * Math.cos(angleInRadians);
      
      return {
        ...rotatedShape,
        startPoint: { x: startRotatedX, y: startRotatedY },
        endPoint: { x: endRotatedX, y: endRotatedY }
      };
    }
    
    return rotatedShape;
  });
}; 
