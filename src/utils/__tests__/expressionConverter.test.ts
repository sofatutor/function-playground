import { expressionConverter } from '../expressionConverter';

describe('ExpressionConverter', () => {
  describe('toMathNotation', () => {
    it('should convert basic arithmetic operations', () => {
      expect(expressionConverter.toMathNotation('2*x')).toBe('2x');
      expect(expressionConverter.toMathNotation('x*2')).toBe('2x');
      expect(expressionConverter.toMathNotation('x**2')).toBe('x^2');
      expect(expressionConverter.toMathNotation('2*x*3')).toBe('2x×3');
    });

    it('should convert Math functions', () => {
      expect(expressionConverter.toMathNotation('Math.sqrt(x)')).toBe('√(x)');
      expect(expressionConverter.toMathNotation('Math.sin(x)')).toBe('sin(x)');
      expect(expressionConverter.toMathNotation('Math.cos(x)')).toBe('cos(x)');
      expect(expressionConverter.toMathNotation('Math.tan(x)')).toBe('tan(x)');
      expect(expressionConverter.toMathNotation('Math.log(x)')).toBe('ln(x)');
      expect(expressionConverter.toMathNotation('Math.exp(x)')).toBe('e^(x)');
      expect(expressionConverter.toMathNotation('Math.abs(x)')).toBe('|x|');
    });

    it('should convert constants', () => {
      expect(expressionConverter.toMathNotation('Math.PI')).toBe('π');
      expect(expressionConverter.toMathNotation('Math.E')).toBe('e');
    });

    it('should handle complex expressions', () => {
      expect(expressionConverter.toMathNotation('2*Math.sin(x)**2')).toBe('2sin(x)^2');
      expect(expressionConverter.toMathNotation('Math.sqrt(x**2 + y**2)')).toBe('√(x^2 + y^2)');
      expect(expressionConverter.toMathNotation('Math.sin(Math.PI*x)')).toBe('sin(π×x)');
    });
  });

  describe('toJSNotation', () => {
    it('should convert basic arithmetic operations', () => {
      expect(expressionConverter.toJSNotation('2x')).toBe('2*x');
      expect(expressionConverter.toJSNotation('x^2')).toBe('x**2');
      expect(expressionConverter.toJSNotation('2x×3')).toBe('2*x*3');
    });

    it('should convert math functions', () => {
      expect(expressionConverter.toJSNotation('√(x)')).toBe('Math.sqrt(x)');
      expect(expressionConverter.toJSNotation('sin(x)')).toBe('Math.sin(x)');
      expect(expressionConverter.toJSNotation('cos(x)')).toBe('Math.cos(x)');
      expect(expressionConverter.toJSNotation('tan(x)')).toBe('Math.tan(x)');
      expect(expressionConverter.toJSNotation('ln(x)')).toBe('Math.log(x)');
      expect(expressionConverter.toJSNotation('|x|')).toBe('Math.abs(x)');
    });

    it('should convert constants', () => {
      expect(expressionConverter.toJSNotation('π')).toBe('Math.PI');
      expect(expressionConverter.toJSNotation('e^(x)')).toBe('Math.exp(x)');
    });

    it('should handle complex expressions', () => {
      expect(expressionConverter.toJSNotation('2sin(x)^2')).toBe('2*Math.sin(x)**2');
      expect(expressionConverter.toJSNotation('√(x^2 + y^2)')).toBe('Math.sqrt(x**2 + y**2)');
      expect(expressionConverter.toJSNotation('sin(π×x)')).toBe('Math.sin(Math.PI*x)');
    });
  });

  describe('validate', () => {
    it('should validate valid JS expressions', () => {
      expect(expressionConverter.validate('2*x', 'js')).toBe(true);
      expect(expressionConverter.validate('Math.sin(x)', 'js')).toBe(true);
      expect(expressionConverter.validate('x**2 + 2*x + 1', 'js')).toBe(true);
    });

    it('should validate valid math expressions', () => {
      expect(expressionConverter.validate('2x', 'math')).toBe(true);
      expect(expressionConverter.validate('sin(x)', 'math')).toBe(true);
      expect(expressionConverter.validate('x^2 + 2x + 1', 'math')).toBe(true);
    });

    it('should reject invalid expressions', () => {
      expect(expressionConverter.validate('2**', 'js')).toBe(false);
      expect(expressionConverter.validate('sin(', 'math')).toBe(false);
      expect(expressionConverter.validate('x + + y', 'js')).toBe(false);
    });
  });

  describe('bidirectional conversion', () => {
    it('should preserve meaning when converting back and forth', () => {
      const jsExpressions = [
        '2*x + 1',
        'Math.sin(x)**2',
        'Math.sqrt(x**2 + y**2)',
        'Math.sin(Math.PI*x)'
      ];

      for (const jsExpr of jsExpressions) {
        const mathExpr = expressionConverter.toMathNotation(jsExpr);
        const backToJs = expressionConverter.toJSNotation(mathExpr);
        
        // Create test functions to compare results
        const f1 = new Function('x', 'y', `return ${jsExpr}`);
        const f2 = new Function('x', 'y', `return ${backToJs}`);
        
        // Test with some sample values
        const testValues = [-1, 0, 1, Math.PI];
        for (const x of testValues) {
          for (const y of testValues) {
            expect(f1(x, y)).toBeCloseTo(f2(x, y), 10);
          }
        }
      }
    });
  });
}); 