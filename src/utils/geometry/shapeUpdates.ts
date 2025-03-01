import { AnyShape, Circle, Rectangle, Triangle, Point } from '@/types/shapes';
import { updateTriangleFromSideLength, updateTriangleFromAngle, calculateTriangleAngles } from './triangle';
import { distanceBetweenPoints } from './common';

// Update shape based on measurement changes
export const updateShapeFromMeasurement = (
  shape: AnyShape,
  measurementKey: string,
  newValue: number,
  valueInPixels: number
): AnyShape => {
  switch (shape.type) {
    case 'circle': {
      if (measurementKey === 'radius') {
        return {
          ...shape,
          radius: valueInPixels
        };
      } else if (measurementKey === 'diameter') {
        return {
          ...shape,
          radius: valueInPixels / 2
        };
      } else if (measurementKey === 'circumference') {
        // C = 2πr, so r = C/(2π)
        return {
          ...shape,
          radius: valueInPixels / (2 * Math.PI)
        };
      } else if (measurementKey === 'area') {
        // A = πr², so r = √(A/π)
        return {
          ...shape,
          radius: Math.sqrt(valueInPixels / Math.PI)
        };
      }
      break;
    }
    case 'rectangle': {
      if (measurementKey === 'width') {
        return {
          ...shape,
          width: valueInPixels
        };
      } else if (measurementKey === 'height') {
        return {
          ...shape,
          height: valueInPixels
        };
      } else if (measurementKey === 'area') {
        // For area, we'll maintain the aspect ratio
        const aspectRatio = shape.width / shape.height;
        const newHeight = Math.sqrt(valueInPixels / aspectRatio);
        const newWidth = newHeight * aspectRatio;
        return {
          ...shape,
          width: newWidth,
          height: newHeight
        };
      } else if (measurementKey === 'perimeter') {
        // For perimeter, we'll maintain the aspect ratio
        const aspectRatio = shape.width / shape.height;
        // P = 2w + 2h, with w = aspectRatio * h
        // P = 2(aspectRatio * h) + 2h = 2h(aspectRatio + 1)
        // h = P / (2(aspectRatio + 1))
        const newHeight = valueInPixels / (2 * (aspectRatio + 1));
        const newWidth = aspectRatio * newHeight;
        return {
          ...shape,
          width: newWidth,
          height: newHeight
        };
      } else if (measurementKey === 'diagonal') {
        // For diagonal, we'll maintain the aspect ratio
        // d² = w² + h², with w = aspectRatio * h
        // d² = (aspectRatio * h)² + h² = h²(aspectRatio² + 1)
        // h = d / √(aspectRatio² + 1)
        const aspectRatio = shape.width / shape.height;
        const newHeight = valueInPixels / Math.sqrt(aspectRatio * aspectRatio + 1);
        const newWidth = aspectRatio * newHeight;
        return {
          ...shape,
          width: newWidth,
          height: newHeight
        };
      }
      break;
    }
    case 'triangle': {
      // Handle side length updates
      if (measurementKey === 'side1' || measurementKey === 'side2' || measurementKey === 'side3') {
        const sideIndex = parseInt(measurementKey.slice(-1)) - 1;
        return updateTriangleFromSideLength(shape as Triangle, sideIndex, valueInPixels);
      }
      // Handle angle updates
      else if (measurementKey === 'angle1' || measurementKey === 'angle2' || measurementKey === 'angle3') {
        // Ensure the angle value is an integer
        const intAngleValue = Math.round(newValue);
        
        // Validate the angle is within range
        if (intAngleValue <= 0 || intAngleValue >= 180) {
          return shape;
        }
        
        // Get the angle index (0, 1, or 2)
        const angleIndex = parseInt(measurementKey.slice(-1)) - 1;
        
        // Calculate the current side lengths
        const sides = [
          distanceBetweenPoints(shape.points[1], shape.points[2]),
          distanceBetweenPoints(shape.points[0], shape.points[2]),
          distanceBetweenPoints(shape.points[0], shape.points[1])
        ];
        
        // Calculate the current angles
        const currentAngles = calculateTriangleAngles(
          sides[0],
          sides[1],
          sides[2]
        ).map(a => Math.round(a)) as [number, number, number];
        
        // Update the triangle points based on the new angle
        const newPoints = updateTriangleFromAngle(
          shape.points,
          angleIndex,
          intAngleValue,
          currentAngles
        );
        
        return {
          ...shape,
          points: newPoints
        };
      }
      // Handle area updates
      else if (measurementKey === 'area') {
        // For area, we'll scale the triangle uniformly
        const currentArea = calculateTriangleArea(shape.points);
        const scaleFactor = Math.sqrt(valueInPixels / currentArea);
        
        // Scale the points from the center
        const center = {
          x: (shape.points[0].x + shape.points[1].x + shape.points[2].x) / 3,
          y: (shape.points[0].y + shape.points[1].y + shape.points[2].y) / 3
        };
        
        const newPoints: [Point, Point, Point] = shape.points.map(point => ({
          x: center.x + (point.x - center.x) * scaleFactor,
          y: center.y + (point.y - center.y) * scaleFactor
        })) as [Point, Point, Point];
        
        return {
          ...shape,
          points: newPoints
        };
      }
      // Handle perimeter updates
      else if (measurementKey === 'perimeter') {
        // For perimeter, we'll scale the triangle uniformly
        const currentPerimeter = calculateTrianglePerimeter(shape.points);
        const scaleFactor = valueInPixels / currentPerimeter;
        
        // Scale the points from the center
        const center = {
          x: (shape.points[0].x + shape.points[1].x + shape.points[2].x) / 3,
          y: (shape.points[0].y + shape.points[1].y + shape.points[2].y) / 3
        };
        
        const newPoints: [Point, Point, Point] = shape.points.map(point => ({
          x: center.x + (point.x - center.x) * scaleFactor,
          y: center.y + (point.y - center.y) * scaleFactor
        })) as [Point, Point, Point];
        
        return {
          ...shape,
          points: newPoints
        };
      }
      break;
    }
  }
  
  // If we get here, we didn't handle the measurement update
  console.warn(`Unhandled measurement update: ${measurementKey} for shape type ${shape.type}`);
  return shape;
};

// Helper function to calculate triangle area
const calculateTriangleArea = (points: [Point, Point, Point]): number => {
  const [a, b, c] = points;
  return 0.5 * Math.abs((a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)));
};

// Helper function to calculate triangle perimeter
const calculateTrianglePerimeter = (points: [Point, Point, Point]): number => {
  return (
    distanceBetweenPoints(points[0], points[1]) +
    distanceBetweenPoints(points[1], points[2]) +
    distanceBetweenPoints(points[2], points[0])
  );
}; 