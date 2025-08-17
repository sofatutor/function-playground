import { logger, isVerboseLoggingEnabled } from '@/utils/logging';

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('logging utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleWarn.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('logger', () => {
    it('should log debug messages when verbose logging is enabled', () => {
      if (isVerboseLoggingEnabled()) {
        logger.debug('test debug message');
        expect(mockConsoleLog).toHaveBeenCalledWith('[DEBUG]', 'test debug message');
      } else {
        logger.debug('test debug message');
        expect(mockConsoleLog).not.toHaveBeenCalled();
      }
    });

    it('should always log error messages', () => {
      logger.error('test error message');
      expect(mockConsoleError).toHaveBeenCalledWith('[ERROR]', 'test error message');
    });

    it('should log warning messages when enabled', () => {
      logger.warn('test warning message');
      // Warnings should be logged in most environments
      expect(mockConsoleWarn).toHaveBeenCalledWith('[WARN]', 'test warning message');
    });
  });

  describe('isVerboseLoggingEnabled', () => {
    it('should return a boolean', () => {
      expect(typeof isVerboseLoggingEnabled()).toBe('boolean');
    });
  });
});