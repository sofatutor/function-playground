import { convertNaturalLanguageToExpression } from '../openaiService';

describe('OpenAI Service', () => {
  describe('convertNaturalLanguageToExpression', () => {
    it('should convert parabola description to x*x', async () => {
      const result = await convertNaturalLanguageToExpression('a parabola that opens upward');
      expect(result.expression).toBe('x*x');
      expect(result.explanation).toContain('quadratic');
    });

    it('should convert sine wave description to Math.sin(x)', async () => {
      const result = await convertNaturalLanguageToExpression('a sine wave');
      expect(result.expression).toBe('Math.sin(x)');
      expect(result.explanation).toContain('sine');
    });

    it('should convert cosine wave description to Math.cos(x)', async () => {
      const result = await convertNaturalLanguageToExpression('cosine wave');
      expect(result.expression).toBe('Math.cos(x)');
      expect(result.explanation).toContain('cosine');
    });

    it('should convert exponential growth description to Math.exp(x)', async () => {
      const result = await convertNaturalLanguageToExpression('exponential growth');
      expect(result.expression).toBe('Math.exp(x)');
      expect(result.explanation).toContain('exponential');
    });

    it('should convert logarithm description to Math.log(x)', async () => {
      const result = await convertNaturalLanguageToExpression('natural logarithm');
      expect(result.expression).toBe('Math.log(x)');
      expect(result.explanation).toContain('logarithm');
    });

    it('should convert cubic function description to x*x*x', async () => {
      const result = await convertNaturalLanguageToExpression('a cubic function');
      expect(result.expression).toBe('x*x*x');
      expect(result.explanation).toContain('cubic');
    });

    it('should convert square root description to Math.sqrt(x)', async () => {
      const result = await convertNaturalLanguageToExpression('square root function');
      expect(result.expression).toBe('Math.sqrt(x)');
      expect(result.explanation).toContain('square root');
    });

    it('should convert absolute value description to Math.abs(x)', async () => {
      const result = await convertNaturalLanguageToExpression('absolute value function');
      expect(result.expression).toBe('Math.abs(x)');
      expect(result.explanation).toContain('absolute');
    });

    it('should convert tangent description to Math.tan(x)', async () => {
      const result = await convertNaturalLanguageToExpression('tangent function');
      expect(result.expression).toBe('Math.tan(x)');
      expect(result.explanation).toContain('tangent');
    });

    it('should default to linear function for unknown descriptions', async () => {
      const result = await convertNaturalLanguageToExpression('some random function');
      expect(result.expression).toBe('x');
      expect(result.explanation).toContain('linear');
    });
    
    it('should use mock implementation when no API key is provided', async () => {
      const result = await convertNaturalLanguageToExpression('a parabola', null);
      expect(result.expression).toBe('x*x');
      expect(result.explanation).toContain('quadratic');
    });
    
    it('should use mock implementation when API key is empty string', async () => {
      const result = await convertNaturalLanguageToExpression('a parabola', '');
      expect(result.expression).toBe('x*x');
      expect(result.explanation).toContain('quadratic');
    });
  });
}); 