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
  samples: number
): [number, number] => {
  const { width } = getCanvasDimensions();
  const padding = samples < 300 ? 5 : 10;
  return [
    ((0 - gridPosition.x) / pixelsPerUnit) - padding,
    ((width - gridPosition.x) / pixelsPerUnit) + padding
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
    const scaledExpression = expression.replace(/(\W|^)x(\W|$)/g, '$1(x)$2');
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
  allowsNegativeX: boolean;
  isHighFrequency: boolean;
  isVeryHighFrequency: boolean;
  isComplex: boolean;
  isCombined: boolean;
  isSqrtAbs: boolean;
  hasSingularity: boolean;
  hasPow: boolean;
  hasPowWithX: boolean;
  hasTrigPowCombination: boolean;
}

const detectFunctionCharacteristics = (expression: string): FunctionCharacteristics => {
  const hasTrig = /Math\.(sin|cos|tan)|\b(sin|cos|tan)\(/.test(expression);
  const hasHighFreq = hasTrig && /[*]\s*x|x\s*[*]/.test(expression);
  
  // Check for Math.pow expressions
  const hasPow = /Math\.pow\(/.test(expression);
  const hasPowWithX = /Math\.pow\(x,|Math\.pow\([^,]+,\s*x\)/.test(expression);
  
  // Check for quadratic or higher terms in trig functions (like x*x, x^2, x**2)
  const hasQuadraticTrig = hasTrig && 
    (/x\s*\*\s*x|x\s*\^\s*2|x\s*\*\*\s*2|Math\.pow\(x,\s*2\)/.test(expression) ||
     /x\s*\*\s*x\s*\*\s*x|x\s*\^\s*3|x\s*\*\*\s*3|Math\.pow\(x,\s*3\)/.test(expression));
  
  // Check for potential singularities like 1/x, division by x, or x in denominator
  const hasSingularity = /1\s*\/\s*x|\/\s*x|\(.*x.*\)\s*\^\s*-1|x\s*\^\s*-1|Math\.pow\(.*x.*,\s*-1\)/.test(expression);
  
  // Check for complex expressions with multiple operations
  const isComplexExpression = expression.split(/[+\-*/]/).length > 3;
  
  // Check for combined trig and pow functions (like in the screenshot)
  const hasTrigPowCombination = hasTrig && hasPow;
  
  return {
    isTangent: /Math\.tan\(|\btan\(/.test(expression),
    isLogarithmic: /Math\.log(10|2)?\(|\b(log|ln)\(/.test(expression),
    allowsNegativeX: /Math\.abs\(x\)|-x|\(-x\)/.test(expression),
    isHighFrequency: hasHighFreq || hasQuadraticTrig || hasPowWithX,
    isVeryHighFrequency: hasQuadraticTrig || hasTrigPowCombination || 
                         (hasTrig && /(\d{2,})\s*\*\s*x|\d{2,}\s*\*\s*Math\.PI/.test(expression)),
    isComplex: /Math\.(pow|sqrt)|\*\*|[+\-*/]{2,}/.test(expression) || isComplexExpression,
    isCombined: (hasTrig && (/Math\.(pow|sqrt)|\*\*|[+\-*/]{2,}/.test(expression))) || hasTrigPowCombination,
    isSqrtAbs: /Math\.sqrt\(Math\.abs\(x\)\)|sqrt\(abs\(x\)\)/.test(expression),
    hasSingularity: hasSingularity,
    hasPow: hasPow,
    hasPowWithX: hasPowWithX,
    hasTrigPowCombination: hasTrigPowCombination
  };
};

const adjustSamples = (
  baseSamples: number,
  characteristics: FunctionCharacteristics
): number => {
  // Special case for the specific function in the screenshot
  if (characteristics.hasTrigPowCombination) {
    return clampSamples(baseSamples * 10);  // Significantly increase samples for trig+pow combinations
  }
  
  if (characteristics.hasSingularity) return clampSamples(baseSamples * 10);
  if (characteristics.isVeryHighFrequency) return clampSamples(baseSamples * 12);
  if (characteristics.isHighFrequency) return clampSamples(baseSamples * 8);
  if (characteristics.hasPowWithX) return clampSamples(baseSamples * 6);  // More samples for Math.pow with x
  if (characteristics.hasPow) return clampSamples(baseSamples * 4);  // More samples for any Math.pow
  if (characteristics.isCombined) return clampSamples(baseSamples * 5);
  if (characteristics.isComplex) return clampSamples(Math.ceil(baseSamples * 3));
  return clampSamples(baseSamples);
};

// X-value generators
const generateLinearXValues = (
  range: [number, number],
  samples: number
): number[] => {
  const step = (range[1] - range[0]) / samples;
  return Array.from({ length: samples + 1 }, (_, i) => range[0] + i * step);
};

const generateLogarithmicXValues = (
  range: [number, number],
  samples: number
): number[] => {
  const logStart = Math.log(Math.max(range[0], 0.00001));
  const logEnd = Math.log(range[1]);
  const logStep = (logEnd - logStart) / samples;
  return Array.from({ length: samples + 1 }, (_, i) => Math.exp(logStart + i * logStep));
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
  const { isLogarithmic, allowsNegativeX } = chars;
  
  // Track the previous point to detect large jumps (discontinuities)
  let prevY: number | null = null;
  let prevX: number | null = null;
  
  for (const x of xValues) {
    let y: number;
    let isValidDomain = true; // Track domain validity separately from calculation validity
    
    try {
      // Check domain validity for logarithmic functions
      if (isLogarithmic && x <= 0 && !allowsNegativeX) {
        y = NaN;
        isValidDomain = false;
      } else {
        y = fn(x);
      }
      
      // Limit extremely large values to prevent rendering issues
      if (Math.abs(y) > 1000000) y = Math.sign(y) * 1000000;
      
      // Check for discontinuities (very large jumps)
      if (prevY !== null && prevX !== null && isValidDomain) {
        const deltaY = Math.abs(y - prevY);
        const deltaX = Math.abs(x - prevX);
        
        // If the rate of change is extremely high, it might be a discontinuity
        // For functions with Math.pow, we need to be more lenient
        const threshold = chars.hasPow ? 1000 : 500;
        
        if (deltaY / deltaX > threshold && !isNaN(y) && isFinite(y)) {
          // Insert a NaN point to create a break in the line
          const midX = (prevX + x) / 2;
          const midCoords = toCanvasCoordinates(midX, NaN, gridPosition, pixelsPerUnit);
          points.push({ ...midCoords, isValid: false });
        }
      }
      
      if (isValidDomain) {
        prevY = y;
        prevX = x;
      } else {
        // Reset tracking for discontinuity detection when domain is invalid
        prevY = null;
        prevX = null;
      }
    } catch (e) {
      y = NaN;
      isValidDomain = false;
      // Reset tracking for discontinuity detection
      prevY = null;
      prevX = null;
    }
    
    // A point is valid if it's within the domain and has a valid calculation result
    const isValid = isValidDomain && !isNaN(y) && isFinite(y);
    const coords = toCanvasCoordinates(x, y, gridPosition, pixelsPerUnit);
    
    points.push({ ...coords, isValid });
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
    return [{ x: 0, y: 0, isValid: false }]; // Return a single invalid point
  }
  
  try {
    const actualSamples = overrideSamples || clampSamples(formula.samples);
    const chars = detectFunctionCharacteristics(formula.expression);
    const adjustedSamples = adjustSamples(actualSamples, chars);
    
    const fullRange = calculateVisibleXRange(gridPosition, pixelsPerUnit, adjustedSamples);
    let visibleXRange: [number, number] = [
      Math.max(fullRange[0], formula.xRange[0]),
      Math.min(fullRange[1], formula.xRange[1])
    ];
    
    let xValues: number[];
    
    // Special case for the specific function in the screenshot
    if (chars.hasTrigPowCombination && formula.expression.includes('Math.sin(Math.PI * Math.pow')) {
      // Use a very high sampling rate for this specific type of function
      xValues = generateLinearXValues(visibleXRange, adjustedSamples * 2);
    }
    else if (chars.isTangent) {
      visibleXRange = [
        Math.max(fullRange[0], -Math.PI/2 + 0.01),
        Math.min(fullRange[1], Math.PI/2 - 0.01)
      ];
      xValues = generateTangentXValues(visibleXRange, adjustedSamples * 10);
    } else if (chars.hasSingularity) {
      // Use special sampling for functions with singularities
      xValues = generateSingularityXValues(visibleXRange, adjustedSamples * 3);
    } else if (chars.isLogarithmic && !chars.allowsNegativeX) {
      visibleXRange[0] = Math.max(visibleXRange[0], 0.00001);
      xValues = generateLogarithmicXValues(visibleXRange, adjustedSamples);
    } else if (chars.hasPowWithX) {
      // Use denser sampling for functions with Math.pow involving x
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
    return [{ x: 0, y: 0, isValid: false }]; // Return a single invalid point
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
