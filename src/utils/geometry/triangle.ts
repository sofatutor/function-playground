import { Point, Triangle } from '@/types/shapes';
import { distanceBetweenPoints } from './common';

export const calculateTriangleArea = (points: [Point, Point, Point]): number => {
  const [a, b, c] = points;
  return 0.5 * Math.abs((a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)));
};

// Helper function to calculate triangle height
export const calculateTriangleHeight = (points: [Point, Point, Point]): number => {
  // Calculate the area
  const area = calculateTriangleArea(points);
  
  // Calculate side lengths
  const side1 = distanceBetweenPoints(points[0], points[1]);
  const side2 = distanceBetweenPoints(points[1], points[2]);
  const side3 = distanceBetweenPoints(points[2], points[0]);
  
  // Find the longest side
  const longestSide = Math.max(side1, side2, side3);
  
  // Calculate height from the longest side as base
  return (2 * area) / longestSide;
};

// Helper function to calculate triangle perimeter
export const calculateTrianglePerimeter = (points: [Point, Point, Point]): number => {
  return (
    distanceBetweenPoints(points[0], points[1]) +
    distanceBetweenPoints(points[1], points[2]) +
    distanceBetweenPoints(points[2], points[0])
  );
};

// Helper function to calculate triangle angles in degrees
export const calculateTriangleAngles = (a: number, b: number, c: number): [number, number, number] => {
  // Law of cosines: cos(A) = (b² + c² - a²) / (2bc)
  // Angle A is opposite to side a, angle B is opposite to side b, angle C is opposite to side c
  
  // Ensure we don't get NaN due to floating point errors
  const clamp = (val: number): number => Math.max(-1, Math.min(1, val));
  
  // Calculate angles using the law of cosines
  // Angle at vertex 0 (between sides c and b)
  const angleA = Math.acos(clamp((b * b + c * c - a * a) / (2 * b * c))) * (180 / Math.PI);
  
  // Angle at vertex 1 (between sides a and c)
  const angleB = Math.acos(clamp((a * a + c * c - b * b) / (2 * a * c))) * (180 / Math.PI);
  
  // Angle at vertex 2 (between sides a and b)
  const angleC = Math.acos(clamp((a * a + b * b - c * c) / (2 * a * b))) * (180 / Math.PI);
  
  // Ensure the sum is exactly 180°
  const sum = angleA + angleB + angleC;
  const scaleFactor = 180 / sum;
  
  return [
    angleA * scaleFactor,
    angleB * scaleFactor,
    angleC * scaleFactor
  ];
};

// Helper function to update triangle from side length
export const updateTriangleFromSideLength = (
  shape: Triangle,
  sideIndex: number,
  newLength: number
): Triangle => {
  // Get the current side length
  const p1 = shape.points[sideIndex];
  const p2 = shape.points[(sideIndex + 1) % 3];
  const currentLength = distanceBetweenPoints(p1, p2);
  
  // Calculate the scale factor
  const scaleFactor = newLength / currentLength;
  
  // Scale the triangle from its center
  const center = shape.position;
  const newPoints = shape.points.map(point => ({
    x: center.x + (point.x - center.x) * scaleFactor,
    y: center.y + (point.y - center.y) * scaleFactor
  })) as [Point, Point, Point];
  
  return {
    ...shape,
    points: newPoints
  };
};

// Helper function to update triangle points based on a changed angle
export const updateTriangleFromAngle = (
  points: [Point, Point, Point],
  angleIndex: number,
  newAngleDegrees: number,
  currentAngles: [number, number, number]
): [Point, Point, Point] => {
  // Calculate side lengths
  const sides = [
    distanceBetweenPoints(points[1], points[2]), // side a (opposite to vertex 0)
    distanceBetweenPoints(points[0], points[2]), // side b (opposite to vertex 1)
    distanceBetweenPoints(points[0], points[1]), // side c (opposite to vertex 2)
  ];
  
  // Store the original triangle properties
  const originalPoints = [...points] as [Point, Point, Point];
  const originalCenter = {
    x: (originalPoints[0].x + originalPoints[1].x + originalPoints[2].x) / 3,
    y: (originalPoints[0].y + originalPoints[1].y + originalPoints[2].y) / 3
  };
  
  // Calculate the average side length to maintain approximate size
  const avgSideLength = (sides[0] + sides[1] + sides[2]) / 3;
  const originalPerimeter = sides[0] + sides[1] + sides[2];
  
  // Create a new array of angles
  const newAngles: [number, number, number] = [...currentAngles];
  
  // Set the new value for the angle we're changing
  newAngles[angleIndex] = newAngleDegrees;
  
  // When changing angle 1, adjust angle 2 (and angle 3 gets the remainder)
  // When changing angle 2, adjust angle 3 (and angle 1 gets the remainder)
  // When changing angle 3, adjust angle 1 (and angle 2 gets the remainder)
  const adjustIndex = (angleIndex + 1) % 3;
  const thirdIndex = (angleIndex + 2) % 3;
  
  // Calculate the difference
  const angleDiff = newAngleDegrees - currentAngles[angleIndex];
  
  // Adjust the second angle by the opposite of the difference
  newAngles[adjustIndex] = Math.max(1, Math.min(178, currentAngles[adjustIndex] - angleDiff));
  
  // The third angle is whatever is needed to make the sum 180
  newAngles[thirdIndex] = 180 - newAngles[angleIndex] - newAngles[adjustIndex];
  
  // Convert angles to radians
  const angleRads = newAngles.map(a => a * (Math.PI / 180));
  
  // Initialize points
  let p0: Point = { x: 0, y: 0 };
  let p1: Point = { x: 0, y: 0 };
  let p2: Point = { x: 0, y: 0 };
  
  if (angleIndex === 0) {
    // If we're changing angle 0, put it at the origin
    // Place p1 at a fixed distance along the x-axis
    p0 = { x: 0, y: 0 };
    p1 = { x: avgSideLength, y: 0 };
    
    // Place p2 to create the desired angle at p0
    const angle0 = angleRads[0];
    p2 = { 
      x: avgSideLength * Math.cos(angle0), 
      y: avgSideLength * Math.sin(angle0) 
    };
  } 
  else if (angleIndex === 1) {
    // If we're changing angle 1, put it at the origin
    // Place p0 at a fixed distance along the x-axis
    p1 = { x: 0, y: 0 };
    p0 = { x: avgSideLength, y: 0 };
    
    // Place p2 to create the desired angle at p1
    const angle1 = angleRads[1];
    p2 = { 
      x: avgSideLength * Math.cos(angle1), 
      y: avgSideLength * Math.sin(angle1) 
    };
  }
  else { // angleIndex === 2
    // If we're changing angle 2, put it at the origin
    // Place p0 at a fixed distance along the x-axis
    p2 = { x: 0, y: 0 };
    p0 = { x: avgSideLength, y: 0 };
    
    // Place p1 to create the desired angle at p2
    const angle2 = angleRads[2];
    p1 = { 
      x: avgSideLength * Math.cos(angle2), 
      y: avgSideLength * Math.sin(angle2) 
    };
  }
  
  // Calculate the center of our new triangle
  const newCenter = {
    x: (p0.x + p1.x + p2.x) / 3,
    y: (p0.y + p1.y + p2.y) / 3
  };
  
  // Calculate the new perimeter
  const newSides = [
    distanceBetweenPoints(p1, p2),
    distanceBetweenPoints(p0, p2),
    distanceBetweenPoints(p0, p1)
  ];
  const newPerimeter = newSides[0] + newSides[1] + newSides[2];
  
  // Calculate the scale factor to maintain the original perimeter
  const scaleFactor = originalPerimeter / newPerimeter;
  
  // Scale and translate the points to match the original center and size
  const finalPoints: [Point, Point, Point] = [
    { 
      x: originalCenter.x + (p0.x - newCenter.x) * scaleFactor, 
      y: originalCenter.y + (p0.y - newCenter.y) * scaleFactor 
    },
    { 
      x: originalCenter.x + (p1.x - newCenter.x) * scaleFactor, 
      y: originalCenter.y + (p1.y - newCenter.y) * scaleFactor 
    },
    { 
      x: originalCenter.x + (p2.x - newCenter.x) * scaleFactor, 
      y: originalCenter.y + (p2.y - newCenter.y) * scaleFactor 
    }
  ];
  
  return finalPoints;
}; 