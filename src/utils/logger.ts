/**
 * Custom logger utility that overrides console methods with enhanced functionality
 * - Adds timestamps to log messages
 * - Adds source file and line number information
 * - Supports enabling/disabling logs globally
 * - Sends logs to Vite dev server in development mode
 */

// Add type declarations for Vite-specific properties
declare global {
  interface Window {
    __vite_browser_logger_installed__?: boolean;
    __vite_log_to_server?: (level: string, ...args: unknown[]) => void;
  }
}

// Storage key for logger settings
export const LOGGER_STORAGE_KEY = '_gp_log_en';

// Default logger state - disabled by default
let loggingEnabled = false;

// Initialize logger state from localStorage
export const initLogger = () => {
  try {
    const storedValue = localStorage.getItem(LOGGER_STORAGE_KEY);
    if (storedValue !== null) {
      loggingEnabled = storedValue === 'true';
    } else {
      // If no stored value, check if we're in development mode
      loggingEnabled = process.env.NODE_ENV === 'development';
    }
    
    // Log initialization
    if (loggingEnabled) {
      console.log('Logger initialized with logging enabled');
    }
  } catch (e) {
    // If localStorage is not available, keep default
    console.error('Failed to initialize logger settings', e);
  }
};

// Function to enable/disable logging
export const setLoggingEnabled = (enabled: boolean) => {
  loggingEnabled = enabled;
  try {
    localStorage.setItem(LOGGER_STORAGE_KEY, String(enabled));
    
    // Log the change
    if (enabled) {
      console.log('Logging enabled');
    } else {
      console.log('Logging disabled');
    }
  } catch (e) {
    console.error('Failed to save logger settings', e);
  }
};

// Function to get current logging state
export const isLoggingEnabled = () => loggingEnabled;

// Save original console methods
const originalMethods = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug.bind(console),
};

// Helper to format timestamp
const getTimestamp = () => {
  const now = new Date();
  return `[${now.toISOString().split('T')[1].slice(0, 12)}]`;
};

// Helper to get caller information
const getCallerInfo = () => {
  try {
    const err = new Error();
    const stack = err.stack || '';
    
    // Parse the stack trace to find the caller
    // Skip the first few lines which are this function and the console method
    const stackLines = stack.split('\n');
    
    // Find the first line that's not from logger.ts
    let callerLine = '';
    for (let i = 3; i < stackLines.length; i++) {
      if (!stackLines[i].includes('logger.ts')) {
        callerLine = stackLines[i];
        break;
      }
    }
    
    // Extract file path and line number
    if (callerLine) {
      // Different browsers format stack traces differently
      // This regex tries to handle Chrome, Firefox, and Safari formats
      const match = callerLine.match(/(?:at\s+|@)(?:.*?)\(?([^:]+):(\d+):(\d+)/);
      if (match) {
        const [, filePath, line, _column] = match;
        
        // Remove any query parameters (like ?t=1741345674326)
        const cleanPath = filePath.split('?')[0];
        
        // Get the folder and filename from the path
        const pathParts = cleanPath.split('/');
        const fileName = pathParts.pop() || cleanPath;
        
        // If it's an index file, include the parent folder name for context
        if (fileName.startsWith('index.')) {
          const parentFolder = pathParts.length > 0 ? pathParts[pathParts.length - 1] : '';
          if (parentFolder) {
            return `[${parentFolder}/${fileName}:${line}]`;
          }
        }
        
        // For non-index files, just use the filename
        return `[${fileName}:${line}]`;
      }
    }
    
    return '[unknown source]';
  } catch (_e) {
    return '[error getting source]';
  }
};

// Override console methods
export const overrideConsoleMethods = () => {
  // Only override if we're not using the Vite browser logger
  if (window.__vite_browser_logger_installed__) {
    // The Vite plugin is already handling console overrides
    console.log('Using Vite browser logger for console overrides');
    return;
  }

  // Override console.log
  console.log = function(...args) {
    if (loggingEnabled) {
      const timestamp = getTimestamp();
      const callerInfo = getCallerInfo();
      originalMethods.log(timestamp, callerInfo, ...args);
    }
  };

  // Override console.info
  console.info = function(...args) {
    if (loggingEnabled) {
      const timestamp = getTimestamp();
      const callerInfo = getCallerInfo();
      originalMethods.info(timestamp, callerInfo, ...args);
    }
  };

  // Override console.warn
  console.warn = function(...args) {
    if (loggingEnabled) {
      const timestamp = getTimestamp();
      const callerInfo = getCallerInfo();
      originalMethods.warn(timestamp, callerInfo, ...args);
    }
  };

  // Override console.error - always enabled for critical errors
  console.error = function(...args) {
    const timestamp = getTimestamp();
    const callerInfo = getCallerInfo();
    originalMethods.error(timestamp, callerInfo, ...args);
  };

  // Override console.debug
  console.debug = function(...args) {
    if (loggingEnabled) {
      const timestamp = getTimestamp();
      const callerInfo = getCallerInfo();
      originalMethods.debug(timestamp, callerInfo, ...args);
    }
  };
};

// Function to restore original console methods
export const restoreConsoleMethods = () => {
  console.log = originalMethods.log;
  console.info = originalMethods.info;
  console.warn = originalMethods.warn;
  console.error = originalMethods.error;
  console.debug = originalMethods.debug;
}; 