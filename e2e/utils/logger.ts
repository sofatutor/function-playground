/**
 * Simple logger utility for e2e tests
 * Only outputs debug logs when DEBUG environment variable is set
 */

// Use string constants instead of enum for better compatibility
const LOG_LEVEL = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
} as const;

export class Logger {
  private static isDebugEnabled = !!process.env.DEBUG;

  /**
   * Log a debug message - only visible when DEBUG env var is set
   */
  static debug(message: string, ...args: unknown[]): void {
    if (this.isDebugEnabled) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Log an info message - always visible
   */
  static info(message: string, ...args: unknown[]): void {
    console.log(`[INFO] ${message}`, ...args);
  }

  /**
   * Log a warning message - always visible
   */
  static warn(message: string, ...args: unknown[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  }

  /**
   * Log an error message - always visible
   */
  static error(message: string, ...args: unknown[]): void {
    console.error(`[ERROR] ${message}`, ...args);
  }
} 