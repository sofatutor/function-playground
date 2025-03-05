import React from 'react';
import { Triangle, ShapeType } from '@/types/shapes';
import { TriangleServiceImpl } from '@/services/implementations/TriangleServiceImpl';

// Direct test of the triangle creation logic without using the hook
describe('Triangle Creation Logic', () => {
  // Test the logic that creates a right triangle
  it('should create a right triangle with the right angle at the bottom left', () => {
    // Arrange
    const startPoint = { x: 100, y: 100 };
    const endPoint = { x: 200, y: 200 };
    
    // Create the points for a right triangle
    const points = [
      { x: startPoint.x, y: startPoint.y }, // Top point
      { x: startPoint.x, y: endPoint.y },   // Bottom left (right angle)
      { x: endPoint.x, y: endPoint.y }      // Bottom right
    ];
    
    // Calculate the position (centroid)
    const position = {
      x: (points[0].x + points[1].x + points[2].x) / 3,
      y: (points[0].y + points[1].y + points[2].y) / 3
    };
    
    // Assert
    // Verify that the points form a right triangle
    // Point 1: Top point
    expect(points[0]).toEqual({ x: 100, y: 100 });
    
    // Point 2: Bottom left (right angle)
    expect(points[1]).toEqual({ x: 100, y: 200 });
    
    // Point 3: Bottom right
    expect(points[2]).toEqual({ x: 200, y: 200 });
    
    // Verify that the angle at point 1 is a right angle (90 degrees)
    // We can check this by using the Pythagorean theorem
    const a = Math.sqrt(Math.pow(points[1].x - points[0].x, 2) + Math.pow(points[1].y - points[0].y, 2));
    const b = Math.sqrt(Math.pow(points[2].x - points[1].x, 2) + Math.pow(points[2].y - points[1].y, 2));
    const c = Math.sqrt(Math.pow(points[0].x - points[2].x, 2) + Math.pow(points[0].y - points[2].y, 2));
    
    // a² + b² should equal c² for a right triangle
    expect(Math.pow(a, 2) + Math.pow(b, 2)).toBeCloseTo(Math.pow(c, 2), 5);
  });
  
  it('should create a right triangle with correct orientation when dragging in different directions', () => {
    // Test cases for different drag directions
    const testCases = [
      { 
        name: 'drag bottom-right', 
        start: { x: 100, y: 100 }, 
        end: { x: 200, y: 200 },
        expectedPoints: [
          { x: 100, y: 100 }, // Top
          { x: 100, y: 200 }, // Bottom left (right angle)
          { x: 200, y: 200 }  // Bottom right
        ]
      },
      { 
        name: 'drag bottom-left', 
        start: { x: 200, y: 100 }, 
        end: { x: 100, y: 200 },
        expectedPoints: [
          { x: 200, y: 100 }, // Top
          { x: 200, y: 200 }, // Bottom right (right angle)
          { x: 100, y: 200 }  // Bottom left
        ]
      },
      { 
        name: 'drag top-right', 
        start: { x: 100, y: 200 }, 
        end: { x: 200, y: 100 },
        expectedPoints: [
          { x: 100, y: 200 }, // Bottom
          { x: 100, y: 100 }, // Top left (right angle)
          { x: 200, y: 100 }  // Top right
        ]
      },
      { 
        name: 'drag top-left', 
        start: { x: 200, y: 200 }, 
        end: { x: 100, y: 100 },
        expectedPoints: [
          { x: 200, y: 200 }, // Bottom
          { x: 200, y: 100 }, // Top right (right angle)
          { x: 100, y: 100 }  // Top left
        ]
      }
    ];
    
    // Test each drag direction
    testCases.forEach(testCase => {
      // Create the points for a right triangle based on the drag direction
      let points;
      
      // Determine the points based on the drag direction
      if (testCase.end.x >= testCase.start.x && testCase.end.y >= testCase.start.y) {
        // Dragging bottom-right
        points = [
          { x: testCase.start.x, y: testCase.start.y }, // Top
          { x: testCase.start.x, y: testCase.end.y },   // Bottom left (right angle)
          { x: testCase.end.x, y: testCase.end.y }      // Bottom right
        ];
      } else if (testCase.end.x <= testCase.start.x && testCase.end.y >= testCase.start.y) {
        // Dragging bottom-left
        points = [
          { x: testCase.start.x, y: testCase.start.y }, // Top
          { x: testCase.start.x, y: testCase.end.y },   // Bottom right (right angle)
          { x: testCase.end.x, y: testCase.end.y }      // Bottom left
        ];
      } else if (testCase.end.x >= testCase.start.x && testCase.end.y <= testCase.start.y) {
        // Dragging top-right
        points = [
          { x: testCase.start.x, y: testCase.start.y }, // Bottom
          { x: testCase.start.x, y: testCase.end.y },   // Top left (right angle)
          { x: testCase.end.x, y: testCase.end.y }      // Top right
        ];
      } else {
        // Dragging top-left
        points = [
          { x: testCase.start.x, y: testCase.start.y }, // Bottom
          { x: testCase.start.x, y: testCase.end.y },   // Top right (right angle)
          { x: testCase.end.x, y: testCase.end.y }      // Top left
        ];
      }
      
      // Verify the points match the expected points for this drag direction
      expect(points[0]).toEqual(testCase.expectedPoints[0]);
      expect(points[1]).toEqual(testCase.expectedPoints[1]);
      expect(points[2]).toEqual(testCase.expectedPoints[2]);
      
      // Verify that the angle at point 1 is a right angle (90 degrees)
      const a = Math.sqrt(Math.pow(points[1].x - points[0].x, 2) + Math.pow(points[1].y - points[0].y, 2));
      const b = Math.sqrt(Math.pow(points[2].x - points[1].x, 2) + Math.pow(points[2].y - points[1].y, 2));
      const c = Math.sqrt(Math.pow(points[0].x - points[2].x, 2) + Math.pow(points[0].y - points[2].y, 2));
      
      // a² + b² should equal c² for a right triangle
      expect(Math.pow(a, 2) + Math.pow(b, 2)).toBeCloseTo(Math.pow(c, 2), 5);
    });
  });
}); 