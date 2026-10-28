/**
 * Authentication Contract & Flow Verification Test Suite
 *
 * Verifies:
 * 1. Express Backend CORS and Security Headers (exact production & dev origins)
 * 2. Backend Login Response Contract across all roles (Admin, Institution, Student)
 * 3. Backend Error Responses (bad credentials, non-existent user, missing fields)
 * 4. Frontend Response Parser & Defensive Validation (handling empty/malformed responses without crashing)
 * 5. Role-based Dashboard Route Mapping
 */

const http = require('http');
const mongoose = require('mongoose');

// Configure test port and environment
process.env.PORT = '5098';
process.env.NODE_ENV = 'test';

const app = require('./server.js');

// Simple in-memory localStorage polyfill for testing client-side storage
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

// Replicate client authService login parser
function parseLoginResponse(response, storage = mockLocalStorage) {
  const authData = response?.data || response;

  if (!authData || typeof authData !== 'object' || !authData.token || !authData.user) {
    throw new Error(
      response?.message || 'Authentication failed: Server returned an invalid or empty session payload.'
    );
  }

  storage.setItem('nep_token', authData.token);
  storage.setItem('nep_user', JSON.stringify(authData.user));

  return authData;
}

// Replicate client AuthContext getDashboardRoute
function getDashboardRoute(role) {
  switch (role) {
    case 'student':
      return '/student/dashboard';
    case 'institution':
      return '/institution/dashboard';
    case 'admin':
      return '/admin/dashboard';
    default:
      return '/login';
  }
}

// Helper: HTTP request wrapper
const makeRequest = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let body;
        try {
          body = JSON.parse(data);
        } catch (e) {
          body = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body,
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
};

async function runAuthContractSuite() {
  console.log('=================================================================');
  console.log('🧪 Starting Authentication Contract & Login Flow Test Suite');
  console.log('=================================================================\n');

  let serverInstance = null;
  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (!condition) {
      console.error(`  ❌ FAILED: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
    passedTests++;
    console.log(`  ✅ PASSED: ${message}`);
  }

  try {
    // Start HTTP server on test port
    await new Promise((resolve, reject) => {
      serverInstance = app.listen(5098, (err) => {
        if (err) return reject(err);
        console.log('📡 Test HTTP Server listening on port 5098\n');
        resolve();
      });
    });

    // Wait briefly for database connection
    for (let i = 0; i < 20; i++) {
      if (mongoose.connection.readyState === 1) break;
      await new Promise((r) => setTimeout(r, 200));
    }

    // -------------------------------------------------------------
    // TEST GROUP 1: CORS & Security Headers
    // -------------------------------------------------------------
    console.log('--- TEST GROUP 1: CORS & Helmet Security Headers ---');

    // 1.1 Production Frontend Origin CORS
    const prodCors = await makeRequest({
      hostname: 'localhost',
      port: 5098,
      path: '/api/v1/auth/login',
      method: 'OPTIONS',
      headers: {
        Origin: 'https://nep-academic-credit-hub-client.onrender.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });
    assert(
      prodCors.headers['access-control-allow-origin'] === 'https://nep-academic-credit-hub-client.onrender.com',
      'CORS preflight allows exact production frontend origin (https://nep-academic-credit-hub-client.onrender.com)'
    );
    assert(
      prodCors.headers['access-control-allow-credentials'] === 'true',
      'CORS allows credentials'
    );

    // 1.2 Development Origin CORS
    const devCors = await makeRequest({
      hostname: 'localhost',
      port: 5098,
      path: '/api/v1/auth/login',
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
      },
    });
    assert(
      devCors.headers['access-control-allow-origin'] === 'http://localhost:5173',
      'CORS preflight allows development origin (http://localhost:5173)'
    );

    // 1.3 Disallowed Origin CORS
    const badCors = await makeRequest({
      hostname: 'localhost',
      port: 5098,
      path: '/api/v1/auth/login',
      method: 'OPTIONS',
      headers: {
        Origin: 'https://malicious-site.example.com',
        'Access-Control-Request-Method': 'POST',
      },
    });
    assert(
      badCors.headers['access-control-allow-origin'] !== 'https://malicious-site.example.com',
      'CORS blocks unauthorized origin'
    );

    // 1.4 Helmet Cross-Origin-Resource-Policy
    const healthReq = await makeRequest({
      hostname: 'localhost',
      port: 5098,
      path: '/api/health',
      method: 'GET',
    });
    assert(
      healthReq.headers['cross-origin-resource-policy'] === 'cross-origin',
      'Helmet Cross-Origin-Resource-Policy is configured as "cross-origin"'
    );
    assert(
      healthReq.headers['x-content-type-options'] === 'nosniff',
      'Helmet standard security protections (nosniff) remain active'
    );

    // -------------------------------------------------------------
    // TEST GROUP 2: Login Response Contract for All Roles
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 2: Login Contract Verification Across Roles ---');

    // 2.1 Admin Login Contract
    const adminLogin = await makeRequest(
      {
        hostname: 'localhost',
        port: 5098,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'admin@nep.gov.in', password: 'Admin@123456' }
    );
    assert(adminLogin.status === 200, 'Admin login returns HTTP 200');
    assert(adminLogin.body.success === true, 'Admin login response has success === true');
    assert(typeof adminLogin.body.data === 'object', 'Admin login contains data object');
    assert(adminLogin.body.data.user.role === 'admin', 'Admin user has role "admin"');
    assert(typeof adminLogin.body.data.token === 'string' && adminLogin.body.data.token.length > 20, 'Admin login returns valid JWT token');

    // 2.2 Institution Login Contract
    const instLogin = await makeRequest(
      {
        hostname: 'localhost',
        port: 5098,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'admin@bitsathy.ac.in', password: '123456' }
    );
    assert(instLogin.status === 200, 'Institution login returns HTTP 200');
    assert(instLogin.body.data.user.role === 'institution', 'Institution user has role "institution"');
    assert(typeof instLogin.body.data.token === 'string', 'Institution login returns valid token');

    // 2.3 Student Login Contract
    const studentLogin = await makeRequest(
      {
        hostname: 'localhost',
        port: 5098,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'gokul.k@bitsathy.ac.in', password: '123456' }
    );
    assert(studentLogin.status === 200, 'Student login returns HTTP 200');
    assert(studentLogin.body.data.user.role === 'student', 'Student user has role "student"');
    assert(typeof studentLogin.body.data.token === 'string', 'Student login returns valid token');

    // -------------------------------------------------------------
    // TEST GROUP 3: Authentication Error Responses
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 3: Authentication Failure Handling ---');

    // 3.1 Invalid Password
    const badPass = await makeRequest(
      {
        hostname: 'localhost',
        port: 5098,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'admin@nep.gov.in', password: 'WrongPassword' }
    );
    assert(badPass.status === 401, 'Incorrect password returns HTTP 401');
    assert(badPass.body.success === false, 'Incorrect password returns success === false');
    assert(typeof badPass.body.message === 'string' && badPass.body.message.includes('Invalid credentials'), 'Error message is clear and descriptive');

    // 3.2 Non-existent User
    const noUser = await makeRequest(
      {
        hostname: 'localhost',
        port: 5098,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'nonexistent@test.ac.in', password: 'SomePassword' }
    );
    assert(noUser.status === 401, 'Non-existent user returns HTTP 401');

    // 3.3 Missing Required Fields
    const missingFields = await makeRequest(
      {
        hostname: 'localhost',
        port: 5098,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'admin@nep.gov.in' }
    );
    assert(missingFields.status === 400, 'Missing password returns HTTP 400');

    // -------------------------------------------------------------
    // TEST GROUP 4: Client Parser Defensive Handling (Empty / Malformed)
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 4: Client Response Parser & Crash Prevention ---');

    // 4.1 Empty Response Body (the Render static site failure scenario)
    let caughtEmptyError = null;
    try {
      mockLocalStorage.clear();
      parseLoginResponse('');
    } catch (err) {
      caughtEmptyError = err;
    }
    assert(
      caughtEmptyError !== null && !caughtEmptyError.message.includes('Cannot read properties of undefined'),
      'Empty response body throws clean Error instead of TypeError (Cannot read properties of undefined)'
    );

    // 4.2 Malformed Response Missing Token
    let caughtMissingToken = null;
    try {
      parseLoginResponse({ data: { user: { role: 'admin' } } });
    } catch (err) {
      caughtMissingToken = err;
    }
    assert(
      caughtMissingToken !== null && caughtMissingToken.message.includes('Authentication failed'),
      'Missing token throws descriptive authentication error'
    );

    // 4.3 Malformed Response Missing User
    let caughtMissingUser = null;
    try {
      parseLoginResponse({ data: { token: 'sample.jwt.token' } });
    } catch (err) {
      caughtMissingUser = err;
    }
    assert(
      caughtMissingUser !== null && caughtMissingUser.message.includes('Authentication failed'),
      'Missing user throws descriptive authentication error'
    );

    // 4.4 Valid Response Parsing & LocalStorage Persistence
    mockLocalStorage.clear();
    const parsedValid = parseLoginResponse(adminLogin.body);
    assert(parsedValid.token === adminLogin.body.data.token, 'Parser correctly extracts token');
    assert(parsedValid.user.email === 'admin@nep.gov.in', 'Parser correctly extracts user');
    assert(mockLocalStorage.getItem('nep_token') === adminLogin.body.data.token, 'Token correctly persisted in localStorage');
    assert(JSON.parse(mockLocalStorage.getItem('nep_user')).email === 'admin@nep.gov.in', 'User correctly persisted in localStorage');

    // -------------------------------------------------------------
    // TEST GROUP 5: Role-based Dashboard Navigation Routes
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 5: Role-based Dashboard Navigation ---');
    assert(getDashboardRoute('admin') === '/admin/dashboard', 'Admin maps to /admin/dashboard');
    assert(getDashboardRoute('institution') === '/institution/dashboard', 'Institution maps to /institution/dashboard');
    assert(getDashboardRoute('student') === '/student/dashboard', 'Student maps to /student/dashboard');
    assert(getDashboardRoute('unknown') === '/login', 'Unknown role falls back safely to /login');

    console.log('\n=================================================================');
    console.log(`🎉 ALL TESTS PASSED: ${passedTests}/${totalTests} tests successful.`);
    console.log('=================================================================\n');

    if (serverInstance) {
      serverInstance.close();
    }
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test suite failed:', err.message);
    if (serverInstance) {
      serverInstance.close();
    }
    await mongoose.disconnect();
    process.exit(1);
  }
}

runAuthContractSuite();
