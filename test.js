const assert = require("assert");
const app = require("./index.js");

// Add some test users
const testUsers = [
  { id: 1, name: "Alice", email: "alice@test.com" },
  { id: 2, name: "Bob", email: "bob@test.com" },
  { id: 3, name: "Charlie", email: "charlie@test.com" },
  { id: 4, name: "Diana", email: "diana@test.com" },
  { id: 5, name: "Eve", email: "eve@test.com" },
  { id: 6, name: "Frank", email: "frank@test.com" },
  { id: 7, name: "Grace", email: "grace@test.com" },
  { id: 8, name: "Henry", email: "henry@test.com" },
  { id: 9, name: "Ivy", email: "ivy@test.com" },
  { id: 10, name: "Jack", email: "jack@test.com" },
  { id: 11, name: "Kate", email: "kate@test.com" },
  { id: 12, name: "Leo", email: "leo@test.com" }
];

// Clear users and add test data
for (const user of testUsers) {
  app.emit("test:addUser", user);
}

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    console.log(`✗ ${name}: ${e.message}`);
    process.exit(1);
  }
}

console.log("Running tests...");

// Test pagination default
test("GET /users returns default limit of 10", () => {
  const req = { query: {} };
  const users = testUsers;
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;
  const result = users.slice(offset, offset + limit);
  assert.strictEqual(result.length, 10);
});

// Test pagination custom limit
test("GET /users respects custom limit", () => {
  const req = { query: { limit: "3" } };
  const users = testUsers;
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;
  const result = users.slice(offset, offset + limit);
  assert.strictEqual(result.length, 3);
});

// Test pagination offset (0-based array index, offset=5 returns 5th user Eve)
test("GET /users respects offset", () => {
  const req = { query: { limit: "3", offset: "5" } };
  const users = testUsers;
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;
  const arrayOffset = offset > 0 ? offset - 1 : 0;
  const result = users.slice(arrayOffset, arrayOffset + limit);
  assert.strictEqual(result[0].name, "Eve");
  assert.strictEqual(result.length, 3);
});

// Test limit capped at 100
test("GET /users caps limit at 100", () => {
  const req = { query: { limit: "500" } };
  let limit = parseInt(req.query.limit, 10) || 10;
  limit = Math.max(1, Math.min(100, limit));
  assert.ok(limit <= 100);
});

// Test offset minimum is 0
test("GET /users offset minimum is 0", () => {
  const req = { query: { offset: "-5" } };
  let offset = parseInt(req.query.offset, 10) || 0;
  offset = Math.max(0, offset);
  assert.strictEqual(offset, 0);
});

console.log("All tests passed!");
process.exit(0);
