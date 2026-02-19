const assert = require("assert");
const request = require("supertest");
const app = require("./index.js");

// Regression test for type mismatch bug in GET /users/:id and DELETE /users/:id
// This test would have caught the bug where req.params.id (string) was compared
// with user.id (number) using strict equality, causing routes to always fail.

async function runRegressionTests() {
  console.log("Running regression tests for user ID type conversion bug...");

  try {
    // Test 1: Create user and verify GET works with ID conversion
    console.log("Test 1: Create user and GET by ID...");
    
    // Create a user
    const createResponse = await request(app)
      .post("/users")
      .send({ name: "Test User", email: "test@example.com" });
    
    assert.equal(createResponse.status, 200);
    const createdUser = createResponse.body;
    assert.equal(typeof createdUser.id, "number");
    console.log(`Created user with ID ${createdUser.id} (type: ${typeof createdUser.id})`);

    // GET the user by ID - this should work despite req.params.id being a string
    const getResponse = await request(app)
      .get(`/users/${createdUser.id}`);
    
    assert.equal(getResponse.status, 200);
    assert.deepEqual(getResponse.body, createdUser);
    console.log("✓ GET /users/:id works with type conversion");

    // Test 2: DELETE user with ID conversion
    console.log("Test 2: DELETE user by ID...");
    
    const deleteResponse = await request(app)
      .delete(`/users/${createdUser.id}`);
    
    assert.equal(deleteResponse.status, 200);
    assert.equal(deleteResponse.body.deleted, true);
    console.log("✓ DELETE /users/:id works with type conversion");

    // Verify user is actually deleted
    const getAfterDeleteResponse = await request(app)
      .get(`/users/${createdUser.id}`);
    
    assert.equal(getAfterDeleteResponse.status, 404);
    console.log("✓ User is actually deleted");

    // Test 3: 404 for non-existent user
    console.log("Test 3: 404 for non-existent user...");
    
    const get404Response = await request(app)
      .get("/users/999");
    
    assert.equal(get404Response.status, 404);
    assert.equal(get404Response.body.error, "User not found");
    console.log("✓ GET returns 404 for non-existent user");

    // Test 4: 400 for invalid user ID
    console.log("Test 4: 400 for invalid user ID...");
    
    const getInvalidResponse = await request(app)
      .get("/users/invalid");
    
    assert.equal(getInvalidResponse.status, 400);
    assert.equal(getInvalidResponse.body.error, "Invalid user ID");
    console.log("✓ GET returns 400 for invalid user ID");

    console.log("All regression tests passed!");

  } catch (error) {
    console.error("Regression test failed:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runRegressionTests();
}

module.exports = { runRegressionTests };