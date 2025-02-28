
import { useState, useCallback } from 'react';
import { 
  AnyShape, Circle, Rectangle, Triangle, Point, ShapeType, OperationMode 
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

// Pixel to CM conversion (standard 96 DPI: 1cm = 37.8px)
const PIXELS_PER_CM = 37.8;
const pixelsToCm = (pixels: number): number => pixels / PIXELS_PER_CM;

// Default shape properties
const DEFAULT_FILL = 'rgba(190, 227, 219, 0.5)';
const DEFAULT_STROKE = '#555B6E';
const DEFAULT_STROKE_WIDTH = 2;

export function useShapeOperations() {
  const [shapes, setShapes] = useState<AnyShape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<OperationMode>('select');
  const [activeShapeType, setActiveShapeType] = useState<ShapeType>('rectangle');
  const [dragStart, setDragStart] = useState<Point | null>(null);
  
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
        // Create an equilateral triangle centered around the start point
        const distance = distanceBetweenPoints(startPoint, endPoint);
        const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
        
        const p1 = { ...startPoint };
        const p2 = {
          x: startPoint.x + distance * Math.cos(angle),
          y: startPoint.y + distance * Math.sin(angle)
        };
        const p3 = {
          x: startPoint.x + distance * Math.cos(angle + (2 * Math.PI / 3)),
          y: startPoint.y + distance * Math.sin(angle + (2 * Math.PI / 3))
        };
        
        newShape = {
          id,
          type: 'triangle',
          position: { ...startPoint },
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
      prevShapes.map(shape => 
        shape.id === id 
          ? { ...shape, position: newPosition } 
          : shape
      )
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
  
  const getShapeMeasurements = useCallback((shape: AnyShape) => {
    switch (shape.type) {
      case 'circle': {
        const circle = shape as Circle;
        const radiusCm = pixelsToCm(circle.radius);
        const areaCm = Math.PI * Math.pow(radiusCm, 2);
        const perimeterCm = 2 * Math.PI * radiusCm;
        return {
          radius: radiusCm.toFixed(2),
          diameter: (radiusCm * 2).toFixed(2),
          area: areaCm.toFixed(2),
          perimeter: perimeterCm.toFixed(2)
        };
      }
      case 'rectangle': {
        const rect = shape as Rectangle;
        const widthCm = pixelsToCm(rect.width);
        const heightCm = pixelsToCm(rect.height);
        const areaCm = widthCm * heightCm;
        const perimeterCm = 2 * (widthCm + heightCm);
        return {
          width: widthCm.toFixed(2),
          height: heightCm.toFixed(2),
          area: areaCm.toFixed(2),
          perimeter: perimeterCm.toFixed(2)
        };
      }
      case 'triangle': {
        const tri = shape as Triangle;
        
        // Calculate side lengths in pixels first
        const side1Px = distanceBetweenPoints(tri.points[0], tri.points[1]);
        const side2Px = distanceBetweenPoints(tri.points[1], tri.points[2]);
        const side3Px = distanceBetweenPoints(tri.points[2], tri.points[0]);
        
        // Convert to centimeters
        const side1Cm = pixelsToCm(side1Px);
        const side2Cm = pixelsToCm(side2Px);
        const side3Cm = pixelsToCm(side3Px);
        
        // Calculate area in pixels and convert to cm²
        const areaPx = calculateTriangleArea(tri.points);
        const areaCm = pixelsToCm(areaPx) * pixelsToCm(1); // Convert px² to cm²
        
        const perimeterCm = side1Cm + side2Cm + side3Cm;
        
        return {
          side1: side1Cm.toFixed(2),
          side2: side2Cm.toFixed(2),
          side3: side3Cm.toFixed(2),
          area: areaCm.toFixed(2),
          perimeter: perimeterCm.toFixed(2)
        };
      }
      default:
        return {};
    }
  }, []);
  
  const getSelectedShape = useCallback(() => {
    if (!selectedShapeId) return null;
    return shapes.find(shape => shape.id === selectedShapeId) || null;
  }, [shapes, selectedShapeId]);
  
  return {
    shapes,
    selectedShapeId,
    activeMode,
    activeShapeType,
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
    getSelectedShape
  };
}
