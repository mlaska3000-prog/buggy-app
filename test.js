const assert = require("assert");
const http = require("http");
const app = require("./index.js");

let server;
const port = 3001; // Use different port for testing

// Helper function to make HTTP requests
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            body: data ? JSON.parse(data) : null
          };
          resolve(result);
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function runTests() {
  try {
    console.log("Starting tests...");
    
    server = app.listen(port);
    
    // Test 1: Create a user
    console.log("Test 1: Creating a user");
    const createResponse = await makeRequest('POST', '/users', {
      name: 'John Doe',
      email: 'john@example.com'
    });
    assert.strictEqual(createResponse.statusCode, 200);
    assert.strictEqual(createResponse.body.id, 1);
    assert.strictEqual(createResponse.body.name, 'John Doe');
    console.log("✓ User creation works");

    // Test 2: Get existing user by ID (regression test for the main bug)
    console.log("Test 2: Getting existing user by ID");
    const getUserResponse = await makeRequest('GET', '/users/1');
    assert.strictEqual(getUserResponse.statusCode, 200);
    assert.strictEqual(getUserResponse.body.id, 1);
    assert.strictEqual(getUserResponse.body.name, 'John Doe');
    console.log("✓ Getting existing user works");

    // Test 3: Get non-existent user by ID (regression test - should return 404)
    console.log("Test 3: Getting non-existent user by ID");
    const nonExistentUserResponse = await makeRequest('GET', '/users/999');
    assert.strictEqual(nonExistentUserResponse.statusCode, 404);
    assert.strictEqual(nonExistentUserResponse.body.error, 'User not found');
    console.log("✓ Non-existent user returns 404 with error message");

    // Test 4: Delete existing user
    console.log("Test 4: Deleting existing user");
    const deleteResponse = await makeRequest('DELETE', '/users/1');
    assert.strictEqual(deleteResponse.statusCode, 200);
    assert.strictEqual(deleteResponse.body.deleted, true);
    console.log("✓ User deletion works");

    // Test 5: Verify user was deleted (should now return 404)
    console.log("Test 5: Verifying user was deleted");
    const deletedUserResponse = await makeRequest('GET', '/users/1');
    assert.strictEqual(deletedUserResponse.statusCode, 404);
    assert.strictEqual(deletedUserResponse.body.error, 'User not found');
    console.log("✓ Deleted user correctly returns 404");

    console.log("\nAll tests passed! ✓");
    
  } catch (error) {
    console.error("Test failed:", error.message);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
  }
}

// Run tests only if this file is executed directly
if (require.main === module) {
  runTests();
}