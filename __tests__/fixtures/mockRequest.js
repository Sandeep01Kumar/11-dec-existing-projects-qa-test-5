/**
 * Mock Request Factory Module
 * 
 * Factory module for creating mock HTTP IncomingMessage (request) objects
 * used in unit tests. Provides createMockRequest() factory function that
 * returns configurable mock request objects with properties like method,
 * url, headers, and httpVersion.
 * 
 * Enables isolated unit testing of the server's request handler without
 * actual network binding.
 * 
 * @module __tests__/fixtures/mockRequest
 * 
 * @example
 * // Basic usage:
 * const { createMockRequest } = require('./fixtures/mockRequest');
 * const mockReq = createMockRequest({ method: 'POST', url: '/api' });
 * 
 * @example
 * // GET request with custom headers:
 * const mockReq = createMockRequest({
 *   method: 'GET',
 *   url: '/users?id=123',
 *   headers: { 'accept': 'application/json' }
 * });
 * 
 * @example
 * // POST request:
 * const mockReq = createMockRequest({
 *   method: 'POST',
 *   url: '/api/data',
 *   headers: { 'content-type': 'application/json' }
 * });
 */

'use strict';

/**
 * Factory function to create mock HTTP IncomingMessage objects for testing.
 * 
 * Creates a configurable mock request object that simulates the Node.js
 * http.IncomingMessage interface. The mock includes standard HTTP request
 * properties as well as Jest mock functions for event emitter methods,
 * enabling verification of event listener registration during handler testing.
 * 
 * @param {Object} [options={}] - Configuration options for the mock request
 * @param {string} [options.method='GET'] - HTTP method (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD, etc.)
 * @param {string} [options.url='/'] - Request URL path including query string if any
 * @param {Object} [options.headers={}] - Object containing HTTP request headers (header names should be lowercase)
 * @param {string} [options.httpVersion='1.1'] - HTTP protocol version string
 * @returns {Object} Mock request object with HTTP properties and Jest mock event emitter methods
 * 
 * @example
 * // Create a basic GET request mock
 * const mockReq = createMockRequest();
 * console.log(mockReq.method);  // 'GET'
 * console.log(mockReq.url);     // '/'
 * 
 * @example
 * // Create a POST request mock with custom URL and headers
 * const mockReq = createMockRequest({
 *   method: 'POST',
 *   url: '/api/users',
 *   headers: {
 *     'content-type': 'application/json',
 *     'authorization': 'Bearer token123'
 *   }
 * });
 * 
 * @example
 * // Verify event listener registration
 * const mockReq = createMockRequest();
 * mockReq.on('data', handler);
 * expect(mockReq.on).toHaveBeenCalledWith('data', handler);
 */
function createMockRequest(options = {}) {
  // Default configuration values for a standard HTTP request
  const defaults = {
    method: 'GET',
    url: '/',
    headers: {},
    httpVersion: '1.1'
  };

  // Merge provided options with defaults, allowing options to override
  const mergedOptions = {
    ...defaults,
    ...options
  };

  // Construct the mock request object with HTTP properties and event emitter mocks
  const mockRequest = {
    // HTTP request properties from merged options
    method: mergedOptions.method,
    url: mergedOptions.url,
    headers: mergedOptions.headers,
    httpVersion: mergedOptions.httpVersion,

    // Event emitter mock methods using Jest's jest.fn()
    // These allow tests to verify event listener registration if needed
    // during handler testing without requiring actual network operations
    on: jest.fn(),
    once: jest.fn(),
    emit: jest.fn(),
    removeListener: jest.fn()
  };

  return mockRequest;
}

// Export the factory function for use in test files
module.exports = { createMockRequest };
