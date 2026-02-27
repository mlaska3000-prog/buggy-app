const assert = require("assert");
const app = require("./index.js");
const request = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = request.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(JSON.stringify(postData));
    req.end();
  });
}

async function runTests() {
  // Start server
  const server = app.listen(3001, '127.0.0.1');
  
  try {
    console.log("Running tests...");
    
    // Test 1: Input validation - missing name
    let result = await makeRequest({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/users',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'test@example.com' });
    
    assert.strictEqual(result.status, 400, 'Should reject missing name');
    assert(result.data.error.includes('Name is required'), 'Error should mention name');
    
    // Test 2: Input validation - invalid email
    result = await makeRequest({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/users',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { name: 'Test User', email: 'invalid-email' });
    
    assert.strictEqual(result.status, 400, 'Should reject invalid email');
    assert(result.data.error.includes('Email'), 'Error should mention email');
    
    // Test 3: Create valid user
    result = await makeRequest({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/users',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { name: 'John Doe', email: 'john@example.com' });
    
    assert.strictEqual(result.status, 200, 'Should create valid user');
    assert.strictEqual(result.data.name, 'John Doe');
    assert.strictEqual(result.data.id, 1);
    
    // Test 4: Get user by ID (string->number conversion)
    result = await makeRequest({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/users/1',
      method: 'GET'
    });
    
    assert.strictEqual(result.status, 200, 'Should find user by ID');
    assert.strictEqual(result.data.name, 'John Doe');
    
    // Test 5: Get non-existent user
    result = await makeRequest({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/users/999',
      method: 'GET'
    });
    
    assert.strictEqual(result.status, 404, 'Should return 404 for non-existent user');
    
    // Test 6: Pagination with limit
    result = await makeRequest({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/users?limit=5',
      method: 'GET'
    });
    
    assert.strictEqual(result.status, 200, 'Should return users with limit');
    assert.strictEqual(result.data.limit, 5, 'Should respect limit parameter');
    
    // Test 7: Delete user
    result = await makeRequest({
      hostname: '127.0.0.1',
      port: 3001,
      path: '/users/1',
      method: 'DELETE'
    });
    
    assert.strictEqual(result.status, 200, 'Should delete user');
    assert.strictEqual(result.data.deleted, true);
    
    console.log("All tests passed!");
    
  } finally {
    server.close();
  }
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };