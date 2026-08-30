const http = require('http');

// Start the server by requiring it (starts on port 5000 in development)
require('./server.js');

// Wait 1 second for port binding and DB check, then test /api/health
setTimeout(() => {
  const req = http.get('http://localhost:5000/api/health', (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      console.log('STATUS_CODE:', res.statusCode);
      console.log('HEALTH_RESPONSE:', rawData);
      process.exit(0);
    });
  });

  req.on('error', (e) => {
    console.error('Request failed:', e.message);
    process.exit(1);
  });
}, 1000);
