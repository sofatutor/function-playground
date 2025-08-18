/**
 * Centralized calibration and localStorage helper
 * SSR-safe and testable
 */

import { MeasurementUnit } from '@/types/shapes';
import { 
  DEFAULT_PIXELS_PER_CM, 
  DEFAULT_PIXELS_PER_INCH 
} from '@/components/GeometryCanvas/CanvasUtils';
import { logger } from '@/utils/logging';

const STORAGE_KEY_PREFIX = 'geometry-canvas-';

interface CalibrationData {
  pixelsPerCm: number;
  pixelsPerInch: number;
}

/**
 * Check if localStorage is available (SSR-safe)
 */
const isLocalStorageAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    const test = 'test';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get stored calibration value for a specific unit
 */
export const getStoredCalibrationValue = (unit: MeasurementUnit): number => {
  if (!isLocalStorageAvailable()) {
    return getDefaultCalibrationValue(unit);
  }
  
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${unit}`);
    if (stored) {
      const value = parseFloat(stored);
      if (!isNaN(value) && value > 0) {
        return value;
      }
    }
  } catch (error) {
    logger.warn(`Failed to read calibration value for ${unit}:`, error);
  }
  
  // Log when using default value
  const defaultValue = getDefaultCalibrationValue(unit);
  logger.debug(`No stored value for ${unit}, using default: ${defaultValue}`);
  return defaultValue;
};

/**
 * Store calibration value for a specific unit
 */
export const storeCalibrationValue = (unit: MeasurementUnit, value: number): void => {
  if (!isLocalStorageAvailable()) {
    logger.warn('localStorage not available, cannot store calibration value');
    return;
  }
  
  if (value <= 0) {
    logger.warn(`Invalid calibration value: ${value}. Must be positive.`);
    return;
  }
  
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${unit}`, value.toString());
    logger.debug(`Stored calibration value for ${unit}: ${value}`);
  } catch (error) {
    logger.error(`Failed to store calibration value for ${unit}:`, error);
  }
};

/**
 * Get default calibration value for a unit
 */
export const getDefaultCalibrationValue = (unit: MeasurementUnit): number => {
  switch (unit) {
    case 'cm':
      return DEFAULT_PIXELS_PER_CM;
    case 'in':
      return DEFAULT_PIXELS_PER_INCH;
    default:
      logger.warn(`Unknown measurement unit: ${unit}. Using cm default.`);
      return DEFAULT_PIXELS_PER_CM;
  }
};

/**
 * Get all stored calibration data
 */
export const getAllCalibrationData = (): CalibrationData => {
  return {
    pixelsPerCm: getStoredCalibrationValue('cm'),
    pixelsPerInch: getStoredCalibrationValue('in'),
  };
};

/**
 * Clear all stored calibration data
 */
export const clearAllCalibrationData = (): void => {
  if (!isLocalStorageAvailable()) {
    logger.warn('localStorage not available, cannot clear calibration data');
    return;
  }
  
  const units: MeasurementUnit[] = ['cm', 'in'];
  
  try {
    units.forEach(unit => {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${unit}`);
    });
    logger.debug('Cleared all calibration data');
  } catch (error) {
    logger.error('Failed to clear calibration data:', error);
  }
};