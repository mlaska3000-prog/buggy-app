const assert = require("assert");
const app = require("./index.js");
// Bug 1: GET /users/:id - id comparison is string vs number (will always return undefined)
// Bug 2: DELETE /users/:id - same string vs number comparison
// Bug 3: Pagination - page/perPage are strings, math will be wrong

// Test GET /version endpoint
const http = require("http");

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: "localhost", port: 3000, path, method: "GET" }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });
    req.on("error", reject);
    req.end();
  });
}

// Run version endpoint tests
async function runTests() {
  // Start server in background
  const server = app.listen(3000);
  
  try {
    // Test 1: GET /version returns HTTP 200
    const res = await makeRequest("/version");
    assert.strictEqual(res.status, 200, "Expected status 200");
    console.log("✓ GET /version returns HTTP 200");
    
    // Test 2 & 3: GET /version returns JSON with version and node
    const body = JSON.parse(res.body);
    assert.strictEqual(body.version, "1.0.0", "Expected version 1.0.0");
    assert.strictEqual(body.node, process.version, "Expected node version");
    console.log("✓ GET /version returns JSON with version: 1.0.0");
    console.log("✓ GET /version returns JSON with node: " + process.version);
    
    console.log("\nAll tests passed!");
  } catch (err) {
    console.error("Test failed:", err.message);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests();