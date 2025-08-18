import { createDebouncedOriginUpdate } from '@/utils/canvasUtils';

describe('canvasUtils', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('createDebouncedOriginUpdate', () => {
    it('should debounce function calls', () => {
      const mockCallback = jest.fn();
      const debouncedUpdate = createDebouncedOriginUpdate(mockCallback);

      // Call multiple times quickly
      debouncedUpdate({ x: 1, y: 1 });
      debouncedUpdate({ x: 2, y: 2 });
      debouncedUpdate({ x: 3, y: 3 });

      // Should not have been called yet
      expect(mockCallback).not.toHaveBeenCalled();

      // Fast-forward time
      jest.advanceTimersByTime(50);

      // Should be called with the last value only
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith({ x: 3, y: 3 });
    });

    it('should cancel previous timeouts when called multiple times', () => {
      const mockCallback = jest.fn();
      const debouncedUpdate = createDebouncedOriginUpdate(mockCallback);

      // Call and advance time partially
      debouncedUpdate({ x: 1, y: 1 });
      jest.advanceTimersByTime(25); // Half the debounce time

      // Call again - should reset the timer
      debouncedUpdate({ x: 2, y: 2 });
      jest.advanceTimersByTime(25); // Should not trigger yet

      expect(mockCallback).not.toHaveBeenCalled();

      // Complete the debounce time
      jest.advanceTimersByTime(25);

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith({ x: 2, y: 2 });
    });

    it('should call callback after debounce time has passed', () => {
      const mockCallback = jest.fn();
      const debouncedUpdate = createDebouncedOriginUpdate(mockCallback);

      debouncedUpdate({ x: 10, y: 20 });

      jest.advanceTimersByTime(50);

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith({ x: 10, y: 20 });
    });
  });
});