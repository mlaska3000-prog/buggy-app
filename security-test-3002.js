const app = require('./index.js');
const http = require('http');

// Start test server
const server = app.listen(3002, '127.0.0.1', () => {
  console.log('Test server running on http://127.0.0.1:3002');
  runTests();
});

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n🔒 Testing Security Enhancements...\n');
  
  try {
    // Test 1: Check security headers
    console.log('1. Testing security headers...');
    const headerTest = await makeRequest({
      hostname: '127.0.0.1',
      port: 3002,
      path: '/users',
      method: 'GET'
    });
    
    const hasHelmetHeaders = headerTest.headers['x-content-type-options'] === 'nosniff' &&
                           headerTest.headers['x-frame-options'] === 'DENY' &&
                           headerTest.headers['x-xss-protection'];
    console.log(`   ✅ Security headers: ${hasHelmetHeaders ? 'PRESENT' : 'MISSING'}`);
    
    // Test 2: Input validation
    console.log('2. Testing input validation...');
    const invalidUser = await makeRequest({
      hostname: '127.0.0.1',
      port: 3002,
      path: '/users',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { name: '', email: 'invalid-email' });
    
    console.log(`   ✅ Input validation: ${invalidUser.status === 400 ? 'WORKING' : 'FAILED'}`);
    
    // Test 3: Valid user creation
    console.log('3. Testing valid user creation...');
    const validUser = await makeRequest({
      hostname: '127.0.0.1',
      port: 3002,
      path: '/users',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { name: 'John Doe', email: 'john.doe@example.com' });
    
    console.log(`   ✅ Valid user creation: ${validUser.status === 201 ? 'WORKING' : 'FAILED'}`);
    
    // Test 4: Type safety (user ID)
    console.log('4. Testing type safety...');
    const userLookup = await makeRequest({
      hostname: '127.0.0.1',
      port: 3002,
      path: '/users/1',
      method: 'GET'
    });
    
    console.log(`   ✅ User lookup: ${userLookup.status === 200 ? 'WORKING' : 'FAILED'}`);
    
    // Test 5: Invalid ID handling
    console.log('5. Testing invalid ID handling...');
    const invalidId = await makeRequest({
      hostname: '127.0.0.1',
      port: 3002,
      path: '/users/abc',
      method: 'GET'
    });
    
    console.log(`   ✅ Invalid ID rejection: ${invalidId.status === 400 ? 'WORKING' : 'FAILED'}`);
    
    // Test 6: Pagination validation
    console.log('6. Testing pagination...');
    const pagination = await makeRequest({
      hostname: '127.0.0.1',
      port: 3002,
      path: '/users?page=1&perPage=10',
      method: 'GET'
    });
    
    console.log(`   ✅ Pagination: ${pagination.status === 200 && pagination.data.page === 1 ? 'WORKING' : 'FAILED'}`);
    
    // Test 7: 404 handling
    console.log('7. Testing 404 handling...');
    const notFound = await makeRequest({
      hostname: '127.0.0.1',
      port: 3002,
      path: '/nonexistent',
      method: 'GET'
    });
    
    console.log(`   ✅ 404 handling: ${notFound.status === 404 ? 'WORKING' : 'FAILED'}`);
    
    console.log('\n🎉 Security tests completed!\n');
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    server.close(() => {
      console.log('Test server closed');
      process.exit(0);
    });
  }
}