import { ShapeType, Point, AnyShape, Circle, Rectangle, Triangle } from '@/types/shapes';
import { generateId, distanceBetweenPoints, DEFAULT_FILL, DEFAULT_STROKE, DEFAULT_STROKE_WIDTH } from './common';

export const createShape = (
  startPoint: Point, 
  endPoint: Point, 
  activeShapeType: ShapeType
): AnyShape => {
  const id = generateId();
  
  switch (activeShapeType) {
    case 'circle': {
      const radius = distanceBetweenPoints(startPoint, endPoint);
      return {
        id,
        type: 'circle',
        position: { ...startPoint },
        radius,
        rotation: 0,
        selected: true,
        fill: DEFAULT_FILL,
        stroke: DEFAULT_STROKE,
        strokeWidth: DEFAULT_STROKE_WIDTH
      };
    }
    case 'rectangle': {
      const width = Math.abs(endPoint.x - startPoint.x);
      const height = Math.abs(endPoint.y - startPoint.y);
      const position = {
        x: Math.min(startPoint.x, endPoint.x),
        y: Math.min(startPoint.y, endPoint.y)
      };
      return {
        id,
        type: 'rectangle',
        position,
        width,
        height,
        rotation: 0,
        selected: true,
        fill: DEFAULT_FILL,
        stroke: DEFAULT_STROKE,
        strokeWidth: DEFAULT_STROKE_WIDTH
      };
    }
    case 'triangle': {
      // Create a true right-angled triangle with a 90-degree angle at the top
      
      // Calculate the width based on the horizontal distance
      const width = Math.abs(endPoint.x - startPoint.x) * 1.2;
      
      // Determine the direction of the drag (left-to-right or right-to-left)
      const isRightward = endPoint.x >= startPoint.x;
      
      // Calculate the midpoint between start and end points (horizontal only)
      const midX = (startPoint.x + endPoint.x) / 2;
      const topY = Math.min(startPoint.y, endPoint.y) - width/4;
      
      // Create the right angle at the top point (p1)
      const p1 = { 
        x: midX,
        y: topY
      }; // Top point with right angle
      
      // Create the other two points to form a right-angled triangle
      // For a right angle at p1, we need the vectors p1->p2 and p1->p3 to be perpendicular
      
      // Point directly below p1
      const p2 = {
        x: midX,
        y: topY + width
      };
      
      // Point to the right or left of p1 depending on drag direction
      const p3 = {
        x: isRightward ? midX + width : midX - width,
        y: topY
      };
      
      // The position is the center of the triangle
      const position = {
        x: (p1.x + p2.x + p3.x) / 3,
        y: (p1.y + p2.y + p3.y) / 3
      };
      
      return {
        id,
        type: 'triangle',
        position,
        points: [p1, p2, p3],
        rotation: 0,
        selected: true,
        fill: DEFAULT_FILL,
        stroke: DEFAULT_STROKE,
        strokeWidth: DEFAULT_STROKE_WIDTH
      };
    }
    default:
      throw new Error(`Unsupported shape type: ${activeShapeType}`);
  }
}; 