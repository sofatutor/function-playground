
import { Formula, FormulaPoint, FormulaExample, FormulaExampleCategory } from "@/types/formula";
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
  pixelsPerUnit: number
): FormulaPoint[] => {
  const { expression, xRange, samples } = formula;
  const actualSamples = Math.min(Math.max(samples, MIN_SAMPLES), MAX_SAMPLES);
  const step = (xRange[1] - xRange[0]) / actualSamples;
  const points: FormulaPoint[] = [];

  try {
    // Create a function from the expression
    // eslint-disable-next-line no-new-func
    const evalFunc = new Function('x', `try { return ${expression}; } catch(e) { return NaN; }`);

    for (let i = 0; i <= actualSamples; i++) {
      const x = xRange[0] + i * step;
      let y: number;
      
      try {
        y = evalFunc(x);
      } catch (error) {
        y = NaN;
      }

      // Skip invalid points
      const isValid = !isNaN(y) && isFinite(y);
      
      // Convert from mathematical coordinates to canvas coordinates
      const canvasX = gridPosition.x + x * pixelsPerUnit;
      // Note the negative sign for y because canvas y coordinates go down
      const canvasY = gridPosition.y - y * pixelsPerUnit;
      
      points.push({ x: canvasX, y: canvasY, isValid });
    }

    return points;
  } catch (error) {
    console.error('Error evaluating function:', error);
    return [];
  }
};

/**
 * Generate points for a parametric function of the form x = f(t), y = g(t)
 */
export const evaluateParametric = (
  formula: Formula, 
  gridPosition: Point,
  pixelsPerUnit: number
): FormulaPoint[] => {
  const { expression, tRange, samples } = formula;
  
  if (!tRange) {
    return [];
  }

  const actualSamples = Math.min(Math.max(samples, MIN_SAMPLES), MAX_SAMPLES);
  const step = (tRange[1] - tRange[0]) / actualSamples;
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
    const evalY = new Function('t', `try { return ${yExpr}; } catch(e) { return NaN; }`);

    for (let i = 0; i <= actualSamples; i++) {
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
  const { expression, tRange, samples } = formula;
  
  if (!tRange) {
    return [];
  }

  const actualSamples = Math.min(Math.max(samples, MIN_SAMPLES), MAX_SAMPLES);
  const step = (tRange[1] - tRange[0]) / actualSamples;
  const points: FormulaPoint[] = [];

  try {
    // Create a function to evaluate r(θ)
    // eslint-disable-next-line no-new-func
    const evalFunc = new Function('theta', `try { return ${expression}; } catch(e) { return NaN; }`);

    for (let i = 0; i <= actualSamples; i++) {
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
  pixelsPerUnit: number
): FormulaPoint[] => {
  switch (formula.type) {
    case 'function':
      return evaluateFunction(formula, gridPosition, pixelsPerUnit);
    case 'parametric':
      return evaluateParametric(formula, gridPosition, pixelsPerUnit);
    case 'polar':
      return evaluatePolar(formula, gridPosition, pixelsPerUnit);
    default:
      return [];
  }
};

/**
 * Generate formula examples
 */
export const getFormulaExamples = (): FormulaExample[] => {
  return [
    // Basic functions
    {
      name: 'Linear function',
      type: 'function',
      expression: '2*x + 1',
      xRange: [-5, 5],
      category: 'basic',
      description: 'f(x) = 2x + 1'
    },
    {
      name: 'Quadratic function',
      type: 'function',
      expression: 'x*x',
      xRange: [-5, 5],
      category: 'basic',
      description: 'f(x) = x²'
    },
    {
      name: 'Cubic function',
      type: 'function',
      expression: 'x*x*x',
      xRange: [-3, 3],
      category: 'basic',
      description: 'f(x) = x³'
    },
    
    // Trigonometric functions
    {
      name: 'Sine wave',
      type: 'function',
      expression: 'Math.sin(x)',
      xRange: [-2*Math.PI, 2*Math.PI],
      category: 'trigonometric',
      description: 'f(x) = sin(x)'
    },
    {
      name: 'Cosine wave',
      type: 'function',
      expression: 'Math.cos(x)',
      xRange: [-2*Math.PI, 2*Math.PI],
      category: 'trigonometric',
      description: 'f(x) = cos(x)'
    },
    {
      name: 'Tangent',
      type: 'function',
      expression: 'Math.tan(x)',
      xRange: [-1.5, 1.5],
      category: 'trigonometric',
      description: 'f(x) = tan(x)'
    },
    
    // Exponential functions
    {
      name: 'Exponential',
      type: 'function',
      expression: 'Math.exp(x)',
      xRange: [-2, 2],
      category: 'exponential',
      description: 'f(x) = e^x'
    },
    {
      name: 'Logarithm',
      type: 'function',
      expression: 'Math.log(x)',
      xRange: [0.1, 5],
      category: 'exponential',
      description: 'f(x) = ln(x)'
    },
    
    // Parametric curves
    {
      name: 'Circle',
      type: 'parametric',
      expression: 'Math.cos(t); Math.sin(t)',
      tRange: [0, 2*Math.PI],
      xRange: [-1, 1],
      category: 'parametric',
      description: 'x(t) = cos(t), y(t) = sin(t)'
    },
    {
      name: 'Lissajous curve',
      type: 'parametric',
      expression: 'Math.sin(3*t); Math.sin(2*t)',
      tRange: [0, 2*Math.PI],
      xRange: [-1, 1],
      category: 'parametric',
      description: 'x(t) = sin(3t), y(t) = sin(2t)'
    },
    {
      name: 'Butterfly curve',
      type: 'parametric',
      expression: 'Math.sin(t) * (Math.exp(Math.cos(t)) - 2 * Math.cos(4*t) - Math.pow(Math.sin(t/12), 5)); Math.cos(t) * (Math.exp(Math.cos(t)) - 2 * Math.cos(4*t) - Math.pow(Math.sin(t/12), 5))',
      tRange: [0, 12*Math.PI],
      xRange: [-4, 4],
      category: 'parametric',
      description: 'Butterfly curve'
    },
    
    // Special functions
    {
      name: 'Polar rose',
      type: 'polar',
      expression: 'Math.cos(3 * theta)',
      tRange: [0, 2*Math.PI],
      xRange: [-1, 1],
      category: 'special',
      description: 'r(θ) = cos(3θ)'
    },
    {
      name: 'Cardioid',
      type: 'polar',
      expression: '1 + Math.cos(theta)',
      tRange: [0, 2*Math.PI],
      xRange: [-2, 2],
      category: 'special',
      description: 'r(θ) = 1 + cos(θ)'
    }
  ];
};

/**
 * Generate a unique ID for a formula
 */
export const generateFormulaId = (): string => {
  return `formula-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

/**
 * Create a default formula with the given type
 */
export const createDefaultFormula = (type: FormulaType = 'function'): Formula => {
  const defaultRanges: Record<FormulaType, { xRange: [number, number], tRange?: [number, number] }> = {
    function: { xRange: [-10, 10] },
    parametric: { xRange: [-10, 10], tRange: [0, 2 * Math.PI] },
    polar: { xRange: [-10, 10], tRange: [0, 2 * Math.PI] }
  };

  const defaultExpressions: Record<FormulaType, string> = {
    function: 'x*x',
    parametric: 'Math.cos(t); Math.sin(t)',
    polar: 'Math.cos(3 * theta)'
  };

  return {
    id: generateFormulaId(),
    type,
    expression: defaultExpressions[type],
    color: '#' + Math.floor(Math.random() * 16777215).toString(16), // Random color
    strokeWidth: 2,
    xRange: defaultRanges[type].xRange,
    tRange: defaultRanges[type].tRange,
    samples: 200,
    visible: true
  };
};
