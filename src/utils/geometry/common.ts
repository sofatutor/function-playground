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