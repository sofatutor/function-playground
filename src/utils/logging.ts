/**
 * Centralized logging utility
 * Gates verbose logs behind loggingEnabled/NODE_ENV
 */

interface LoggingConfig {
  enabled: boolean;
  level: 'debug' | 'info' | 'warn' | 'error';
}

// Check if logging is enabled via environment variables
const getLoggingConfig = (): LoggingConfig => {
  // In test environment, enable all logging by default
  if (process.env.NODE_ENV === 'test') {
    return {
      enabled: true,
      level: 'debug'
    };
  }
  
  if (typeof window !== 'undefined') {
    try {
      // Check for Vite environment variables
      if (typeof globalThis !== 'undefined' && 'VITE_LOGGING_ENABLED' in globalThis) {
        const loggingEnabled = (globalThis as {[key: string]: unknown}).VITE_LOGGING_ENABLED;
        const envMode = (globalThis as {[key: string]: unknown}).MODE || 'production';
        
        return {
          enabled: loggingEnabled === 'true' || envMode === 'development',
          level: envMode === 'development' ? 'debug' : 'warn'
        };
      }
    } catch {
      // Fallback for environments where globalThis variables are not available
    }
  }
  
  return {
    enabled: process.env.NODE_ENV === 'development',
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'warn'
  };
};

const config = getLoggingConfig();

export const logger = {
  debug: (...args: unknown[]) => {
    if (config.enabled && ['debug'].includes(config.level)) {
      console.log('[DEBUG]', ...args);
    }
  },
  
  info: (...args: unknown[]) => {
    if (config.enabled && ['debug', 'info'].includes(config.level)) {
      console.log('[INFO]', ...args);
    }
  },
  
  warn: (...args: unknown[]) => {
    if (config.enabled && ['debug', 'info', 'warn'].includes(config.level)) {
      console.warn('[WARN]', ...args);
    }
  },
  
  error: (...args: unknown[]) => {
    if (config.enabled) {
      console.error('[ERROR]', ...args);
    }
  }
};

// Convenience function to check if verbose logging is enabled
export const isVerboseLoggingEnabled = (): boolean => {
  return config.enabled && config.level === 'debug';
};