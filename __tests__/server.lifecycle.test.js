/**
 * Server Lifecycle Tests
 * 
 * Tests the server startup, shutdown, and lifecycle event handling.
 * 
 * @module __tests__/server.lifecycle.test.js
 */

const http = require('http');
const { startServer, stopServer, waitForServer, getServerUrl } = require('./helpers/serverUtils');

/**
 * Helper function to create a test server (wraps http.createServer)
 */
function createTestServer(handler) {
  return http.createServer(handler);
}

/**
 * Helper function to pause execution for a given number of milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper function to check if a port is available
 */
function isPortAvailable(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.once('error', () => {
      resolve(false);
    });
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, host);
  });
}

describe('Server Lifecycle Tests', () => {
  // Store reference to main server module
  let mainServerModule;
  
  beforeAll(() => {
    // Import the main server module once
    mainServerModule = require('../server');
  });
  
  afterAll((done) => {
    // Ensure main server is closed
    if (mainServerModule && mainServerModule.server && mainServerModule.server.listening) {
      mainServerModule.server.close(done);
    } else {
      done();
    }
  });
  
  describe('Server Module Exports', () => {
    it('should have server instance available after module import', () => {
      expect(mainServerModule.server).toBeDefined();
      expect(mainServerModule.server).toBeInstanceOf(http.Server);
    });
    
    it('should have correct hostname constant', () => {
      expect(mainServerModule.hostname).toBe('127.0.0.1');
    });
    
    it('should have correct port constant', () => {
      expect(mainServerModule.port).toBe(3000);
    });
    
    it('should have listen method', () => {
      expect(typeof mainServerModule.server.listen).toBe('function');
    });
    
    it('should have close method', () => {
      expect(typeof mainServerModule.server.close).toBe('function');
    });
    
    it('should have address method', () => {
      expect(typeof mainServerModule.server.address).toBe('function');
    });
    
    it('should have listening property', () => {
      expect(typeof mainServerModule.server.listening).toBe('boolean');
    });
  });
  
  describe('Test Server Creation', () => {
    let testServer;
    const testPort = 3010;
    
    afterEach((done) => {
      if (testServer && testServer.listening) {
        testServer.close(done);
      } else {
        done();
      }
    });
    
    it('should be able to create a test server with same handler pattern', (done) => {
      testServer = createTestServer((req, res) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Test Server Response\n');
      });
      
      testServer.listen(testPort, '127.0.0.1', () => {
        expect(testServer.listening).toBe(true);
        done();
      });
    });
    
    it('should be able to close test server gracefully', (done) => {
      testServer = createTestServer((req, res) => {
        res.end('test');
      });
      
      testServer.listen(testPort + 1, '127.0.0.1', () => {
        expect(testServer.listening).toBe(true);
        
        testServer.close(() => {
          expect(testServer.listening).toBe(false);
          testServer = null;
          done();
        });
      });
    });
    
    it('should fire listening event on startup', (done) => {
      testServer = createTestServer((req, res) => {
        res.end('test');
      });
      
      testServer.on('listening', () => {
        expect(testServer.listening).toBe(true);
        done();
      });
      
      testServer.listen(testPort + 2, '127.0.0.1');
    });
    
    it('should fire close event on shutdown', (done) => {
      testServer = createTestServer((req, res) => {
        res.end('test');
      });
      
      testServer.listen(testPort + 3, '127.0.0.1', () => {
        testServer.on('close', () => {
          expect(testServer.listening).toBe(false);
          testServer = null;
          done();
        });
        
        testServer.close();
      });
    });
  });
  
  describe('Server Utility Functions', () => {
    it('should handle sleep utility correctly', async () => {
      const startTime = Date.now();
      await sleep(100);
      const elapsed = Date.now() - startTime;
      
      expect(elapsed).toBeGreaterThanOrEqual(95); // Allow small timing variance
    });
    
    it('should stop server with utility function', async () => {
      const testServer = createTestServer((req, res) => res.end('test'));
      
      await new Promise(resolve => testServer.listen(3020, '127.0.0.1', resolve));
      expect(testServer.listening).toBe(true);
      
      await stopServer(testServer);
      expect(testServer.listening).toBe(false);
    });
    
    it('should check port availability correctly', async () => {
      // A random high port should be available
      const randomPort = 49152 + Math.floor(Math.random() * 16383);
      const randomPortAvailable = await isPortAvailable(randomPort);
      expect(randomPortAvailable).toBe(true);
    });
  });
  
  describe('Multiple Start/Stop Cycles', () => {
    let testServer;
    const testPort = 3030;
    
    afterEach((done) => {
      if (testServer && testServer.listening) {
        testServer.close(done);
      } else {
        done();
      }
    });
    
    it('should handle start-stop-start cycle correctly', async () => {
      testServer = createTestServer((req, res) => res.end('test'));
      
      // First start
      await new Promise(resolve => testServer.listen(testPort, '127.0.0.1', resolve));
      expect(testServer.listening).toBe(true);
      
      // Stop
      await stopServer(testServer);
      expect(testServer.listening).toBe(false);
      
      // Create new server for second start (http.Server can't be restarted after close)
      testServer = createTestServer((req, res) => res.end('test'));
      await new Promise(resolve => testServer.listen(testPort, '127.0.0.1', resolve));
      expect(testServer.listening).toBe(true);
    });
  });
});
