/**
 * List of mathematical function names to exclude from parameter detection
 */
const MATH_FUNCTIONS = [
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh',
  'log', 'ln', 'exp', 'sqrt', 'abs', 'floor', 'ceil', 'round',
  'Math.sin', 'Math.cos', 'Math.tan', 'Math.asin', 'Math.acos', 'Math.atan',
  'Math.sinh', 'Math.cosh', 'Math.tanh', 'Math.log', 'Math.exp', 'Math.sqrt',
  'Math.abs', 'Math.floor', 'Math.ceil', 'Math.round'
];

/**
 * Regular expression to match single letters that could be parameters
 * Excludes 'x' as it's the default variable
 */
const PARAMETER_REGEX = /[a-wyzA-WYZ]/g;

/**
 * Interface for detected parameters
 */
export interface DetectedParameter {
  name: string;
  defaultValue: number;
  minValue: number;
  maxValue: number;
  step: number;
}

/**
 * Removes function names from the formula
 */
function removeFunctionNames(formula: string): string {
  let cleanedFormula = formula;
  // Sort functions by length (longest first) to handle nested functions correctly
  const sortedFunctions = [...MATH_FUNCTIONS].sort((a, b) => b.length - a.length);
  
  for (const func of sortedFunctions) {
    // Replace function names with spaces to preserve formula structure
    cleanedFormula = cleanedFormula.replace(new RegExp(func, 'g'), ' '.repeat(func.length));
  }
  
  return cleanedFormula;
}

/**
 * Detects parameters in a mathematical formula
 * @param formula The mathematical formula to analyze
 * @returns Array of detected parameters with default values
 */
export function detectParameters(formula: string): DetectedParameter[] {
  // Remove whitespace for consistent matching
  const normalizedFormula = formula.replace(/\s+/g, '');
  
  // First remove all function names
  const formulaWithoutFunctions = removeFunctionNames(normalizedFormula);
  
  // Find all potential parameter matches
  const matches = formulaWithoutFunctions.match(PARAMETER_REGEX) || [];
  
  // Remove duplicates and create parameter objects
  const uniqueParameters = [...new Set(matches)].map(name => ({
    name: name.toLowerCase(), // Convert to lowercase for consistency
    defaultValue: 1, // Set default value to 1 as specified
    minValue: -10, // Default min value
    maxValue: 10, // Default max value
    step: 0.1 // Default step value
  }));
  
  return uniqueParameters;
}

/**
 * Tests if a string is a valid parameter name
 * @param name The string to test
 * @returns boolean indicating if the string is a valid parameter name
 */
export function isValidParameterName(name: string): boolean {
  // Must be a single letter (excluding x)
  return /^[a-wyzA-WYZ]$/.test(name);
} 