import { Point } from '@/types/shapes';
import { distanceBetweenPoints } from './pointOperations';

// Helper functions for shape calculations
export const generateId = (): string => Math.random().toString(36).substring(2, 9);

// Re-export the distanceBetweenPoints function for backward compatibility
export { distanceBetweenPoints };

// Default shape properties
export const DEFAULT_FILL = 'rgba(190, 227, 219, 0.5)';
export const DEFAULT_STROKE = '#555B6E';
export const DEFAULT_STROKE_WIDTH = 1;

// Default pixel to physical unit conversion (standard 96 DPI: 1cm = 37.8px)
export const DEFAULT_PIXELS_PER_CM = 60;
// 1 inch = 96px on standard DPI screens
export const DEFAULT_PIXELS_PER_INCH = 152.4;

// Helper to get calibrated values from localStorage
export const getStoredPixelsPerUnit = (unit: 'cm' | 'in'): number => {
  const storedValue = localStorage.getItem(`pixelsPerUnit_${unit}`);
  if (storedValue) {
    return parseFloat(storedValue);
  }
  return unit === 'cm' ? DEFAULT_PIXELS_PER_CM : DEFAULT_PIXELS_PER_INCH;
};

// Conversion between units
export const cmToInches = (cm: number): number => cm / 2.54;
export const inchesToCm = (inches: number): number => inches * 2.54;

// Golden ratio for color generation to ensure visually distinct colors
const GOLDEN_RATIO_CONJUGATE = 0.618033988749895;

// Keep track of the current hue
let currentHue = Math.random();

/**
 * Generate a visually distinct color using HSL color space and golden ratio
 * @param saturation Saturation value (0-1)
 * @param lightness Lightness value (0-1)
 * @param alpha Alpha/opacity value (0-1)
 * @returns A distinct color in rgba format
 */
export const getNextShapeColor = (
  saturation = 0.9, 
  lightness = 0.5, 
  alpha = 0.8
): string => {
  // Use golden ratio to generate next hue
  currentHue = (currentHue + GOLDEN_RATIO_CONJUGATE) % 1;
  
  // Convert HSL to RGB
  const hue = currentHue * 360;
  const rgb = hslToRgb(hue, saturation, lightness);
  
  // Return as rgba string
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
};

/**
 * Get a random color
 * @param saturation Saturation value (0-1)
 * @param lightness Lightness value (0-1)
 * @param alpha Alpha/opacity value (0-1)
 * @returns A random color in rgba format
 */
export const getRandomShapeColor = (
  saturation = 0.9, 
  lightness = 0.5, 
  alpha = 0.8
): string => {
  // Generate a random hue
  const hue = Math.random() * 360;
  const rgb = hslToRgb(hue, saturation, lightness);
  
  // Return as rgba string
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
};

/**
 * Convert HSL color values to RGB
 * @param h Hue (0-360)
 * @param s Saturation (0-1)
 * @param l Lightness (0-1)
 * @returns RGB values as [r, g, b] where each value is 0-255
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
} 