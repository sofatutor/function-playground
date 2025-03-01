import React from 'react';
import { Point, OperationMode, ShapeType } from '@/types/shapes';

interface PreviewShapeProps {
  isDrawing: boolean;
  drawStart: Point | null;
  drawCurrent: Point | null;
  currentShapeType: ShapeType;
  activeMode: OperationMode;
}

const PreviewShape: React.FC<PreviewShapeProps> = ({
  isDrawing,
  drawStart,
  drawCurrent,
  currentShapeType,
  activeMode
}) => {
  if (!isDrawing || !drawStart || !drawCurrent) return null;
  
  const minX = Math.min(drawStart.x, drawCurrent.x);
  const minY = Math.min(drawStart.y, drawCurrent.y);
  const width = Math.abs(drawCurrent.x - drawStart.x);
  const height = Math.abs(drawCurrent.y - drawStart.y);

  if (activeMode === 'create') {
    switch (currentShapeType) {
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
              backgroundColor: 'rgba(190, 227, 219, 0.2)'
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
              backgroundColor: 'rgba(190, 227, 219, 0.2)'
            }}
          />
        );
      case 'triangle': {
        // Create a right-angled triangle to match the one created in useShapeOperations
        const distance = Math.sqrt(
          Math.pow(drawCurrent.x - drawStart.x, 2) + 
          Math.pow(drawCurrent.y - drawStart.y, 2)
        );
        const angle = Math.atan2(drawCurrent.y - drawStart.y, drawCurrent.x - drawStart.x);
        
        // First point (start point)
        const p1 = drawStart;
        // Second point (end point)
        const p2 = {
          x: drawStart.x + distance * Math.cos(angle),
          y: drawStart.y + distance * Math.sin(angle)
        };
        // Third point (perpendicular to create right angle at p1)
        const p3 = {
          x: drawStart.x + distance * Math.sin(angle), // Use sin for x to create perpendicular direction
          y: drawStart.y - distance * Math.cos(angle)  // Use negative cos for y to create perpendicular direction
        };
        
        const boxMinX = Math.min(p1.x, p2.x, p3.x);
        const boxMinY = Math.min(p1.y, p2.y, p3.y);
        const boxMaxX = Math.max(p1.x, p2.x, p3.x);
        const boxMaxY = Math.max(p1.y, p2.y, p3.y);
        const boxWidth = boxMaxX - boxMinX;
        const boxHeight = boxMaxY - boxMinY;
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
              height: boxHeight
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
  }
  return null;
};

export default PreviewShape;
