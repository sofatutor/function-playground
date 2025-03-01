import { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  AnyShape, Circle, Rectangle, Triangle, Point, ShapeType, OperationMode, MeasurementUnit
} from '@/types/shapes';
import { toast } from 'sonner';

// Helper functions for shape calculations
const generateId = (): string => Math.random().toString(36).substring(2, 9);

const distanceBetweenPoints = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

const calculateTriangleArea = (points: [Point, Point, Point]): number => {
  const [a, b, c] = points;
  return 0.5 * Math.abs((a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)));
};

// Helper function to calculate triangle height
const calculateTriangleHeight = (points: [Point, Point, Point], base: number): number => {
  // Area = 0.5 * base * height, so height = 2 * area / base
  const area = calculateTriangleArea(points);
  return (2 * area) / base;
};

// Helper function to calculate triangle angles in degrees
const calculateTriangleAngles = (a: number, b: number, c: number): [number, number, number] => {
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

// Helper function to update triangle points based on a changed angle
const updateTriangleFromAngle = (
  points: [Point, Point, Point],
  angleIndex: number,
  newAngleDegrees: number,
  currentAngles: [number, number, number]
): [Point, Point, Point] => {
  console.log(`Updating angle ${angleIndex} to ${newAngleDegrees}°`);
  console.log(`Current angles: ${currentAngles.map(a => Math.round(a)).join(', ')}`);
  
  // Make a copy of the original points
  const originalPoints = [...points] as [Point, Point, Point];
  
  // Calculate side lengths
  const sides = [
    distanceBetweenPoints(points[1], points[2]), // side a (opposite to vertex 0)
    distanceBetweenPoints(points[0], points[2]), // side b (opposite to vertex 1)
    distanceBetweenPoints(points[0], points[1]), // side c (opposite to vertex 2)
  ];
  
  // Calculate the new angles
  const newAngles: [number, number, number] = [...currentAngles];
  
  // Important: We need to update the correct angle index
  // angleIndex is the index of the angle we want to change (0, 1, or 2)
  newAngles[angleIndex] = newAngleDegrees;
  
  // Adjust the other two angles to maintain 180° sum
  const otherIndices = [0, 1, 2].filter(i => i !== angleIndex);
  const remainingAngle = 180 - newAngleDegrees;
  
  // Distribute the remaining angle proportionally to the other two angles
  const ratio = currentAngles[otherIndices[0]] / (currentAngles[otherIndices[0]] + currentAngles[otherIndices[1]]);
  newAngles[otherIndices[0]] = Math.round(remainingAngle * ratio);
  newAngles[otherIndices[1]] = 180 - newAngleDegrees - newAngles[otherIndices[0]];
  
  console.log(`New angles: ${newAngles.map(a => Math.round(a)).join(', ')}`);
  
  // We'll keep the vertex at the angleIndex fixed and recalculate the positions of the other two
  const newPoints: [Point, Point, Point] = [...points] as [Point, Point, Point];
  
  // Convert angles to radians for calculations
  const angleRads = newAngles.map(a => a * (Math.PI / 180));
  
  // Keep the vertex at angleIndex fixed
  if (angleIndex === 0) {
    // If we're changing angle at vertex 0, keep that vertex fixed
    // and recalculate positions of vertices 1 and 2
    
    // Calculate new position for vertex 1
    // We'll keep the distance between vertex 0 and 1 the same
    const distC = sides[2]; // side c between vertices 0 and 1
    
    // The angle at vertex 0 is the angle we're changing
    const angle0Rad = newAngleDegrees * (Math.PI / 180);
    
    // Calculate the new position for vertex 1
    newPoints[1] = {
      x: points[0].x + distC * Math.cos(angle0Rad),
      y: points[0].y + distC * Math.sin(angle0Rad)
    };
    
    // Calculate the new position for vertex 2
    // We need to ensure the angle at vertex 0 is exactly newAngleDegrees
    // and the angle at vertex 1 is newAngles[1]
    
    // Calculate the angle for the third vertex
    const angle1Rad = newAngles[1] * (Math.PI / 180);
    const totalAngle = Math.PI - angle0Rad - angle1Rad;
    
    // Calculate the new position for vertex 2
    // We'll use the law of sines to determine the distance
    const distB = sides[1]; // side b between vertices 0 and 2
    
    newPoints[2] = {
      x: points[0].x + distB * Math.cos(totalAngle),
      y: points[0].y + distB * Math.sin(totalAngle)
    };
  } else if (angleIndex === 1) {
    // If we're changing angle at vertex 1, keep that vertex fixed
    // and recalculate positions of vertices 0 and 2
    
    // Calculate new position for vertex 0
    // We'll keep the distance between vertex 1 and 0 the same
    const distC = sides[2]; // side c between vertices 0 and 1
    
    // The angle at vertex 1 is the angle we're changing
    const angle1Rad = newAngleDegrees * (Math.PI / 180);
    
    // Calculate the new position for vertex 0
    newPoints[0] = {
      x: points[1].x + distC * Math.cos(angle1Rad),
      y: points[1].y + distC * Math.sin(angle1Rad)
    };
    
    // Calculate the new position for vertex 2
    // We need to ensure the angle at vertex 1 is exactly newAngleDegrees
    // and the angle at vertex 0 is newAngles[0]
    
    // Calculate the angle for the third vertex
    const angle0Rad = newAngles[0] * (Math.PI / 180);
    const totalAngle = Math.PI - angle1Rad - angle0Rad;
    
    // Calculate the new position for vertex 2
    // We'll use the law of sines to determine the distance
    const distA = sides[0]; // side a between vertices 1 and 2
    
    newPoints[2] = {
      x: points[1].x + distA * Math.cos(totalAngle),
      y: points[1].y + distA * Math.sin(totalAngle)
    };
  } else if (angleIndex === 2) {
    // If we're changing angle at vertex 2, keep that vertex fixed
    // and recalculate positions of vertices 0 and 1
    
    // Calculate new position for vertex 0
    // We'll keep the distance between vertex 2 and 0 the same
    const distB = sides[1]; // side b between vertices 0 and 2
    
    // The angle at vertex 2 is the angle we're changing
    const angle2Rad = newAngleDegrees * (Math.PI / 180);
    
    // Calculate the new position for vertex 0
    newPoints[0] = {
      x: points[2].x + distB * Math.cos(angle2Rad),
      y: points[2].y + distB * Math.sin(angle2Rad)
    };
    
    // Calculate the new position for vertex 1
    // We need to ensure the angle at vertex 2 is exactly newAngleDegrees
    // and the angle at vertex 0 is newAngles[0]
    
    // Calculate the angle for the third vertex
    const angle0Rad = newAngles[0] * (Math.PI / 180);
    const totalAngle = Math.PI - angle2Rad - angle0Rad;
    
    // Calculate the new position for vertex 1
    // We'll use the law of sines to determine the distance
    const distA = sides[0]; // side a between vertices 1 and 2
    
    newPoints[1] = {
      x: points[2].x + distA * Math.cos(totalAngle),
      y: points[2].y + distA * Math.sin(totalAngle)
    };
  }
  
  // Calculate the center of the original triangle
  const originalCenter = {
    x: (originalPoints[0].x + originalPoints[1].x + originalPoints[2].x) / 3,
    y: (originalPoints[0].y + originalPoints[1].y + originalPoints[2].y) / 3
  };
  
  // Calculate the center of the new triangle
  const newCenter = {
    x: (newPoints[0].x + newPoints[1].x + newPoints[2].x) / 3,
    y: (newPoints[0].y + newPoints[1].y + newPoints[2].y) / 3
  };
  
  // Translate the new triangle to match the center of the original triangle
  const translation = {
    x: originalCenter.x - newCenter.x,
    y: originalCenter.y - newCenter.y
  };
  
  const finalPoints: [Point, Point, Point] = newPoints.map(p => ({
    x: p.x + translation.x,
    y: p.y + translation.y
  })) as [Point, Point, Point];
  
  console.log('Original points:', originalPoints);
  console.log('Final points:', finalPoints);
  
  return finalPoints;
};

// Default pixel to physical unit conversion (standard 96 DPI: 1cm = 37.8px)
const DEFAULT_PIXELS_PER_CM = 60;
// 1 inch = 96px on standard DPI screens
const DEFAULT_PIXELS_PER_INCH = 152.4;

// Helper to get calibrated values from localStorage
const getStoredPixelsPerUnit = (unit: MeasurementUnit): number => {
  const storedValue = localStorage.getItem(`pixelsPerUnit_${unit}`);
  if (storedValue) {
    return parseFloat(storedValue);
  }
  return unit === 'cm' ? DEFAULT_PIXELS_PER_CM : DEFAULT_PIXELS_PER_INCH;
};

// Conversion between units
const cmToInches = (cm: number): number => cm / 2.54;
const inchesToCm = (inches: number): number => inches * 2.54;

// Default shape properties
const DEFAULT_FILL = 'rgba(190, 227, 219, 0.5)';
const DEFAULT_STROKE = '#555B6E';
const DEFAULT_STROKE_WIDTH = 2;

// Helper function to calculate triangle perimeter
const calculateTrianglePerimeter = (points: [Point, Point, Point]): number => {
  return (
    distanceBetweenPoints(points[0], points[1]) +
    distanceBetweenPoints(points[1], points[2]) +
    distanceBetweenPoints(points[2], points[0])
  );
};

// Helper function to update triangle from side length
const updateTriangleFromSideLength = (
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

export function useShapeOperations() {
  const [shapes, setShapes] = useState<AnyShape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<OperationMode>('select');
  const [activeShapeType, setActiveShapeType] = useState<ShapeType>('rectangle');
  const [measurementUnit, setMeasurementUnit] = useState<MeasurementUnit>('cm');
  const [dragStart, setDragStart] = useState<Point | null>(null);
  
  // Get the calibrated pixels per unit values - add a dependency to force refresh
  const [refreshCalibration, setRefreshCalibration] = useState(0);
  
  // Force refresh of calibration values when component mounts
  useEffect(() => {
    setRefreshCalibration(prev => prev + 1);
  }, []);
  
  // Force refresh of calibration values when measurement unit changes
  useEffect(() => {
    setRefreshCalibration(prev => prev + 1);
  }, [measurementUnit]);
  
  // Get the calibrated pixels per unit values with refresh dependency
  const pixelsPerCm = useMemo(() => getStoredPixelsPerUnit('cm'), [refreshCalibration]);
  const pixelsPerInch = useMemo(() => getStoredPixelsPerUnit('in'), [refreshCalibration]);
  
  // Dynamic conversion functions that use the calibrated values
  const pixelsToCm = useCallback((pixels: number): number => {
    return pixels / pixelsPerCm;
  }, [pixelsPerCm]);
  
  const pixelsToInches = useCallback((pixels: number): number => {
    return pixels / pixelsPerInch;
  }, [pixelsPerInch]);
  
  const createShape = useCallback((startPoint: Point, endPoint: Point) => {
    const id = generateId();
    let newShape: AnyShape;
    
    switch (activeShapeType) {
      case 'circle': {
        const radius = distanceBetweenPoints(startPoint, endPoint);
        newShape = {
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
        break;
      }
      case 'rectangle': {
        const width = Math.abs(endPoint.x - startPoint.x);
        const height = Math.abs(endPoint.y - startPoint.y);
        const position = {
          x: Math.min(startPoint.x, endPoint.x),
          y: Math.min(startPoint.y, endPoint.y)
        };
        newShape = {
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
        break;
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
        
        newShape = {
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
        break;
      }
      default:
        throw new Error(`Unsupported shape type: ${activeShapeType}`);
    }
    
    setShapes(prevShapes => [...prevShapes, newShape]);
    setSelectedShapeId(id);
    toast.success(`${activeShapeType} created!`);
    return id;
  }, [activeShapeType]);
  
  const selectShape = useCallback((id: string | null) => {
    setShapes(prevShapes => 
      prevShapes.map(shape => ({
        ...shape,
        selected: shape.id === id
      }))
    );
    setSelectedShapeId(id);
  }, []);
  
  const moveShape = useCallback((id: string, newPosition: Point) => {
    setShapes(prevShapes => 
      prevShapes.map(shape => {
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
      })
    );
  }, []);
  
  const resizeShape = useCallback((id: string, factor: number) => {
    setShapes(prevShapes => 
      prevShapes.map(shape => {
        if (shape.id !== id) return shape;
        
        switch (shape.type) {
          case 'circle':
            return {
              ...shape,
              radius: (shape as Circle).radius * factor
            };
          case 'rectangle':
            return {
              ...shape,
              width: (shape as Rectangle).width * factor,
              height: (shape as Rectangle).height * factor
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
      })
    );
  }, []);
  
  const rotateShape = useCallback((id: string, angle: number) => {
    setShapes(prevShapes => 
      prevShapes.map(shape => 
        shape.id === id 
          ? { ...shape, rotation: angle } 
          : shape
      )
    );
  }, []);
  
  const deleteShape = useCallback((id: string) => {
    setShapes(prevShapes => prevShapes.filter(shape => shape.id !== id));
    if (selectedShapeId === id) {
      setSelectedShapeId(null);
    }
    toast.info("Shape deleted");
  }, [selectedShapeId]);
  
  const deleteAllShapes = useCallback(() => {
    setShapes([]);
    setSelectedShapeId(null);
    toast.info("All shapes cleared");
  }, []);
  
  // Convert physical measurements to pixels based on the current unit
  const convertToPixels = useCallback((value: number): number => {
    if (measurementUnit === 'in') {
      return value * pixelsPerInch;
    }
    return value * pixelsPerCm;
  }, [measurementUnit, pixelsPerCm, pixelsPerInch]);
  
  // Convert pixels to physical measurements based on the current unit
  const convertFromPixels = useCallback((pixels: number): number => {
    if (measurementUnit === 'in') {
      return pixelsToInches(pixels);
    }
    return pixelsToCm(pixels);
  }, [measurementUnit, pixelsToCm, pixelsToInches]);
  
  // Get measurements for a shape in the current unit
  const getShapeMeasurements = useCallback((shape: AnyShape) => {
    const measurements: Record<string, number> = {};
    
    switch (shape.type) {
      case 'circle': {
        const circle = shape as Circle;
        const diameter = convertFromPixels(circle.radius * 2);
        const radius = diameter / 2;
        const circumference = Math.PI * diameter;
        const area = Math.PI * radius * radius;
        
        measurements.diameter = parseFloat(diameter.toFixed(2));
        measurements.radius = parseFloat(radius.toFixed(2));
        measurements.circumference = parseFloat(circumference.toFixed(2));
        measurements.area = parseFloat(area.toFixed(2));
        break;
      }
      case 'rectangle': {
        const rect = shape as Rectangle;
        const width = convertFromPixels(rect.width);
        const height = convertFromPixels(rect.height);
        const perimeter = 2 * (width + height);
        const area = width * height;
        
        measurements.width = parseFloat(width.toFixed(2));
        measurements.height = parseFloat(height.toFixed(2));
        measurements.perimeter = parseFloat(perimeter.toFixed(2));
        measurements.area = parseFloat(area.toFixed(2));
        break;
      }
      case 'triangle': {
        const tri = shape as Triangle;
        
        // Calculate side lengths in pixels
        const side1 = distanceBetweenPoints(tri.points[0], tri.points[1]);
        const side2 = distanceBetweenPoints(tri.points[1], tri.points[2]);
        const side3 = distanceBetweenPoints(tri.points[2], tri.points[0]);
        
        // Convert to physical units
        const side1Length = convertFromPixels(side1);
        const side2Length = convertFromPixels(side2);
        const side3Length = convertFromPixels(side3);
        
        // Calculate perimeter
        const perimeter = side1Length + side2Length + side3Length;
        
        // Calculate area using Heron's formula
        const s = perimeter / 2; // Semi-perimeter
        const area = Math.sqrt(s * (s - side1Length) * (s - side2Length) * (s - side3Length));
        
        // Calculate heights for each side as base
        const height1 = (2 * area) / side1Length; // Height from side1 as base
        const height2 = (2 * area) / side2Length; // Height from side2 as base
        const height3 = (2 * area) / side3Length; // Height from side3 as base
        
        // Use the average height as the representative height
        const height = (height1 + height2 + height3) / 3;
        
        // Calculate angles
        const angles = calculateTriangleAngles(side1Length, side2Length, side3Length);
        
        measurements.side1 = parseFloat(side1Length.toFixed(2));
        measurements.side2 = parseFloat(side2Length.toFixed(2));
        measurements.side3 = parseFloat(side3Length.toFixed(2));
        measurements.perimeter = parseFloat(perimeter.toFixed(2));
        measurements.area = parseFloat(area.toFixed(2));
        measurements.height = parseFloat(height.toFixed(2));
        measurements.angle1 = Math.round(angles[0]);
        measurements.angle2 = Math.round(angles[1]);
        measurements.angle3 = Math.round(angles[2]);
        break;
      }
    }
    
    return measurements;
  }, [convertFromPixels]);
  
  const getSelectedShape = useCallback(() => {
    if (!selectedShapeId) return null;
    return shapes.find(shape => shape.id === selectedShapeId) || null;
  }, [shapes, selectedShapeId]);
  
  // Update shape based on measurement changes
  const updateShapeFromMeasurement = useCallback((
    shape: AnyShape,
    measurementKey: string,
    newValue: number,
    unit: string
  ): AnyShape => {
    // Convert to pixels if needed
    const valueInPixels = unit === 'px' ? newValue : convertToPixels(newValue);

    // Handle different shape types
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
          console.log(`Updating ${measurementKey} to ${newValue} degrees`);
          
          // Ensure the angle value is an integer
          const intAngleValue = Math.round(newValue);
          
          // Validate the angle is within range
          if (intAngleValue <= 0 || intAngleValue >= 180) {
            console.log(`Invalid angle value: ${intAngleValue}. Must be between 0 and 180.`);
            return shape;
          }
          
          // Get the angle index (0, 1, or 2)
          const angleIndex = parseInt(measurementKey.slice(-1)) - 1;
          
          // Store the original triangle properties
          const originalPoints = [...shape.points] as [Point, Point, Point];
          const originalCenter = {
            x: (originalPoints[0].x + originalPoints[1].x + originalPoints[2].x) / 3,
            y: (originalPoints[0].y + originalPoints[1].y + originalPoints[2].y) / 3
          };
          
          // Calculate the current side lengths
          const sides = [
            distanceBetweenPoints(shape.points[1], shape.points[2]),
            distanceBetweenPoints(shape.points[0], shape.points[2]),
            distanceBetweenPoints(shape.points[0], shape.points[1])
          ];
          
          // Calculate the average side length to maintain approximate size
          const avgSideLength = (sides[0] + sides[1] + sides[2]) / 3;
          const originalPerimeter = sides[0] + sides[1] + sides[2];
          
          // Calculate the current angles
          const currentAngles = calculateTriangleAngles(
            sides[0],
            sides[1],
            sides[2]
          ).map(a => Math.round(a)) as [number, number, number];
          
          console.log(`Current angles: ${currentAngles.join(', ')}`);
          
          // Create a new array of angles
          const newAngles: [number, number, number] = [...currentAngles];
          
          // Set the new value for the angle we're changing
          newAngles[angleIndex] = intAngleValue;
          
          // When changing angle 1, adjust angle 2 (and angle 3 gets the remainder)
          // When changing angle 2, adjust angle 3 (and angle 1 gets the remainder)
          // When changing angle 3, adjust angle 1 (and angle 2 gets the remainder)
          const adjustIndex = (angleIndex + 1) % 3;
          const thirdIndex = (angleIndex + 2) % 3;
          
          // Calculate the difference
          const angleDiff = intAngleValue - currentAngles[angleIndex];
          
          // Adjust the second angle by the opposite of the difference
          newAngles[adjustIndex] = Math.max(1, Math.min(178, currentAngles[adjustIndex] - angleDiff));
          
          // The third angle is whatever is needed to make the sum 180
          newAngles[thirdIndex] = 180 - newAngles[angleIndex] - newAngles[adjustIndex];
          
          // Ensure the third angle is valid
          if (newAngles[thirdIndex] <= 0 || newAngles[thirdIndex] >= 180) {
            console.log(`Invalid angle configuration: ${newAngles.join(', ')}`);
            return shape;
          }
          
          console.log(`New angles to apply: ${newAngles.join(', ')}`);
          
          // SIMPLER APPROACH: Create a triangle with fixed side length and exact angles
          
          // Convert angles to radians
          const angleRads = newAngles.map(a => a * (Math.PI / 180));
          
          // We'll create a triangle with a fixed side length (avgSideLength)
          // and position it so that the vertex with the changed angle is at the origin
          
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
          
          // Now we have a triangle with the exact angle we want at the specified vertex
          // We need to scale it to match the original size and translate it to the original center
          
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
          
          // Verify the new angles
          const finalSides = [
            distanceBetweenPoints(finalPoints[1], finalPoints[2]),
            distanceBetweenPoints(finalPoints[0], finalPoints[2]),
            distanceBetweenPoints(finalPoints[0], finalPoints[1])
          ];
          
          const resultAngles = calculateTriangleAngles(
            finalSides[0],
            finalSides[1],
            finalSides[2]
          );
          
          console.log(`Resulting angles after update: ${resultAngles.map(a => Math.round(a)).join(', ')}`);
          
          // Double-check that the angle we wanted to change is correct
          if (Math.abs(Math.round(resultAngles[angleIndex]) - intAngleValue) > 1) {
            console.log(`Warning: Resulting angle ${Math.round(resultAngles[angleIndex])} differs from requested angle ${intAngleValue}`);
          }
          
          return {
            ...shape,
            points: finalPoints,
            position: originalCenter
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
  }, [convertToPixels, convertFromPixels]);
  
  // Function to update shape based on measurement values
  const updateMeasurement = useCallback((key: string, value: string) => {
    if (!selectedShapeId) return;
    
    // Parse the input value to a number
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      toast.error("Please enter a valid positive number");
      return;
    }
    
    const selectedShape = getSelectedShape();
    if (!selectedShape) return;
    
    setShapes(prevShapes => 
      prevShapes.map(shape => {
        if (shape.id !== selectedShapeId) return shape;
        
        // Use our helper function to update the shape
        return updateShapeFromMeasurement(shape, key, numValue, measurementUnit);
      })
    );
    
    toast.success("Shape updated");
  }, [selectedShapeId, getSelectedShape, updateShapeFromMeasurement, measurementUnit]);
  
  return {
    shapes,
    selectedShapeId,
    activeMode,
    activeShapeType,
    measurementUnit,
    setMeasurementUnit,
    dragStart,
    setDragStart,
    createShape,
    selectShape,
    moveShape,
    resizeShape,
    rotateShape,
    deleteShape,
    deleteAllShapes,
    setActiveMode,
    setActiveShapeType,
    getShapeMeasurements,
    getSelectedShape,
    updateShapeFromMeasurement,
    updateMeasurement
  };
}
