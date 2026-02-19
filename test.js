const assert = require("assert");
const http = require("http");
const app = require("./index.js");

// Helper to make HTTP requests
function request(path, method = "GET") {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: "localhost", port: 3000, path, method }, (res) => {
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
  
  // Test 1: GET /health returns HTTP 200
  const res1 = await request("/health");
  assert.strictEqual(res1.status, 200, "GET /health should return 200");
  
  // Test 2: GET /health returns JSON with status: "ok"
  assert.strictEqual(res1.body.status, "ok", "Health status should be 'ok'");
  
  // Test 3: GET /health returns JSON with uptime number greater than 0
  assert.strictEqual(typeof res1.body.uptime, "number", "Uptime should be a number");
  assert.ok(res1.body.uptime > 0, "Uptime should be greater than 0");
  
  // Test 4: GET /version returns HTTP 200
  const res2 = await request("/version");
  assert.strictEqual(res2.status, 200, "GET /version should return 200");
  
  // Test 5: GET /version returns JSON with version: "1.0.0"
  assert.strictEqual(res2.body.version, "1.0.0", "Version should be '1.0.0'");
  
  // Test 6: GET /version returns JSON with node version string
  assert.strictEqual(typeof res2.body.node, "string", "Node version should be a string");
  assert.ok(res2.body.node.length > 0, "Node version should not be empty");
  
  console.log("All tests passed!");
}

runTests().catch(err => {
  console.error("Tests failed:", err);
  process.exit(1);
});
