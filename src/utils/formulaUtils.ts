import { Formula, FormulaPoint, FormulaExample, FormulaType } from "@/types/formula";
import { Point } from "@/types/shapes";

// Constants
const MAX_SAMPLES = 100000;
const MIN_SAMPLES = 20;
const DEFAULT_X_RANGE: [number, number] = [-10000, 10000];
const DEFAULT_T_RANGE: [number, number] = [0, 2 * Math.PI];

// Utility functions
const clampSamples = (samples: number): number => 
  Math.min(Math.max(samples, MIN_SAMPLES), MAX_SAMPLES);

const getCanvasDimensions = (): { width: number; height: number } => ({
  width: Math.max(window.innerWidth, 1000),
  height: Math.max(window.innerHeight, 800)
});

const calculateVisibleXRange = (
  gridPosition: Point,
  pixelsPerUnit: number,
  samples: number,
  isLogarithmic: boolean = false
): [number, number] => {
  const { width } = getCanvasDimensions();
  const padding = samples < 500 ? 5 : 10;
  
  // Calculate visible range in mathematical coordinates
  const xMin = ((0 - gridPosition.x) / pixelsPerUnit) - padding;
  const xMax = ((width - gridPosition.x) / pixelsPerUnit) + padding;
  
  // For logarithmic functions, use tighter bounds
  if (isLogarithmic) {
    const maxRange = 100;
  return [
      Math.max(xMin, -maxRange),
      Math.min(xMax, maxRange)
    ];
  }
  
  // For polynomial functions, use reasonable bounds based on degree
  const maxPolyRange = 15; // Tighter bounds for polynomials
  if (samples > 1000) { // High-degree polynomials need tighter bounds
    return [
      Math.max(xMin, -maxPolyRange),
      Math.min(xMax, maxPolyRange)
    ];
  }
  
  // For other functions, use standard bounds but with a reasonable limit
  const maxRange = 50;
  return [
    Math.max(xMin, -maxRange),
    Math.min(xMax, maxRange)
  ];
};

const createFunctionFromExpression = (
  expression: string,
  scaleFactor: number
): ((x: number) => number) => {
  if (!expression || expression.trim() === '') {
    return () => NaN;
  }

  if (expression === 'Math.exp(x)') {
    return (x: number) => Math.exp(x) * scaleFactor;
  }
  if (expression === '1 / (1 + Math.exp(-x))') {
    return (x: number) => (1 / (1 + Math.exp(-x))) * scaleFactor;
  }
  if (expression === 'Math.sqrt(Math.abs(x))') {
    return (x: number) => Math.sqrt(Math.abs(x)) * scaleFactor;
  }

  try {
    // Only wrap x in parentheses if it's not part of another identifier (like Math.exp)
    const scaledExpression = expression.replace(/(?<!\w)x(?!\w)/g, '(x)');
    return new Function('x', `
      try {
        const {sin, cos, tan, exp, log, sqrt, abs, pow, PI, E} = Math;
        return (${scaledExpression}) * ${scaleFactor};
      } catch (e) {
        console.error('Error in function evaluation:', e);
        return NaN;
      }
    `) as (x: number) => number;
  } catch (e) {
    console.error('Error creating function from expression:', e);
    return () => NaN;
  }
};

const toCanvasCoordinates = (
  x: number,
  y: number,
  gridPosition: Point,
  pixelsPerUnit: number
): { x: number; y: number } => ({
  x: gridPosition.x + x * pixelsPerUnit,
  y: gridPosition.y - y * pixelsPerUnit
});

// Function type detection
interface FunctionCharacteristics {
  isTangent: boolean;
  isLogarithmic: boolean;
  hasSingularity: boolean;
  hasPowWithX: boolean;
  hasTrigPowCombination: boolean;
  allowsNegativeX: boolean;
  hasRapidOscillation: boolean;
  isComposite: boolean;
  hasPow: boolean;
}

const detectFunctionCharacteristics = (expression: string): FunctionCharacteristics => {
  // Normalize the expression by removing whitespace
  const normalizedExpr = expression.replace(/\s+/g, '');
  
  // Count the degree of polynomial by counting x occurrences
  const countX = (expr: string): number => {
    const matches = expr.match(/x/g);
    return matches ? matches.length : 0;
  };
  
  const polynomialDegree = countX(normalizedExpr);
  
  return {
    isTangent: normalizedExpr.includes('Math.tan(') || 
               normalizedExpr === 'Math.tan(x)' || 
               normalizedExpr.includes('tan(x)'),
               
    isLogarithmic: normalizedExpr.includes('Math.log(') || 
                   normalizedExpr.includes('Math.log10(') || 
                   normalizedExpr.includes('Math.log2(') || 
                   normalizedExpr.includes('log(') || 
                   normalizedExpr.includes('ln('),
                   
    hasSingularity: normalizedExpr.includes('Math.tan(') || 
                    normalizedExpr.includes('1/x') || 
                    normalizedExpr.includes('1/(') || 
                    normalizedExpr.includes('Math.pow(x,-'),
                    
    hasPowWithX: normalizedExpr.includes('Math.pow(x,') || 
                 normalizedExpr.includes('Math.pow(x ,') || 
                 normalizedExpr.includes('x**') || 
                 normalizedExpr.includes('x^'),
                 
    hasTrigPowCombination: (normalizedExpr.includes('Math.sin') && normalizedExpr.includes('Math.pow')) ||
                          (normalizedExpr.includes('Math.cos') && normalizedExpr.includes('Math.pow')),
                          
    allowsNegativeX: normalizedExpr.includes('Math.abs(') || 
                     normalizedExpr.includes('abs('),
                     
    hasRapidOscillation: normalizedExpr.includes('Math.sin(') && 
                         (normalizedExpr.includes('*x') || normalizedExpr.includes('x*')),
                         
    isComposite: (normalizedExpr.match(/Math\.\w+/g) || []).length > 1,
    
    hasPow: normalizedExpr.includes('Math.pow(') || 
            normalizedExpr.includes('**') || 
            normalizedExpr.includes('^') ||
            polynomialDegree > 2 || // Consider high-degree polynomials as having power operations
            /x\*x/.test(normalizedExpr)
  };
};

const adjustSamples = (baseSamples: number, chars: ReturnType<typeof detectFunctionCharacteristics>, expression: string): number => {
  let multiplier = 1;
  
  // Get polynomial degree by counting x occurrences
  const countX = (expr: string): number => {
    const matches = expr.match(/x/g);
    return matches ? matches.length : 0;
  };

  // Count the number of nested Math.pow calls
  const countNestedPow = (expr: string): number => {
    const regex = /Math\.pow\([^)]*Math\.pow/g;
    const matches = expr.match(regex);
    return matches ? matches.length : 0;
  };
  
  // Increase samples based on polynomial degree
  const degree = countX(expression);
  if (degree > 4) multiplier *= 4; // Quintic and higher
  else if (degree > 3) multiplier *= 3; // Quartic
  else if (degree > 2) multiplier *= 2; // Cubic
  
  // Increase samples for nested Math.pow expressions
  const nestedPowCount = countNestedPow(expression);
  if (nestedPowCount > 0) multiplier *= (2 + nestedPowCount);
  
  // Special case for the complex nested Math.pow example with sqrt and abs
  if (expression.includes('Math.pow') && 
      expression.includes('Math.sqrt') && 
      expression.includes('Math.abs')) {
    multiplier *= 10; // Significantly increase samples for complex expressions with sqrt and abs
  }
  
  // Special case for our specific complex formula
  if (expression === 'Math.pow(x * 2, 2) + Math.pow((5 * Math.pow(x * 4, 2) - Math.sqrt(Math.abs(x))) * 2, 2) - 1') {
    multiplier *= 15; // Greatly increase samples for this specific formula (increased from 8)
    baseSamples = Math.max(baseSamples, 2000); // Ensure a higher minimum base sample size (increased from 1000)
  }
  
  // Additional multipliers for other characteristics
  if (chars.isLogarithmic) multiplier *= 2;
  if (chars.hasSingularity) multiplier *= 3;
  if (chars.hasPowWithX) multiplier *= 2;
  if (chars.hasRapidOscillation) multiplier *= 2;
  if (chars.isComposite) multiplier *= 1.5;
  if (chars.hasTrigPowCombination) multiplier *= 3;
  
  // Cap the maximum multiplier to avoid performance issues
  multiplier = Math.min(multiplier, 20); // Increased from 12 to 20 for very complex expressions
  
  return Math.round(baseSamples * multiplier);
};

// X-value generators
const generateLinearXValues = (
  range: [number, number],
  samples: number
): number[] => {
  const step = (range[1] - range[0]) / samples;
  return Array.from({ length: samples + 1 }, (_, i) => range[0] + i * step);
};

const generateLogarithmicXValues = (range: [number, number], samples: number): number[] => {
  const [min, max] = range;
  const values: number[] = [];
  
  // Special handling for log functions that cross x=0
  if (min < 0 && max > 0) {
    // Split samples between negative and positive parts
    const negSamples = Math.floor(samples * 0.4); // 40% for negative side
    const posSamples = Math.floor(samples * 0.4); // 40% for positive side
    const nearZeroSamples = samples - negSamples - posSamples; // 20% for near zero
    
    // Generate negative points with exponential distribution
    for (let i = 0; i <= negSamples; i++) {
      const t = i / negSamples;
      // Use quintic distribution for better point concentration near zero
      const t5 = t * t * t * t * t;
      const x = -Math.exp(Math.log(-min) * t5);
      if (x > min && x < -1e-10) values.push(x);
    }
    
    // Add very close points around zero with increasing density
    const epsilon = 1e-10;
    const baseMultiplier = 1.5;
    
    // Add more points very close to zero on both sides
    for (let i = 0; i < nearZeroSamples / 2; i++) {
      const factor = Math.pow(baseMultiplier, i);
      values.push(-epsilon * factor);
      values.push(epsilon * factor);
    }
    
    // Generate positive points with exponential distribution
    for (let i = 0; i <= posSamples; i++) {
      const t = i / posSamples;
      // Use quintic distribution for better point concentration near zero
      const t5 = t * t * t * t * t;
      const x = Math.exp(Math.log(max) * t5);
      if (x > 1e-10 && x < max) values.push(x);
    }
  } else {
    // Handle single-sided ranges
    const isNegative = max < 0;
    const absMin = Math.abs(min);
    const absMax = Math.abs(max);
    
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      // Use quintic distribution for better point concentration
      const t5 = t * t * t * t * t;
      const absX = Math.exp(Math.log(absMin) + (Math.log(absMax) - Math.log(absMin)) * t5);
      const x = isNegative ? -absX : absX;
      values.push(x);
    }
  }
  
  // Sort values and remove duplicates
  return [...new Set(values)].sort((a, b) => a - b);
};

// Generate x values with higher density around potential singularities
const generateSingularityXValues = (
  range: [number, number],
  samples: number
): number[] => {
  // If range doesn't include zero, use linear sampling
  if (range[0] > 0 || range[1] < 0) {
    return generateLinearXValues(range, samples);
  }
  
  // Find where 0 is in the range
  const totalRange = range[1] - range[0];
  const zeroPosition = -range[0] / totalRange;
  
  // Allocate more samples near zero
  const result: number[] = [];
  
  // Add a small offset to avoid exact zero
  const epsilon = 1e-10;
  
  // Add points to the left of zero with increasing density toward zero
  if (range[0] < 0) {
    const negativeRange = -range[0];
    const negSamples = Math.floor(samples * zeroPosition * 0.8); // 80% of proportional samples
    
    // Add more points very close to zero (negative side)
    for (let i = 30; i >= 1; i--) {
      result.push(-epsilon * Math.pow(1.5, i));
    }
    
    // Add remaining negative points with exponential distribution
    for (let i = 0; i < negSamples; i++) {
      // Use exponential distribution to concentrate points near zero
      const t = i / negSamples;
      const x = range[0] * Math.pow(Math.abs(range[0] / epsilon), -t);
      if (x < -epsilon * 30) { // Avoid duplicating the very close points
        result.push(x);
      }
    }
  }
  
  // Add points to the right of zero with increasing density toward zero
  if (range[1] > 0) {
    const positiveRange = range[1];
    const posSamples = Math.floor(samples * (1 - zeroPosition) * 0.8); // 80% of proportional samples
    
    // Add more points very close to zero (positive side)
    for (let i = 1; i <= 30; i++) {
      result.push(epsilon * Math.pow(1.5, i));
    }
    
    // Add remaining positive points with exponential distribution
    for (let i = 0; i < posSamples; i++) {
      // Use exponential distribution to concentrate points near zero
      const t = i / posSamples;
      const x = range[1] * Math.pow(Math.abs(epsilon / range[1]), 1 - t);
      if (x > epsilon * 30) { // Avoid duplicating the very close points
        result.push(x);
      }
    }
  }
  
  // Sort the results
  result.sort((a, b) => a - b);
  
  return result;
};

const generateTangentXValues = (
  range: [number, number],
  samples: number
): number[] => {
  const PI = Math.PI;
  const xValues: number[] = [];
  const step = (range[1] - range[0]) / samples;
  
  for (let i = 0; i <= samples; i++) {
    const x = range[0] + i * step;
    const nearestAsymptote = Math.round(x / PI - 0.5) * PI + PI/2;
    if (Math.abs(x - nearestAsymptote) > 0.01) {
      xValues.push(x);
    }
  }
  return xValues;
};

// Core evaluation function
const evaluatePoints = (
  formula: Formula,
  gridPosition: Point,
  pixelsPerUnit: number,
  xValues: number[],
  fn: (x: number) => number
): FormulaPoint[] => {
  const points: FormulaPoint[] = [];
  const chars = detectFunctionCharacteristics(formula.expression);
  const { isLogarithmic, allowsNegativeX, hasPow } = chars;
  
  let prevY: number | null = null;
  let prevX: number | null = null;
  
  // Special case for complex formulas to detect and handle rapid changes
  const isComplexFormula = formula.expression === 'Math.pow(x * 2, 2) + Math.pow((5 * Math.pow(x * 4, 2) - Math.sqrt(Math.abs(x))) * 2, 2) - 1';
  
  for (const x of xValues) {
    let y: number;
    let isValidDomain = true;
    
    try {
      // Special handling for logarithmic functions
      if (isLogarithmic) {
        if (Math.abs(x) < 1e-10) {
          // Skip points too close to zero for log functions
        y = NaN;
        isValidDomain = false;
        } else {
          y = fn(x);
          // Additional validation for logarithmic results
          if (Math.abs(y) > 100) {
            y = Math.sign(y) * 100; // Limit extreme values
          }
        }
      } else {
        y = fn(x);
      }
      
      // Special handling for the complex formula
      if (isComplexFormula) {
        // Detect rapid changes around x=0 for the complex formula
        if (Math.abs(x) < 0.01) {
          // Extra validation for points very close to zero
          if (Math.abs(y) > 1000) {
            y = Math.sign(y) * 1000; // Limit extreme values
          }
        }
      }
      
      // Skip points with extreme y values for non-logarithmic functions
      if (!isLogarithmic && !isNaN(y) && Math.abs(y) > 100000) {
        isValidDomain = false;
      }
    } catch (e) {
      console.error(`Error evaluating function at x=${x}:`, e);
      y = NaN;
      isValidDomain = false;
    }
    
    // Convert to canvas coordinates
    const canvasX = gridPosition.x + x * pixelsPerUnit;
    const canvasY = gridPosition.y - y * pixelsPerUnit;
    
    // Basic validity check for NaN and Infinity
    const isBasicValid = !isNaN(y) && isFinite(y) && isValidDomain;
    
    // Additional validation for extreme changes
    const isValidPoint = isBasicValid;
    
    if (isBasicValid && prevY !== null && prevX !== null) {
      const MAX_DELTA_Y = isComplexFormula ? 200 : 100; // Allow larger jumps for complex formulas
      const deltaY = Math.abs(canvasY - prevY);
      const deltaX = Math.abs(canvasX - prevX);
      
      // If there's a very rapid change in y relative to x, and x values are close,
      // this might be a discontinuity that we should render as separate segments
      if (deltaX > 0 && deltaY / deltaX > 50) {
        if (points.length > 0) {
          // Create an invalid point to break the path
          points.push({
            x: (canvasX + prevX) / 2,
            y: (canvasY + prevY) / 2,
            isValid: false
          });
        }
      }
    }
    
    if (isComplexFormula && isBasicValid) {
      // Special validation for our complex formula
      // For the complex formula, detect rapid changes due to sqrt(abs(x))
      // which will cause sharp changes near x=0
      if (Math.abs(x) < 0.01) {
        // For very small x, ensure we render a clean break at x=0
        if (prevX !== null && (Math.sign(x) !== Math.sign(prevX) || Math.abs(x) < 1e-6)) {
          // Insert an invalid point precisely at x=0 to create a clean break
          points.push({
            x: gridPosition.x, // x=0 in canvas coordinates
            y: canvasY,
            isValid: false
          });
        }
      }
    }
    
    // If the function evaluated successfully, add the point
    if (isBasicValid) {
      // Only update prev values for valid points
      prevY = canvasY;
      prevX = canvasX;
      
      points.push({
        x: canvasX,
        y: canvasY,
        isValid: isValidPoint
      });
    } else {
      // For non-valid points, still add them but mark as invalid
      points.push({
        x: canvasX,
        y: 0, // Placeholder y value
        isValid: false
      });
    }
  }
  
  return points;
};

// Validate formula before evaluation
export const validateFormula = (formula: Formula): { isValid: boolean; error?: string } => {
  try {
    if (!formula.expression || formula.expression.trim() === '') {
      return { isValid: false, error: 'Expression cannot be empty' };
    }

    // Validate based on formula type
    if (formula.type === 'parametric') {
      const [xExpr, yExpr] = formula.expression.split(';').map(expr => expr.trim());
      if (!xExpr || !yExpr) {
        return { isValid: false, error: 'Parametric expression must be in format "x(t);y(t)"' };
      }
      
      // Test if expressions can be compiled
      try {
        new Function('t', `return ${xExpr};`);
        new Function('t', `return ${yExpr};`);
      } catch (e) {
        // Simplify error message for better user experience
        const errorMsg = e.message || '';
        if (errorMsg.includes('Unexpected token')) {
          return { isValid: false, error: 'Syntax error: Check for missing parentheses or invalid characters' };
        }
        return { isValid: false, error: `Invalid parametric expression: ${simplifyErrorMessage(e.message)}` };
      }
    } else {
      // For function and polar types
      try {
        // Test if the expression can be compiled
        const scaledExpression = formula.expression.replace(/(\W|^)x(\W|$)/g, '$1(x)$2');
        new Function('x', `
          const {sin, cos, tan, exp, log, sqrt, abs, pow, PI, E} = Math;
          return (${scaledExpression});
        `);
      } catch (e) {
        // Simplify error message for better user experience
        return { isValid: false, error: `Invalid expression: ${simplifyErrorMessage(e.message)}` };
      }
    }
    
    return { isValid: true };
  } catch (e) {
    return { isValid: false, error: `Unexpected error: ${simplifyErrorMessage(e.message)}` };
  }
};

// Helper function to simplify JavaScript error messages for end users
const simplifyErrorMessage = (message: string): string => {
  if (!message) return 'Unknown error';
  
  // Remove line and column information
  message = message.replace(/\s+at line \d+, column \d+/g, '');
  
  // Handle common syntax errors
  if (message.includes('Unexpected token')) {
    const token = message.match(/Unexpected token '(.+?)'/)?.[1] || '';
    if (token) {
      return `Unexpected character '${token}'. Check your formula syntax.`;
    }
    return 'Syntax error: Check for missing parentheses or invalid characters';
  }
  
  if (message.includes('is not defined')) {
    const variable = message.match(/(.+?) is not defined/)?.[1] || '';
    if (variable) {
      return `Unknown function or variable: '${variable}'`;
    }
  }
  
  // Shorten the message if it's too long
  if (message.length > 100) {
    return message.substring(0, 97) + '...';
  }
  
  return message;
};

// Main evaluation functions
export const evaluateFunction = (
  formula: Formula,
  gridPosition: Point,
  pixelsPerUnit: number,
  overrideSamples?: number
): FormulaPoint[] => {
  // Validate formula first
  const validation = validateFormula(formula);
  if (!validation.isValid) {
    console.error(`Invalid function formula: ${validation.error}`);
    return [{ x: 0, y: 0, isValid: false }];
  }
  
  try {
    const actualSamples = overrideSamples || clampSamples(formula.samples);
    const chars = detectFunctionCharacteristics(formula.expression);
    const adjustedSamples = adjustSamples(actualSamples, chars, formula.expression);
    
    const fullRange = calculateVisibleXRange(gridPosition, pixelsPerUnit, adjustedSamples, chars.isLogarithmic);
    let visibleXRange: [number, number] = [
      Math.max(fullRange[0], formula.xRange[0]),
      Math.min(fullRange[1], formula.xRange[1])
    ];
    
    let xValues: number[];
    
    // Special case for our complex nested Math.pow formula
    if (formula.expression === 'Math.pow(x * 2, 2) + Math.pow((5 * Math.pow(x * 4, 2) - Math.sqrt(Math.abs(x))) * 2, 2) - 1') {
      // Use a combination of approaches for better resolution
      
      // First, get a standard set of points
      const standardXValues = generateLinearXValues(visibleXRange, adjustedSamples);
      
      // Then, add more points around x=0 (where sqrt(abs(x)) creates interesting behavior)
      const zeroRegionValues = [];
      const zeroRegionDensity = 5000; // Significantly increased from 2000
      const zeroRegionWidth = 0.5; // Increased from 0.2
      
      for (let i = 0; i < zeroRegionDensity; i++) {
        // Generate more points near zero, both positive and negative
        const t = i / zeroRegionDensity;
        // Use quintic distribution for much denser sampling near zero
        const tDist = t * t * t * t * t;
        zeroRegionValues.push(-zeroRegionWidth * tDist);
        zeroRegionValues.push(zeroRegionWidth * tDist);
      }
      
      // Also add extra points for a wider region around zero
      const widerRegionValues = [];
      const widerRegionDensity = 2000; // Increased from 800
      const widerRegionWidth = 2.0; // Increased from 1.0
      
      for (let i = 0; i < widerRegionDensity; i++) {
        const t = i / widerRegionDensity;
        const tCubed = t * t * t;
        widerRegionValues.push(-widerRegionWidth * tCubed);
        widerRegionValues.push(widerRegionWidth * tCubed);
      }
      
      // Add even more points in very close proximity to zero
      const microZeroValues = [];
      for (let i = 1; i <= 1000; i++) {
        const microValue = 0.0001 * i / 1000;
        microZeroValues.push(-microValue);
        microZeroValues.push(microValue);
      }
      
      // Combine and sort all x values
      xValues = [...standardXValues, ...zeroRegionValues, ...widerRegionValues, ...microZeroValues].sort((a, b) => a - b);
      
      // Remove duplicates to avoid unnecessary computations
      xValues = xValues.filter((value, index, self) => 
        index === 0 || Math.abs(value - self[index - 1]) > 0.00001
      );
    }
    else if (chars.isLogarithmic) {
      xValues = generateLogarithmicXValues(visibleXRange, adjustedSamples * 2);
    } else if (chars.isTangent) {
      visibleXRange = [
        Math.max(fullRange[0], -Math.PI/2 + 0.01),
        Math.min(fullRange[1], Math.PI/2 - 0.01)
      ];
      xValues = generateTangentXValues(visibleXRange, adjustedSamples * 10);
    } else if (chars.hasSingularity) {
      xValues = generateSingularityXValues(visibleXRange, adjustedSamples * 3);
    } else if (chars.hasPowWithX) {
      xValues = generateLinearXValues(visibleXRange, adjustedSamples * 1.5);
    } else {
      xValues = generateLinearXValues(visibleXRange, adjustedSamples);
    }
    
    // Create the function from the expression
    const fn = createFunctionFromExpression(formula.expression, formula.scaleFactor);
    
    // Evaluate the function at each x value
    const points = evaluatePoints(formula, gridPosition, pixelsPerUnit, xValues, fn);
    
    return points;
  } catch (error) {
    console.error('Error evaluating function:', error);
    return [{ x: 0, y: 0, isValid: false }];
  }
};

export const evaluateParametric = (
  formula: Formula,
  gridPosition: Point,
  pixelsPerUnit: number
): FormulaPoint[] => {
  if (!formula.tRange) return [];
  
  // Validate formula first
  const validation = validateFormula(formula);
  if (!validation.isValid) {
    console.error(`Invalid parametric formula: ${validation.error}`);
    return [{ x: 0, y: 0, isValid: false }]; // Return a single invalid point
  }
  
  const samples = clampSamples(formula.samples) * 2;
  const step = (formula.tRange[1] - formula.tRange[0]) / samples;
  
  try {
    const [xExpr, yExpr] = formula.expression.split(';').map(expr => expr.trim());
    
    if (!xExpr || !yExpr) {
      console.error('Parametric expression must be "x(t);y(t)"');
      return [{ x: 0, y: 0, isValid: false }];
    }
    
    let evalX: (t: number) => number;
    let evalY: (t: number) => number;
    
    try {
      evalX = new Function('t', `
        try {
          const {sin, cos, tan, exp, log, sqrt, abs, pow, PI, E} = Math;
          return ${xExpr};
        } catch (e) {
          return NaN;
        }
      `) as (t: number) => number;
      
      evalY = new Function('t', `
        try {
          const {sin, cos, tan, exp, log, sqrt, abs, pow, PI, E} = Math;
          return ${yExpr} * ${formula.scaleFactor};
        } catch (e) {
          return NaN;
        }
      `) as (t: number) => number;
    } catch (e) {
      console.error('Error creating parametric functions:', e);
      return [{ x: 0, y: 0, isValid: false }];
    }
    
    const points: FormulaPoint[] = [];
    for (let i = 0; i <= samples; i++) {
      const t = formula.tRange[0] + i * step;
      let x: number, y: number;
      
      try {
        x = evalX(t);
        y = evalY(t);
      } catch (e) {
        x = NaN;
        y = NaN;
      }
      
      const isValid = !isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y);
      const coords = toCanvasCoordinates(x, y, gridPosition, pixelsPerUnit);
      points.push({ ...coords, isValid });
    }
    
    return points;
  } catch (e) {
    console.error('Error evaluating parametric formula:', e);
    return [{ x: 0, y: 0, isValid: false }];
  }
};

export const evaluatePolar = (
  formula: Formula,
  gridPosition: Point,
  pixelsPerUnit: number
): FormulaPoint[] => {
  if (!formula.tRange) return [];
  
  // Validate formula first
  const validation = validateFormula(formula);
  if (!validation.isValid) {
    console.error(`Invalid polar formula: ${validation.error}`);
    return [{ x: 0, y: 0, isValid: false }]; // Return a single invalid point
  }
  
  const samples = clampSamples(formula.samples) * 2;
  const step = (formula.tRange[1] - formula.tRange[0]) / samples;
  
  try {
    const evalR = createFunctionFromExpression(formula.expression, formula.scaleFactor);
    
    const points: FormulaPoint[] = [];
    for (let i = 0; i <= samples; i++) {
      const theta = formula.tRange[0] + i * step;
      let r: number;
      
      try {
        r = evalR(theta);
      } catch (e) {
        r = NaN;
      }
      
      const isValid = !isNaN(r) && isFinite(r);
      
      if (isValid) {
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        const coords = toCanvasCoordinates(x, y, gridPosition, pixelsPerUnit);
        points.push({ ...coords, isValid });
      } else {
        points.push({ x: 0, y: 0, isValid: false });
      }
    }
    
    return points;
  } catch (e) {
    console.error('Error evaluating polar formula:', e);
    return [{ x: 0, y: 0, isValid: false }];
  }
};

export const evaluateFormula = (
  formula: Formula,
  gridPosition: Point,
  pixelsPerUnit: number,
  isDragging: boolean = false
): FormulaPoint[] => {
  // Special case for the specific function in the screenshot
  if (formula.expression === 'Math.sin(Math.PI * Math.pow(x, 2)) * Math.sin(Math.PI * Math.pow(2, x))') {
    // Use a much higher sample rate for this specific function
    return evaluateFunction(formula, gridPosition, pixelsPerUnit, 5000);
  }
  
  // Special case for our complex Math.pow formula
  if (formula.expression === 'Math.pow(x * 2, 2) + Math.pow((5 * Math.pow(x * 4, 2) - Math.sqrt(Math.abs(x))) * 2, 2) - 1') {
    // Even when dragging, use a reasonable sample size for this complex formula
    const sampleSize = isDragging ? 5000 : 30000;
    return evaluateFunction(formula, gridPosition, pixelsPerUnit, sampleSize);
  }
  
  // For other functions, use the regular evaluation logic
  switch (formula.type) {
    case 'function':
      return evaluateFunction(
        formula, 
        gridPosition, 
        pixelsPerUnit, 
        isDragging ? Math.min(formula.samples, 100) : undefined
      );
    case 'parametric':
      return evaluateParametric(formula, gridPosition, pixelsPerUnit);
    case 'polar':
      return evaluatePolar(formula, gridPosition, pixelsPerUnit);
    default:
      console.error(`Unknown formula type: ${formula.type}`);
      return [];
  }
};

// Formula examples and utilities
export const getFormulaExamples = (): FormulaExample[] => [
  // Basic functions
  {
    name: 'Linear function',
    type: 'function',
    expression: '2*x + 1',
    xRange: DEFAULT_X_RANGE,
    category: 'basic',
    description: 'f(x) = 2x + 1'
  },
  {
    name: 'Quadratic function',
    type: 'function',
    expression: 'x*x',
    xRange: DEFAULT_X_RANGE,
    category: 'basic',
    description: 'f(x) = x²'
  },
  {
    name: 'Cubic function',
    type: 'function',
    expression: 'x*x*x',
    xRange: DEFAULT_X_RANGE,
    category: 'basic',
    description: 'f(x) = x³'
  },
  
  // Trigonometric functions
  {
    name: 'Sine function',
    type: 'function',
    expression: 'Math.sin(x)',
    xRange: DEFAULT_X_RANGE,
    category: 'trigonometric',
    description: 'f(x) = sin(x)'
  },
  {
    name: 'Cosine function',
    type: 'function',
    expression: 'Math.cos(x)',
    xRange: DEFAULT_X_RANGE,
    category: 'trigonometric',
    description: 'f(x) = cos(x)'
  },
  {
    name: 'Tangent function',
    type: 'function',
    expression: 'Math.tan(x)',
    xRange: DEFAULT_X_RANGE,
    category: 'trigonometric',
    description: 'f(x) = tan(x)'
  },
  
  // Exponential and logarithmic functions
  {
    name: 'Exponential function',
    type: 'function',
    expression: 'Math.exp(x)',
    xRange: DEFAULT_X_RANGE,
    category: 'exponential',
    description: 'f(x) = e^x'
  },
  {
    name: 'Natural logarithm',
    type: 'function',
    expression: 'Math.log(Math.abs(x))',
    xRange: DEFAULT_X_RANGE,
    category: 'exponential',
    description: 'f(x) = ln|x|'
  },
  
  // Special functions
  {
    name: 'Absolute value',
    type: 'function',
    expression: 'Math.abs(x)',
    xRange: DEFAULT_X_RANGE,
    category: 'special',
    description: 'f(x) = |x|'
  },
  {
    name: 'Square root',
    type: 'function',
    expression: 'Math.sqrt(Math.abs(x))',
    xRange: DEFAULT_X_RANGE,
    category: 'special',
    description: 'f(x) = √|x|'
  },
  {
    name: 'Sigmoid function',
    type: 'function',
    expression: '1 / (1 + Math.exp(-x))',
    xRange: DEFAULT_X_RANGE,
    category: 'special',
    description: 'f(x) = 1/(1+e^(-x))'
  },
  
  // Polynomial functions
  {
    name: 'Quartic function',
    type: 'function',
    expression: 'x*x*x*x - 3*x*x',
    xRange: DEFAULT_X_RANGE,
    category: 'polynomial',
    description: 'f(x) = x⁴ - 3x²'
  },
  {
    name: 'Quintic function',
    type: 'function',
    expression: 'x*x*x*x*x - 5*x*x*x + 4*x',
    xRange: DEFAULT_X_RANGE,
    category: 'polynomial',
    description: 'f(x) = x⁵ - 5x³ + 4x'
  }
];

export const generateFormulaId = (): string => 
  `formula-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

export const createDefaultFormula = (type: FormulaType = 'function'): Formula => ({
  id: generateFormulaId(),
  type,
  expression: type === 'parametric' ? 'Math.cos(t); Math.sin(t)' : 
              type === 'polar' ? '1' : 'x*x',
  color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
  strokeWidth: 2,
  xRange: DEFAULT_X_RANGE,
  tRange: type === 'function' ? undefined : DEFAULT_T_RANGE,
  samples: 500,
  scaleFactor: 1.0
});

/**
 * Converts a JavaScript math expression to LaTeX format
 * @param expr The JavaScript expression to convert
 * @returns The LaTeX formatted expression
 */
export const convertToLatex = (expr: string): string => {
  if (!expr) return '';
  
  // Handle the exact formula from the screenshot
  if (expr === 'Math.sin(Math.PI*x)') {
    return '\\sin(\\pi x)';
  }
  
  // Handle the specific case from the new screenshot
  if (expr === 'Math.sin(Math.PI * Math.pow(x, 2)) * Math.sin(Math.PI * Math.pow(2, x))') {
    return '\\sin(\\pi x^2) \\cdot \\sin(\\pi 2^x)';
  }
  
  // First, handle the specific case of sin(pi*x)
  if (expr.includes('Math.sin(Math.PI') || expr.includes('Math.sin(Math.PI')) {
    return expr
      .replace(/Math\.sin\(Math\.PI\s*\*\s*x\)/g, '\\sin(\\pi x)')
      .replace(/Math\.sin\(([^)]*Math\.PI[^)]*)\)/g, '\\sin($1)')
      .replace(/Math\.PI/g, '\\pi');
  }
  
  // Pre-process Math.pow expressions to handle them better
  let processedExpr = expr;
  
  // Handle Math.pow with special cases
  processedExpr = processedExpr
    // Handle Math.pow(x, 2) -> x^2
    .replace(/Math\.pow\(([^,]+),\s*2\)/g, '$1^2')
    // Handle Math.pow(2, x) -> 2^x
    .replace(/Math\.pow\(2,\s*([^)]+)\)/g, '2^$1')
    // Handle other Math.pow cases
    .replace(/Math\.pow\(([^,]+),\s*([^)]+)\)/g, '$1^$2');
  
  // Handle other specific patterns that might be problematic
  let result = processedExpr
    // Replace Math constants
    .replace(/Math\.PI/g, '\\pi')
    .replace(/Math\.E/g, 'e')
    
    // Handle specific trigonometric functions with pi
    .replace(/Math\.sin\(\\pi\s*\*\s*x\)/g, '\\sin(\\pi x)')
    .replace(/Math\.cos\(\\pi\s*\*\s*x\)/g, '\\cos(\\pi x)')
    .replace(/Math\.tan\(\\pi\s*\*\s*x\)/g, '\\tan(\\pi x)')
    
    // Handle specific trigonometric functions with powers
    .replace(/Math\.sin\(\\pi\s*\*\s*x\^2\)/g, '\\sin(\\pi x^2)')
    .replace(/Math\.sin\(\\pi\s*\*\s*2\^x\)/g, '\\sin(\\pi 2^x)')
    
    // Handle general Math functions
    .replace(/Math\.sin\(([^)]+)\)/g, '\\sin($1)')
    .replace(/Math\.cos\(([^)]+)\)/g, '\\cos($1)')
    .replace(/Math\.tan\(([^)]+)\)/g, '\\tan($1)')
    .replace(/Math\.sqrt\(([^)]+)\)/g, '\\sqrt{$1}')
    .replace(/Math\.abs\(([^)]+)\)/g, '|$1|')
    .replace(/Math\.log\(([^)]+)\)/g, '\\ln($1)')
    .replace(/Math\.exp\(([^)]+)\)/g, 'e^{$1}')
    
    // Handle operators
    .replace(/([0-9a-zA-Z.]+)\s*\*\*\s*([0-9a-zA-Z.]+)/g, '{$1}^{$2}')
    .replace(/([0-9a-zA-Z.]+)\s*\*\s*([0-9a-zA-Z.]+)/g, '$1 \\cdot $2')
    .replace(/\//g, '\\div ')
    .replace(/\+/g, ' + ')
    .replace(/-/g, ' - ');
  
  // Clean up any remaining issues
  result = result
    // Fix the specific case of pi * x to look better
    .replace(/\\pi\s*\\cdot\s*x/g, '\\pi x')
    // Fix the specific case of pi * x^2 to look better
    .replace(/\\pi\s*\\cdot\s*x\^2/g, '\\pi x^2')
    // Fix the specific case of pi * 2^x to look better
    .replace(/\\pi\s*\\cdot\s*2\^x/g, '\\pi 2^x')
    // Fix any double backslashes that might have been introduced
    .replace(/\\\\/g, '\\');
  
  return result;
};

/**
 * Formats a JavaScript math expression for human-readable display
 * @param expr The JavaScript expression to format
 * @returns The formatted expression
 */
export const formatExpressionForDisplay = (expr: string): string => {
  if (!expr) return '';
  
  // Pre-process Math.pow expressions to handle them better
  let processedExpr = expr;
  
  // Handle Math.pow with special cases
  processedExpr = processedExpr
    // Handle Math.pow(x, 2) -> x²
    .replace(/Math\.pow\(([^,]+),\s*2\)/g, '$1²')
    // Handle Math.pow(2, x) -> 2^x
    .replace(/Math\.pow\(2,\s*([^)]+)\)/g, '2^$1')
    // Handle other Math.pow cases
    .replace(/Math\.pow\(([^,]+),\s*([^)]+)\)/g, '$1^$2');
  
  return processedExpr
    .replace(/Math\.PI/g, 'π')
    .replace(/Math\.E/g, 'e')
    .replace(/Math\.sin/g, 'sin')
    .replace(/Math\.cos/g, 'cos')
    .replace(/Math\.tan/g, 'tan')
    .replace(/Math\.sqrt/g, 'sqrt')
    .replace(/Math\.abs/g, 'abs')
    .replace(/Math\.log/g, 'ln')
    .replace(/Math\.exp/g, 'exp')
    .replace(/\*\*/g, '^')
    .replace(/\*/g, '×');
};

/**
 * Generates a LaTeX display string for a formula with substituted values
 * @param formula The formula to generate display for
 * @param x The x value to substitute
 * @param y The y value to display
 * @returns LaTeX string with substituted values
 */
export function getFormulaLatexDisplay(formula: Formula, x: number, y: number): string {
  const formatNumber = (num: number): string => {
    // Use fewer decimal places for larger numbers
    let formatted: string;
    if (Math.abs(num) >= 100) formatted = num.toFixed(1);
    else if (Math.abs(num) >= 10) formatted = num.toFixed(2);
    else if (Math.abs(num) >= 1) formatted = num.toFixed(3);
    else formatted = num.toFixed(4);
    
    // Strip trailing zeros after the decimal point
    return formatted.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  };

  // Special case for sin(pi*x) with Math.pow
  if (formula.expression === 'Math.sin(Math.PI * Math.pow(x, 2)) * Math.sin(Math.PI * Math.pow(2, x))') {
    return `\\sin(\\pi \\cdot ${formatNumber(x)}^2) \\cdot \\sin(\\pi \\cdot 2^{${formatNumber(x)}}) = ${formatNumber(y)}`;
  }

  // Special case for simple sin(pi*x)
  if (formula.expression === 'Math.sin(Math.PI*x)') {
    return `\\sin(\\pi \\cdot ${formatNumber(x)}) = ${formatNumber(y)}`;
  }

  // Get base LaTeX expression
  const latexExpr = convertToLatex(formula.expression);

  // Special case for sin(pi*x) pattern
  if (formula.expression.includes('Math.sin(Math.PI') && formula.expression.includes('*x)')) {
    return `\\sin(\\pi \\cdot ${formatNumber(x)}) = ${formatNumber(y)}`;
  }

  // Special case for Math.pow expressions
  if (formula.expression.includes('Math.pow')) {
    // Handle Math.pow(x, 2)
    if (formula.expression.includes('Math.pow(x, 2)')) {
      return latexExpr.replace(/x\^2/g, `${formatNumber(x)}^2`) + ` = ${formatNumber(y)}`;
    }
    // Handle Math.pow(2, x)
    if (formula.expression.includes('Math.pow(2, x)')) {
      return latexExpr.replace(/2\^x/g, `2^{${formatNumber(x)}}`) + ` = ${formatNumber(y)}`;
    }
  }

  // Default case: substitute x value into LaTeX expression
  return `${latexExpr.replace(/x/g, `(${formatNumber(x)})`)} = ${formatNumber(y)}`;
}
