const assert = require("assert");
const app = require("./index.js");
const http = require("http");

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      const options = {
        hostname: 'localhost',
        port: port,
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          server.close();
          try {
            resolve({
              statusCode: res.statusCode,
              data: data ? JSON.parse(data) : null
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              data: data
            });
          }
        });
      });

      req.on('error', (e) => {
        server.close();
        reject(e);
      });

      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  });
}

async function runTests() {
  console.log("Running regression tests...");

  // Test 1: Should be able to retrieve a user by ID after creating it
  console.log("Test 1: GET /users/:id should return created user");
  const createResponse = await makeRequest('POST', '/users', { name: 'John Doe', email: 'john@example.com' });
  assert.strictEqual(createResponse.statusCode, 200, 'Create user should succeed');
  assert.strictEqual(createResponse.data.id, 1, 'Created user should have ID 1');
  assert.strictEqual(createResponse.data.name, 'John Doe', 'Created user should have correct name');

  const getResponse = await makeRequest('GET', '/users/1');
  assert.strictEqual(getResponse.statusCode, 200, 'Get user should succeed');
  assert.strictEqual(getResponse.data.id, 1, 'Retrieved user should have correct ID');
  assert.strictEqual(getResponse.data.name, 'John Doe', 'Retrieved user should have correct name');
  console.log("✓ GET /users/:id works correctly");

  // Test 2: Should be able to delete a user by ID
  console.log("Test 2: DELETE /users/:id should actually delete the user");
  const deleteResponse = await makeRequest('DELETE', '/users/1');
  assert.strictEqual(deleteResponse.statusCode, 200, 'Delete should succeed');
  assert.strictEqual(deleteResponse.data.deleted, true, 'Delete response should confirm deletion');

  const getAfterDelete = await makeRequest('GET', '/users/1');
  assert.strictEqual(getAfterDelete.statusCode, 200, 'Get after delete should succeed');
  assert.strictEqual(getAfterDelete.data, null, 'User should be null after deletion');
  console.log("✓ DELETE /users/:id works correctly");

  // Test 3: Pagination should return numeric page values
  console.log("Test 3: Pagination should handle page parameters correctly");
  // Create a few more users first
  await makeRequest('POST', '/users', { name: 'Jane Doe', email: 'jane@example.com' });
  await makeRequest('POST', '/users', { name: 'Bob Smith', email: 'bob@example.com' });
  
  const paginationResponse = await makeRequest('GET', '/users?page=2&perPage=1');
  assert.strictEqual(paginationResponse.statusCode, 200, 'Pagination should succeed');
  assert.strictEqual(typeof paginationResponse.data.page, 'number', 'Page should be a number');
  assert.strictEqual(paginationResponse.data.page, 2, 'Page should be 2');
  console.log("✓ Pagination works correctly");

  console.log("All tests passed!");
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };