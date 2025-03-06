import { Formula, FormulaPoint, FormulaExample, FormulaExampleCategory, FormulaType } from "@/types/formula";
import { Point } from "@/types/shapes";

// Constants for formula evaluation
const MAX_SAMPLES = 2000;
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
  
  // Check if this is a logarithmic function
  const isLogarithmic = expression.includes('Math.log(') ||
                        expression.includes('Math.log10(') ||
                        expression.includes('Math.log2(') ||
                        expression.includes('log(') ||
                        expression.includes('ln(');
  
  // Check if this is a high-frequency trigonometric function
  const hasTrigFunction = expression.includes('Math.sin(') || 
                          expression.includes('Math.cos(') ||
                          expression.includes('sin(') || 
                          expression.includes('cos(');
                          
  // Check for multipliers that indicate high frequency
  const hasHighFrequency = hasTrigFunction && (
    expression.includes('* x') || 
    expression.includes('*x') ||
    expression.includes('x *') ||
    expression.includes('x*')
  );
  
  // If the expression contains log(x) directly, we need x > 0
  // If it contains log(-x) or log(Math.abs(x)), we can allow negative values
  const allowsNegativeX = isLogarithmic && (
    expression.includes('Math.abs(x)') || 
    expression.includes('-x') ||
    expression.includes('(-x)')
  );
  
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
  } else if (isLogarithmic) {
    // For logarithmic functions, restrict the domain to positive values
    // Use a small positive value as the minimum to avoid the asymptote at x=0
    const minX = 0.00001; // Even smaller minimum value for better coverage
    
    // Set the visible range based on the expression
    if (allowsNegativeX) {
      visibleXRange = [
        Math.max(leftEdgeX, xRange[0]), 
        Math.min(rightEdgeX, xRange[1])
      ];
      console.log(`Plotting logarithmic function with abs/negative handling: [${visibleXRange[0]}, ${visibleXRange[1]}]`);
    } else {
      visibleXRange = [
        Math.max(minX, leftEdgeX, xRange[0]), 
        Math.min(rightEdgeX, xRange[1])
      ];
      console.log(`Plotting logarithmic function with restricted domain: [${visibleXRange[0]}, ${visibleXRange[1]}]`);
    }
  } else {
    // For other functions, use the visible range of the grid
    visibleXRange = [
      Math.max(leftEdgeX, xRange[0]), 
      Math.min(rightEdgeX, xRange[1])
    ];
  }
  
  // For high-frequency trigonometric functions, we need to ensure we have enough samples
  // to capture the oscillations. We'll estimate the number of oscillations in the visible range
  // and adjust the number of samples accordingly.
  let adjustedSamples = actualSamples;
  
  if (hasHighFrequency) {
    // Try to estimate the frequency by looking for multipliers
    let frequencyFactor = 1;
    
    // Look for patterns like "2 * Math.PI * x" or similar
    if (expression.includes('Math.PI')) {
      // Extract the coefficient before Math.PI if possible
      const piMatch = expression.match(/(\d+)\s*\*\s*Math\.PI/);
      if (piMatch && piMatch[1]) {
        frequencyFactor = parseInt(piMatch[1], 10);
      } else {
        frequencyFactor = 1; // Default if we can't extract a specific value
      }
    }
    
    // Estimate the number of oscillations in the visible range
    const visibleRange = visibleXRange[1] - visibleXRange[0];
    const estimatedOscillations = frequencyFactor * visibleRange;
    
    // We want at least 20 samples per oscillation for smooth rendering
    const recommendedSamples = Math.ceil(estimatedOscillations * 20);
    
    // Use the higher of our original samples or the recommended samples
    adjustedSamples = Math.max(actualSamples, recommendedSamples);
    
    // Cap at MAX_SAMPLES to avoid performance issues
    adjustedSamples = Math.min(adjustedSamples, MAX_SAMPLES);
    
    console.log(`High-frequency function detected. Estimated oscillations: ${estimatedOscillations}, using ${adjustedSamples} samples`);
  }
  
  // Calculate the step size based on the visible range and number of samples
  const xStep = (visibleXRange[1] - visibleXRange[0]) / (hasHighFrequency ? adjustedSamples : actualSamples);
  
  // For logarithmic functions, use adaptive sampling to concentrate more points near the asymptote
  const xValues: number[] = [];
  if (isLogarithmic && !allowsNegativeX) {
    // Create a logarithmically spaced set of x values to better capture the curve near x=0
    // This puts more points near the asymptote where the function changes rapidly
    const logStart = Math.log(visibleXRange[0]);
    const logEnd = Math.log(visibleXRange[1]);
    const logStep = (logEnd - logStart) / (hasHighFrequency ? adjustedSamples : actualSamples);
    
    for (let i = 0; i <= (hasHighFrequency ? adjustedSamples : actualSamples); i++) {
      const logX = logStart + i * logStep;
      xValues.push(Math.exp(logX));
    }
    
    // Add some extra points very close to the asymptote
    if (visibleXRange[0] < 0.1) {
      // Add more extra points between minX and 0.1 for better coverage
      const extraPoints = 40; // Increased from 20 to 40
      const extraMinX = 0.00001; // Even smaller minimum value
      const extraMaxX = 0.1;
      const extraLogStart = Math.log(extraMinX);
      const extraLogEnd = Math.log(extraMaxX);
      const extraLogStep = (extraLogEnd - extraLogStart) / extraPoints;
      
      for (let i = 0; i <= extraPoints; i++) {
        const logX = extraLogStart + i * extraLogStep;
        const x = Math.exp(logX);
        if (!xValues.includes(x)) {
          xValues.push(x);
        }
      }
      
      // Add even more points extremely close to zero for better asymptote visualization
      const microPoints = 20;
      const microMinX = 0.000001; // Extremely small value
      const microMaxX = 0.0001;
      const microLogStart = Math.log(microMinX);
      const microLogEnd = Math.log(microMaxX);
      const microLogStep = (microLogEnd - microLogStart) / microPoints;
      
      for (let i = 0; i <= microPoints; i++) {
        const logX = microLogStart + i * microLogStep;
        const x = Math.exp(logX);
        if (!xValues.includes(x)) {
          xValues.push(x);
        }
      }
      
      // Sort the x values
      xValues.sort((a, b) => a - b);
    }
    
    console.log(`Using ${xValues.length} adaptive sample points for logarithmic function`);
  } else if (hasHighFrequency) {
    // For high-frequency functions, use a higher density of points
    // Use the adjusted samples value we calculated earlier
    for (let i = 0; i <= adjustedSamples; i++) {
      xValues.push(visibleXRange[0] + i * xStep);
    }
    
    console.log(`Using ${adjustedSamples + 1} sample points for high-frequency function`);
  } else {
    // For other functions, use regular linear spacing
    for (let i = 0; i <= actualSamples; i++) {
      xValues.push(visibleXRange[0] + i * xStep);
    }
  }
  
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
    
    // Sample the function at the calculated x values
    for (const x of xValues) {
      let y: number;
      
      try {
        // For logarithmic functions, we need to handle domain restrictions
        if (isLogarithmic) {
          // Skip evaluation for non-positive values unless the expression handles them
          if (x <= 0 && !allowsNegativeX) {
            y = NaN;
          } else {
            y = fn(x);
          }
        } else {
          y = fn(x);
        }
      } catch (e) {
        y = NaN;
      }
      
      // Check if the result is valid
      const isValid = !isNaN(y) && isFinite(y);
      
      // For logarithmic functions, we need to handle very large values
      // that would cause the graph to be clipped
      if (isLogarithmic && isValid) {
        // Limit the maximum absolute value to prevent extreme scaling
        const MAX_VALUE = 1000;
        if (Math.abs(y) > MAX_VALUE) {
          y = y > 0 ? MAX_VALUE : -MAX_VALUE;
        }
      }
      
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
 * Evaluate a formula and generate points for rendering
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
  
  // Check if this is a logarithmic function
  const isLogarithmic = formula.expression.includes('Math.log(') ||
                        formula.expression.includes('Math.log10(') ||
                        formula.expression.includes('Math.log2(') ||
                        formula.expression.includes('log(') ||
                        formula.expression.includes('ln(');
  
  // Check if this is a high-frequency trigonometric function
  const hasTrigFunction = formula.expression.includes('Math.sin(') || 
                          formula.expression.includes('Math.cos(') ||
                          formula.expression.includes('sin(') || 
                          formula.expression.includes('cos(');
                          
  // Check for multipliers that indicate high frequency
  const hasHighFrequency = hasTrigFunction && (
    formula.expression.includes('* x') || 
    formula.expression.includes('*x') ||
    formula.expression.includes('x *') ||
    formula.expression.includes('x*')
  );
  
  // For logarithmic functions, especially those with asymptotes like Math.log(2/x),
  // we need more samples for better resolution
  let samples = dragSamples;
  if (isLogarithmic && !isDragging) {
    // Use significantly more samples for logarithmic functions when not dragging
    samples = Math.min(formula.samples * 4, MAX_SAMPLES);
    console.log(`Using ${samples} samples for logarithmic function`);
  } else if (isTangent && !isDragging) {
    // Use more samples for tangent functions when not dragging
    samples = Math.min(formula.samples * 2, MAX_SAMPLES);
  } else if (hasHighFrequency && !isDragging) {
    // Use many more samples for high-frequency trigonometric functions
    // The higher the frequency, the more samples we need
    
    // Try to estimate the frequency by looking for multipliers
    let frequencyMultiplier = 1;
    
    // Look for patterns like "2 * Math.PI * x" or similar
    if (formula.expression.includes('Math.PI')) {
      // If we have PI in the expression, it's likely a frequency multiplier
      if (formula.expression.includes('2 * Math.PI') || formula.expression.includes('2*Math.PI')) {
        frequencyMultiplier = 4; // Double frequency needs 4x samples
      } else if (formula.expression.includes('3 * Math.PI') || formula.expression.includes('3*Math.PI')) {
        frequencyMultiplier = 6; // Triple frequency needs 6x samples
      } else if (formula.expression.includes('4 * Math.PI') || formula.expression.includes('4*Math.PI')) {
        frequencyMultiplier = 8; // Quadruple frequency needs 8x samples
      } else if (formula.expression.includes('5 * Math.PI') || formula.expression.includes('5*Math.PI')) {
        frequencyMultiplier = 10; // 5x frequency needs 10x samples
      } else {
        frequencyMultiplier = 3; // Default for any PI-based frequency
      }
    } else {
      // For other high-frequency patterns, use a default multiplier
      frequencyMultiplier = 3;
    }
    
    // Calculate samples based on frequency
    samples = Math.min(formula.samples * frequencyMultiplier, MAX_SAMPLES);
    console.log(`Using ${samples} samples for high-frequency trigonometric function (multiplier: ${frequencyMultiplier})`);
  }
  
  // Always use function evaluation for all formula types
  // This simplifies the code and ensures consistent behavior
  return evaluateFunction(
    formula, 
    gridPosition, 
    pixelsPerUnit, 
    samples
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
