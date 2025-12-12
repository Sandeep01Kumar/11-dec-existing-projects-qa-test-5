/**
 * Mock Response Factory
 * 
 * Provides factory functions for creating mock HTTP ServerResponse objects
 * for isolated unit testing of the server response handling.
 * 
 * Usage:
 *   const { createMockResponse } = require('./fixtures/mockResponse');
 *   const mockRes = createMockResponse();
 *   handler(mockReq, mockRes);
 *   expect(mockRes.statusCode).toBe(200);
 */

const { EventEmitter } = require('events');

/**
 * Creates a mock HTTP ServerResponse object for testing
 * 
 * The mock response captures all method calls and property assignments,
 * allowing tests to verify correct response handling without actual HTTP I/O.
 * 
 * @param {Object} options - Configuration options for the mock response
 * @param {boolean} [options.captureData=true] - Whether to capture written data
 * @returns {Object} Mock ServerResponse object with jest spies
 * 
 * @example
 * const mockRes = createMockResponse();
 * handler(mockReq, mockRes);
 * expect(mockRes.statusCode).toBe(200);
 * expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
 * expect(mockRes.end).toHaveBeenCalledWith('Hello, World!\n');
 */
function createMockResponse(options = {}) {
  const emitter = new EventEmitter();
  const captureData = options.captureData !== false;
  
  // Storage for captured response data
  const writtenData = [];
  const headers = {};
  
  const mockResponse = {
    // Status code property (typically set directly)
    statusCode: 200,
    statusMessage: 'OK',
    
    // Header management with jest spies
    setHeader: jest.fn((name, value) => {
      headers[name.toLowerCase()] = value;
    }),
    
    getHeader: jest.fn((name) => {
      return headers[name.toLowerCase()];
    }),
    
    removeHeader: jest.fn((name) => {
      delete headers[name.toLowerCase()];
    }),
    
    hasHeader: jest.fn((name) => {
      return name.toLowerCase() in headers;
    }),
    
    getHeaders: jest.fn(() => ({ ...headers })),
    
    // Response body methods with jest spies
    write: jest.fn((chunk, encoding, callback) => {
      if (captureData) {
        writtenData.push(chunk);
      }
      if (typeof callback === 'function') {
        callback();
      }
      return true;
    }),
    
    end: jest.fn((chunk, encoding, callback) => {
      if (chunk !== undefined && captureData) {
        writtenData.push(chunk);
      }
      // Handle callback as second or third argument
      const cb = typeof encoding === 'function' ? encoding : callback;
      if (typeof cb === 'function') {
        cb();
      }
      emitter.emit('finish');
      return mockResponse;
    }),
    
    // Writable stream methods
    cork: jest.fn(),
    uncork: jest.fn(),
    flushHeaders: jest.fn(),
    
    // Header writing control
    headersSent: false,
    sendDate: true,
    
    // Connection management
    finished: false,
    writableEnded: false,
    writableFinished: false,
    
    // Socket reference (minimal mock)
    socket: {
      remoteAddress: '127.0.0.1',
      remotePort: 12345,
      destroy: jest.fn()
    },
    
    // Event emitter methods
    on: emitter.on.bind(emitter),
    once: emitter.once.bind(emitter),
    emit: emitter.emit.bind(emitter),
    removeListener: emitter.removeListener.bind(emitter),
    removeAllListeners: emitter.removeAllListeners.bind(emitter),
    
    // Utility methods for testing
    _getWrittenData: () => writtenData.join(''),
    _getHeaders: () => ({ ...headers }),
    _reset: () => {
      writtenData.length = 0;
      Object.keys(headers).forEach(key => delete headers[key]);
      mockResponse.statusCode = 200;
      mockResponse.statusMessage = 'OK';
      mockResponse.headersSent = false;
      mockResponse.finished = false;
      mockResponse.writableEnded = false;
      mockResponse.writableFinished = false;
      mockResponse.setHeader.mockClear();
      mockResponse.getHeader.mockClear();
      mockResponse.removeHeader.mockClear();
      mockResponse.hasHeader.mockClear();
      mockResponse.getHeaders.mockClear();
      mockResponse.write.mockClear();
      mockResponse.end.mockClear();
    }
  };
  
  return mockResponse;
}

/**
 * Creates a mock response that simulates write failure
 * 
 * @returns {Object} Mock response that rejects writes
 */
function createFailingMockResponse() {
  const mockRes = createMockResponse();
  mockRes.write.mockReturnValue(false);
  return mockRes;
}

/**
 * Creates a mock response that tracks timing
 * 
 * @returns {Object} Mock response with timing information
 */
function createTimedMockResponse() {
  const mockRes = createMockResponse();
  const startTime = Date.now();
  
  mockRes._getElapsedTime = () => Date.now() - startTime;
  
  const originalEnd = mockRes.end;
  mockRes.end = jest.fn((...args) => {
    mockRes._endTime = Date.now();
    return originalEnd(...args);
  });
  
  return mockRes;
}

module.exports = {
  createMockResponse,
  createFailingMockResponse,
  createTimedMockResponse
};
