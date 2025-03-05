import { Point } from "./shapes";

export type FormulaType = 'function' | 'parametric' | 'polar';

export interface Formula {
  id: string;
  type: FormulaType;
  expression: string;
  color: string;
  strokeWidth: number;
  xRange: [number, number]; // For function and parametric
  tRange?: [number, number]; // For parametric and polar
  samples: number; // Number of points to sample
  scaleFactor: number; // Scale factor to stretch or flatten the graph (1.0 is normal)
}

export interface FormulaPoint {
  x: number;
  y: number;
  isValid: boolean; // Flag to track discontinuities/undefined points
}

export type FormulaExampleCategory = 'basic' | 'trigonometric' | 'exponential' | 'parametric' | 'special' | 'polynomial';

export interface FormulaExample {
  name: string;
  type: FormulaType;
  expression: string;
  xRange: [number, number];
  tRange?: [number, number];
  category: FormulaExampleCategory;
  description: string;
}
