const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello, World!\n');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

// Export server instance and configuration for testability
// Enables test files to:
// - Import server instance for supertest wrapping
// - Access hostname and port constants for test assertions
// - Control server lifecycle for proper test isolation
module.exports = { server, hostname, port };
