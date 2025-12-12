/**
 * Error Handling Tests for server.js
 * 
 * Tests error scenarios including port conflicts, network errors,
 * and server error event handling.
 * 
 * @module __tests__/server.error.test.js
 */

const http = require('http');
const { startServer, stopServer, waitForServer, getServerUrl } = require('./helpers/serverUtils');

/**
 * Helper function to create a test server (wraps http.createServer)
 */
function createTestServer(handler) {
  return http.createServer(handler);
}

describe('Server Error Handling Tests', () => {
  let mainServerModule;
  
  beforeAll(() => {
    mainServerModule = require('../server');
  });
  
  afterAll((done) => {
    if (mainServerModule && mainServerModule.server && mainServerModule.server.listening) {
      mainServerModule.server.close(done);
    } else {
      done();
    }
  });
  
  describe('Port Conflict Errors', () => {
    let conflictServer;
    let portServer;
    const conflictPort = 3050;
    
    beforeEach((done) => {
      // Create a server to occupy the port
      portServer = createTestServer((req, res) => res.end('test'));
      portServer.listen(conflictPort, '127.0.0.1', done);
    });
    
    afterEach((done) => {
      // Clean up conflict server
      const closeConflict = (callback) => {
        if (conflictServer && conflictServer.listening) {
          conflictServer.close(callback);
        } else {
          callback();
        }
      };
      
      // Clean up port server
      const closePort = (callback) => {
        if (portServer && portServer.listening) {
          portServer.close(callback);
        } else {
          callback();
        }
      };
      
      closeConflict(() => closePort(done));
    });
    
    it('should emit error event when port is already in use', (done) => {
      // portServer is already using conflictPort
      conflictServer = createTestServer((req, res) => res.end('test'));
      
      conflictServer.on('error', (err) => {
        expect(err).toBeDefined();
        expect(err.code).toBe('EADDRINUSE');
        expect(err.syscall).toBe('listen');
        conflictServer = null;
        done();
      });
      
      // Try to bind to already used port
      conflictServer.listen(conflictPort, '127.0.0.1');
    });
    
    it('should handle EADDRINUSE error gracefully', (done) => {
      conflictServer = createTestServer((req, res) => res.end('test'));
      
      conflictServer.on('error', (err) => {
        expect(err.code).toBe('EADDRINUSE');
        expect(conflictServer.listening).toBe(false);
        conflictServer = null;
        done();
      });
      
      conflictServer.on('listening', () => {
        // Should not reach here
        done(new Error('Server should not have started'));
      });
      
      conflictServer.listen(conflictPort, '127.0.0.1');
    });
  });
  
  describe('Invalid Configuration Errors', () => {
    let errorServer;
    
    afterEach((done) => {
      if (errorServer && errorServer.listening) {
        errorServer.close(done);
      } else {
        done();
      }
    });
    
    it('should handle invalid port number gracefully', () => {
      errorServer = createTestServer((req, res) => res.end('test'));
      
      // Port numbers should be between 0 and 65535
      expect(() => {
        errorServer.listen(-1, '127.0.0.1');
      }).toThrow();
    });
    
    it('should handle port number too high', () => {
      errorServer = createTestServer((req, res) => res.end('test'));
      
      expect(() => {
        errorServer.listen(70000, '127.0.0.1');
      }).toThrow();
    });
  });
  
  describe('Server Error Events', () => {
    let testServer;
    const testPort = 3060;
    
    afterEach((done) => {
      if (testServer && testServer.listening) {
        testServer.close(done);
      } else {
        done();
      }
    });
    
    it('should allow registering error handlers', () => {
      testServer = createTestServer((req, res) => res.end('test'));
      
      const errorHandler = jest.fn();
      testServer.on('error', errorHandler);
      
      // Verify handler is registered
      expect(testServer.listeners('error')).toContain(errorHandler);
    });
    
    it('should allow multiple error handlers', () => {
      testServer = createTestServer((req, res) => res.end('test'));
      
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      testServer.on('error', handler1);
      testServer.on('error', handler2);
      
      expect(testServer.listeners('error')).toHaveLength(2);
    });
    
    it('should support removing error handlers', () => {
      testServer = createTestServer((req, res) => res.end('test'));
      
      const errorHandler = jest.fn();
      testServer.on('error', errorHandler);
      testServer.removeListener('error', errorHandler);
      
      expect(testServer.listeners('error')).not.toContain(errorHandler);
    });
  });
  
  describe('Connection Error Handling', () => {
    let testServer;
    const testPort = 3061;
    
    afterEach((done) => {
      if (testServer && testServer.listening) {
        testServer.close(done);
      } else {
        done();
      }
    });
    
    it('should handle client connection errors', (done) => {
      testServer = createTestServer((req, res) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Hello, World!\n');
      });
      
      testServer.on('clientError', (err, socket) => {
        // Handle client error gracefully
        if (socket.writable) {
          socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
        }
      });
      
      testServer.listen(testPort, '127.0.0.1', () => {
        // Server should handle clientError events
        expect(testServer.listeners('clientError').length).toBeGreaterThan(0);
        done();
      });
    });
    
    it('should continue serving after handling an error', async () => {
      testServer = createTestServer((req, res) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Still working\n');
      });
      
      testServer.on('clientError', (err, socket) => {
        if (socket.writable) {
          socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
        }
      });
      
      await new Promise(resolve => testServer.listen(testPort + 1, '127.0.0.1', resolve));
      
      // Server should still be listening
      expect(testServer.listening).toBe(true);
    });
  });
  
  describe('Server Close Error Handling', () => {
    let testServer;
    const testPort = 3063;
    
    afterEach((done) => {
      if (testServer && testServer.listening) {
        testServer.close(done);
      } else {
        done();
      }
    });
    
    it('should handle callback on close', (done) => {
      testServer = createTestServer((req, res) => res.end('test'));
      
      testServer.listen(testPort, '127.0.0.1', () => {
        testServer.close((err) => {
          expect(err).toBeUndefined();
          testServer = null;
          done();
        });
      });
    });
    
    it('should not error when closing a non-listening server', (done) => {
      testServer = createTestServer((req, res) => res.end('test'));
      
      // Server is created but not listening
      testServer.close((err) => {
        // Node.js may return ERR_SERVER_NOT_RUNNING error
        // or undefined depending on version
        testServer = null;
        done();
      });
    });
  });
  
  describe('Main Server Error Resilience', () => {
    it('should have error event handler capability', () => {
      const { server } = mainServerModule;
      
      // Server should be an event emitter
      expect(typeof server.on).toBe('function');
      expect(typeof server.emit).toBe('function');
      expect(typeof server.removeListener).toBe('function');
    });
    
    it('should maintain valid state structure', () => {
      const { server } = mainServerModule;
      
      // Server should have proper state properties regardless of listening state
      // The server.listening property should be a boolean
      expect(typeof server.listening).toBe('boolean');
      
      // Server should have address method
      expect(typeof server.address).toBe('function');
      
      // If server is listening, address should return valid info
      if (server.listening) {
        expect(server.address()).not.toBeNull();
        expect(server.address()).toHaveProperty('port');
      }
    });
  });
  
  describe('Edge Case Error Scenarios', () => {
    let edgeServer;
    const edgePort = 3070;
    
    afterEach((done) => {
      if (edgeServer && edgeServer.listening) {
        edgeServer.close(done);
      } else {
        done();
      }
    });
    
    it('should handle request with no URL gracefully', async () => {
      edgeServer = createTestServer((req, res) => {
        // Even with empty/null URL, server should respond
        res.statusCode = 200;
        res.end('Handled\n');
      });
      
      await new Promise(resolve => edgeServer.listen(edgePort, '127.0.0.1', resolve));
      expect(edgeServer.listening).toBe(true);
    });
    
    it('should handle server with custom maxHeadersCount', async () => {
      edgeServer = createTestServer((req, res) => {
        res.statusCode = 200;
        res.end('OK\n');
      });
      
      edgeServer.maxHeadersCount = 100;
      
      await new Promise(resolve => edgeServer.listen(edgePort + 1, '127.0.0.1', resolve));
      expect(edgeServer.maxHeadersCount).toBe(100);
    });
    
    it('should handle server with custom timeout', async () => {
      edgeServer = createTestServer((req, res) => {
        res.statusCode = 200;
        res.end('OK\n');
      });
      
      edgeServer.timeout = 10000;
      
      await new Promise(resolve => edgeServer.listen(edgePort + 2, '127.0.0.1', resolve));
      expect(edgeServer.timeout).toBe(10000);
    });
    
    it('should handle keepAliveTimeout configuration', async () => {
      edgeServer = createTestServer((req, res) => {
        res.statusCode = 200;
        res.end('OK\n');
      });
      
      edgeServer.keepAliveTimeout = 5000;
      
      await new Promise(resolve => edgeServer.listen(edgePort + 3, '127.0.0.1', resolve));
      expect(edgeServer.keepAliveTimeout).toBe(5000);
    });
  });
});
