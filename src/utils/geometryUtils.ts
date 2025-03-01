import { ShapeType } from '@/types/shapes';

// Formula templates for different shapes and measurements
export const formulas = {
  circle: {
    area: {
      en: '\\text{area} = \\pi r^2',
      de: '\\text{Fläche} = \\pi r^2'
    },
    perimeter: {
      en: '\\text{perimeter} = 2\\pi r',
      de: '\\text{Umfang} = 2\\pi r'
    }
  },
  rectangle: {
    area: {
      en: '\\text{area} = w \\times h',
      de: '\\text{Fläche} = w \\times h'
    },
    perimeter: {
      en: '\\text{perimeter} = 2(w + h)',
      de: '\\text{Umfang} = 2(w + h)'
    }
  },
  triangle: {
    area: {
      en: '\\text{area} = \\frac{1}{2} \\times \\text{base} \\times \\text{height}',
      de: '\\text{Fläche} = \\frac{1}{2} \\times \\text{Basis} \\times \\text{Höhe}'
    },
    perimeter: {
      en: '\\text{perimeter} = a + b + c',
      de: '\\text{Umfang} = a + b + c'
    }
  }
};

/**
 * Get the formula for a specific measurement of a shape
 */
export const getFormula = (shapeType: ShapeType, measurementKey: string, language: string = 'en'): string => {
  if (!formulas[shapeType] || !formulas[shapeType][measurementKey]) {
    return '';
  }
  return formulas[shapeType][measurementKey][language] || formulas[shapeType][measurementKey]['en'];
};

/**
 * Get a more detailed explanation of how the measurement is calculated
 */
export const getFormulaExplanation = (shapeType: ShapeType, measurementKey: string): string => {
  switch (shapeType) {
    case 'circle':
      switch (measurementKey) {
        case 'area':
          return 'The space inside the circle: $A = \\pi r^2$.';
        case 'perimeter':
          return 'The distance around the circle, also called circumference: $C = 2\\pi r$.';
      }
      break;
    case 'rectangle':
      switch (measurementKey) {
        case 'area':
          return 'The space inside the rectangle: $A = w \\times h$.';
        case 'perimeter':
          return 'The distance around the rectangle: $P = 2(w + h)$.';
      }
      break;
    case 'triangle':
      switch (measurementKey) {
        case 'area':
          return 'The space inside the triangle. For a general triangle: $A = \\frac{1}{2} \\times \\text{base} \\times \\text{height}$.';
        case 'perimeter':
          return 'The distance around the triangle: $P = a + b + c$ (sum of all sides).';
      }
      break;
  }
  
  return '';
};
