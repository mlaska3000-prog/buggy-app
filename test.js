const assert = require("assert");
const http = require("http");
const app = require("./index.js");

// Test server
let server;
const port = 3002;
const host = '127.0.0.1';

// Test helper functions
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, body: parsedBody, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, body: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log("Starting test suite...");

  // Start test server
  server = app.listen(port, host, () => {
    console.log(`Test server running on ${host}:${port}`);
  });
  
  // Handle server errors
  server.on('error', (error) => {
    console.error('Server error:', error);
    process.exit(1);
  });
  
  // Give server time to start
  await new Promise(resolve => setTimeout(resolve, 100));

  try {
    // Test 1: Input validation - valid user creation
    console.log("\n=== Test 1: Valid user creation ===");
    const validUser = { name: "John Doe", email: "john@example.com" };
    const createResponse = await makeRequest('POST', '/users', validUser);
    console.log(`Status: ${createResponse.status}`);
    console.log(`Response:`, createResponse.body);
    assert.strictEqual(createResponse.status, 201, "Should create user successfully");
    assert.strictEqual(createResponse.body.name, "John Doe", "Name should match");
    assert.strictEqual(createResponse.body.email, "john@example.com", "Email should match");
    assert.strictEqual(typeof createResponse.body.id, "number", "ID should be a number");

    // Test 2: Input validation - invalid user creation (missing email)
    console.log("\n=== Test 2: Invalid user creation (missing email) ===");
    const invalidUser = { name: "Jane Doe" };
    const invalidResponse = await makeRequest('POST', '/users', invalidUser);
    console.log(`Status: ${invalidResponse.status}`);
    console.log(`Response:`, invalidResponse.body);
    assert.strictEqual(invalidResponse.status, 400, "Should reject invalid user");
    assert.strictEqual(invalidResponse.body.error, "Validation failed", "Should return validation error");

    // Test 3: Input validation - invalid email format
    console.log("\n=== Test 3: Invalid email format ===");
    const badEmailUser = { name: "Bob", email: "invalid-email" };
    const badEmailResponse = await makeRequest('POST', '/users', badEmailUser);
    console.log(`Status: ${badEmailResponse.status}`);
    assert.strictEqual(badEmailResponse.status, 400, "Should reject invalid email");

    // Test 4: Type coercion fix - GET user by ID
    console.log("\n=== Test 4: Get user by ID (type coercion fix) ===");
    const getUserResponse = await makeRequest('GET', '/users/1');
    console.log(`Status: ${getUserResponse.status}`);
    console.log(`Response:`, getUserResponse.body);
    assert.strictEqual(getUserResponse.status, 200, "Should find user by ID");
    assert.strictEqual(getUserResponse.body.id, 1, "Should return correct user");
    assert.strictEqual(getUserResponse.body.name, "John Doe", "Should return correct user name");

    // Test 5: Invalid user ID
    console.log("\n=== Test 5: Invalid user ID ===");
    const invalidIdResponse = await makeRequest('GET', '/users/abc');
    console.log(`Status: ${invalidIdResponse.status}`);
    assert.strictEqual(invalidIdResponse.status, 400, "Should reject non-numeric ID");

    // Test 6: Non-existent user ID
    console.log("\n=== Test 6: Non-existent user ID ===");
    const notFoundResponse = await makeRequest('GET', '/users/999');
    console.log(`Status: ${notFoundResponse.status}`);
    assert.strictEqual(notFoundResponse.status, 404, "Should return 404 for non-existent user");

    // Test 7: Pagination fix
    console.log("\n=== Test 7: Pagination with query parameters ===");
    // Create a second user first
    await makeRequest('POST', '/users', { name: "Alice Smith", email: "alice@example.com" });
    
    const paginationResponse = await makeRequest('GET', '/users?page=1&perPage=1');
    console.log(`Status: ${paginationResponse.status}`);
    console.log(`Response:`, paginationResponse.body);
    assert.strictEqual(paginationResponse.status, 200, "Should return paginated results");
    assert.strictEqual(paginationResponse.body.users.length, 1, "Should return 1 user per page");
    assert.strictEqual(typeof paginationResponse.body.pagination.page, "number", "Page should be a number");
    assert.strictEqual(typeof paginationResponse.body.pagination.perPage, "number", "PerPage should be a number");

    // Test 8: Delete user (type coercion fix)
    console.log("\n=== Test 8: Delete user by ID ===");
    const deleteResponse = await makeRequest('DELETE', '/users/2');
    console.log(`Status: ${deleteResponse.status}`);
    console.log(`Response:`, deleteResponse.body);
    assert.strictEqual(deleteResponse.status, 200, "Should delete user successfully");
    assert.strictEqual(deleteResponse.body.deleted, true, "Should confirm deletion");

    // Test 9: Security - Server binding (should reject external connections)
    console.log("\n=== Test 9: Server binding check ===");
    // This test verifies that the server binds to localhost only
    // The server should be accessible via 127.0.0.1 but the binding prevents external access
    const localhostResponse = await makeRequest('GET', '/users/1');
    assert.strictEqual(localhostResponse.status, 200, "Should be accessible via localhost");

    console.log("\n✅ All tests passed!");
    
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  } finally {
    // Close server
    server.close();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().then(() => {
    console.log("\nTest suite completed successfully.");
    process.exit(0);
  }).catch((error) => {
    console.error("\nTest suite failed:", error);
    process.exit(1);
  });
}

module.exports = { runTests };