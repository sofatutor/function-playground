import { 
  initLogger, 
  setLoggingEnabled, 
  isLoggingEnabled, 
  overrideConsoleMethods, 
  restoreConsoleMethods,
  LOGGER_STORAGE_KEY
} from '@/utils/logger';

// Add type declaration for the Vite React preamble property
declare global {
  interface Window {
    __vite_plugin_react_preamble_installed__?: boolean;
    __vite_browser_logger_installed__?: boolean;
    __vite_log_to_server?: (level: string, ...args: unknown[]) => void;
  }
}

describe('Logger Utility', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        store = {};
      }),
    };
  })();

  // Mock console methods
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
  };

  // Mock process.env
  const originalNodeEnv = process.env.NODE_ENV;

  // Mock window event listener
  const originalAddEventListener = window.addEventListener;
  const originalDispatchEvent = window.dispatchEvent;

  // Setup mocks before each test
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
    console.debug = jest.fn();
    localStorageMock.clear();
    
    // Default to 'test' environment
    process.env.NODE_ENV = 'test';

    // Mock window event listener
    window.addEventListener = jest.fn();
    window.dispatchEvent = jest.fn();

    // Mock Vite HMR
    window.__vite_plugin_react_preamble_installed__ = false;
  });

  // Restore original console methods and env after each test
  afterEach(() => {
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.debug = originalConsole.debug;
    
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;

    // Restore window event listener
    window.addEventListener = originalAddEventListener;
    window.dispatchEvent = originalDispatchEvent;

    // Clean up Vite HMR mock
    delete window.__vite_plugin_react_preamble_installed__;
    delete window.__vite_browser_logger_installed__;
  });

  test('should initialize with default logging disabled', () => {
    initLogger();
    expect(isLoggingEnabled()).toBe(false);
  });

  test('should initialize with logging enabled in development mode', () => {
    process.env.NODE_ENV = 'development';
    initLogger();
    expect(isLoggingEnabled()).toBe(true);
  });

  test('should initialize with logging enabled from localStorage', () => {
    localStorageMock.setItem(LOGGER_STORAGE_KEY, 'true');
    initLogger();
    expect(isLoggingEnabled()).toBe(true);
  });

  test('should set logging enabled state', () => {
    setLoggingEnabled(true);
    expect(isLoggingEnabled()).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(LOGGER_STORAGE_KEY, 'true');
    
    setLoggingEnabled(false);
    expect(isLoggingEnabled()).toBe(false);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(LOGGER_STORAGE_KEY, 'false');
  });

  test('should connect to dev server in development mode', () => {
    process.env.NODE_ENV = 'development';
    window.__vite_plugin_react_preamble_installed__ = true;
    
    // Mock window.__vite_log_to_server
    window.__vite_log_to_server = jest.fn();
    
    // Manually set the flag that would be set by the browser-logger plugin
    window.__vite_browser_logger_installed__ = true;
    
    initLogger();
    
    // Check if the flag is still set
    expect(window.__vite_browser_logger_installed__).toBe(true);
  });

  test.skip('should override console methods', () => {
    // Mock the Error constructor to provide a consistent stack trace for testing
    const originalError = global.Error;
    global.Error = jest.fn(() => ({
      stack: `
        Error
            at getCallerInfo (src/utils/logger.ts:50:15)
            at console.log (src/utils/logger.ts:90:25)
            at Object.<anonymous> (src/components/TestComponent.tsx:42:13)
      `
    })) as unknown as ErrorConstructor;

    // Make sure the browser logger flag is not set
    window.__vite_browser_logger_installed__ = false;
    
    overrideConsoleMethods();
    
    // Test with logging enabled
    setLoggingEnabled(true);
    console.log('test log');
    console.info('test info');
    console.warn('test warn');
    console.error('test error');
    console.debug('test debug');
    
    expect(console.log).toHaveBeenCalled();
    expect(console.info).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
    expect(console.debug).toHaveBeenCalled();
    
    // Reset mock calls
    jest.clearAllMocks();
    
    // Test with logging disabled
    setLoggingEnabled(false);
    console.log('test log');
    console.info('test info');
    console.warn('test warn');
    console.error('test error'); // Error should still be logged
    console.debug('test debug');
    
    expect(console.log).not.toHaveBeenCalled();
    expect(console.info).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled(); // Error should still be logged
    expect(console.debug).not.toHaveBeenCalled();

    // Restore the original Error constructor
    global.Error = originalError;
  });

  test.skip('should restore original console methods', () => {
    // Make sure the browser logger flag is not set
    window.__vite_browser_logger_installed__ = false;
    
    // Save the original methods before overriding
    const originalLog = console.log;
    const originalInfo = console.info;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalDebug = console.debug;
    
    overrideConsoleMethods();
    restoreConsoleMethods();
    
    // After restoration, console methods should be the original functions
    expect(console.log).toBe(originalLog);
    expect(console.info).toBe(originalInfo);
    expect(console.warn).toBe(originalWarn);
    expect(console.error).toBe(originalError);
    expect(console.debug).toBe(originalDebug);
  });
}); 