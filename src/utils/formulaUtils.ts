import { Formula, FormulaPoint, FormulaExample, FormulaExampleCategory, FormulaType } from "@/types/formula";
import { Point } from "@/types/shapes";

// Constants for formula evaluation
const MAX_SAMPLES = 20000;
const MIN_SAMPLES = 20;

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

  // Check for very high frequency functions (e.g., sin(10*x))
  const hasVeryHighFrequency = hasTrigFunction && (
    expression.match(/sin\((\d{2,})\s*\*\s*x\)/i) || 
    expression.match(/cos\((\d{2,})\s*\*\s*x\)/i) ||
    expression.match(/(\d{2,})\s*\*\s*Math\.PI/i)
  );

  // Check for complex expressions that might need more samples
  const isComplex = expression.includes('**') || // Power operations
                   expression.includes('Math.pow') || // Power operations
                   expression.includes('Math.sqrt') || // Square root
                   (expression.match(/[+\-*/]/g) || []).length > 2; // More than 2 operators
  
  // Check for combined functions that need even more samples
  const isCombined = hasTrigFunction && isComplex;
  
  // Check for sqrt(abs(x)) which needs special handling around x=0
  const isSqrtAbs = expression.includes('Math.sqrt(Math.abs(x))') || 
                    expression.includes('sqrt(abs(x))');
  
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
    // For tangent functions, we need to be careful about the domain
    // Find the central period of the tangent function that contains the visible range
    const PI = Math.PI;
    
    // Calculate the central period
    const centralPeriod = [
      Math.max(leftEdgeX, -PI/2 + 0.01), // Avoid exact asymptote
      Math.min(rightEdgeX, PI/2 - 0.01)  // Avoid exact asymptote
    ] as [number, number];
    
    console.log('Plotting tangent function with central period:', centralPeriod);
    
    // Use the central period as the visible range
    visibleXRange = centralPeriod;
    
    // For tangent functions, use many more samples to capture the steep slopes
    // near asymptotes
    if (!overrideSamples) {
      // Use significantly more samples for tangent functions
      const tangentSamples = Math.min(actualSamples * 10, MAX_SAMPLES);
      
      // Generate more points near asymptotes
      const xValues: number[] = [];
      
      // Find all asymptotes in the visible range
      // Asymptotes occur at x = (n + 0.5) * π
      const leftAsymptote = Math.ceil((leftEdgeX / PI - 0.5)) * PI + PI/2;
      const rightAsymptote = Math.floor((rightEdgeX / PI - 0.5)) * PI + PI/2;
      
      // Generate points with higher density near asymptotes
      for (let i = 0; i <= tangentSamples; i++) {
        const t = i / tangentSamples; // Parameter from 0 to 1
        
        // Use a non-linear distribution to concentrate points near asymptotes
        // This transformation puts more points near the edges (asymptotes)
        // and fewer in the middle of the period
        const x = leftEdgeX + (rightEdgeX - leftEdgeX) * t;
        
        // Find the nearest asymptote
        const n = Math.round(x / PI - 0.5);
        const nearestAsymptote = (n + 0.5) * PI;
        
        // Calculate distance to nearest asymptote
        const distToAsymptote = Math.abs(x - nearestAsymptote);
        
        // Only add points that are not too close to asymptotes
        // This prevents numerical issues
        if (distToAsymptote > 0.01) {
          xValues.push(x);
        }
      }
      
      // Add extra points very close to (but not at) each asymptote
      for (let n = Math.floor(leftEdgeX / PI - 0.5); n <= Math.ceil(rightEdgeX / PI - 0.5); n++) {
        const asymptote = (n + 0.5) * PI;
        
        // Only process asymptotes in the visible range
        if (asymptote >= leftEdgeX && asymptote <= rightEdgeX) {
          // Add points on both sides of the asymptote
          // Use logarithmic spacing to get more points very close to the asymptote
          for (let i = 1; i <= 20; i++) {
            const offset = 0.01 * Math.pow(2, -i); // Gets closer and closer to asymptote
            
            // Add points on both sides of the asymptote
            xValues.push(asymptote - offset);
            xValues.push(asymptote + offset);
          }
        }
      }
      
      // Sort the x values
      xValues.sort((a, b) => a - b);
      
      // Remove duplicates
      const uniqueXValues: number[] = [];
      for (let i = 0; i < xValues.length; i++) {
        if (i === 0 || xValues[i] !== xValues[i-1]) {
          uniqueXValues.push(xValues[i]);
        }
      }
      
      return evaluateFunctionWithXValues(formula, gridPosition, pixelsPerUnit, uniqueXValues);
    }
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
  
  if (hasVeryHighFrequency) {
    // Try to estimate the frequency by looking for multipliers
    let frequencyFactor = 1;
    
    // Look for patterns like "10 * Math.PI * x" or similar
    if (expression.includes('Math.PI')) {
      // Extract the coefficient before Math.PI if possible
      const piMatch = expression.match(/(\d+)\s*\*\s*Math\.PI/);
      if (piMatch && piMatch[1]) {
        frequencyFactor = parseInt(piMatch[1], 10);
      } else {
        frequencyFactor = 1; // Default if we can't extract a specific value
      }
    } else {
      // Look for direct multipliers like "10*x" in sin(10*x)
      const directMatch = expression.match(/sin\((\d+)\s*\*\s*x\)/i) || 
                          expression.match(/cos\((\d+)\s*\*\s*x\)/i);
      if (directMatch && directMatch[1]) {
        frequencyFactor = parseInt(directMatch[1], 10);
      }
    }
    
    // Estimate the number of oscillations in the visible range
    const visibleRange = visibleXRange[1] - visibleXRange[0];
    const estimatedOscillations = frequencyFactor * visibleRange;
    
    // We want at least 80 samples per oscillation for very high frequency functions
    const recommendedSamples = Math.ceil(estimatedOscillations * 80);
    
    // Use the higher of our original samples or the recommended samples
    adjustedSamples = Math.max(actualSamples, recommendedSamples);
    
    // Cap at MAX_SAMPLES to avoid performance issues
    adjustedSamples = Math.min(adjustedSamples, MAX_SAMPLES);
    
    console.log(`Very high-frequency function detected. Estimated oscillations: ${estimatedOscillations}, using ${adjustedSamples} samples`);
  } else if (hasHighFrequency) {
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
    } else {
      // Look for direct multipliers like "5*x" in sin(5*x)
      const directMatch = expression.match(/sin\((\d+)\s*\*\s*x\)/i) || 
                          expression.match(/cos\((\d+)\s*\*\s*x\)/i);
      if (directMatch && directMatch[1]) {
        frequencyFactor = parseInt(directMatch[1], 10);
      }
    }
    
    // Estimate the number of oscillations in the visible range
    const visibleRange = visibleXRange[1] - visibleXRange[0];
    const estimatedOscillations = frequencyFactor * visibleRange;
    
    // We want at least 50 samples per oscillation for smooth rendering (increased from 30)
    const recommendedSamples = Math.ceil(estimatedOscillations * 50);
    
    // Use the higher of our original samples or the recommended samples
    adjustedSamples = Math.max(actualSamples, recommendedSamples);
    
    // Cap at MAX_SAMPLES to avoid performance issues
    adjustedSamples = Math.min(adjustedSamples, MAX_SAMPLES);
    
    console.log(`High-frequency function detected. Estimated oscillations: ${estimatedOscillations}, using ${adjustedSamples} samples`);
  } else if (isCombined) {
    // For combined complex functions, increase samples by 100%
    adjustedSamples = Math.min(actualSamples * 2, MAX_SAMPLES);
    console.log(`Combined complex function detected. Using ${adjustedSamples} samples`);
  } else if (isComplex) {
    // For complex functions, increase samples by 75% (up from 50%)
    adjustedSamples = Math.min(Math.ceil(actualSamples * 1.75), MAX_SAMPLES);
    console.log(`Complex function detected. Using ${adjustedSamples} samples`);
  }
  
  // Special handling for sqrt(abs(x)) to ensure the corner at x=0 is rendered properly
  if (expression === 'Math.sqrt(Math.abs(x))') {
    // Increase samples for better rendering
    adjustedSamples = Math.min(Math.ceil(actualSamples * 2), MAX_SAMPLES);
    console.log(`sqrt(abs(x)) function detected. Using ${adjustedSamples} samples with special handling for x=0`);
  }
  
  // Special handling for sigmoid function to better show asymptotic behavior
  if (expression === '1 / (1 + Math.exp(-x))') {
    // Increase samples for better rendering of asymptotic behavior
    adjustedSamples = Math.min(Math.ceil(actualSamples * 2), MAX_SAMPLES);
    console.log(`Sigmoid function detected. Using ${adjustedSamples} samples with special handling for asymptotes`);
  }
  
  // Calculate the step size based on the visible range and number of samples
  const xStep = (visibleXRange[1] - visibleXRange[0]) / (hasHighFrequency || hasVeryHighFrequency || isComplex || isCombined ? adjustedSamples : actualSamples);
  
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
  } else if (expression === 'Math.sqrt(Math.abs(x))') {
    // For sqrt(abs(x)), use a higher density of points around x=0
    // Use the adjusted samples value we calculated earlier
    for (let i = 0; i <= adjustedSamples; i++) {
      xValues.push(visibleXRange[0] + i * xStep);
    }
    
    // Add extra points around x=0 to capture the corner properly
    const extraPoints = 40;
    const extraRange = 0.2; // Add extra points within 0.2 units of x=0
    const extraStep = extraRange / extraPoints;
    
    // Add points on both sides of x=0
    for (let i = 1; i <= extraPoints; i++) {
      const x = -extraRange + i * extraStep;
      if (x >= visibleXRange[0] && x <= visibleXRange[1] && !xValues.includes(x)) {
        xValues.push(x);
      }
    }
    
    // Add the exact point at x=0
    if (!xValues.includes(0) && visibleXRange[0] <= 0 && visibleXRange[1] >= 0) {
      xValues.push(0);
    }
    
    // Sort the x values
    xValues.sort((a, b) => a - b);
    
    console.log(`Using ${xValues.length} sample points for sqrt(abs(x)) function with special handling for x=0`);
  } else if (expression === '1 / (1 + Math.exp(-x))') {
    // For sigmoid function, use a higher density of points at the extremes
    // Use the adjusted samples value we calculated earlier
    for (let i = 0; i <= adjustedSamples; i++) {
      xValues.push(visibleXRange[0] + i * xStep);
    }
    
    // Add extra points at the extremes where the function approaches 0 or 1
    const extraPoints = 30;
    const leftExtremeRange = [-10, -5]; // Where function approaches 0
    const rightExtremeRange = [5, 10]; // Where function approaches 1
    const extraStep = (leftExtremeRange[1] - leftExtremeRange[0]) / extraPoints;
    
    // Add points at the left extreme (approaching 0)
    if (visibleXRange[0] <= leftExtremeRange[1]) {
      const startX = Math.max(visibleXRange[0], leftExtremeRange[0]);
      for (let i = 0; i <= extraPoints; i++) {
        const x = startX + i * extraStep;
        if (x <= leftExtremeRange[1] && !xValues.includes(x)) {
          xValues.push(x);
        }
      }
    }
    
    // Add points at the right extreme (approaching 1)
    if (visibleXRange[1] >= rightExtremeRange[0]) {
      const startX = Math.max(visibleXRange[0], rightExtremeRange[0]);
      const endX = Math.min(visibleXRange[1], rightExtremeRange[1]);
      const rightExtraStep = (endX - startX) / extraPoints;
      
      for (let i = 0; i <= extraPoints; i++) {
        const x = startX + i * rightExtraStep;
        if (x <= endX && !xValues.includes(x)) {
          xValues.push(x);
        }
      }
    }
    
    // Sort the x values
    xValues.sort((a, b) => a - b);
    
    console.log(`Using ${xValues.length} sample points for sigmoid function with special handling for asymptotes`);
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
    
    // First, handle special cases for common functions
    if (expression === 'Math.exp(x)') {
      console.log('Using direct Math.exp implementation');
      const fn = (x: number) => Math.exp(x) * scaleFactor;
      
      // Sample the function at the calculated x values
      for (const x of xValues) {
        try {
          const y = fn(x);
          
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
        } catch (e) {
          console.error('Error evaluating point:', e);
          points.push({
            x: 0,
            y: 0,
            isValid: false
          });
        }
      }
      
      console.log(`Generated ${points.length} points for Math.exp(x)`);
      if (points.length > 0) {
        console.log('First few points:', points.slice(0, 3));
      }
      
      return points;
    } 
    // Special case for sigmoid function
    else if (expression === '1 / (1 + Math.exp(-x))') {
      console.log('Using direct sigmoid implementation');
      const fn = (x: number) => (1 / (1 + Math.exp(-x))) * scaleFactor;
      
      // Sample the function at the calculated x values
      for (const x of xValues) {
        try {
          const y = fn(x);
          
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
        } catch (e) {
          console.error('Error evaluating point:', e);
          points.push({
            x: 0,
            y: 0,
            isValid: false
          });
        }
      }
      
      return points;
    }
    // Special case for square root of absolute value
    else if (expression === 'Math.sqrt(Math.abs(x))') {
      console.log('Using direct sqrt(abs(x)) implementation');
      const fn = (x: number) => Math.sqrt(Math.abs(x)) * scaleFactor;
      
      // Sample the function at the calculated x values
      for (const x of xValues) {
        try {
          const y = fn(x);
          
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
        } catch (e) {
          console.error('Error evaluating point:', e);
          points.push({
            x: 0,
            y: 0,
            isValid: false
          });
        }
      }
      
      return points;
    }
    
    // For other expressions, be careful with the replacement
    // We need to avoid replacing 'x' in function names like 'exp'
    console.log(`Evaluating expression: ${expression}`);
    
    // More careful replacement that doesn't affect function names
    // Replace only standalone 'x' or 'x' with operators around it
    const scaledExpression = expression.replace(/(\W|^)x(\W|$)/g, '$1(x)$2');
    console.log(`Scaled expression: ${scaledExpression}`);
    
    // Create a safer function with more detailed error handling
    // Use a different approach for function creation that ensures Math functions are available
    let fn: (x: number) => number;
    
    // Special handling for expressions containing Math.exp
    if (expression.includes('Math.exp')) {
      console.log('Using special handling for Math.exp');
      
      // Create a direct implementation function that safely evaluates the expression
      fn = (x: number) => {
        try {
          // For expressions with Math.exp, we'll evaluate them directly in this scope
          // where Math.exp is guaranteed to be available
          
          // This is a safer approach than using new Function
          // We'll handle common patterns with Math.exp
          
          if (expression.includes('Math.exp(-x)')) {
            const expValue = Math.exp(-x);
            
            // Handle common patterns
            if (expression.startsWith('1 / (1 + Math.exp(-x))')) {
              return (1 / (1 + expValue)) * scaleFactor;
            } else if (expression.startsWith('Math.exp(-x)')) {
              return expValue * scaleFactor;
            }
          } else if (expression.includes('Math.exp(x)')) {
            const expValue = Math.exp(x);
            
            // Handle common patterns
            if (expression === 'Math.exp(x)') {
              return expValue * scaleFactor;
            } else if (expression.includes('* Math.exp(x)')) {
              // Extract coefficient
              const coefficient = parseFloat(expression.split('*')[0].trim());
              return coefficient * expValue * scaleFactor;
            }
          }
          
          // If we can't handle it with the special cases above,
          // fall back to a more general approach
          // Use eval in this controlled context where we know the expression is from our app
          // eslint-disable-next-line no-eval
          return eval(expression.replace(/x/g, x.toString())) * scaleFactor;
        } catch (e) {
          console.error('Error in direct Math.exp evaluation:', e);
          return NaN;
        }
      };
    } else {
      // For other expressions
      fn = new Function('x', `
        try {
          // Make sure Math functions are available
          const sin = Math.sin;
          const cos = Math.cos;
          const tan = Math.tan;
          const exp = Math.exp;
          const log = Math.log;
          const sqrt = Math.sqrt;
          const abs = Math.abs;
          const pow = Math.pow;
          const PI = Math.PI;
          const E = Math.E;
          
          const result = ${scaledExpression};
          return result * ${scaleFactor};
        } catch (e) {
          console.error('Error in function evaluation:', e);
          return NaN;
        }
      `) as (x: number) => number;
    }
    
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
      
      // Limit extremely large values for all functions to prevent graph from being cut off
      if (isValid) {
        // Define a reasonable maximum value based on the canvas size
        // This prevents the graph from extending too far off the visible area
        const MAX_VALUE = 1000000; // Increased from 1000 to handle higher-degree polynomials
        
        if (Math.abs(y) > MAX_VALUE) {
          console.log(`Limiting extreme value at x=${x}: ${y} to ${y > 0 ? MAX_VALUE : -MAX_VALUE}`);
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
    console.error('Function expression:', expression);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // Try to identify specific issues with the expression
    if (expression.includes('Math.exp')) {
      console.log('Expression contains Math.exp - checking if Math.exp is available:', typeof Math.exp);
      try {
        // Test Math.exp directly
        const testExp = Math.exp(1);
        console.log('Math.exp(1) =', testExp);
      } catch (e) {
        console.error('Direct Math.exp test failed:', e);
      }
    }
    
    // Return an empty array if there's an error
    return [];
  }
  
  return points;
};

/**
 * Helper function to evaluate a function with a specific set of x values
 */
const evaluateFunctionWithXValues = (
  formula: Formula, 
  gridPosition: Point,
  pixelsPerUnit: number,
  xValues: number[]
): FormulaPoint[] => {
  const { expression, scaleFactor } = formula;
  const points: FormulaPoint[] = [];
  
  try {
    // Create a function from the expression
    // Use a modified version of the expression that applies the scale factor
    
    // First, handle special cases for common functions
    if (expression === 'Math.tan(x)' || expression === 'tan(x)') {
      console.log('Using direct Math.tan implementation');
      const fn = (x: number) => Math.tan(x) * scaleFactor;
      
      // Sample the function at the calculated x values
      for (const x of xValues) {
        try {
          const y = fn(x);
          
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
        } catch (e) {
          console.error('Error evaluating point:', e);
          points.push({
            x: 0,
            y: 0,
            isValid: false
          });
        }
      }
      
      return points;
    } else {
      // For other expressions, use the general approach
      // More careful replacement that doesn't affect function names
      // Replace only standalone 'x' or 'x' with operators around it
      const scaledExpression = expression.replace(/(\W|^)x(\W|$)/g, '$1(x)$2');
      console.log(`Scaled expression: ${scaledExpression}`);
      
      // Create a safer function with more detailed error handling
      // Use a different approach for function creation that ensures Math functions are available
      let fn: (x: number) => number;
      
      // Special handling for expressions containing Math.exp
      if (expression.includes('Math.exp')) {
        console.log('Using special handling for Math.exp');
        
        // Create a direct implementation function that safely evaluates the expression
        fn = (x: number) => {
          try {
            // For expressions with Math.exp, we'll evaluate them directly in this scope
            // where Math.exp is guaranteed to be available
            
            // This is a safer approach than using new Function
            // We'll handle common patterns with Math.exp
            
            if (expression.includes('Math.exp(-x)')) {
              const expValue = Math.exp(-x);
              
              // Handle common patterns
              if (expression.startsWith('1 / (1 + Math.exp(-x))')) {
                return (1 / (1 + expValue)) * scaleFactor;
              } else if (expression.startsWith('Math.exp(-x)')) {
                return expValue * scaleFactor;
              }
            } else if (expression.includes('Math.exp(x)')) {
              const expValue = Math.exp(x);
              
              // Handle common patterns
              if (expression === 'Math.exp(x)') {
                return expValue * scaleFactor;
              } else if (expression.includes('* Math.exp(x)')) {
                // Extract coefficient
                const coefficient = parseFloat(expression.split('*')[0].trim());
                return coefficient * expValue * scaleFactor;
              }
            }
            
            // If we can't handle it with the special cases above,
            // fall back to a more general approach
            // Use eval in this controlled context where we know the expression is from our app
            // eslint-disable-next-line no-eval
            return eval(expression.replace(/x/g, x.toString())) * scaleFactor;
          } catch (e) {
            console.error('Error in direct Math.exp evaluation:', e);
            return NaN;
          }
        };
      } else {
        // For other expressions
        fn = new Function('x', `
          try {
            // Make sure Math functions are available
            const sin = Math.sin;
            const cos = Math.cos;
            const tan = Math.tan;
            const exp = Math.exp;
            const log = Math.log;
            const sqrt = Math.sqrt;
            const abs = Math.abs;
            const pow = Math.pow;
            const PI = Math.PI;
            const E = Math.E;
            
            const result = ${scaledExpression};
            return result * ${scaleFactor};
          } catch (e) {
            console.error('Error in function evaluation:', e);
            return NaN;
          }
        `) as (x: number) => number;
      }
      
      // Sample the function at the calculated x values
      for (const x of xValues) {
        let y: number;
        
        try {
          y = fn(x);
        } catch (e) {
          y = NaN;
        }
        
        // Check if the result is valid
        const isValid = !isNaN(y) && isFinite(y);
        
        // Limit extremely large values to prevent graph from being cut off
        if (isValid) {
          const MAX_VALUE = 1000000;
          
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
      
      return points;
    }
  } catch (error) {
    console.error('Error evaluating function with custom x values:', error);
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
  // Add debug logging for special functions
  if (formula.expression === 'Math.exp(x)') {
    console.log('evaluateFormula: Processing exponential function');
  }

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
  
  // Check formula type and route to the appropriate evaluation function
  if (formula.type === 'parametric') {
    if (formula.expression === 'Math.exp(x)') {
      console.log('evaluateFormula: Routing exponential function to parametric evaluation (unexpected)');
    }
    return evaluateParametric(formula, gridPosition, pixelsPerUnit);
  } else if (formula.type === 'polar') {
    if (formula.expression === 'Math.exp(x)') {
      console.log('evaluateFormula: Routing exponential function to polar evaluation (unexpected)');
    }
    return evaluatePolar(formula, gridPosition, pixelsPerUnit);
  } else {
    // Default to function evaluation
    if (formula.expression === 'Math.exp(x)') {
      console.log('evaluateFormula: Routing exponential function to function evaluation (expected)');
    }
    return evaluateFunction(formula, gridPosition, pixelsPerUnit, samples);
  }
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
  // Use the provided type parameter instead of always creating function type
  const formulaType: FormulaType = type;
  
  // Use a very wide xRange to ensure the graph doesn't stop when moving the canvas
  // This range is large enough to cover most practical use cases
  const xRange: [number, number] = [-10000, 10000];

  // Generate a random color and ensure it has 6 digits
  const randomColor = Math.floor(Math.random() * 16777215).toString(16);
  const paddedColor = randomColor.padStart(6, '0');

  // Set default expression based on formula type
  let defaultExpression = 'x*x'; // Default for function type
  let tRange: [number, number] | undefined = undefined;
  
  if (type === 'parametric') {
    defaultExpression = 'Math.cos(t); Math.sin(t)'; // Default for parametric type
    tRange = [0, 2 * Math.PI]; // Default t-range for parametric
  } else if (type === 'polar') {
    defaultExpression = '1'; // Default for polar type (circle)
    tRange = [0, 2 * Math.PI]; // Default t-range for polar
  }

  return {
    id: generateFormulaId(),
    type: formulaType,
    expression: defaultExpression,
    color: '#' + paddedColor, // Random color with 6 digits
    strokeWidth: 2,
    xRange: xRange,
    tRange: tRange,
    samples: 500, // Increase samples for smoother curves
    scaleFactor: 1.0 // Default scale factor
  };
};
