import { jest } from '@jest/globals';
import type { IncomingMessage } from 'http';

/**
 * Mock server response type with additional properties for testing
 */
export interface MockServerResponse {
  setHeader: jest.Mock;
  statusCode: number;
  end: jest.Mock;
  responseData: string;
}

// Type for the 'on' method of IncomingMessage
type IncomingMessageOnMethod = (
  event: string,
  listener: (...args: unknown[]) => void
) => IncomingMessage;

/**
 * Creates a mock HTTP request with proper typing
 */
export function createMockRequest(method: string, url: string): IncomingMessage {
  const req = {
    method,
    url,
    headers: { host: 'localhost:3000' },
    on: jest.fn()
  } as unknown as IncomingMessage;
  
  // Add proper implementation for the 'on' method
  req.on = jest.fn().mockImplementation((event: string, callback: (...args: unknown[]) => void) => {
    if (event === 'end') {
      callback();
    }
    return req;
  }) as unknown as IncomingMessage['on'];
  
  return req;
}

/**
 * Creates a mock HTTP response with proper typing
 */
export function createMockResponse(): MockServerResponse {
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
}

/**
 * Adds mock body data to a request for testing log submissions
 */
export function addMockRequestBody(req: IncomingMessage, bodyData: Record<string, unknown>): void {
  const onMock = jest.fn().mockImplementation((event: string, callback: (...args: unknown[]) => void) => {
    if (event === 'data') {
      callback(JSON.stringify(bodyData));
    } else if (event === 'end') {
      callback();
    }
    return req;
  }) as unknown as IncomingMessage['on'];
  req.on = onMock;
} 