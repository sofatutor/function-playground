/**
 * Utility functions for canvas operations
 */
import { ORIGIN_UPDATE_DEBOUNCE_MS } from '@/utils/constants';

/**
 * Creates a debounced function for origin updates to prevent layout thrash during dragging
 */
export const createDebouncedOriginUpdate = (callback: (origin: { x: number; y: number }) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (origin: { x: number; y: number }) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      callback(origin);
      timeoutId = null;
    }, ORIGIN_UPDATE_DEBOUNCE_MS);
  };
};

/**
 * Cancels any pending debounced origin update
 */
export const cancelDebouncedOriginUpdate = (_debouncedFn: ReturnType<typeof createDebouncedOriginUpdate>) => {
  // The timeout is internal to the debounced function, so we need to create a version that exposes cancel
  // For now, we'll use a different approach with refs in the component
};