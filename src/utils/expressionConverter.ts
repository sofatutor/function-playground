import { validateFormula } from './formulaUtils';
import { Formula } from '@/types/formula';

interface Token {
  type: 'number' | 'variable' | 'operator' | 'function' | 'constant' | 'parenthesis';
  value: string;
}

interface JSToMathRule {
  js: RegExp;
  math: string;
}

interface MathToJSRule {
  math: RegExp;
  js: string;
}

const jsToMathRules: JSToMathRule[] = [
  // Math functions
  { js: /Math\.sqrt\(/g, math: '√(' },
  { js: /Math\.sin\(/g, math: 'sin(' },
  { js: /Math\.cos\(/g, math: 'cos(' },
  { js: /Math\.tan\(/g, math: 'tan(' },
  { js: /Math\.log\(/g, math: 'ln(' },
  { js: /Math\.abs\(/g, math: '|' },
  { js: /Math\.exp\(/g, math: 'e^(' },
  // Constants
  { js: /Math\.PI/g, math: 'π' },
  { js: /Math\.E/g, math: 'e' },
  // Operators
  { js: /\*\*/g, math: '^' },
  { js: /(\d+)\s*\*\s*([a-zA-Z])/g, math: '$1$2' },
  { js: /([a-zA-Z])\s*\*\s*(\d+)/g, math: '$2$1' },
  { js: /\*/g, math: '×' },
];

const mathToJSRules: MathToJSRule[] = [
  // Math functions
  { math: /√\(/g, js: 'Math.sqrt(' },
  { math: /sin\(/g, js: 'Math.sin(' },
  { math: /cos\(/g, js: 'Math.cos(' },
  { math: /tan\(/g, js: 'Math.tan(' },
  { math: /ln\(/g, js: 'Math.log(' },
  { math: /\|([^|]+)\|/g, js: 'Math.abs($1)' },
  // Constants
  { math: /π/g, js: 'Math.PI' },
  { math: /e\^/g, js: 'Math.exp' },
  // Operators
  { math: /\^/g, js: '**' },
  { math: /(\d+)([a-zA-Z])/g, js: '$1*$2' },
  { math: /([a-zA-Z])(\d+)/g, js: '$1*$2' },
  { math: /×/g, js: '*' },
];

export class ExpressionConverter {
  /**
   * Convert from JS notation to math notation
   */
  toMathNotation(expression: string): string {
    let result = expression;
    
    // Handle Math functions and constants first
    for (const [js, math] of Object.entries({
      'Math.sqrt(': '√(',
      'Math.sin(': 'sin(',
      'Math.cos(': 'cos(',
      'Math.tan(': 'tan(',
      'Math.log(': 'ln(',
      'Math.abs(': '|',
      'Math.exp(': 'e^(',
      'Math.PI': 'π',
      'Math.E': 'e'
    })) {
      result = result.replace(new RegExp(js.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), math);
    }
    
    // Handle operators
    result = result.replace(/\*\*/g, '^');
    
    // Handle chained multiplication with variables (e.g., 2*x*3 -> 2x×3)
    result = result.replace(/(\d+)\s*\*\s*([a-zA-Z])\s*\*\s*(\d+)/g, '$1$2×$3');
    
    // Handle simple multiplication with variables
    result = result.replace(/(\d+)\s*\*\s*([a-zA-Z])/g, '$1$2');
    result = result.replace(/([a-zA-Z])\s*\*\s*(\d+)/g, '$2$1');
    
    // Handle remaining multiplication
    result = result.replace(/\*/g, '×');
    
    // Handle absolute value closing
    result = result.replace(/\|([^|]+)\)/g, '|$1|');
    
    return result;
  }

  /**
   * Convert from math notation to JS notation
   */
  toJSNotation(expression: string): string {
    let result = expression;
    
    // Handle absolute value first
    result = result.replace(/\|([^|]+)\|/g, 'Math.abs($1)');
    
    // Handle Math functions and constants
    for (const [math, js] of Object.entries({
      '√(': 'Math.sqrt(',
      'sin(': 'Math.sin(',
      'cos(': 'Math.cos(',
      'tan(': 'Math.tan(',
      'ln(': 'Math.log(',
      'π': 'Math.PI',
      'e^(': 'Math.exp('
    })) {
      result = result.replace(new RegExp(math.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), js);
    }
    
    // Handle operators
    result = result.replace(/\^/g, '**');
    
    // Handle implicit multiplication
    result = result.replace(/(\d+)([a-zA-Z])/g, '$1*$2');
    result = result.replace(/([a-zA-Z])(\d+)/g, '$1*$2');
    
    // Handle remaining multiplication
    result = result.replace(/×/g, '*');
    
    return result;
  }

  /**
   * Validate expression in either notation
   */
  validate(expression: string, type: 'js' | 'math'): boolean {
    try {
      // Convert math notation to JS if needed
      const jsExpression = type === 'math' ? this.toJSNotation(expression) : expression;
      
      // Basic syntax validation
      if (jsExpression.includes('++') || jsExpression.includes('--') || 
          jsExpression.includes('+ +') || jsExpression.includes('- -') ||
          jsExpression.includes('**-') || /[+\-*/]{2,}/.test(jsExpression.replace(/\*\*/g, '^'))) {
        return false;
      }
      
      // Check for unmatched parentheses
      const openCount = (jsExpression.match(/\(/g) || []).length;
      const closeCount = (jsExpression.match(/\)/g) || []).length;
      if (openCount !== closeCount) {
        return false;
      }
      
      // Create a safe evaluation context with Math functions
      const context = {
        Math,
        x: 1, // Sample value for testing
        y: 1,
        z: 1,
      };
      
      // Try to evaluate the expression
      const fn = new Function(...Object.keys(context), `return ${jsExpression}`);
      fn(...Object.values(context));
      
      return true;
    } catch {
      return false;
    }
  }
}

// Export a singleton instance
export const expressionConverter = new ExpressionConverter(); 