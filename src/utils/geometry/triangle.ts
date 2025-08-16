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
  // Store the original triangle properties
  const originalPoints = [...points] as [Point, Point, Point];
  const originalCenter = {
    x: (originalPoints[0].x + originalPoints[1].x + originalPoints[2].x) / 3,
    y: (originalPoints[0].y + originalPoints[1].y + originalPoints[2].y) / 3
  };
  
  // Map UI angle index to internal vertex index
  // angle1 (UI index 0) -> vertex 2
  // angle2 (UI index 1) -> vertex 0
  // angle3 (UI index 2) -> vertex 1
  const vertexIndexMap = [2, 0, 1];
  const vertexIndex = vertexIndexMap[angleIndex];
  
  // Get the vertex and adjacent points based on the vertex index
  const vertex = originalPoints[vertexIndex];
  const adjacent1 = originalPoints[(vertexIndex + 1) % 3];
  const adjacent2 = originalPoints[(vertexIndex + 2) % 3];
  
  // Calculate vectors from vertex to adjacent points
  const vector1 = { 
    x: adjacent1.x - vertex.x, 
    y: adjacent1.y - vertex.y 
  };
  const vector2 = { 
    x: adjacent2.x - vertex.x, 
    y: adjacent2.y - vertex.y 
  };
  
  // Calculate lengths of vectors
  const length1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
  const length2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);
  
  // Calculate the current angle between the vectors
  // Using the dot product formula: cos(θ) = (v1·v2) / (|v1|·|v2|)
  const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;
  const _currentAngle = Math.acos(Math.max(-1, Math.min(1, dotProduct / (length1 * length2))));
  
  // Convert the target angle to radians
  const targetAngle = newAngleDegrees * (Math.PI / 180);
  
  // We'll keep vector1 fixed and rotate vector2 to achieve the desired angle
  // First, normalize vector1 to make calculations easier
  const normalizedVector1 = {
    x: vector1.x / length1,
    y: vector1.y / length1
  };
  
  // Calculate the angle between vector1 and the positive x-axis
  const vector1Angle = Math.atan2(normalizedVector1.y, normalizedVector1.x);
  
  // Check if we're currently moving counterclockwise from vector1 to vector2
  const crossProduct = vector1.x * vector2.y - vector1.y * vector2.x;
  const isCounterclockwise = crossProduct > 0;
  
  // Calculate the new angle for vector2
  let newVector2Angle;
  if (isCounterclockwise) {
    newVector2Angle = vector1Angle + targetAngle;
  } else {
    newVector2Angle = vector1Angle - targetAngle;
  }
  
  // Create the new normalized vector2
  const newNormalizedVector2 = {
    x: Math.cos(newVector2Angle),
    y: Math.sin(newVector2Angle)
  };
  
  // Scale it back to the original length
  const newVector2 = {
    x: newNormalizedVector2.x * length2,
    y: newNormalizedVector2.y * length2
  };
  
  // Calculate the new position for adjacent2
  const newAdjacent2 = {
    x: vertex.x + newVector2.x,
    y: vertex.y + newVector2.y
  };
  
  // Create the new triangle points
  const newPoints: [Point, Point, Point] = [...originalPoints] as [Point, Point, Point];
  newPoints[(vertexIndex + 2) % 3] = newAdjacent2;
  
  // Calculate the new center of the triangle
  const newCenter = {
    x: (newPoints[0].x + newPoints[1].x + newPoints[2].x) / 3,
    y: (newPoints[0].y + newPoints[1].y + newPoints[2].y) / 3
  };
  
  // Translate the triangle to maintain the original center
  const dx = originalCenter.x - newCenter.x;
  const dy = originalCenter.y - newCenter.y;
  
  const finalPoints: [Point, Point, Point] = newPoints.map(p => ({
    x: p.x + dx,
    y: p.y + dy
  })) as [Point, Point, Point];
  
  // Calculate the final angles to verify
  const finalSides = [
    distanceBetweenPoints(finalPoints[1], finalPoints[2]),
    distanceBetweenPoints(finalPoints[0], finalPoints[2]),
    distanceBetweenPoints(finalPoints[0], finalPoints[1])
  ];
  
  const finalAngles = calculateTriangleAngles(
    finalSides[0],
    finalSides[1],
    finalSides[2]
  ).map(a => Math.round(a));
  
  // If the angle is still not close to the target, try a more direct approach
  if (Math.abs(finalAngles[angleIndex] - newAngleDegrees) > 5) {
    // Create a completely new triangle with the desired angle
    // We'll use the Law of Sines to calculate the new side lengths
    
    // Create a new array of angles
    const newAnglesArray: [number, number, number] = [...currentAngles];
    newAnglesArray[angleIndex] = newAngleDegrees;
    
    // Adjust the other angles to maintain 180 degrees
    const otherIndices = [0, 1, 2].filter(i => i !== angleIndex);
    const remainingAngleSum = 180 - newAngleDegrees;
    
    // Maintain the proportion between the other two angles
    const originalOtherSum = currentAngles[otherIndices[0]] + currentAngles[otherIndices[1]];
    const ratio0 = currentAngles[otherIndices[0]] / originalOtherSum;
    const _ratio1 = currentAngles[otherIndices[1]] / originalOtherSum;
    
    newAnglesArray[otherIndices[0]] = Math.max(1, Math.min(178, remainingAngleSum * ratio0));
    newAnglesArray[otherIndices[1]] = 180 - newAngleDegrees - newAnglesArray[otherIndices[0]];
    
    // Convert to radians
    const anglesInRadians = newAnglesArray.map(a => a * (Math.PI / 180));
    
    // Calculate new side lengths using the Law of Sines
    // a/sin(A) = b/sin(B) = c/sin(C)
    const sinA = Math.sin(anglesInRadians[0]);
    const sinB = Math.sin(anglesInRadians[1]);
    const sinC = Math.sin(anglesInRadians[2]);
    
    // Keep one side fixed (e.g., side1) and calculate the others
    const side1 = finalSides[0];
    const side2 = (side1 * sinB) / sinA;
    const side3 = (side1 * sinC) / sinA;
    
    // Reconstruct the triangle with these side lengths
    // Place the first point at the origin
    const p0 = { x: 0, y: 0 };
    
    // Place the second point along the x-axis
    const p1 = { x: side3, y: 0 };
    
    // Calculate the position of the third point using the Law of Cosines
    const angleC = anglesInRadians[2];
    const x2 = side2 * Math.cos(angleC);
    const y2 = side2 * Math.sin(angleC);
    const p2 = { x: x2, y: y2 };
    
    // Create the new triangle
    const reconstructedPoints: [Point, Point, Point] = [p0, p1, p2];
    
    // Calculate the center of the reconstructed triangle
    const reconstructedCenter = {
      x: (p0.x + p1.x + p2.x) / 3,
      y: (p0.y + p1.y + p2.y) / 3
    };
    
    // Translate and scale to match the original center and size
    const reconstructedFinalPoints: [Point, Point, Point] = reconstructedPoints.map(p => ({
      x: originalCenter.x + (p.x - reconstructedCenter.x),
      y: originalCenter.y + (p.y - reconstructedCenter.y)
    })) as [Point, Point, Point];
    
    // Verify the reconstructed angles
    const reconstructedSides = [
      distanceBetweenPoints(reconstructedFinalPoints[1], reconstructedFinalPoints[2]),
      distanceBetweenPoints(reconstructedFinalPoints[0], reconstructedFinalPoints[2]),
      distanceBetweenPoints(reconstructedFinalPoints[0], reconstructedFinalPoints[1])
    ];
    
    const reconstructedAngles = calculateTriangleAngles(
      reconstructedSides[0],
      reconstructedSides[1],
      reconstructedSides[2]
    ).map(a => Math.round(a));
    
    // Use the reconstructed triangle if it's closer to the target angle
    if (Math.abs(reconstructedAngles[angleIndex] - newAngleDegrees) < Math.abs(finalAngles[angleIndex] - newAngleDegrees)) {
      return reconstructedFinalPoints;
    }
  }
  
  return finalPoints;
}; 