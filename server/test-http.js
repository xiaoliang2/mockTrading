const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', message: 'Server is running' }));
});

server.listen(5000, '0.0.0.0', () => {
  console.log('Server running on http://0.0.0.0:5000');
});