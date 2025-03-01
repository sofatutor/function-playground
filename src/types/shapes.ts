
export type ShapeType = 'circle' | 'rectangle' | 'triangle' | 'line';
export type MeasurementUnit = 'cm' | 'in';

export interface Point {
  x: number;
  y: number;
}

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

export interface Circle extends Shape {
  type: 'circle';
  radius: number;
}

export interface Rectangle extends Shape {
  type: 'rectangle';
  width: number;
  height: number;
}

export interface Triangle extends Shape {
  type: 'triangle';
  points: [Point, Point, Point]; // Three points defining the triangle
}

export interface Line extends Shape {
  type: 'line';
  startPoint: Point;
  endPoint: Point;
  length: number; // Store the length for easy access in measurements
}

export type AnyShape = Circle | Rectangle | Triangle | Line;

export type OperationMode = 'select' | 'create' | 'move' | 'resize' | 'rotate';

export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';
