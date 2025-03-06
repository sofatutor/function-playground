export type ShapeType = 'circle' | 'rectangle' | 'triangle' | 'line';
export type MeasurementUnit = 'cm' | 'in';

/**
 * Represents a 2D point with x and y coordinates
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Base shape interface with common properties for all shapes
 */
export interface Shape {
  id: string;
  type: ShapeType;
  position: Point;
  rotation: number;
  selected: boolean;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

/**
 * Circle shape with radius property
 */
export interface Circle extends Shape {
  type: 'circle';
  radius: number;
}

/**
 * Rectangle shape with width and height properties
 */
export interface Rectangle extends Shape {
  type: 'rectangle';
  width: number;
  height: number;
}

/**
 * Triangle shape with three points
 */
export interface Triangle extends Shape {
  type: 'triangle';
  points: [Point, Point, Point]; // Three points defining the triangle
}

/**
 * Line shape with start and end points
 */
export interface Line extends Shape {
  type: 'line';
  startPoint: Point;
  endPoint: Point;
  length: number; // Store the length for easy access in measurements
}

/**
 * Union type of all shape types
 */
export type AnyShape = Circle | Rectangle | Triangle | Line;

/**
 * Operation modes for the canvas
 */
export type OperationMode = 'select' | 'create' | 'move' | 'resize' | 'rotate';

/**
 * Resize handle positions
 */
export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

/**
 * Type guard to check if a shape is a Circle
 * @param shape The shape to check
 * @returns True if the shape is a Circle
 */
export function isCircle(shape: AnyShape): shape is Circle {
  return shape.type === 'circle';
}

/**
 * Type guard to check if a shape is a Rectangle
 * @param shape The shape to check
 * @returns True if the shape is a Rectangle
 */
export function isRectangle(shape: AnyShape): shape is Rectangle {
  return shape.type === 'rectangle';
}

/**
 * Type guard to check if a shape is a Triangle
 * @param shape The shape to check
 * @returns True if the shape is a Triangle
 */
export function isTriangle(shape: AnyShape): shape is Triangle {
  return shape.type === 'triangle';
}

/**
 * Type guard to check if a shape is a Line
 * @param shape The shape to check
 * @returns True if the shape is a Line
 */
export function isLine(shape: AnyShape): shape is Line {
  return shape.type === 'line';
}

/**
 * Type for shapes with width and height properties
 */
export type ShapeWithDimensions = Rectangle;

/**
 * Type guard to check if a shape has width and height dimensions
 * @param shape The shape to check
 * @returns True if the shape has width and height properties
 */
export function hasWidthAndHeight(shape: AnyShape): shape is ShapeWithDimensions {
  return 'width' in shape && 'height' in shape;
}

/**
 * Type for shapes with points
 */
export type ShapeWithPoints = Triangle;

/**
 * Type guard to check if a shape has points
 * @param shape The shape to check
 * @returns True if the shape has points
 */
export function hasPoints(shape: AnyShape): shape is ShapeWithPoints {
  return 'points' in shape;
}

/**
 * Type for shapes with start and end points
 */
export type ShapeWithEndpoints = Line;

/**
 * Type guard to check if a shape has start and end points
 * @param shape The shape to check
 * @returns True if the shape has start and end points
 */
export function hasEndpoints(shape: AnyShape): shape is ShapeWithEndpoints {
  return 'startPoint' in shape && 'endPoint' in shape;
}

/**
 * Type for shapes with a radius
 */
export type ShapeWithRadius = Circle;

/**
 * Type guard to check if a shape has a radius
 * @param shape The shape to check
 * @returns True if the shape has a radius
 */
export function hasRadius(shape: AnyShape): shape is ShapeWithRadius {
  return 'radius' in shape;
}

/**
 * Utility type to extract shape properties based on shape type
 */
export type ShapeProperties<T extends ShapeType> = 
  T extends 'circle' ? Circle :
  T extends 'rectangle' ? Rectangle :
  T extends 'triangle' ? Triangle :
  T extends 'line' ? Line :
  never;

/**
 * Safely cast a shape to a specific type if it matches
 * @param shape The shape to cast
 * @param type The target shape type
 * @returns The shape cast to the specific type, or null if types don't match
 */
export function castShape<T extends ShapeType>(
  shape: AnyShape | null | undefined, 
  type: T
): ShapeProperties<T> | null {
  if (!shape) return null;
  if (shape.type !== type) return null;
  return shape as ShapeProperties<T>;
}
