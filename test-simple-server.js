const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', message: 'Simple test server works!' }));
});

server.listen(3000, '127.0.0.1', () => {
  console.log('✅ Simple test server listening on http://127.0.0.1:3000');
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});
