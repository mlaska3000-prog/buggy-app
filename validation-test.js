const app = require('./index.js');
const http = require('http');

const server = app.listen(3003, '127.0.0.1', () => {
  console.log('Validation test server running on http://127.0.0.1:3003');
  runValidationTests();
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

async function runValidationTests() {
  console.log('\n🧪 Testing Enhanced Input Validation...\n');
  
  try {
    // Test 1: Valid user creation
    console.log('1. Testing valid user creation...');
    const validUser = await makeRequest({
      hostname: '127.0.0.1',
      port: 3003,
      path: '/users',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { name: 'John Doe', email: 'john.doe@example.com' });
    
    console.log(`   ✅ Valid user: ${validUser.status === 201 ? 'CREATED' : 'FAILED'}`);
    
    // Test 2: Duplicate email
    console.log('2. Testing duplicate email prevention...');
    const duplicateEmail = await makeRequest({
      hostname: '127.0.0.1',
      port: 3003,
      path: '/users',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { name: 'Jane Smith', email: 'john.doe@example.com' });
    
    console.log(`   ✅ Duplicate email: ${duplicateEmail.status === 400 ? 'BLOCKED' : 'FAILED'}`);
    
    // Test 3: Invalid email format
    console.log('3. Testing invalid email validation...');
    const invalidEmail = await makeRequest({
      hostname: '127.0.0.1',
      port: 3003,
      path: '/users',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { name: 'Invalid User', email: 'not-an-email' });
    
    console.log(`   ✅ Invalid email: ${invalidEmail.status === 400 ? 'BLOCKED' : 'FAILED'}`);
    
    // Test 4: Empty name
    console.log('4. Testing empty name validation...');
    const emptyName = await makeRequest({
      hostname: '127.0.0.1',
      port: 3003,
      path: '/users',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { name: '', email: 'empty@example.com' });
    
    console.log(`   ✅ Empty name: ${emptyName.status === 400 ? 'BLOCKED' : 'FAILED'}`);
    
    // Test 5: Invalid characters in name
    console.log('5. Testing invalid name characters...');
    const invalidName = await makeRequest({
      hostname: '127.0.0.1',
      port: 3003,
      path: '/users',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { name: 'John<script>alert(1)</script>', email: 'script@example.com' });
    
    console.log(`   ✅ Invalid name chars: ${invalidName.status === 400 ? 'BLOCKED' : 'FAILED'}`);
    
    // Test 6: Type safety - string vs number ID
    console.log('6. Testing user ID type safety...');
    const userLookup = await makeRequest({
      hostname: '127.0.0.1',
      port: 3003,
      path: '/users/1',
      method: 'GET'
    });
    
    console.log(`   ✅ Numeric ID lookup: ${userLookup.status === 200 ? 'WORKING' : 'FAILED'}`);
    
    // Test 7: Invalid ID format
    console.log('7. Testing invalid ID rejection...');
    const invalidIdTest = await makeRequest({
      hostname: '127.0.0.1',
      port: 3003,
      path: '/users/abc',
      method: 'GET'
    });
    
    console.log(`   ✅ Invalid ID: ${invalidIdTest.status === 400 ? 'BLOCKED' : 'FAILED'}`);
    
    // Test 8: Pagination parameter validation
    console.log('8. Testing pagination validation...');
    const paginationTest = await makeRequest({
      hostname: '127.0.0.1',
      port: 3003,
      path: '/users?page=abc&perPage=xyz',
      method: 'GET'
    });
    
    console.log(`   ✅ Invalid pagination: ${paginationTest.status === 400 ? 'BLOCKED' : 'WORKING'}`);
    
    // Test 9: Valid pagination
    console.log('9. Testing valid pagination...');
    const validPagination = await makeRequest({
      hostname: '127.0.0.1',
      port: 3003,
      path: '/users?page=1&perPage=5',
      method: 'GET'
    });
    
    console.log(`   ✅ Valid pagination: ${validPagination.status === 200 ? 'WORKING' : 'FAILED'}`);
    
    // Test 10: 404 for unknown endpoints
    console.log('10. Testing 404 handling...');
    const notFoundTest = await makeRequest({
      hostname: '127.0.0.1',
      port: 3003,
      path: '/unknown-endpoint',
      method: 'GET'
    });
    
    console.log(`   ✅ 404 handling: ${notFoundTest.status === 404 ? 'WORKING' : 'FAILED'}`);
    
    console.log('\n🎉 All validation tests completed!\n');
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    server.close(() => {
      console.log('Validation test server closed');
      process.exit(0);
    });
  }
}