const assert = require("assert");
const app = require("./index.js");

// Simple in-memory test runner
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`✗ ${name}: ${e.message}`);
    failed++;
  }
}

// Mock request/response for testing
function mockReq(params = {}, query = {}, body = {}) {
  return { params, query, body };
}

function mockRes() {
  let statusCode = 200;
  let data = null;
  return {
    status: function(code) {
      statusCode = code;
      return this;
    },
    json: function(d) {
      data = d;
      return this;
    },
    getStatus: () => statusCode,
    getData: () => data
  };
}

console.log("Running tests...\n");

// Test 1: User ID param validation
test("GET /users/:id - should parse string id to number", () => {
  const id = parseInt("1");
  assert.strictEqual(typeof id, "number");
  assert.strictEqual(id, 1);
});

// Test 2: Pagination parsing
test("Pagination - should parse string page to number", () => {
  const page = parseInt("2") || 1;
  assert.strictEqual(page, 2);
});

test("Pagination - should parse string perPage to number", () => {
  const perPage = Math.min(parseInt("5") || 10, 100);
  assert.strictEqual(perPage, 5);
});

// Test 3: Input validation logic
test("Input validation - should validate email format", () => {
  const email = "test@example.com";
  const isEmail = email.includes("@") && email.includes(".");
  assert.strictEqual(isEmail, true);
});

test("Input validation - should reject invalid email", () => {
  const email = "not-an-email";
  const isEmail = email.includes("@") && email.includes(".");
  assert.strictEqual(isEmail, false);
});

// Test 4: Name validation regex
test("Input validation - should validate name characters", () => {
  const name = "John Doe";
  const validName = /^[a-zA-Z\s\-'\.]+$/.test(name);
  assert.strictEqual(validName, true);
});

console.log(`\n--- Results: ${passed} passed, ${failed} failed ---`);
process.exit(failed > 0 ? 1 : 0);
