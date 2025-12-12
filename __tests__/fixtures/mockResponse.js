/**
 * Mock Response Factory Module
 * 
 * Factory module for creating mock HTTP ServerResponse objects with Jest spies
 * used in unit tests. Provides createMockResponse() factory function that returns
 * mock response objects with spied methods for testing the server's request
 * handler behavior. Enables verification of response configuration without
 * actual HTTP communication.
 * 
 * @module __tests__/fixtures/mockResponse
 */

'use strict';

/**
 * Factory function to create mock HTTP ServerResponse objects with Jest spies.
 * 
 * Creates a mock response object that mimics the Node.js http.ServerResponse
 * interface with Jest spy functions for all methods. This enables isolated
 * unit testing of request handlers without actual network binding.
 * 
 * The mock response tracks:
 * - statusCode property assignments
 * - setHeader() calls with headers stored internally
 * - end() calls with response body data
 * - write() calls for streaming responses
 * - writeHead() calls for combined status and headers
 * - Event emitter method calls
 * 
 * @returns {Object} Mock response object with spied methods and properties
 * 
 * @example
 * // Basic usage:
 * const { createMockResponse } = require('./fixtures/mockResponse');
 * const mockRes = createMockResponse();
 * 
 * // Invoke request handler
 * requestHandler(mockReq, mockRes);
 * 
 * // Assert on spy calls
 * expect(mockRes.statusCode).toBe(200);
 * expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
 * expect(mockRes.end).toHaveBeenCalledWith('Hello, World!\n');
 * 
 * @example
 * // Verify headers were set correctly:
 * const mockRes = createMockResponse();
 * handler(mockReq, mockRes);
 * expect(mockRes.getHeader('content-type')).toBe('text/plain');
 * expect(mockRes._headers['content-type']).toBe('text/plain');
 * 
 * @example
 * // Verify response body:
 * const mockRes = createMockResponse();
 * handler(mockReq, mockRes);
 * expect(mockRes._body).toBe('Hello, World!\n');
 * expect(mockRes.finished).toBe(true);
 */
function createMockResponse() {
  /**
   * Mock response object simulating Node.js http.ServerResponse
   * @type {Object}
   */
  const mockResponse = {
    // =========================================================================
    // PROPERTIES
    // =========================================================================
    
    /**
     * HTTP status code for the response
     * Defaults to 200 (OK) per HTTP conventions
     * Can be set directly by request handlers (e.g., res.statusCode = 404)
     * @type {number}
     */
    statusCode: 200,
    
    /**
     * HTTP status message corresponding to the status code
     * @type {string}
     */
    statusMessage: '',
    
    /**
     * Indicates whether headers have already been sent to the client
     * @type {boolean}
     */
    headersSent: false,
    
    /**
     * Indicates whether the response has been completed
     * @type {boolean}
     */
    finished: false,
    
    // =========================================================================
    // INTERNAL STORAGE (for testing assertions)
    // =========================================================================
    
    /**
     * Internal storage for headers (case-insensitive keys stored as lowercase)
     * Allows tests to verify headers without calling getHeader()
     * @type {Object}
     * @private
     */
    _headers: {},
    
    /**
     * Internal storage for response body data
     * Accumulated from write() and end() calls
     * @type {string}
     * @private
     */
    _body: '',
    
    /**
     * Gets all data written to the response
     * Returns accumulated data from write() and end() calls
     * 
     * @function
     * @returns {string} All written data concatenated
     */
    _getWrittenData: function() {
      return this._body || '';
    },
    
    // =========================================================================
    // HEADER METHODS (as Jest spies)
    // =========================================================================
    
    /**
     * Sets a single header value for the response
     * Headers are stored case-insensitively (converted to lowercase)
     * 
     * @function
     * @param {string} name - Header name
     * @param {string|number|string[]} value - Header value
     * @returns {void}
     */
    setHeader: jest.fn(function(name, value) {
      this._headers[name.toLowerCase()] = value;
    }),
    
    /**
     * Retrieves a previously set header value
     * 
     * @function
     * @param {string} name - Header name (case-insensitive)
     * @returns {string|number|string[]|undefined} Header value or undefined
     */
    getHeader: jest.fn(function(name) {
      return this._headers[name.toLowerCase()];
    }),
    
    /**
     * Removes a header from the response
     * 
     * @function
     * @param {string} name - Header name to remove (case-insensitive)
     * @returns {void}
     */
    removeHeader: jest.fn(function(name) {
      delete this._headers[name.toLowerCase()];
    }),
    
    /**
     * Checks if a header has been set
     * 
     * @function
     * @param {string} name - Header name to check (case-insensitive)
     * @returns {boolean} True if header exists
     */
    hasHeader: jest.fn(function(name) {
      return Object.prototype.hasOwnProperty.call(this._headers, name.toLowerCase());
    }),
    
    /**
     * Returns a shallow copy of all current outgoing headers
     * 
     * @function
     * @returns {Object} Object containing all headers
     */
    getHeaders: jest.fn(function() {
      return { ...this._headers };
    }),
    
    /**
     * Returns an array of header names that have been set
     * 
     * @function
     * @returns {string[]} Array of header names
     */
    getHeaderNames: jest.fn(function() {
      return Object.keys(this._headers);
    }),
    
    // =========================================================================
    // RESPONSE WRITING METHODS (as Jest spies)
    // =========================================================================
    
    /**
     * Sends the response header with status code and optional headers
     * This is a combined method for setting status and headers at once
     * 
     * @function
     * @param {number} statusCode - HTTP status code
     * @param {string} [statusMessage] - Optional status message
     * @param {Object} [headers] - Optional headers object
     * @returns {Object} Returns the mock response for chaining
     */
    writeHead: jest.fn(function(statusCode, statusMessage, headers) {
      this.statusCode = statusCode;
      
      // Handle overloaded signature: writeHead(statusCode, headers)
      let headersObj = headers;
      if (typeof statusMessage === 'object' && statusMessage !== null) {
        headersObj = statusMessage;
      } else if (typeof statusMessage === 'string') {
        this.statusMessage = statusMessage;
      }
      
      // Merge headers if provided
      if (headersObj && typeof headersObj === 'object') {
        Object.keys(headersObj).forEach(key => {
          this._headers[key.toLowerCase()] = headersObj[key];
        });
      }
      
      this.headersSent = true;
      return this;
    }),
    
    /**
     * Writes a chunk of the response body
     * Can be called multiple times to send the body in chunks
     * 
     * @function
     * @param {string|Buffer} chunk - Data to write
     * @param {string} [encoding] - Character encoding (default: 'utf8')
     * @param {Function} [callback] - Callback when chunk is flushed
     * @returns {boolean} Returns true (simulating successful write)
     */
    write: jest.fn(function(chunk, encoding, callback) {
      // Handle chunk conversion and append to body
      if (chunk !== undefined && chunk !== null) {
        if (Buffer.isBuffer(chunk)) {
          this._body += chunk.toString(typeof encoding === 'string' ? encoding : 'utf8');
        } else {
          this._body += String(chunk);
        }
      }
      
      // Handle callback (may be second or third argument)
      const cb = typeof encoding === 'function' ? encoding : callback;
      if (typeof cb === 'function') {
        // Simulate async callback
        process.nextTick(cb);
      }
      
      return true;
    }),
    
    /**
     * Signals that all response headers and body have been sent
     * This method MUST be called on each response to complete it
     * 
     * @function
     * @param {string|Buffer} [data] - Optional final data to send
     * @param {string} [encoding] - Character encoding for data
     * @param {Function} [callback] - Optional callback when response is finished
     * @returns {Object} Returns the mock response for chaining
     */
    end: jest.fn(function(data, encoding, callback) {
      // Append final data if provided
      if (data !== undefined && data !== null && typeof data !== 'function') {
        if (Buffer.isBuffer(data)) {
          this._body += data.toString(typeof encoding === 'string' ? encoding : 'utf8');
        } else {
          this._body += String(data);
        }
      }
      
      // Mark response as finished
      this.finished = true;
      
      // Handle callback (may be in different argument positions)
      let cb;
      if (typeof data === 'function') {
        cb = data;
      } else if (typeof encoding === 'function') {
        cb = encoding;
      } else if (typeof callback === 'function') {
        cb = callback;
      }
      
      if (cb) {
        // Simulate async callback
        process.nextTick(cb);
      }
      
      // Emit 'finish' event if listeners are set up
      if (typeof this.emit === 'function' && this.emit.mock) {
        // Only emit if emit is a mock function (to avoid errors)
        this.emit('finish');
      }
      
      return this;
    }),
    
    // =========================================================================
    // STREAM CONTROL METHODS (as Jest spies)
    // =========================================================================
    
    /**
     * Buffers all written chunks until uncork() is called
     * @function
     */
    cork: jest.fn(),
    
    /**
     * Flushes all data buffered since cork() was called
     * @function
     */
    uncork: jest.fn(),
    
    /**
     * Flushes the response headers
     * @function
     */
    flushHeaders: jest.fn(function() {
      this.headersSent = true;
    }),
    
    // =========================================================================
    // EVENT EMITTER METHODS (as Jest spies)
    // =========================================================================
    
    /**
     * Adds a listener for the specified event
     * @function
     * @param {string} event - Event name
     * @param {Function} listener - Event handler function
     * @returns {Object} Returns the mock response for chaining
     */
    on: jest.fn(function() {
      return this;
    }),
    
    /**
     * Adds a one-time listener for the specified event
     * @function
     * @param {string} event - Event name
     * @param {Function} listener - Event handler function
     * @returns {Object} Returns the mock response for chaining
     */
    once: jest.fn(function() {
      return this;
    }),
    
    /**
     * Emits an event to all registered listeners
     * @function
     * @param {string} event - Event name
     * @param {...*} args - Arguments to pass to listeners
     * @returns {boolean} Returns true if event had listeners
     */
    emit: jest.fn(function() {
      return true;
    }),
    
    /**
     * Removes a listener from the specified event
     * @function
     * @param {string} event - Event name
     * @param {Function} listener - Listener to remove
     * @returns {Object} Returns the mock response for chaining
     */
    removeListener: jest.fn(function() {
      return this;
    }),
    
    /**
     * Removes all listeners, or those of the specified event
     * @function
     * @param {string} [event] - Optional event name
     * @returns {Object} Returns the mock response for chaining
     */
    removeAllListeners: jest.fn(function() {
      return this;
    }),
    
    // =========================================================================
    // ADDITIONAL PROPERTIES (for compatibility)
    // =========================================================================
    
    /**
     * Whether the Date header should be automatically sent
     * @type {boolean}
     */
    sendDate: true,
    
    /**
     * Indicates if the stream is writable
     * @type {boolean}
     */
    writable: true,
    
    /**
     * Indicates if end() has been called
     * @type {boolean}
     */
    writableEnded: false,
    
    /**
     * Indicates if 'finish' event has been emitted
     * @type {boolean}
     */
    writableFinished: false,
    
    /**
     * Reference to the underlying socket (minimal mock)
     * @type {Object|null}
     */
    socket: null,
    
    /**
     * Reference to the underlying connection (alias for socket)
     * @type {Object|null}
     */
    connection: null,
    
    // =========================================================================
    // TEST UTILITY METHODS
    // =========================================================================
    
    /**
     * Resets the mock response to its initial state
     * Useful for reusing the same mock across multiple test assertions
     * 
     * @function
     * @returns {void}
     */
    _reset: function() {
      this.statusCode = 200;
      this.statusMessage = '';
      this.headersSent = false;
      this.finished = false;
      this._headers = {};
      this._body = '';
      this.writable = true;
      this.writableEnded = false;
      this.writableFinished = false;
      
      // Clear mock function call history
      if (this.setHeader && this.setHeader.mockClear) {
        this.setHeader.mockClear();
      }
      if (this.getHeader && this.getHeader.mockClear) {
        this.getHeader.mockClear();
      }
      if (this.removeHeader && this.removeHeader.mockClear) {
        this.removeHeader.mockClear();
      }
      if (this.hasHeader && this.hasHeader.mockClear) {
        this.hasHeader.mockClear();
      }
      if (this.getHeaders && this.getHeaders.mockClear) {
        this.getHeaders.mockClear();
      }
      if (this.getHeaderNames && this.getHeaderNames.mockClear) {
        this.getHeaderNames.mockClear();
      }
      if (this.writeHead && this.writeHead.mockClear) {
        this.writeHead.mockClear();
      }
      if (this.write && this.write.mockClear) {
        this.write.mockClear();
      }
      if (this.end && this.end.mockClear) {
        this.end.mockClear();
      }
      if (this.cork && this.cork.mockClear) {
        this.cork.mockClear();
      }
      if (this.uncork && this.uncork.mockClear) {
        this.uncork.mockClear();
      }
      if (this.flushHeaders && this.flushHeaders.mockClear) {
        this.flushHeaders.mockClear();
      }
      if (this.on && this.on.mockClear) {
        this.on.mockClear();
      }
      if (this.once && this.once.mockClear) {
        this.once.mockClear();
      }
      if (this.emit && this.emit.mockClear) {
        this.emit.mockClear();
      }
      if (this.removeListener && this.removeListener.mockClear) {
        this.removeListener.mockClear();
      }
      if (this.removeAllListeners && this.removeAllListeners.mockClear) {
        this.removeAllListeners.mockClear();
      }
    }
  };
  
  // Bind all function properties to the mockResponse object
  // This ensures 'this' refers to mockResponse when methods are called
  const methodNames = [
    'setHeader', 'getHeader', 'removeHeader', 'hasHeader', 
    'getHeaders', 'getHeaderNames', 'writeHead', 'write', 'end',
    'cork', 'uncork', 'flushHeaders', 'on', 'once', 'emit',
    'removeListener', 'removeAllListeners', '_getWrittenData', '_reset'
  ];
  
  methodNames.forEach(methodName => {
    if (typeof mockResponse[methodName] === 'function' && mockResponse[methodName].mockImplementation) {
      // Get the original implementation
      const originalImpl = mockResponse[methodName].getMockImplementation();
      if (originalImpl) {
        // Rebind to mockResponse
        mockResponse[methodName].mockImplementation(originalImpl.bind(mockResponse));
      }
    }
  });
  
  return mockResponse;
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================

module.exports = { createMockResponse };
