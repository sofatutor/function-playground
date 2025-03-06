import { Formula, FormulaPoint, FormulaExample, FormulaExampleCategory, FormulaType } from "@/types/formula";
import { Point } from "@/types/shapes";

// Constants for formula evaluation
const MAX_SAMPLES = 1000;
const MIN_SAMPLES = 100;

/**
 * Generate points for a mathematical function of the form y = f(x)
 */
export const evaluateFunction = (
  formula: Formula, 
  gridPosition: Point,
  pixelsPerUnit: number,
  overrideSamples?: number
): FormulaPoint[] => {
  const { expression, xRange, samples, scaleFactor } = formula;
  const actualSamples = overrideSamples || Math.min(Math.max(samples, MIN_SAMPLES), MAX_SAMPLES);
  
  // Calculate the visible range of the grid
  // Use a very wide range to ensure the function is plotted across the entire grid
  // Get approximate canvas dimensions
  const canvasWidth = Math.max(window.innerWidth, 1000);
  const canvasHeight = Math.max(window.innerHeight, 800);
  
  // Calculate the visible x-range in mathematical coordinates
  // Add extra padding to ensure the function extends beyond the visible area
  // Use less padding if we're using fewer samples (during dragging)
  const padding = actualSamples < 300 ? 5 : 10; // Less padding during dragging
  const leftEdgeX = ((0 - gridPosition.x) / pixelsPerUnit) - padding;
  const rightEdgeX = ((canvasWidth - gridPosition.x) / pixelsPerUnit) + padding;
  
  // Check if this is a tangent function
  const isTangent = expression.includes('Math.tan(') || 
                    expression === 'Math.tan(x)' || 
                    expression.includes('tan(x)');
  
  // For tangent functions, we need to restrict the domain to avoid multiple periods
  let visibleXRange: [number, number];
  
  if (isTangent) {
    // For tangent, we'll always plot the period containing the origin (0,0)
    // Tangent has period π, and asymptotes at odd multiples of π/2
    const PI = Math.PI;
    
    // The period containing the origin is from -π/2 to π/2
    // Add small offsets to avoid the asymptotes
    const periodStart = -PI/2 + 0.1;
    const periodEnd = PI/2 - 0.1;
    
    visibleXRange = [periodStart, periodEnd];
    console.log(`Plotting tangent function with central period: [${periodStart}, ${periodEnd}]`);
  } else {
    // For other functions, use the visible range of the grid
    visibleXRange = [
      Math.max(leftEdgeX, xRange[0]), 
      Math.min(rightEdgeX, xRange[1])
    ];
  }
  
  // Calculate the step size based on the visible range and number of samples
  const xStep = (visibleXRange[1] - visibleXRange[0]) / actualSamples;
  
  // Generate points
  const points: FormulaPoint[] = [];
  
  try {
    // Create a function from the expression
    // Use a modified version of the expression that applies the scale factor
    // The scale factor affects the y-values: larger values stretch the graph vertically,
    // smaller values flatten it
    const scaledExpression = expression.replace(/x/g, '(x)');
    const fn = new Function('x', `
      try {
        const Math = window.Math;
        const result = ${scaledExpression};
        return result * ${scaleFactor};
      } catch (e) {
        return NaN;
      }
    `);
    
    // Sample the function at regular intervals
    for (let i = 0; i <= actualSamples; i++) {
      const x = visibleXRange[0] + i * xStep;
      let y: number;
      
      try {
        y = fn(x);
      } catch (e) {
        y = NaN;
      }
      
      // Check if the result is valid
      const isValid = !isNaN(y) && isFinite(y);
      
      // Convert mathematical coordinates to canvas coordinates
      const canvasX = gridPosition.x + x * pixelsPerUnit;
      const canvasY = gridPosition.y - y * pixelsPerUnit; // Flip y-axis
      
      points.push({
        x: canvasX,
        y: canvasY,
        isValid
      });
    }
  } catch (error) {
    console.error('Error evaluating function:', error);
    // Return an empty array if there's an error
    return [];
  }
  
  return points;
};

/**
 * Generate points for a parametric function of the form x = f(t), y = g(t)
 */
export const evaluateParametric = (
  formula: Formula, 
  gridPosition: Point,
  pixelsPerUnit: number
): FormulaPoint[] => {
  const { expression, tRange, samples, scaleFactor } = formula;
  
  if (!tRange) {
    return [];
  }

  const actualSamples = Math.min(Math.max(samples, MIN_SAMPLES), MAX_SAMPLES);
  
  // For parametric functions, we'll keep using tRange as it defines the parameter range
  // But we'll increase the number of samples for better coverage
  const enhancedSamples = Math.min(actualSamples * 2, MAX_SAMPLES);
  const step = (tRange[1] - tRange[0]) / enhancedSamples;
  const points: FormulaPoint[] = [];

  try {
    // Split the expression into x(t) and y(t) parts
    const [xExpr, yExpr] = expression.split(';').map(expr => expr.trim());
    
    if (!xExpr || !yExpr) {
      throw new Error('Parametric expression must be in the form "x(t);y(t)"');
    }

    // Create functions for x(t) and y(t)
    // eslint-disable-next-line no-new-func
    const evalX = new Function('t', `try { return ${xExpr}; } catch(e) { return NaN; }`);
    // eslint-disable-next-line no-new-func
    const evalY = new Function('t', `try { 
      const result = ${yExpr}; 
      return result * ${scaleFactor}; 
    } catch(e) { return NaN; }`);

    for (let i = 0; i <= enhancedSamples; i++) {
      const t = tRange[0] + i * step;
      
      let x: number, y: number;
      
      try {
        x = evalX(t);
        y = evalY(t);
      } catch (error) {
        x = NaN;
        y = NaN;
      }

      // Skip invalid points
      const isValid = !isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y);
      
      // Convert from mathematical coordinates to canvas coordinates
      const canvasX = gridPosition.x + x * pixelsPerUnit;
      const canvasY = gridPosition.y - y * pixelsPerUnit;
      
      points.push({ x: canvasX, y: canvasY, isValid });
    }

    return points;
  } catch (error) {
    console.error('Error evaluating parametric function:', error);
    return [];
  }
};

/**
 * Generate points for a polar function of the form r = f(θ)
 */
export const evaluatePolar = (
  formula: Formula, 
  gridPosition: Point,
  pixelsPerUnit: number
): FormulaPoint[] => {
  const { expression, tRange, samples, scaleFactor } = formula;
  
  if (!tRange) {
    return [];
  }

  const actualSamples = Math.min(Math.max(samples, MIN_SAMPLES), MAX_SAMPLES);
  
  // For polar functions, we'll increase the number of samples for smoother curves
  const enhancedSamples = Math.min(actualSamples * 2, MAX_SAMPLES);
  const step = (tRange[1] - tRange[0]) / enhancedSamples;
  const points: FormulaPoint[] = [];

  try {
    // Create a function to evaluate r(θ)
    // eslint-disable-next-line no-new-func
    const evalFunc = new Function('theta', `try { 
      const result = ${expression}; 
      return result * ${scaleFactor}; 
    } catch(e) { return NaN; }`);

    for (let i = 0; i <= enhancedSamples; i++) {
      const theta = tRange[0] + i * step;
      let r: number;
      
      try {
        r = evalFunc(theta);
      } catch (error) {
        r = NaN;
      }

      // Skip invalid points
      const isValid = !isNaN(r) && isFinite(r);
      
      if (isValid) {
        // Convert polar (r, θ) to Cartesian (x, y)
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        
        // Convert from mathematical coordinates to canvas coordinates
        const canvasX = gridPosition.x + x * pixelsPerUnit;
        const canvasY = gridPosition.y - y * pixelsPerUnit;
        
        points.push({ x: canvasX, y: canvasY, isValid });
      } else {
        // Include invalid point to create a discontinuity in the graph
        points.push({ x: 0, y: 0, isValid: false });
      }
    }

    return points;
  } catch (error) {
    console.error('Error evaluating polar function:', error);
    return [];
  }
};

/**
 * Generate points for any type of formula
 */
export const evaluateFormula = (
  formula: Formula, 
  gridPosition: Point,
  pixelsPerUnit: number,
  isDragging: boolean = false
): FormulaPoint[] => {
  // During dragging, use a much smaller number of samples for better performance
  const dragSamples = isDragging ? Math.min(Math.max(Math.floor(formula.samples / 5), MIN_SAMPLES / 5), MAX_SAMPLES / 5) : undefined;
  
  // Check if this is a tangent function
  const isTangent = formula.expression.includes('Math.tan(') || 
                    formula.expression === 'Math.tan(x)' || 
                    formula.expression.includes('tan(x)');
  
  // Always use function evaluation for all formula types
  // This simplifies the code and ensures consistent behavior
  return evaluateFunction(
    formula, 
    gridPosition, 
    pixelsPerUnit, 
    dragSamples
  );
};

/**
 * Generate formula examples
 */
export const getFormulaExamples = (): FormulaExample[] => {
  // Define a standard wide range for all examples
  const standardRange: [number, number] = [-10000, 10000];
  
  return [
    // Basic functions
    {
      name: 'Linear function',
      type: 'function',
      expression: '2*x + 1',
      xRange: standardRange,
      category: 'basic',
      description: 'f(x) = 2x + 1'
    },
    {
      name: 'Quadratic function',
      type: 'function',
      expression: 'x*x',
      xRange: standardRange,
      category: 'basic',
      description: 'f(x) = x²'
    },
    {
      name: 'Cubic function',
      type: 'function',
      expression: 'x*x*x',
      xRange: standardRange,
      category: 'basic',
      description: 'f(x) = x³'
    },
    
    // Trigonometric functions
    {
      name: 'Sine function',
      type: 'function',
      expression: 'Math.sin(x)',
      xRange: standardRange,
      category: 'trigonometric',
      description: 'f(x) = sin(x)'
    },
    {
      name: 'Cosine function',
      type: 'function',
      expression: 'Math.cos(x)',
      xRange: standardRange,
      category: 'trigonometric',
      description: 'f(x) = cos(x)'
    },
    {
      name: 'Tangent function',
      type: 'function',
      expression: 'Math.tan(x)',
      xRange: standardRange,
      category: 'trigonometric',
      description: 'f(x) = tan(x)'
    },
    
    // Exponential and logarithmic functions
    {
      name: 'Exponential function',
      type: 'function',
      expression: 'Math.exp(x)',
      xRange: standardRange,
      category: 'exponential',
      description: 'f(x) = e^x'
    },
    {
      name: 'Natural logarithm',
      type: 'function',
      expression: 'Math.log(Math.abs(x))',
      xRange: standardRange,
      category: 'exponential',
      description: 'f(x) = ln|x|'
    },
    
    // Special functions
    {
      name: 'Absolute value',
      type: 'function',
      expression: 'Math.abs(x)',
      xRange: standardRange,
      category: 'special',
      description: 'f(x) = |x|'
    },
    {
      name: 'Square root',
      type: 'function',
      expression: 'Math.sqrt(Math.abs(x))',
      xRange: standardRange,
      category: 'special',
      description: 'f(x) = √|x|'
    },
    {
      name: 'Sigmoid function',
      type: 'function',
      expression: '1 / (1 + Math.exp(-x))',
      xRange: standardRange,
      category: 'special',
      description: 'f(x) = 1/(1+e^(-x))'
    },
    
    // Polynomial functions
    {
      name: 'Quartic function',
      type: 'function',
      expression: 'x*x*x*x - 3*x*x',
      xRange: standardRange,
      category: 'polynomial',
      description: 'f(x) = x⁴ - 3x²'
    },
    {
      name: 'Quintic function',
      type: 'function',
      expression: 'x*x*x*x*x - 5*x*x*x + 4*x',
      xRange: standardRange,
      category: 'polynomial',
      description: 'f(x) = x⁵ - 5x³ + 4x'
    }
  ];
};

/**
 * Generate a unique ID for a formula
 */
export const generateFormulaId = (): string => {
  return 'formula-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
};

/**
 * Create a default formula with the given type
 */
export const createDefaultFormula = (type: FormulaType = 'function'): Formula => {
  // Always create function type formulas
  const formulaType: FormulaType = 'function';
  
  // Use a very wide xRange to ensure the graph doesn't stop when moving the canvas
  // This range is large enough to cover most practical use cases
  const xRange: [number, number] = [-10000, 10000];

  // Generate a random color and ensure it has 6 digits
  const randomColor = Math.floor(Math.random() * 16777215).toString(16);
  const paddedColor = randomColor.padStart(6, '0');

  return {
    id: generateFormulaId(),
    type: formulaType,
    expression: 'x*x', // Default to a simple quadratic function
    color: '#' + paddedColor, // Random color with 6 digits
    strokeWidth: 2,
    xRange: xRange,
    samples: 500, // Increase samples for smoother curves
    scaleFactor: 1.0 // Default scale factor
  };
};
