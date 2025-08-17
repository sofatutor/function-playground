import {
  getStoredCalibrationValue,
  storeCalibrationValue,
  getDefaultCalibrationValue,
  getAllCalibrationData,
  clearAllCalibrationData,
} from '@/utils/calibrationHelper';
import { MeasurementUnit } from '@/types/shapes';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('calibrationHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDefaultCalibrationValue', () => {
    it('should return correct defaults for each unit', () => {
      expect(getDefaultCalibrationValue('cm')).toBe(60);
      expect(getDefaultCalibrationValue('in')).toBe(152.4);
    });

    it('should return cm default for unknown units', () => {
      expect(getDefaultCalibrationValue('unknown' as MeasurementUnit)).toBe(60);
    });
  });

  describe('getStoredCalibrationValue', () => {
    it('should return stored value when available', () => {
      localStorageMock.getItem.mockReturnValue('80');
      
      const result = getStoredCalibrationValue('cm');
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('geometry-canvas-cm');
      expect(result).toBe(80);
    });

    it('should return default value when no stored value', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = getStoredCalibrationValue('cm');
      
      expect(result).toBe(60); // default for cm
    });

    it('should return default value for invalid stored value', () => {
      localStorageMock.getItem.mockReturnValue('invalid');
      
      const result = getStoredCalibrationValue('cm');
      
      expect(result).toBe(60); // default for cm
    });
  });

  describe('storeCalibrationValue', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should store valid calibration value', () => {
      storeCalibrationValue('cm', 80);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('geometry-canvas-cm', '80');
    });

    it('should not store invalid calibration value', () => {
      storeCalibrationValue('cm', -10);
      
      // Should not call setItem for the calibration value, but isLocalStorageAvailable check still calls it
      expect(localStorageMock.setItem).toHaveBeenCalledWith('test', 'test');
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith('geometry-canvas-cm', '-10');
    });

    it('should not store zero calibration value', () => {
      storeCalibrationValue('cm', 0);
      
      // Should not call setItem for the calibration value, but isLocalStorageAvailable check still calls it
      expect(localStorageMock.setItem).toHaveBeenCalledWith('test', 'test');
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith('geometry-canvas-cm', '0');
    });
  });

  describe('getAllCalibrationData', () => {
    it('should return calibration data for all units', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'geometry-canvas-cm') return '80';
        if (key === 'geometry-canvas-in') return '160';
        return null;
      });

      const result = getAllCalibrationData();

      expect(result).toEqual({
        pixelsPerCm: 80,
        pixelsPerInch: 160,
      });
    });
  });

  describe('clearAllCalibrationData', () => {
    it('should clear all stored calibration data', () => {
      clearAllCalibrationData();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('geometry-canvas-cm');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('geometry-canvas-in');
    });
  });
});