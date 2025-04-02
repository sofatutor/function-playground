import { detectParameters, isValidParameterName } from '@/utils/parameterDetection';

describe('parameterDetection', () => {
  describe('detectParameters', () => {
    it('should detect single parameter in simple formula', () => {
      const formula = 'ax^2';
      const result = detectParameters(formula);
      expect(result).toEqual([
        { name: 'a', displayName: 'a', defaultValue: 1, minValue: -10, maxValue: 10, step: 0.1 }
      ]);
    });

    it('should detect multiple parameters in formula', () => {
      const formula = 'ax^2 + bx + c';
      const result = detectParameters(formula);
      expect(result).toEqual([
        { name: 'a', displayName: 'a', defaultValue: 1, minValue: -10, maxValue: 10, step: 0.1 },
        { name: 'b', displayName: 'b', defaultValue: 1, minValue: -10, maxValue: 10, step: 0.1 },
        { name: 'c', displayName: 'c', defaultValue: 1, minValue: -10, maxValue: 10, step: 0.1 }
      ]);
    });

    it('should not detect x as a parameter', () => {
      const formula = 'ax^2 + bx + c';
      const result = detectParameters(formula);
      expect(result).not.toContainEqual({ name: 'x', defaultValue: 1 });
    });

    it('should not detect parameters in function names', () => {
      const formula = 'sin(x) + a*cos(x)';
      const result = detectParameters(formula);
      expect(result).toEqual([
        { name: 'a', displayName: 'a', defaultValue: 1, minValue: -10, maxValue: 10, step: 0.1 }
      ]);
    });

    it('should handle Math function names', () => {
      const formula = 'Math.sin(x) + a*Math.cos(x)';
      const result = detectParameters(formula);
      expect(result).toEqual([
        { name: 'a', displayName: 'a', defaultValue: 1, minValue: -10, maxValue: 10, step: 0.1 }
      ]);
    });

    it('should handle nested functions', () => {
      const formula = 'a*sqrt(b*x^2)';
      const result = detectParameters(formula);
      expect(result).toEqual([
        { name: 'a', displayName: 'a', defaultValue: 1, minValue: -10, maxValue: 10, step: 0.1 },
        { name: 'b', displayName: 'b', defaultValue: 1, minValue: -10, maxValue: 10, step: 0.1 }
      ]);
    });

    it('should handle whitespace', () => {
      const formula = 'a * x^2 + b * x + c';
      const result = detectParameters(formula);
      expect(result).toEqual([
        { name: 'a', displayName: 'a', defaultValue: 1, minValue: -10, maxValue: 10, step: 0.1 },
        { name: 'b', displayName: 'b', defaultValue: 1, minValue: -10, maxValue: 10, step: 0.1 },
        { name: 'c', displayName: 'c', defaultValue: 1, minValue: -10, maxValue: 10, step: 0.1 }
      ]);
    });

    it('should handle case sensitivity', () => {
      const formula = 'Ax^2 + Bx + C';
      const result = detectParameters(formula);
      expect(result).toEqual([
        { name: 'a', displayName: 'a', defaultValue: 1, minValue: -10, maxValue: 10, step: 0.1 },
        { name: 'b', displayName: 'b', defaultValue: 1, minValue: -10, maxValue: 10, step: 0.1 },
        { name: 'c', displayName: 'c', defaultValue: 1, minValue: -10, maxValue: 10, step: 0.1 }
      ]);
    });
  });

  describe('isValidParameterName', () => {
    it('should accept single letters', () => {
      expect(isValidParameterName('a')).toBe(true);
      expect(isValidParameterName('b')).toBe(true);
      expect(isValidParameterName('z')).toBe(true);
    });

    it('should not accept x', () => {
      expect(isValidParameterName('x')).toBe(false);
    });

    it('should not accept multiple characters', () => {
      expect(isValidParameterName('ab')).toBe(false);
      expect(isValidParameterName('a1')).toBe(false);
    });

    it('should not accept numbers', () => {
      expect(isValidParameterName('1')).toBe(false);
      expect(isValidParameterName('2')).toBe(false);
    });

    it('should not accept function names', () => {
      expect(isValidParameterName('sin')).toBe(false);
      expect(isValidParameterName('cos')).toBe(false);
      expect(isValidParameterName('sqrt')).toBe(false);
    });
  });
}); 