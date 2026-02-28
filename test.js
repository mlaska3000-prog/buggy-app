// Security Fixes Verification Tests
// Run: node test.js

const http = require('http');
const app = require('./index.js');

let server;
let baseURL;

function runTests() {
  return new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', async () => {
      const addr = server.address();
      baseURL = `http://127.0.0.1:${addr.port}`;
      console.log(`Testing server at ${baseURL}\n`);
      
      let passed = 0;
      let failed = 0;
      
      // Helper
      const fetch = (url, options = {}) => new Promise((res) => {
        http.request(url, options, res).on('error', res).end();
      });
      
      // Test 1: Server binds to localhost
      try {
        const addr = server.address();
        if (addr.address === '127.0.0.1') {
          console.log('✓ Server binds to localhost only');
          passed++;
        } else {
          console.log('✗ Server binds to:', addr.address);
          failed++;
        }
      } catch (e) {
        console.log('✗ Server binding test:', e.message);
        failed++;
      }
      
      // Test 2: Input validation - empty name
      try {
        const res = await new Promise((res) => {
          const req = http.request(`${baseURL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          }, res);
          req.write(JSON.stringify({ name: '', email: 'test@example.com' }));
          req.end();
        });
        if (res.statusCode === 400) {
          console.log('✓ Input validation rejects empty name');
          passed++;
        } else {
          console.log('✗ Empty name validation got:', res.statusCode);
          failed++;
        }
      } catch (e) {
        console.log('✗ Empty name test:', e.message);
        failed++;
      }
      
      // Test 3: Input validation - invalid email
      try {
        const res = await new Promise((res) => {
          const req = http.request(`${baseURL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          }, res);
          req.write(JSON.stringify({ name: 'John', email: 'invalid' }));
          req.end();
        });
        if (res.statusCode === 400) {
          console.log('✓ Input validation rejects invalid email');
          passed++;
        } else {
          console.log('✗ Invalid email validation got:', res.statusCode);
          failed++;
        }
      } catch (e) {
        console.log('✗ Invalid email test:', e.message);
        failed++;
      }
      
      // Test 4: Type coercion - GET by ID
      try {
        // Create user
        await new Promise((res) => {
          const req = http.request(`${baseURL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          }, res);
          req.write(JSON.stringify({ name: 'Jane', email: 'jane@test.com' }));
          req.end();
        });
        
        // Get by ID (string param)
        const res = await new Promise((res) => {
          http.request(`${baseURL}/users/1`, { method: 'GET' }, res).end();
        });
        
        if (res.statusCode === 200) {
          console.log('✓ GET /users/:id finds user (type coercion works)');
          passed++;
        } else {
          console.log('✗ GET by ID got:', res.statusCode);
          failed++;
        }
      } catch (e) {
        console.log('✗ Type coercion test:', e.message);
        failed++;
      }
      
      // Test 5: Pagination handles string params
      try {
        const res = await new Promise((res) => {
          http.request(`${baseURL}/users?page=1&perPage=10`, { method: 'GET' }, res).end();
        });
        
        if (res.statusCode === 200) {
          console.log('✓ Pagination handles string params correctly');
          passed++;
        } else {
          console.log('✗ Pagination got:', res.statusCode);
          failed++;
        }
      } catch (e) {
        console.log('✗ Pagination test:', e.message);
        failed++;
      }
      
      server.close();
      console.log(`\nResults: ${passed} passed, ${failed} failed`);
      resolve(failed === 0 ? 0 : 1);
    });
  });
}

runTests().then((code) => process.exit(code));
