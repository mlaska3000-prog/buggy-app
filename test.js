const assert = require("assert");
const app = require("./index.js");
const http = require("http");

// Helper function to make HTTP requests
function makeRequest(method, path, body) {
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
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          server.close();
          resolve({
            statusCode: res.statusCode,
            body: JSON.parse(data || '{}')
          });
        });
      });

      req.on('error', (err) => {
        server.close();
        reject(err);
      });

      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  });
}

async function runTests() {
  console.log("Running tests...");

  // Test: DELETE non-existent user should return 404
  try {
    const response = await makeRequest('DELETE', '/users/999');
    assert.strictEqual(response.statusCode, 404, 'DELETE non-existent user should return 404');
    assert.strictEqual(response.body.error, 'User not found', 'DELETE non-existent user should return error message');
    console.log("✓ DELETE non-existent user returns 404 with error message");
  } catch (error) {
    console.error("✗ DELETE non-existent user test failed:", error.message);
    process.exit(1);
  }

  // Test: DELETE existing user should return 200
  try {
    // First create a user
    const createResponse = await makeRequest('POST', '/users', { name: 'Test User', email: 'test@example.com' });
    assert.strictEqual(createResponse.statusCode, 200, 'POST should create user successfully');
    
    const userId = createResponse.body.id;
    
    // Then delete it
    const deleteResponse = await makeRequest('DELETE', `/users/${userId}`);
    assert.strictEqual(deleteResponse.statusCode, 200, 'DELETE existing user should return 200');
    assert.strictEqual(deleteResponse.body.deleted, true, 'DELETE existing user should return deleted: true');
    console.log("✓ DELETE existing user returns 200 with success message");
  } catch (error) {
    console.error("✗ DELETE existing user test failed:", error.message);
    process.exit(1);
  }

  console.log("All tests passed!");
}

runTests().catch(err => {
  console.error("Test runner error:", err);
  process.exit(1);
});