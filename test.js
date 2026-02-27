const assert = require("assert");
const app = require("./index.js");
const http = require("http");

// Simple test helper
const makeRequest = (options, body) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
};

const basePort = 3456;

const runTests = async () => {
  let server;
  let passed = 0;
  let failed = 0;

  const test = (name, fn) => {
    try {
      console.log(`Testing: ${name}`);
      fn();
      console.log(`  ✓ PASS`);
      passed++;
    } catch (e) {
      console.log(`  ✗ FAIL: ${e.message}`);
      failed++;
    }
  };

  // Start server on different port
  server = app.listen(basePort);
  
  // Wait for server
  await new Promise(r => setTimeout(r, 100));

  try {
    // Test 1: Create valid user
    test("POST /users creates user", async () => {
      const res = await makeRequest({
        hostname: "localhost", port: basePort, path: "/users", method: "POST",
        headers: { "Content-Type": "application/json" }
      }, JSON.stringify({ name: "John", email: "john@test.com" }));
      assert.strictEqual(res.status, 200);
      const user = JSON.parse(res.body);
      assert.strictEqual(user.name, "John");
      assert.strictEqual(user.email, "john@test.com");
      assert.strictEqual(user.id, 1);
    });

    // Test 2: Reject invalid user (no name)
    test("POST /users rejects empty name", async () => {
      const res = await makeRequest({
        hostname: "localhost", port: basePort, path: "/users", method: "POST",
        headers: { "Content-Type": "application/json" }
      }, JSON.stringify({ name: "", email: "john@test.com" }));
      assert.strictEqual(res.status, 400);
    });

    // Test 3: Reject invalid email
    test("POST /users rejects invalid email", async () => {
      const res = await makeRequest({
        hostname: "localhost", port: basePort, path: "/users", method: "POST",
        headers: { "Content-Type": "application/json" }
      }, JSON.stringify({ name: "John", email: "invalid-email" }));
      assert.strictEqual(res.status, 400);
    });

    // Test 4: GET /users/:id returns user (type conversion fix)
    test("GET /users/:id returns user by numeric id", async () => {
      const res = await makeRequest({
        hostname: "localhost", port: basePort, path: "/users/1", method: "GET"
      });
      assert.strictEqual(res.status, 200);
      const user = JSON.parse(res.body);
      assert.strictEqual(user.id, 1);
    });

    // Test 5: GET /users/:id returns 404 for non-existent
    test("GET /users/:id returns 404 for missing user", async () => {
      const res = await makeRequest({
        hostname: "localhost", port: basePort, path: "/users/999", method: "GET"
      });
      assert.strictEqual(res.status, 404);
    });

    // Test 6: Pagination works
    test("GET /users supports pagination", async () => {
      // Add more users
      for (let i = 2; i <= 15; i++) {
        await makeRequest({
          hostname: "localhost", port: basePort, path: "/users", method: "POST",
          headers: { "Content-Type": "application/json" }
        }, JSON.stringify({ name: `User${i}`, email: `user${i}@test.com` }));
      }
      
      const res = await makeRequest({
        hostname: "localhost", port: basePort, path: "/users?page=1&perPage=5", method: "GET"
      });
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.body);
      assert.strictEqual(data.users.length, 5);
      assert.strictEqual(data.total, 15);
      assert.strictEqual(data.perPage, 5);
    });

    // Test 7: DELETE /users/:id works (type conversion fix)
    test("DELETE /users/:id deletes user", async () => {
      const res = await makeRequest({
        hostname: "localhost", port: basePort, path: "/users/1", method: "DELETE"
      });
      assert.strictEqual(res.status, 200);
      
      // Verify deleted
      const getRes = await makeRequest({
        hostname: "localhost", port: basePort, path: "/users/1", method: "GET"
      });
      assert.strictEqual(getRes.status, 404);
    });

  } finally {
    server.close();
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
};

runTests().catch(e => {
  console.error("Test error:", e);
  process.exit(1);
});
