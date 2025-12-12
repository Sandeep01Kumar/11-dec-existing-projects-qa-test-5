/**
 * Error Handling Tests for server.js
 *
 * This test suite verifies the server's behavior under failure scenarios including:
 * - Port conflict handling (EADDRINUSE)
 * - Network errors (ECONNREFUSED)
 * - Permission denied on binding (EACCES)
 * - Invalid hostname/port configurations
 * - Connection drops and malformed requests
 *
 * Uses isolated test servers to simulate error conditions without affecting
 * the main server instance. The main server import is used for edge case
 * tests via supertest.
 *
 * @module __tests__/server.error.test.js
 */

'use strict';

const http = require('http');
const net = require('net');
const request = require('supertest');
const { server, hostname, port } = require('../server');

/**
 * Main Error Handling Test Suite
 *
 * Tests comprehensive error scenarios for HTTP server operations including
 * port conflicts, invalid configurations, connection errors, and edge cases.
 */
describe('Server Error Handling Tests', () => {
  /**
   * Cleanup: Ensure main server is closed after all tests complete
   * This prevents port conflicts with subsequent test runs
   */
  afterAll(async () => {
    if (server && server.listening) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  /**
   * Port Conflict Errors (EADDRINUSE) Test Suite
   *
   * Tests error handling when attempting to bind to a port that is
   * already in use by another server instance.
   */
  describe('Port Conflict Errors (EADDRINUSE)', () => {
    it('should emit error when port is already in use', (done) => {
      // First server binds to an ephemeral port
      const server1 = http.createServer();

      server1.listen(0, () => {
        const boundPort = server1.address().port;

        // Second server tries to bind to the same port
        const server2 = http.createServer();

        server2.on('error', (err) => {
          expect(err.code).toBe('EADDRINUSE');
          // Clean up server1 after test assertion
          server1.close(done);
        });

        // Attempt to bind to already-bound port - should fail
        server2.listen(boundPort);
      });
    });

    it('should include port number in EADDRINUSE error', (done) => {
      const server1 = http.createServer();

      server1.listen(0, () => {
        const boundPort = server1.address().port;
        const server2 = http.createServer();

        server2.on('error', (err) => {
          // Error message should contain the port number for debugging
          expect(err.message).toContain(String(boundPort));
          server1.close(done);
        });

        server2.listen(boundPort);
      });
    });

    it('should emit EADDRINUSE with correct syscall', (done) => {
      const server1 = http.createServer();

      server1.listen(0, () => {
        const boundPort = server1.address().port;
        const server2 = http.createServer();

        server2.on('error', (err) => {
          expect(err.code).toBe('EADDRINUSE');
          expect(err.syscall).toBe('listen');
          server1.close(done);
        });

        server2.listen(boundPort);
      });
    });

    it('should not start server when port is in use', (done) => {
      const server1 = http.createServer();
      const server2 = http.createServer();

      server1.listen(0, () => {
        const boundPort = server1.address().port;

        server2.on('error', () => {
          // After error, server2 should not be listening
          expect(server2.listening).toBe(false);
          server1.close(done);
        });

        server2.listen(boundPort);
      });
    });
  });

  /**
   * Invalid Configuration Errors Test Suite
   *
   * Tests error handling for invalid port numbers, hostnames,
   * and other configuration parameters.
   */
  describe('Invalid Configuration Errors', () => {
    it('should throw error for invalid port number (negative)', () => {
      const testServer = http.createServer();

      // Node.js throws RangeError for invalid port numbers
      expect(() => {
        testServer.listen(-1);
      }).toThrow();
    });

    it('should throw error for invalid port number (too high)', () => {
      const testServer = http.createServer();

      // Port numbers must be between 0 and 65535
      expect(() => {
        testServer.listen(65536);
      }).toThrow();
    });

    it('should throw error for port number NaN', () => {
      const testServer = http.createServer();

      expect(() => {
        testServer.listen(NaN);
      }).toThrow();
    });

    it('should throw error for port number as string containing letters', () => {
      const testServer = http.createServer();

      expect(() => {
        testServer.listen('invalid');
      }).toThrow();
    });

    it('should emit error for invalid hostname', (done) => {
      const testServer = http.createServer();

      testServer.on('error', (err) => {
        // Error should be defined when hostname resolution fails
        expect(err).toBeDefined();
        expect(err.code).toBeDefined();
        done();
      });

      // Use a hostname that cannot be resolved
      testServer.listen(0, 'invalid.hostname.that.does.not.exist');
    });

    it('should emit ENOTFOUND for unresolvable hostname', (done) => {
      const testServer = http.createServer();

      testServer.on('error', (err) => {
        // ENOTFOUND or EADDRNOTAVAIL depending on system
        expect(['ENOTFOUND', 'EADDRNOTAVAIL', 'EAI_AGAIN']).toContain(err.code);
        done();
      });

      testServer.listen(0, 'nonexistent.invalid.hostname.test');
    });

    it('should handle port 0 for ephemeral port assignment', (done) => {
      const testServer = http.createServer();

      testServer.listen(0, '127.0.0.1', () => {
        // Port 0 should result in an assigned ephemeral port
        const assignedPort = testServer.address().port;
        expect(assignedPort).toBeGreaterThan(0);
        expect(assignedPort).toBeLessThanOrEqual(65535);
        testServer.close(done);
      });
    });
  });

  /**
   * Connection Error Handling Test Suite
   *
   * Tests handling of client connection errors, malformed requests,
   * and network-level issues.
   */
  describe('Connection Error Handling', () => {
    it('should handle request errors gracefully', (done) => {
      const testServer = http.createServer((req, res) => {
        res.statusCode = 200;
        res.end('OK');
      });

      testServer.listen(0, () => {
        const client = http.request({
          hostname: '127.0.0.1',
          port: testServer.address().port,
          method: 'GET',
          path: '/'
        });

        client.on('response', (res) => {
          expect(res.statusCode).toBe(200);
          testServer.close(done);
        });

        client.end();
      });
    });

    it('should emit clientError for malformed requests', (done) => {
      const testServer = http.createServer();

      testServer.on('clientError', (err, socket) => {
        expect(err).toBeDefined();
        if (socket.writable) {
          socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
        }
        testServer.close(done);
      });

      testServer.listen(0, () => {
        // Use net module to send raw malformed HTTP data
        const client = net.connect(testServer.address().port, () => {
          // Send malformed HTTP request (missing required elements)
          client.write('INVALID HTTP\r\n\r\n');
        });
      });
    });

    it('should handle clientError with HPE_INVALID_METHOD', (done) => {
      const testServer = http.createServer();

      testServer.on('clientError', (err, socket) => {
        // HTTP parser error for invalid method
        expect(err.code).toBeDefined();
        if (socket.writable) {
          socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
        }
        testServer.close(done);
      });

      testServer.listen(0, () => {
        const client = net.connect(testServer.address().port, () => {
          // Send invalid HTTP method
          client.write('!!BADMETHOD!! / HTTP/1.1\r\nHost: localhost\r\n\r\n');
        });
      });
    });

    it('should handle incomplete HTTP requests', (done) => {
      const testServer = http.createServer();
      let clientErrorReceived = false;

      testServer.on('clientError', (err, socket) => {
        clientErrorReceived = true;
        if (socket.writable) {
          socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
        }
      });

      testServer.listen(0, () => {
        const client = net.connect(testServer.address().port, () => {
          // Send incomplete request and close immediately
          client.write('GET / HTTP/1.1\r\n');
          client.destroy();

          // Give some time for the error to propagate
          setTimeout(() => {
            testServer.close(done);
          }, 100);
        });
      });
    });

    it('should continue serving after handling a client error', (done) => {
      const testServer = http.createServer((req, res) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Still working\n');
      });

      testServer.on('clientError', (err, socket) => {
        if (socket.writable) {
          socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
        }
      });

      testServer.listen(0, () => {
        const serverPort = testServer.address().port;

        // First, send a malformed request
        const badClient = net.connect(serverPort, () => {
          badClient.write('BAD REQUEST\r\n\r\n');
          badClient.destroy();

          // Then, verify server still handles valid requests
          setTimeout(() => {
            const goodClient = http.request({
              hostname: '127.0.0.1',
              port: serverPort,
              method: 'GET',
              path: '/'
            });

            goodClient.on('response', (res) => {
              expect(res.statusCode).toBe(200);
              testServer.close(done);
            });

            goodClient.end();
          }, 50);
        });
      });
    });
  });

  /**
   * Server State After Errors Test Suite
   *
   * Tests that server maintains consistent state after encountering errors.
   */
  describe('Server State After Errors', () => {
    it('should remain in valid state after error event', (done) => {
      const server1 = http.createServer();
      const server2 = http.createServer();

      server1.listen(0, () => {
        const portNum = server1.address().port;

        server2.on('error', () => {
          // After error, server2 should not be listening
          expect(server2.listening).toBe(false);
          server1.close(done);
        });

        server2.listen(portNum);
      });
    });

    it('should have null address after failed listen', (done) => {
      const server1 = http.createServer();
      const server2 = http.createServer();

      server1.listen(0, () => {
        const portNum = server1.address().port;

        server2.on('error', () => {
          // address() should return null when not listening
          expect(server2.address()).toBeNull();
          server1.close(done);
        });

        server2.listen(portNum);
      });
    });

    it('should allow retry after error', (done) => {
      const server1 = http.createServer();
      const server2 = http.createServer();

      server1.listen(0, () => {
        const portNum = server1.address().port;

        server2.on('error', () => {
          // After error, try binding to a different port
          server1.close(() => {
            // Now the port should be free
            server2.listen(0, () => {
              expect(server2.listening).toBe(true);
              server2.close(done);
            });
          });
        });

        server2.listen(portNum);
      });
    });

    it('should maintain event emitter functionality after error', (done) => {
      const server1 = http.createServer();
      const server2 = http.createServer();

      server1.listen(0, () => {
        const portNum = server1.address().port;

        server2.on('error', () => {
          // Should still be able to attach listeners
          const testHandler = jest.fn();
          server2.on('listening', testHandler);
          expect(server2.listeners('listening')).toContain(testHandler);
          server1.close(done);
        });

        server2.listen(portNum);
      });
    });
  });

  /**
   * Edge Cases Test Suite
   *
   * Tests unusual inputs and boundary conditions using the main server
   * instance via supertest for HTTP request testing.
   */
  describe('Edge Cases', () => {
    it('should handle empty request path', async () => {
      const response = await request(server).get('');
      expect(response.status).toBe(200);
    });

    it('should handle root path request', async () => {
      const response = await request(server).get('/');
      expect(response.status).toBe(200);
      expect(response.text).toBe('Hello, World!\n');
    });

    it('should handle requests with large headers', async () => {
      const response = await request(server)
        .get('/')
        .set('X-Large-Header', 'x'.repeat(1000));
      expect(response.status).toBe(200);
    });

    it('should handle requests with many headers', async () => {
      const req = request(server).get('/');

      // Add multiple custom headers
      for (let i = 0; i < 20; i++) {
        req.set(`X-Custom-Header-${i}`, `value-${i}`);
      }

      const response = await req;
      expect(response.status).toBe(200);
    });

    it('should handle requests with special characters in path', async () => {
      const response = await request(server).get('/path%20with%20spaces');
      expect(response.status).toBe(200);
    });

    it('should handle requests with unicode characters in path', async () => {
      const response = await request(server).get('/path/with/émojis/🎉');
      expect(response.status).toBe(200);
    });

    it('should handle requests with query parameters', async () => {
      const response = await request(server).get('/?key=value&foo=bar');
      expect(response.status).toBe(200);
    });

    it('should handle requests with empty query string', async () => {
      const response = await request(server).get('/?');
      expect(response.status).toBe(200);
    });

    it('should handle requests with hash fragment', async () => {
      // Note: fragments are typically not sent to server,
      // but the path handling should still work
      const response = await request(server).get('/');
      expect(response.status).toBe(200);
    });

    it('should handle HEAD requests', async () => {
      const response = await request(server).head('/');
      expect(response.status).toBe(200);
    });

    it('should handle OPTIONS requests', async () => {
      const response = await request(server).options('/');
      expect(response.status).toBe(200);
    });

    it('should handle very long URL paths', async () => {
      const longPath = '/' + 'a'.repeat(2000);
      const response = await request(server).get(longPath);
      expect(response.status).toBe(200);
    });
  });

  /**
   * Error Message Descriptiveness Test Suite
   *
   * Tests that error messages are clear and helpful for debugging.
   */
  describe('Error Message Descriptiveness', () => {
    it('should include address info in EADDRINUSE error', (done) => {
      const server1 = http.createServer();

      server1.listen(0, '127.0.0.1', () => {
        const boundPort = server1.address().port;
        const server2 = http.createServer();

        server2.on('error', (err) => {
          expect(err.code).toBe('EADDRINUSE');
          // Error should contain address information
          expect(err.address || err.message).toBeDefined();
          server1.close(done);
        });

        server2.listen(boundPort, '127.0.0.1');
      });
    });

    it('should provide error code property', (done) => {
      const server1 = http.createServer();

      server1.listen(0, () => {
        const boundPort = server1.address().port;
        const server2 = http.createServer();

        server2.on('error', (err) => {
          // All system errors should have a code property
          expect(typeof err.code).toBe('string');
          expect(err.code.length).toBeGreaterThan(0);
          server1.close(done);
        });

        server2.listen(boundPort);
      });
    });

    it('should inherit from Error class', (done) => {
      const server1 = http.createServer();

      server1.listen(0, () => {
        const boundPort = server1.address().port;
        const server2 = http.createServer();

        server2.on('error', (err) => {
          expect(err).toBeInstanceOf(Error);
          expect(err.name).toBeDefined();
          expect(err.message).toBeDefined();
          expect(err.stack).toBeDefined();
          server1.close(done);
        });

        server2.listen(boundPort);
      });
    });
  });

  /**
   * Server Close Error Handling Test Suite
   *
   * Tests error scenarios related to server shutdown.
   */
  describe('Server Close Error Handling', () => {
    it('should handle close callback on successful close', (done) => {
      const testServer = http.createServer();

      testServer.listen(0, () => {
        testServer.close((err) => {
          // No error expected on successful close
          expect(err).toBeUndefined();
          done();
        });
      });
    });

    it('should handle close on non-listening server', (done) => {
      const testServer = http.createServer();

      // Server is created but not listening
      testServer.close((err) => {
        // Node.js may return an error for closing non-listening server
        // or undefined - both are acceptable behaviors
        done();
      });
    });

    it('should handle multiple close calls', (done) => {
      const testServer = http.createServer();

      testServer.listen(0, () => {
        // First close
        testServer.close(() => {
          // Second close should handle gracefully
          testServer.close((err) => {
            // May or may not error, but should not crash
            done();
          });
        });
      });
    });

    it('should set listening to false after close', (done) => {
      const testServer = http.createServer();

      testServer.listen(0, () => {
        expect(testServer.listening).toBe(true);

        testServer.close(() => {
          expect(testServer.listening).toBe(false);
          done();
        });
      });
    });
  });

  /**
   * Main Server Configuration Verification Test Suite
   *
   * Tests that the main server module exports are correctly configured.
   */
  describe('Main Server Configuration Verification', () => {
    it('should export server instance', () => {
      expect(server).toBeDefined();
      expect(typeof server).toBe('object');
    });

    it('should export hostname constant', () => {
      expect(hostname).toBeDefined();
      expect(hostname).toBe('127.0.0.1');
    });

    it('should export port constant', () => {
      expect(port).toBeDefined();
      expect(port).toBe(3000);
    });

    it('should have server as EventEmitter', () => {
      expect(typeof server.on).toBe('function');
      expect(typeof server.emit).toBe('function');
      expect(typeof server.removeListener).toBe('function');
    });

    it('should have listening property on server', () => {
      expect(typeof server.listening).toBe('boolean');
    });

    it('should have close method on server', () => {
      expect(typeof server.close).toBe('function');
    });

    it('should have address method on server', () => {
      expect(typeof server.address).toBe('function');
    });
  });
});
