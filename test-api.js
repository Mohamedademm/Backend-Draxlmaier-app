// Simple test script for backend API
const http = require('http');

const testEndpoints = [
  '/health',
  '/api/auth/login'
];

console.log('Testing Backend API...\n');

testEndpoints.forEach(endpoint => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: endpoint,
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`✓ ${endpoint} - Status: ${res.statusCode}`);
    res.on('data', (d) => {
      console.log(`  Response: ${d.toString()}\n`);
    });
  });

  req.on('error', (error) => {
    console.error(`✗ ${endpoint} - Error: ${error.message}\n`);
  });

  req.end();
});
