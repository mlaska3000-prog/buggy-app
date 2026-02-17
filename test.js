const assert = require("assert");
const request = require("supertest");
const app = require("./index.js");

async function runTests() {
  console.log("Running tests...");

  // Regression test: GET /users/:id should handle string route params
  // Bug: Express route params are always strings, but user.id is a number.
  // Without parseInt, comparing number === string returns false.
  console.log("Regression test: GET /users/:id handles string route parameter");
  
  const regCreateResponse = await request(app)
    .post("/users")
    .send({ name: "Regression User", email: "regression@test.com" });
  const regUserId = regCreateResponse.body.id;
  
  // Explicitly pass string "1" to simulate Express route param behavior
  const regGetResponse = await request(app)
    .get("/users/1");
  
  assert.strictEqual(regGetResponse.status, 200);
  assert.strictEqual(regGetResponse.body.name, "Regression User");
  assert.strictEqual(regGetResponse.body.id, regUserId);
  console.log("✓ Regression test: string route param handled correctly");
  
  // Test: GET and DELETE /users/:id should work with numeric IDs
  console.log("Test: GET /users/:id returns correct user");
  
  // Create a test user
  const createResponse = await request(app)
    .post("/users")
    .send({ name: "Test User", email: "test@example.com" });
  
  assert.strictEqual(createResponse.status, 200);
  assert.strictEqual(createResponse.body.name, "Test User");
  const userId = createResponse.body.id;
  
  // Test GET /users/:id with the created user
  const getResponse = await request(app)
    .get(`/users/${userId}`);
  
  assert.strictEqual(getResponse.status, 200);
  assert.strictEqual(getResponse.body.name, "Test User");
  assert.strictEqual(getResponse.body.id, userId);
  console.log("✓ GET /users/:id works correctly");
  
  // Test DELETE /users/:id
  console.log("Test: DELETE /users/:id removes correct user");
  const deleteResponse = await request(app)
    .delete(`/users/${userId}`);
  
  assert.strictEqual(deleteResponse.status, 200);
  assert.strictEqual(deleteResponse.body.deleted, true);
  
  // Verify user was deleted (should return 404)
  const getAfterDeleteResponse = await request(app)
    .get(`/users/${userId}`);
  
  assert.strictEqual(getAfterDeleteResponse.status, 404);
  assert.strictEqual(getAfterDeleteResponse.body.error, "User not found");
  console.log("✓ DELETE /users/:id works correctly");
  
  // Test invalid ID handling
  console.log("Test: Invalid ID handling");
  const invalidGetResponse = await request(app)
    .get("/users/invalid");
  
  assert.strictEqual(invalidGetResponse.status, 400);
  assert.strictEqual(invalidGetResponse.body.error, "Invalid user ID");
  
  const invalidDeleteResponse = await request(app)
    .delete("/users/invalid");
  
  assert.strictEqual(invalidDeleteResponse.status, 400);
  assert.strictEqual(invalidDeleteResponse.body.error, "Invalid user ID");
  console.log("✓ Invalid ID handling works correctly");
  
  console.log("All tests passed!");
}

runTests().catch(err => {
  console.error("Test failed:", err.message);
  process.exit(1);
});