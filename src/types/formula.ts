import { Point } from "./shapes";

export type FormulaType = 'function' | 'parametric' | 'polar';

export interface Formula {
  id: string;
  type: FormulaType;
  name?: string; // Optional name for the formula
  expression: string;
  color: string;
  strokeWidth: number;
  xRange: [number, number]; // The range of x values to plot
  tRange?: [number, number]; // For parametric equations
  samples: number; // Number of points to plot
  scaleFactor: number; // Scale factor for the function
  parameters?: Record<string, number>; // Parameters for the function
  minValue?: number; // Minimum value for the function
  maxValue?: number; // Maximum value for the function
}

export interface FormulaPoint {
  x: number;
  y: number;
  isValid: boolean; // Flag to track discontinuities/undefined points
}

export type FormulaExampleCategory = 'basic' | 'trigonometric' | 'exponential' | 'parametric' | 'special' | 'polynomial' | 'polar';

export interface FormulaExample {
  name: string;
  type: FormulaType;
  expression: string;
  xRange: [number, number];
  tRange?: [number, number];
  category: FormulaExampleCategory;
  description: string;
}
