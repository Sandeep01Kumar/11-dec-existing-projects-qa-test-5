/**
 * Mock Request Factory
 * 
 * Provides factory functions for creating mock HTTP IncomingMessage objects
 * for isolated unit testing of the server request handler.
 * 
 * Usage:
 *   const { createMockRequest } = require('./fixtures/mockRequest');
 *   const mockReq = createMockRequest({ method: 'POST', url: '/api' });
 */

const { EventEmitter } = require('events');

/**
 * Creates a mock HTTP IncomingMessage object for testing
 * 
 * @param {Object} options - Configuration options for the mock request
 * @param {string} [options.method='GET'] - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param {string} [options.url='/'] - Request URL path
 * @param {Object} [options.headers={}] - HTTP request headers
 * @param {string} [options.httpVersion='1.1'] - HTTP version string
 * @param {Object} [options.socket={}] - Mock socket object
 * @returns {Object} Mock IncomingMessage object with event emitter capabilities
 * 
 * @example
 * const mockReq = createMockRequest({
 *   method: 'POST',
 *   url: '/api/users',
 *   headers: { 'content-type': 'application/json' }
 * });
 */
function createMockRequest(options = {}) {
  const emitter = new EventEmitter();
  
  const mockRequest = {
    // HTTP request properties
    method: options.method || 'GET',
    url: options.url || '/',
    headers: options.headers || {},
    httpVersion: options.httpVersion || '1.1',
    
    // Socket properties (minimal mock)
    socket: options.socket || {
      remoteAddress: '127.0.0.1',
      remotePort: 12345,
      encrypted: false
    },
    
    // Connection property
    connection: options.connection || {
      remoteAddress: '127.0.0.1',
      remotePort: 12345
    },
    
    // Event emitter methods
    on: emitter.on.bind(emitter),
    once: emitter.once.bind(emitter),
    emit: emitter.emit.bind(emitter),
    removeListener: emitter.removeListener.bind(emitter),
    removeAllListeners: emitter.removeAllListeners.bind(emitter),
    
    // Readable stream methods (minimal implementation)
    read: jest.fn().mockReturnValue(null),
    pause: jest.fn(),
    resume: jest.fn(),
    setEncoding: jest.fn(),
    destroy: jest.fn(),
    
    // Additional properties
    complete: true,
    aborted: false,
    rawHeaders: [],
    trailers: {},
    rawTrailers: []
  };
  
  return mockRequest;
}

/**
 * Creates a mock GET request
 * 
 * @param {string} [url='/'] - Request URL path
 * @param {Object} [headers={}] - Request headers
 * @returns {Object} Mock GET request object
 */
function createMockGetRequest(url = '/', headers = {}) {
  return createMockRequest({
    method: 'GET',
    url,
    headers
  });
}

/**
 * Creates a mock POST request
 * 
 * @param {string} [url='/'] - Request URL path
 * @param {Object} [headers={}] - Request headers
 * @returns {Object} Mock POST request object
 */
function createMockPostRequest(url = '/', headers = {}) {
  return createMockRequest({
    method: 'POST',
    url,
    headers: {
      'content-type': 'application/json',
      ...headers
    }
  });
}

/**
 * Creates a mock request with custom HTTP method
 * 
 * @param {string} method - HTTP method
 * @param {string} [url='/'] - Request URL path
 * @param {Object} [headers={}] - Request headers
 * @returns {Object} Mock request object with specified method
 */
function createMockRequestWithMethod(method, url = '/', headers = {}) {
  return createMockRequest({
    method: method.toUpperCase(),
    url,
    headers
  });
}

module.exports = {
  createMockRequest,
  createMockGetRequest,
  createMockPostRequest,
  createMockRequestWithMethod
};
