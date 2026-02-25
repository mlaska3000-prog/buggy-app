const assert = require("assert");
const http = require("http");

// Simple test helper
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "127.0.0.1",
      port: 3000,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json"
      }
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log("Running security and functionality tests...\n");

  // Test 1: Input validation - missing name
  let res = await makeRequest("POST", "/users", { email: "test@test.com" });
  assert.strictEqual(res.status, 400, "Should reject missing name");
  assert.strictEqual(res.body.error, "Valid name is required");
  console.log("✓ Test 1: Missing name validation works");

  // Test 2: Input validation - empty name
  res = await makeRequest("POST", "/users", { name: "   ", email: "test@test.com" });
  assert.strictEqual(res.status, 400, "Should reject empty name");
  console.log("✓ Test 2: Empty name validation works");

  // Test 3: Input validation - invalid email
  res = await makeRequest("POST", "/users", { name: "John", email: "invalid" });
  assert.strictEqual(res.status, 400, "Should reject invalid email");
  assert.strictEqual(res.body.error, "Valid email is required");
  console.log("✓ Test 3: Invalid email validation works");

  // Test 4: Input validation - email without @
  res = await makeRequest("POST", "/users", { name: "John", email: "test.com" });
  assert.strictEqual(res.status, 400, "Should reject email without @");
  console.log("✓ Test 4: Email without @ validation works");

  // Test 5: Valid user creation
  res = await makeRequest("POST", "/users", { name: "John Doe", email: "john@test.com" });
  assert.strictEqual(res.status, 200, "Should create valid user");
  assert.strictEqual(res.body.name, "John Doe");
  assert.strictEqual(res.body.email, "john@test.com");
  assert.strictEqual(res.body.id, 1);
  console.log("✓ Test 5: Valid user creation works");

  // Test 6: Type coercion - GET user by ID (string param should work as number)
  res = await makeRequest("GET", "/users/1");
  assert.strictEqual(res.status, 200, "Should find user by numeric ID");
  assert.strictEqual(res.body.id, 1);
  console.log("✓ Test 6: Type coercion - GET by ID works");

  // Test 7: Type coercion - DELETE user by ID (string param should work as number)
  res = await makeRequest("DELETE", "/users/1");
  assert.strictEqual(res.status, 200, "Should delete user by numeric ID");
  assert.strictEqual(res.body.deleted, true);
  console.log("✓ Test 7: Type coercion - DELETE by ID works");

  // Test 8: Invalid ID returns 400
  res = await makeRequest("GET", "/users/abc");
  assert.strictEqual(res.status, 400, "Should reject non-numeric ID");
  assert.strictEqual(res.body.error, "Invalid user ID");
  console.log("✓ Test 8: Non-numeric ID validation works");

  // Test 9: Pagination - default values
  // Add some users first
  await makeRequest("POST", "/users", { name: "User1", email: "u1@test.com" });
  await makeRequest("POST", "/users", { name: "User2", email: "u2@test.com" });
  await makeRequest("POST", "/users", { name: "User3", email: "u3@test.com" });

  res = await makeRequest("GET", "/users");
  assert.strictEqual(res.status, 200, "Should return users list");
  assert.strictEqual(res.body.total, 3);
  assert.strictEqual(res.body.limit, 10);
  assert.strictEqual(res.body.offset, 0);
  console.log("✓ Test 9: Pagination default works");

  // Test 10: Pagination - custom limit/offset
  res = await makeRequest("GET", "/users?limit=2&offset=1");
  assert.strictEqual(res.body.limit, 2);
  assert.strictEqual(res.body.offset, 1);
  assert.strictEqual(res.body.users.length, 2);
  console.log("✓ Test 10: Pagination with limit/offset works");

  // Test 11: Pagination - limit capped at 100
  res = await makeRequest("GET", "/users?limit=500");
  assert.strictEqual(res.body.limit, 100, "Should cap limit at 100");
  console.log("✓ Test 11: Pagination limit capped at 100");

  // Test 12: Pagination - offset minimum 0
  res = await makeRequest("GET", "/users?offset=-5");
  assert.strictEqual(res.body.offset, 0, "Should not allow negative offset");
  console.log("✓ Test 12: Pagination offset minimum enforced");

  console.log("\n✅ All 12 tests passed!");
}

runTests().catch(err => {
  console.error("Test failed:", err.message);
  process.exit(1);
});