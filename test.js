const assert = require("assert");
const request = require("supertest");
const app = require("./index.js");

async function runTests() {
  console.log("Running regression tests...");
  
  // Test 1: Create a user first
  const createResponse = await request(app)
    .post("/users")
    .send({ name: "Test User", email: "test@example.com" })
    .expect(200);
  
  const createdUser = createResponse.body;
  console.log("✓ User created:", createdUser);
  
  // Test 2: GET existing user should return 200
  const getResponse = await request(app)
    .get(`/users/${createdUser.id}`)
    .expect(200);
  
  assert.strictEqual(getResponse.body.id, createdUser.id);
  assert.strictEqual(getResponse.body.name, "Test User");
  console.log("✓ GET existing user returns 200");
  
  // Test 3: GET non-existent user should return 404
  await request(app)
    .get("/users/999")
    .expect(404);
  console.log("✓ GET non-existent user returns 404");
  
  // Test 4: DELETE existing user should return 200
  await request(app)
    .delete(`/users/${createdUser.id}`)
    .expect(200)
    .expect((res) => {
      assert.strictEqual(res.body.deleted, true);
    });
  console.log("✓ DELETE existing user returns 200");
  
  // Test 5: DELETE non-existent user should return 404 (regression test for the bug)
  await request(app)
    .delete("/users/999")
    .expect(404)
    .expect((res) => {
      assert.strictEqual(res.body.error, "User not found");
    });
  console.log("✓ DELETE non-existent user returns 404 (regression test passed)");
  
  // Test 6: Verify deleted user is actually gone
  await request(app)
    .get(`/users/${createdUser.id}`)
    .expect(404);
  console.log("✓ Deleted user is no longer accessible");
  
  console.log("All tests passed!");
}

// Only run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };