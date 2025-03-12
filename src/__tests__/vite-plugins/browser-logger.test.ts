import { browserLogger } from '../../vite-plugins/browser-logger';
import type { Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

// Mock chalk to avoid color codes in tests
jest.mock('chalk', () => {
  const chalkFn = (text: string) => text;
  chalkFn.green = (text: string) => text;
  chalkFn.yellow = (text: string) => text;
  chalkFn.red = (text: string) => text;
  chalkFn.blue = (text: string) => text;
  chalkFn.magenta = (text: string) => text;
  chalkFn.white = (text: string) => text;
  chalkFn.dim = (text: string) => text;
  chalkFn.cyan = (text: string) => text;
  chalkFn.bold = {
    bgBlack: (text: string) => text
  };
  return { default: chalkFn };
});

// Define custom response type with responseData property
interface MockServerResponse {
  setHeader: jest.Mock;
  statusCode: number;
  end: jest.Mock;
  responseData: string;
}

describe('Browser Logger Plugin', () => {
  // Set NODE_ENV to test for the tests
  const originalNodeEnv = process.env.NODE_ENV;
  
  // Mock console.log to avoid cluttering test output
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    console.log = jest.fn();
    console.error = jest.fn();
    // Reset timers
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });
  
  test('should release connection after timeout period', async () => {
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
    const middleware = mockMiddlewareUse.mock.calls[0][1];
    
    // Create mock request and response objects
    const createMockReq = (method: string, url: string): IncomingMessage => {
      return {
        method,
        url,
        headers: { host: 'localhost:3000' },
        on: jest.fn((event, callback) => {
          if (event === 'end') {
            callback();
          }
          return {} as IncomingMessage;
        })
      } as unknown as IncomingMessage;
    };
    
    const createMockRes = (): MockServerResponse => {
      const res: MockServerResponse = {
        setHeader: jest.fn(),
        statusCode: 0,
        end: jest.fn(),
        responseData: '',
      };
      
      // Override end to capture response data
      res.end = jest.fn((data?: string) => {
        if (data) {
          res.responseData = data;
        }
        return res as unknown as MockServerResponse;
      });
      
      return res;
    };
    
    // Test handshake request
    const handshakeReq = createMockReq('GET', '/vite-browser-log?action=handshake');
    const handshakeRes = createMockRes();
    
    middleware(handshakeReq, handshakeRes);
    
    // Verify handshake response
    expect(handshakeRes.statusCode).toBe(200);
    expect(handshakeRes.responseData).toContain('active');
    
    // Extract connection ID from response
    const responseData = JSON.parse(handshakeRes.responseData);
    const connectionId = responseData.connectionId;
    
    // Verify connection is active
    expect(responseData.status).toBe('active');
    
    // Fast forward time to just before timeout
    jest.advanceTimersByTime(9000);
    
    // Send a heartbeat to keep the connection alive
    const heartbeatReq = createMockReq('GET', `/vite-browser-log?action=heartbeat&connectionId=${connectionId}`);
    const heartbeatRes = createMockRes();
    
    middleware(heartbeatReq, heartbeatRes);
    
    // Verify heartbeat response
    expect(heartbeatRes.statusCode).toBe(200);
    expect(JSON.parse(heartbeatRes.responseData).status).toBe('active');
    
    // Fast forward time to just after timeout without sending another heartbeat
    jest.advanceTimersByTime(11000);
    
    // Try to send a log with the now-timed-out connection
    const logReq = createMockReq('POST', '/vite-browser-log');
    const logRes = createMockRes();
    
    // Mock the request body
    logReq.on = jest.fn((event, callback) => {
      if (event === 'data') {
        callback(JSON.stringify({
          connectionId,
          level: 'info',
          message: 'Test log',
          timestamp: '[12:34:56.789]',
          context: '[src/test.ts:123]'
        }));
      } else if (event === 'end') {
        callback();
      }
      return logReq;
    });
    
    middleware(logReq, logRes);
    
    // Verify log is rejected because connection timed out
    expect(logRes.statusCode).toBe(403);
    
    // Try to send a new handshake after timeout
    const newHandshakeReq = createMockReq('GET', '/vite-browser-log?action=handshake');
    const newHandshakeRes = createMockRes();
    
    middleware(newHandshakeReq, newHandshakeRes);
    
    // Verify new connection is accepted as active
    expect(newHandshakeRes.statusCode).toBe(200);
    expect(JSON.parse(newHandshakeRes.responseData).status).toBe('active');
  });
  
  test('should allow inactive connection to become active after timeout', async () => {
    // Create the plugin
    const plugin = browserLogger() as Plugin;
    
    // Access the internal state of the plugin for testing
    const pluginInstance = plugin as unknown as {
      configureServer: (server: ViteDevServer) => void;
      _testExports?: {
        activeConnectionId: string | null;
        lastHeartbeatTime: number;
        checkConnectionTimeout: () => void;
      };
    };
    
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
    const configureServerFn = pluginInstance.configureServer as (server: ViteDevServer) => void;
    configureServerFn(mockServer);
    
    // Get the middleware function
    const middleware = mockMiddlewareUse.mock.calls[0][1];
    
    // Create mock request and response objects
    const createMockReq = (method: string, url: string): IncomingMessage => {
      return {
        method,
        url,
        headers: { host: 'localhost:3000' },
        on: jest.fn((event, callback) => {
          if (event === 'end') {
            callback();
          }
          return {} as IncomingMessage;
        })
      } as unknown as IncomingMessage;
    };
    
    const createMockRes = (): MockServerResponse => {
      const res: MockServerResponse = {
        setHeader: jest.fn(),
        statusCode: 0,
        end: jest.fn(),
        responseData: '',
      };
      
      // Override end to capture response data
      res.end = jest.fn((data?: string) => {
        if (data) {
          res.responseData = data;
        }
        return res as unknown as MockServerResponse;
      });
      
      return res;
    };
    
    // First connection handshake
    const handshakeReq1 = createMockReq('GET', '/vite-browser-log?action=handshake');
    const handshakeRes1 = createMockRes();
    
    middleware(handshakeReq1, handshakeRes1);
    
    // Extract first connection ID
    const responseData1 = JSON.parse(handshakeRes1.responseData);
    const connectionId1 = responseData1.connectionId;
    
    // Verify first connection is active
    expect(responseData1.status).toBe('active');
    
    // Second connection handshake
    const handshakeReq2 = createMockReq('GET', '/vite-browser-log?action=handshake');
    const handshakeRes2 = createMockRes();
    
    middleware(handshakeReq2, handshakeRes2);
    
    // Extract second connection ID
    const responseData2 = JSON.parse(handshakeRes2.responseData);
    const connectionId2 = responseData2.connectionId;
    
    // Verify second connection is inactive
    expect(responseData2.status).toBe('inactive');
    
    // Fast forward time to trigger timeout for first connection
    jest.advanceTimersByTime(11000);
    
    // Manually trigger the timeout check (since we can't directly access the interval)
    // This is a workaround for testing - in real usage, the interval would trigger this
    jest.runOnlyPendingTimers();
    
    // Send heartbeat from second connection
    const heartbeatReq = createMockReq('GET', `/vite-browser-log?action=heartbeat&connectionId=${connectionId2}`);
    const heartbeatRes = createMockRes();
    
    middleware(heartbeatReq, heartbeatRes);
    
    // Verify second connection is now active
    expect(heartbeatRes.statusCode).toBe(200);
    expect(JSON.parse(heartbeatRes.responseData).status).toBe('active');
    
    // Try to send a log with the second connection
    const logReq = createMockReq('POST', '/vite-browser-log');
    const logRes = createMockRes();
    
    // Mock the request body
    logReq.on = jest.fn((event, callback) => {
      if (event === 'data') {
        callback(JSON.stringify({
          connectionId: connectionId2,
          level: 'info',
          message: 'Test log',
          timestamp: '[12:34:56.789]',
          context: '[src/test.ts:123]'
        }));
      } else if (event === 'end') {
        callback();
      }
      return logReq;
    });
    
    middleware(logReq, logRes);
    
    // Verify log is accepted
    expect(logRes.statusCode).toBe(200);
  });
}); 