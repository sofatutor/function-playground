import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import type { ViteDevServer } from 'vite';

// Mock chalk implementation
const mockChalk = {
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
  },
  default: (text: string) => text
};

// Mock chalk before importing the module that uses it
jest.doMock('chalk', () => mockChalk);

// Now import the module that uses chalk
import { browserLogger } from '../../vite-plugins/browser-logger';

// Mock server response type
interface MockServerResponse {
  setHeader: jest.Mock;
  statusCode: number;
  end: jest.Mock;
  responseData: string;
}

// Type for middleware function
type MiddlewareFunction = (req: IncomingMessage, res: ServerResponse) => void;

// Extended request type with emitEvents method
interface ExtendedIncomingMessage extends IncomingMessage {
  emitEvents: () => void;
}

describe('Browser Logger Plugin', () => {
  // Mock Date.now to control time
  const originalDateNow = Date.now;
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    // Mock console to silence output
    console.log = jest.fn();
    console.error = jest.fn();
    
    // Mock Date.now
    jest.useFakeTimers();
    
    // Set a fixed time for Date.now
    const mockNow = 1000;
    Date.now = jest.fn(() => mockNow);
  });
  
  afterEach(() => {
    // Restore console
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    
    // Restore Date.now
    Date.now = originalDateNow;
    jest.useRealTimers();
  });
  
  // Helper functions for creating mock requests and responses
  const createMockReq = (method: string, url: string): IncomingMessage => {
    const req = {
      method,
      url,
      headers: { host: 'localhost:3000' },
      on: jest.fn()
    } as unknown as IncomingMessage;
    
    return req;
  };
  
  const createMockRes = (): MockServerResponse => {
    const res = {
      setHeader: jest.fn(),
      statusCode: 0,
      end: jest.fn(),
      responseData: ''
    };
    
    // Override end to capture response data
    res.end = jest.fn(function(this: MockServerResponse, data?: string) {
      if (data) {
        this.responseData = data;
      }
      return this;
    });
    
    return res;
  };
  
  const createPostRequest = (url: string, body: Record<string, unknown>): ExtendedIncomingMessage => {
    const req = createMockReq('POST', url) as ExtendedIncomingMessage;
    
    // Mock the request body events
    const onMock = req.on as jest.Mock;
    
    // Store callbacks for later execution
    const callbacks: Record<string, (data?: string) => void> = {};
    
    onMock.mockImplementation((event: string, callback: (data?: string) => void) => {
      callbacks[event] = callback;
      return req;
    });
    
    // Add a method to trigger the events in the correct order
    req.emitEvents = () => {
      if (callbacks['data']) {
        callbacks['data'](JSON.stringify(body));
      }
      if (callbacks['end']) {
        callbacks['end']();
      }
    };
    
    return req;
  };
  
  test('should release connection after timeout', async () => {
    // Create the plugin
    const plugin = browserLogger() as Plugin;
    
    // Mock server and middleware
    const mockMiddlewareUse = jest.fn();
    const mockHttpServerOn = jest.fn();
    
    const mockServer = {
      middlewares: {
        use: mockMiddlewareUse
      },
      httpServer: {
        on: mockHttpServerOn
      }
    } as unknown as ViteDevServer;
    
    // Call configureServer to set up the middleware
    const configureServerFn = plugin.configureServer as (server: ViteDevServer) => void;
    configureServerFn(mockServer);
    
    // Get the middleware function
    const middleware = mockMiddlewareUse.mock.calls[0][1] as MiddlewareFunction;
    
    // First connection handshake
    const handshakeReq = createMockReq('GET', '/vite-browser-log?action=handshake');
    const handshakeRes = createMockRes();
    
    middleware(handshakeReq, handshakeRes as unknown as ServerResponse);
    
    // Extract connection ID
    const responseData = JSON.parse(handshakeRes.responseData);
    const connectionId = responseData.connectionId;
    
    // Verify connection is active
    expect(responseData.status).toBe('active');
    
    // Update the mock time to simulate timeout
    jest.advanceTimersByTime(11000);
    (Date.now as jest.Mock).mockReturnValue(12000);
    
    // Manually trigger the timeout check
    jest.runOnlyPendingTimers();
    
    // Try to send a log with the now-timed-out connection
    const logReq = createPostRequest('/vite-browser-log', {
      connectionId,
      level: 'info',
      message: 'Test log',
      timestamp: '[12:34:56.789]',
      context: '[src/test.ts:123]'
    });
    const logRes = createMockRes();
    
    middleware(logReq, logRes as unknown as ServerResponse);
    
    // Trigger the request events
    logReq.emitEvents();
    
    // Verify log is rejected
    expect(logRes.statusCode).toBe(403);
  }, 10000);
  
  test('should allow inactive connection to become active after timeout', async () => {
    // Create the plugin
    const plugin = browserLogger() as Plugin;
    
    // Mock server and middleware
    const mockMiddlewareUse = jest.fn();
    const mockHttpServerOn = jest.fn();
    
    const mockServer = {
      middlewares: {
        use: mockMiddlewareUse
      },
      httpServer: {
        on: mockHttpServerOn
      }
    } as unknown as ViteDevServer;
    
    // Call configureServer to set up the middleware
    const configureServerFn = plugin.configureServer as (server: ViteDevServer) => void;
    configureServerFn(mockServer);
    
    // Get the middleware function
    const middleware = mockMiddlewareUse.mock.calls[0][1] as MiddlewareFunction;
    
    // First connection handshake
    const handshakeReq1 = createMockReq('GET', '/vite-browser-log?action=handshake');
    const handshakeRes1 = createMockRes();
    
    middleware(handshakeReq1, handshakeRes1 as unknown as ServerResponse);
    
    // Extract first connection ID
    const responseData1 = JSON.parse(handshakeRes1.responseData);
    const connectionId1 = responseData1.connectionId;
    
    // Verify first connection is active
    expect(responseData1.status).toBe('active');
    
    // Second connection handshake
    const handshakeReq2 = createMockReq('GET', '/vite-browser-log?action=handshake');
    const handshakeRes2 = createMockRes();
    
    middleware(handshakeReq2, handshakeRes2 as unknown as ServerResponse);
    
    // Extract second connection ID
    const responseData2 = JSON.parse(handshakeRes2.responseData);
    const connectionId2 = responseData2.connectionId;
    
    // Verify second connection is inactive
    expect(responseData2.status).toBe('inactive');
    
    // Update the mock time to simulate timeout
    jest.advanceTimersByTime(11000);
    (Date.now as jest.Mock).mockReturnValue(12000);
    
    // Manually trigger the timeout check
    jest.runOnlyPendingTimers();
    
    // Send heartbeat from second connection
    const heartbeatReq = createMockReq('GET', `/vite-browser-log?action=heartbeat&connectionId=${connectionId2}`);
    const heartbeatRes = createMockRes();
    
    middleware(heartbeatReq, heartbeatRes as unknown as ServerResponse);
    
    // Verify second connection is now active
    expect(heartbeatRes.statusCode).toBe(200);
    expect(JSON.parse(heartbeatRes.responseData).status).toBe('active');
    
    // Try to send a log with the second connection
    const logReq = createPostRequest('/vite-browser-log', {
      connectionId: connectionId2,
      level: 'info',
      message: 'Test log',
      timestamp: '[12:34:56.789]',
      context: '[src/test.ts:123]'
    });
    const logRes = createMockRes();
    
    middleware(logReq, logRes as unknown as ServerResponse);
    
    // Trigger the request events
    logReq.emitEvents();
    
    // Verify log is accepted
    expect(logRes.statusCode).toBe(200);
  }, 10000);
  
  test('should immediately make a new connection active if current connection has timed out', async () => {
    // Create the plugin
    const plugin = browserLogger() as Plugin;
    
    // Mock server and middleware
    const mockMiddlewareUse = jest.fn();
    const mockHttpServerOn = jest.fn();
    
    const mockServer = {
      middlewares: {
        use: mockMiddlewareUse
      },
      httpServer: {
        on: mockHttpServerOn
      }
    } as unknown as ViteDevServer;
    
    // Call configureServer to set up the middleware
    const configureServerFn = plugin.configureServer as (server: ViteDevServer) => void;
    configureServerFn(mockServer);
    
    // Get the middleware function
    const middleware = mockMiddlewareUse.mock.calls[0][1] as MiddlewareFunction;
    
    // First connection handshake
    const handshakeReq1 = createMockReq('GET', '/vite-browser-log?action=handshake');
    const handshakeRes1 = createMockRes();
    
    middleware(handshakeReq1, handshakeRes1 as unknown as ServerResponse);
    
    // Extract first connection ID
    const responseData1 = JSON.parse(handshakeRes1.responseData);
    const connectionId1 = responseData1.connectionId;
    
    // Verify first connection is active
    expect(responseData1.status).toBe('active');
    
    // Update the mock time to simulate timeout
    (Date.now as jest.Mock).mockReturnValue(12000);
    
    // Second connection handshake - should become active immediately
    const handshakeReq2 = createMockReq('GET', '/vite-browser-log?action=handshake');
    const handshakeRes2 = createMockRes();
    
    middleware(handshakeReq2, handshakeRes2 as unknown as ServerResponse);
    
    // Extract second connection ID
    const responseData2 = JSON.parse(handshakeRes2.responseData);
    const connectionId2 = responseData2.connectionId;
    
    // Verify second connection is active (not inactive)
    expect(responseData2.status).toBe('active');
    
    // Try to send a log with the second connection
    const logReq = createPostRequest('/vite-browser-log', {
      connectionId: connectionId2,
      level: 'info',
      message: 'Test log',
      timestamp: '[12:34:56.789]',
      context: '[src/test.ts:123]'
    });
    const logRes = createMockRes();
    
    middleware(logReq, logRes as unknown as ServerResponse);
    
    // Trigger the request events
    logReq.emitEvents();
    
    // Verify log is accepted
    expect(logRes.statusCode).toBe(200);
    
    // Try to send a log with the first connection (should be rejected)
    const logReq2 = createPostRequest('/vite-browser-log', {
      connectionId: connectionId1,
      level: 'info',
      message: 'Test log',
      timestamp: '[12:34:56.789]',
      context: '[src/test.ts:123]'
    });
    const logRes2 = createMockRes();
    
    middleware(logReq2, logRes2 as unknown as ServerResponse);
    
    // Trigger the request events
    logReq2.emitEvents();
    
    // Verify log from first connection is rejected
    expect(logRes2.statusCode).toBe(403);
  }, 10000);
  
  test('should immediately make a secondary connection active on heartbeat if primary connection has timed out', async () => {
    // Create the plugin
    const plugin = browserLogger() as Plugin;
    
    // Mock server and middleware
    const mockMiddlewareUse = jest.fn();
    const mockHttpServerOn = jest.fn();
    
    const mockServer = {
      middlewares: {
        use: mockMiddlewareUse
      },
      httpServer: {
        on: mockHttpServerOn
      }
    } as unknown as ViteDevServer;
    
    // Call configureServer to set up the middleware
    const configureServerFn = plugin.configureServer as (server: ViteDevServer) => void;
    configureServerFn(mockServer);
    
    // Get the middleware function
    const middleware = mockMiddlewareUse.mock.calls[0][1] as MiddlewareFunction;
    
    // First connection handshake
    const handshakeReq1 = createMockReq('GET', '/vite-browser-log?action=handshake');
    const handshakeRes1 = createMockRes();
    
    middleware(handshakeReq1, handshakeRes1 as unknown as ServerResponse);
    
    // Extract first connection ID
    const responseData1 = JSON.parse(handshakeRes1.responseData);
    const connectionId1 = responseData1.connectionId;
    
    // Verify first connection is active
    expect(responseData1.status).toBe('active');
    
    // Second connection handshake - should be inactive
    const handshakeReq2 = createMockReq('GET', '/vite-browser-log?action=handshake');
    const handshakeRes2 = createMockRes();
    
    middleware(handshakeReq2, handshakeRes2 as unknown as ServerResponse);
    
    // Extract second connection ID
    const responseData2 = JSON.parse(handshakeRes2.responseData);
    const connectionId2 = responseData2.connectionId;
    
    // Verify second connection is inactive
    expect(responseData2.status).toBe('inactive');
    
    // Update the mock time to simulate timeout
    (Date.now as jest.Mock).mockReturnValue(12000);
    
    // Send heartbeat from second connection - should become active immediately
    const heartbeatReq = createMockReq('GET', `/vite-browser-log?action=heartbeat&connectionId=${connectionId2}`);
    const heartbeatRes = createMockRes();
    
    middleware(heartbeatReq, heartbeatRes as unknown as ServerResponse);
    
    // Verify second connection is now active
    expect(heartbeatRes.statusCode).toBe(200);
    expect(JSON.parse(heartbeatRes.responseData).status).toBe('active');
    
    // Try to send a log with the second connection
    const logReq = createPostRequest('/vite-browser-log', {
      connectionId: connectionId2,
      level: 'info',
      message: 'Test log',
      timestamp: '[12:34:56.789]',
      context: '[src/test.ts:123]'
    });
    const logRes = createMockRes();
    
    middleware(logReq, logRes as unknown as ServerResponse);
    
    // Trigger the request events
    logReq.emitEvents();
    
    // Verify log is accepted
    expect(logRes.statusCode).toBe(200);
  }, 10000);

  test('should handle disconnect requests properly', async () => {
    // Create the plugin
    const plugin = browserLogger() as Plugin;
    
    // Mock server and middleware
    const mockMiddlewareUse = jest.fn();
    const mockHttpServerOn = jest.fn();
    
    const mockServer = {
      middlewares: {
        use: mockMiddlewareUse
      },
      httpServer: {
        on: mockHttpServerOn
      }
    } as unknown as ViteDevServer;
    
    // Call configureServer to set up the middleware
    const configureServerFn = plugin.configureServer as (server: ViteDevServer) => void;
    configureServerFn(mockServer);
    
    // Get the middleware function
    const middleware = mockMiddlewareUse.mock.calls[0][1] as MiddlewareFunction;
    
    // First connection handshake
    const handshakeReq = createMockReq('GET', '/vite-browser-log?action=handshake');
    const handshakeRes = createMockRes();
    
    middleware(handshakeReq, handshakeRes as unknown as ServerResponse);
    
    // Extract connection ID
    const responseData = JSON.parse(handshakeRes.responseData);
    const connectionId = responseData.connectionId;
    
    // Verify connection is active
    expect(responseData.status).toBe('active');
    
    // Send disconnect request
    const disconnectReq = createMockReq('GET', `/vite-browser-log?action=disconnect&connectionId=${connectionId}`);
    const disconnectRes = createMockRes();
    
    middleware(disconnectReq, disconnectRes as unknown as ServerResponse);
    
    // Verify disconnect response
    expect(disconnectRes.statusCode).toBe(200);
    expect(JSON.parse(disconnectRes.responseData).status).toBe('disconnected');
    
    // Try to send a log after disconnect
    const logReq = createPostRequest('/vite-browser-log', {
      connectionId,
      level: 'info',
      message: 'Test log',
      timestamp: '[12:34:56.789]',
      context: '[src/test.ts:123]'
    });
    const logRes = createMockRes();
    
    middleware(logReq, logRes as unknown as ServerResponse);
    
    // Trigger the request events
    logReq.emitEvents();
    
    // Verify log is rejected
    expect(logRes.statusCode).toBe(403);
  });

  test('should handle different log levels correctly', async () => {
    // Create the plugin
    const plugin = browserLogger() as Plugin;
    
    // Mock server and middleware
    const mockMiddlewareUse = jest.fn();
    const mockHttpServerOn = jest.fn();
    
    const mockServer = {
      middlewares: {
        use: mockMiddlewareUse
      },
      httpServer: {
        on: mockHttpServerOn
      }
    } as unknown as ViteDevServer;
    
    // Call configureServer to set up the middleware
    const configureServerFn = plugin.configureServer as (server: ViteDevServer) => void;
    configureServerFn(mockServer);
    
    // Get the middleware function
    const middleware = mockMiddlewareUse.mock.calls[0][1] as MiddlewareFunction;
    
    // First connection handshake
    const handshakeReq = createMockReq('GET', '/vite-browser-log?action=handshake');
    const handshakeRes = createMockRes();
    
    middleware(handshakeReq, handshakeRes as unknown as ServerResponse);
    
    // Extract connection ID
    const responseData = JSON.parse(handshakeRes.responseData);
    const connectionId = responseData.connectionId;
    
    // Test different log levels
    const logLevels = ['error', 'warn', 'info', 'debug', 'unknown'];
    
    for (const level of logLevels) {
      const logReq = createPostRequest('/vite-browser-log', {
        connectionId,
        level,
        message: `Test ${level} log`,
        timestamp: '[12:34:56.789]',
        context: '[src/test.ts:123]'
      });
      const logRes = createMockRes();
      
      middleware(logReq, logRes as unknown as ServerResponse);
      
      // Trigger the request events
      logReq.emitEvents();
      
      // Verify log is accepted
      expect(logRes.statusCode).toBe(200);
      expect(logRes.responseData).toBe('OK');
    }
  });

  test('should handle malformed log data correctly', async () => {
    // Create the plugin
    const plugin = browserLogger() as Plugin;
    
    // Mock server and middleware
    const mockMiddlewareUse = jest.fn();
    const mockHttpServerOn = jest.fn();
    
    const mockServer = {
      middlewares: {
        use: mockMiddlewareUse
      },
      httpServer: {
        on: mockHttpServerOn
      }
    } as unknown as ViteDevServer;
    
    // Call configureServer to set up the middleware
    const configureServerFn = plugin.configureServer as (server: ViteDevServer) => void;
    configureServerFn(mockServer);
    
    // Get the middleware function
    const middleware = mockMiddlewareUse.mock.calls[0][1] as MiddlewareFunction;
    
    // First connection handshake
    const handshakeReq = createMockReq('GET', '/vite-browser-log?action=handshake');
    const handshakeRes = createMockRes();
    
    middleware(handshakeReq, handshakeRes as unknown as ServerResponse);
    
    // Extract connection ID
    const responseData = JSON.parse(handshakeRes.responseData);
    const connectionId = responseData.connectionId;
    
    // Test with invalid JSON
    const invalidReq = createMockReq('POST', '/vite-browser-log') as ExtendedIncomingMessage;
    const invalidRes = createMockRes();
    
    // Mock the request body events with invalid JSON
    const onMock = invalidReq.on as jest.Mock;
    onMock.mockImplementation((event: string, callback: (data?: string) => void) => {
      if (event === 'data') {
        callback('invalid json');
      } else if (event === 'end') {
        callback();
      }
      return invalidReq;
    });
    
    middleware(invalidReq, invalidRes as unknown as ServerResponse);
    
    // Verify error response
    expect(invalidRes.statusCode).toBe(400);
    expect(invalidRes.responseData).toBe('Bad Request');
    
    // Test with missing required fields
    const missingFieldsReq = createPostRequest('/vite-browser-log', {
      connectionId
      // missing level, message, etc.
    });
    const missingFieldsRes = createMockRes();
    
    middleware(missingFieldsReq, missingFieldsRes as unknown as ServerResponse);
    
    // Trigger the request events
    missingFieldsReq.emitEvents();
    
    // Verify error response
    expect(missingFieldsRes.statusCode).toBe(400);
    expect(missingFieldsRes.responseData).toBe('Bad Request');
  });

  test('should handle CORS and HTTP methods correctly', async () => {
    // Create the plugin
    const plugin = browserLogger() as Plugin;
    
    // Mock server and middleware
    const mockMiddlewareUse = jest.fn();
    const mockHttpServerOn = jest.fn();
    
    const mockServer = {
      middlewares: {
        use: mockMiddlewareUse
      },
      httpServer: {
        on: mockHttpServerOn
      }
    } as unknown as ViteDevServer;
    
    // Call configureServer to set up the middleware
    const configureServerFn = plugin.configureServer as (server: ViteDevServer) => void;
    configureServerFn(mockServer);
    
    // Get the middleware function
    const middleware = mockMiddlewareUse.mock.calls[0][1] as MiddlewareFunction;
    
    // Test OPTIONS request (CORS preflight)
    const optionsReq = createMockReq('OPTIONS', '/vite-browser-log');
    const optionsRes = createMockRes();
    
    middleware(optionsReq, optionsRes as unknown as ServerResponse);
    
    // Verify CORS headers and response
    expect(optionsRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
    expect(optionsRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    expect(optionsRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type');
    expect(optionsRes.statusCode).toBe(200);
    
    // Test unknown GET request
    const unknownGetReq = createMockReq('GET', '/vite-browser-log?action=unknown');
    const unknownGetRes = createMockRes();
    
    middleware(unknownGetReq, unknownGetRes as unknown as ServerResponse);
    
    // Verify bad request response
    expect(unknownGetRes.statusCode).toBe(400);
    expect(unknownGetRes.responseData).toBe('Bad Request');
    
    // Test unsupported method
    const unsupportedReq = createMockReq('PUT', '/vite-browser-log');
    const unsupportedRes = createMockRes();
    
    middleware(unsupportedReq, unsupportedRes as unknown as ServerResponse);
    
    // Verify method not allowed response
    expect(unsupportedRes.statusCode).toBe(405);
    expect(unsupportedRes.responseData).toBe('Method Not Allowed');
  });
}); 