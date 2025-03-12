/**
 * Test utilities for mocking chalk in tests
 * This provides a safe way to use chalk in tests without color codes
 */

// Define a type for the chalk interface we're using
export interface ChalkInterface {
  green: (text: string) => string;
  yellow: (text: string) => string;
  red: (text: string) => string;
  blue: (text: string) => string;
  magenta: (text: string) => string;
  white: (text: string) => string;
  dim: (text: string) => string;
  cyan: (text: string) => string;
  bold: {
    bgBlack: (text: string) => string;
  };
}

// Mock chalk implementation for tests
export const mockChalk: ChalkInterface = {
  green: (text: string) => text,
  yellow: (text: string) => text,
  red: (text: string) => text,
  blue: (text: string) => text,
  magenta: (text: string) => text,
  white: (text: string) => text,
  dim: (text: string) => text,
  cyan: (text: string) => text,
  bold: {
    bgBlack: (text: string) => text
  }
};

/**
 * Creates a safe chalk implementation that uses the mock in tests
 * and the real chalk in production
 */
export function createSafeChalk(realChalk: ChalkInterface, isTest: boolean = false): ChalkInterface {
  return {
    green: (text: string) => isTest ? text : realChalk.green(text),
    yellow: (text: string) => isTest ? text : realChalk.yellow(text),
    red: (text: string) => isTest ? text : realChalk.red(text),
    blue: (text: string) => isTest ? text : realChalk.blue(text),
    magenta: (text: string) => isTest ? text : realChalk.magenta(text),
    white: (text: string) => isTest ? text : realChalk.white(text),
    dim: (text: string) => isTest ? text : realChalk.dim(text),
    cyan: (text: string) => isTest ? text : realChalk.cyan(text),
    bold: {
      bgBlack: (text: string) => isTest ? text : realChalk.bold.bgBlack(text)
    }
  };
} 