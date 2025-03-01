
import { ShapeType } from '@/types/shapes';

// Formula templates for different shapes and measurements
export const formulas = {
  circle: {
    radius: '\\text{radius} = r',
    diameter: '\\text{diameter} = 2r',
    area: '\\text{area} = \\pi r^2',
    perimeter: '\\text{perimeter} = 2\\pi r'
  },
  rectangle: {
    width: '\\text{width} = w',
    height: '\\text{height} = h',
    area: '\\text{area} = w \\times h',
    perimeter: '\\text{perimeter} = 2(w + h)'
  },
  triangle: {
    side1: '\\text{side1} = a',
    side2: '\\text{side2} = b',
    side3: '\\text{side3} = c',
    area: '\\text{area} = \\frac{1}{2} \\times \\text{base} \\times \\text{height}',
    perimeter: '\\text{perimeter} = a + b + c'
  }
};

/**
 * Get the formula for a specific measurement of a shape
 */
export const getFormula = (shapeType: ShapeType, measurementKey: string): string => {
  if (!formulas[shapeType] || !formulas[shapeType][measurementKey]) {
    return '';
  }
  return formulas[shapeType][measurementKey];
};

/**
 * Get a more detailed explanation of how the measurement is calculated
 */
export const getFormulaExplanation = (shapeType: ShapeType, measurementKey: string): string => {
  switch (shapeType) {
    case 'circle':
      switch (measurementKey) {
        case 'radius':
          return 'The distance from the center to the edge of the circle.';
        case 'diameter':
          return 'The distance across the circle through the center: $d = 2r$.';
        case 'area':
          return 'The space inside the circle: $A = \\pi r^2$.';
        case 'perimeter':
          return 'The distance around the circle, also called circumference: $C = 2\\pi r$.';
      }
      break;
    case 'rectangle':
      switch (measurementKey) {
        case 'width':
          return 'The horizontal dimension of the rectangle.';
        case 'height':
          return 'The vertical dimension of the rectangle.';
        case 'area':
          return 'The space inside the rectangle: $A = w \\times h$.';
        case 'perimeter':
          return 'The distance around the rectangle: $P = 2(w + h)$.';
      }
      break;
    case 'triangle':
      switch (measurementKey) {
        case 'side1':
        case 'side2':
        case 'side3':
          return 'The length of one of the sides of the triangle.';
        case 'area':
          return 'The space inside the triangle. For a general triangle: $A = \\frac{1}{2} \\times \\text{base} \\times \\text{height}$.';
        case 'perimeter':
          return 'The distance around the triangle: $P = a + b + c$ (sum of all sides).';
      }
      break;
  }
  
  return '';
};
