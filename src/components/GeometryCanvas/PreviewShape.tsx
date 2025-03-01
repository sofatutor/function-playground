import React from 'react';
import { Point, ShapeType } from '@/types/shapes';

interface PreviewShapeProps {
  isDrawing: boolean;
  drawStart: Point | null;
  drawCurrent: Point | null;
  activeShapeType: ShapeType;
}

const PreviewShape: React.FC<PreviewShapeProps> = ({
  isDrawing,
  drawStart,
  drawCurrent,
  activeShapeType
}) => {
  if (!isDrawing || !drawStart || !drawCurrent) return null;
  
  const minX = Math.min(drawStart.x, drawCurrent.x);
  const minY = Math.min(drawStart.y, drawCurrent.y);
  const width = Math.abs(drawCurrent.x - drawStart.x);
  const height = Math.abs(drawCurrent.y - drawStart.y);
  
  switch (activeShapeType) {
    case 'circle': {
      const radius = Math.sqrt(
        Math.pow(drawCurrent.x - drawStart.x, 2) + 
        Math.pow(drawCurrent.y - drawStart.y, 2)
      );
      return (
        <div
          className="absolute rounded-full border-2 border-dashed"
          style={{
            left: drawStart.x - radius,
            top: drawStart.y - radius,
            width: radius * 2,
            height: radius * 2,
            borderColor: 'rgba(85, 91, 110, 0.6)',
            backgroundColor: 'rgba(190, 227, 219, 0.2)',
            zIndex: 1
          }}
        />
      );
    }
    case 'rectangle':
      return (
        <div
          className="absolute border-2 border-dashed"
          style={{
            left: minX,
            top: minY,
            width,
            height,
            borderColor: 'rgba(85, 91, 110, 0.6)',
            backgroundColor: 'rgba(190, 227, 219, 0.2)',
            zIndex: 1
          }}
        />
      );
    case 'triangle': {
      // Create a true right-angled triangle with a 90-degree angle at the top
      
      // Calculate the width based on the horizontal distance
      const width = Math.abs(drawCurrent.x - drawStart.x) * 1.2;
      
      // Determine the direction of the drag (left-to-right or right-to-left)
      const isRightward = drawCurrent.x >= drawStart.x;
      
      // Calculate the midpoint between start and end points (horizontal only)
      const midX = (drawStart.x + drawCurrent.x) / 2;
      const topY = Math.min(drawStart.y, drawCurrent.y) - width/4;
      
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
      
      // Calculate bounding box
      const boxMinX = Math.min(p1.x, p2.x, p3.x);
      const boxMinY = Math.min(p1.y, p2.y, p3.y);
      const boxMaxX = Math.max(p1.x, p2.x, p3.x);
      const boxMaxY = Math.max(p1.y, p2.y, p3.y);
      
      const boxWidth = boxMaxX - boxMinX;
      const boxHeight = boxMaxY - boxMinY;
      
      // Create SVG path for the triangle
      const pathData = `
        M ${p1.x - boxMinX} ${p1.y - boxMinY}
        L ${p2.x - boxMinX} ${p2.y - boxMinY}
        L ${p3.x - boxMinX} ${p3.y - boxMinY}
        Z
      `;
      
      return (
        <div
          className="absolute"
          style={{
            left: boxMinX,
            top: boxMinY,
            width: boxWidth,
            height: boxHeight,
            zIndex: 1
          }}
        >
          <svg width={boxWidth} height={boxHeight}>
            <path
              d={pathData}
              fill="rgba(190, 227, 219, 0.2)"
              stroke="rgba(85, 91, 110, 0.6)"
              strokeWidth={2}
              strokeDasharray="5,5"
            />
          </svg>
        </div>
      );
    }
    default:
      return null;
  }
};

export default PreviewShape; 