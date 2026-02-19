const assert = require("assert");
const http = require("http");
const app = require("./index.js");

// Bug 1: GET /users/:id - id comparison is string vs number (will always return undefined)
// Bug 2: DELETE /users/:id - same string vs number comparison
// Bug 3: Pagination - page/perPage are strings, math will be wrong

// Helper function to make HTTP requests
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: "localhost", port: 3000, path: path, method: "GET" }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        resolve({ status: res.statusCode, body: JSON.parse(data) });
      });
    });
    req.on("error", reject);
    req.end();
  });
}

async function runTests() {
  console.log("Running tests...");
  
  // Start the server
  const server = app.listen(3000);
  
  // Wait for server to be ready
  await new Promise(resolve => setTimeout(resolve, 500));
  
  try {
    // Test GET /ping
    console.log("Testing GET /ping...");
    const pingRes = await makeRequest("/ping");
    assert.strictEqual(pingRes.status, 200, "GET /ping should return 200");
    assert.strictEqual(pingRes.body.pong, true, "GET /ping should return pong: true");
    assert.ok(pingRes.body.timestamp > 0, "GET /ping should return timestamp > 0");
    assert.strictEqual(typeof pingRes.body.timestamp, "number", "timestamp should be a number");
    console.log("✓ GET /ping passed");
    
    // Test GET /stats
    console.log("Testing GET /stats...");
    const statsRes = await makeRequest("/stats");
    assert.strictEqual(statsRes.status, 200, "GET /stats should return 200");
    assert.ok(statsRes.body.users >= 0, "GET /stats should return users >= 0");
    assert.strictEqual(typeof statsRes.body.users, "number", "users should be a number");
    assert.ok(statsRes.body.uptime > 0, "GET /stats should return uptime > 0");
    assert.strictEqual(typeof statsRes.body.uptime, "number", "uptime should be a number");
    console.log("✓ GET /stats passed");
    
    console.log("All tests passed!");
    server.close();
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err.message);
    server.close();
    process.exit(1);
  }
}

runTests();