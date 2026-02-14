const assert = require("assert");
const request = require("supertest");
const app = require("./index.js");

async function runTests() {
  console.log("Running tests...");
  
  // Helper function to reset state before each test
  async function resetState() {
    await request(app).post("/test/reset");
  }
  
  // Test: should not reuse IDs after deletion (regression test for the main bug)
  async function testNoIdCollisionAfterDeletion() {
    console.log("Testing ID collision after deletion...");
    await resetState();
    
    // Create two users
    const user1Res = await request(app).post("/users").send({ name: "User1", email: "user1@test.com" });
    const user2Res = await request(app).post("/users").send({ name: "User2", email: "user2@test.com" });
    
    assert.strictEqual(user1Res.body.id, 1, "First user should have id 1");
    assert.strictEqual(user2Res.body.id, 2, "Second user should have id 2");
    
    // Delete the first user
    await request(app).delete("/users/1");
    
    // Create a third user - should NOT get id 1 (should get id 3)
    const user3Res = await request(app).post("/users").send({ name: "User3", email: "user3@test.com" });
    assert.strictEqual(user3Res.body.id, 3, "Third user should have id 3, not reusing deleted id 1");
    
    // Verify we can still get user2 and user3 correctly
    const getUser2 = await request(app).get("/users/2");
    const getUser3 = await request(app).get("/users/3");
    
    assert.strictEqual(getUser2.body.id, 2, "Should retrieve user2 correctly");
    assert.strictEqual(getUser2.body.name, "User2", "Should retrieve user2 name correctly");
    assert.strictEqual(getUser3.body.id, 3, "Should retrieve user3 correctly");
    assert.strictEqual(getUser3.body.name, "User3", "Should retrieve user3 name correctly");
    
    console.log("✓ ID collision test passed");
  }
  
  // Test: GET /users/:id should work correctly
  async function testGetUserById() {
    console.log("Testing GET /users/:id...");
    await resetState();
    
    const createRes = await request(app).post("/users").send({ name: "TestUser", email: "test@test.com" });
    const userId = createRes.body.id;
    
    const getRes = await request(app).get(`/users/${userId}`);
    assert.strictEqual(getRes.body.id, userId, "Should retrieve user by ID correctly");
    assert.strictEqual(getRes.body.name, "TestUser", "Should retrieve user name correctly");
    
    console.log("✓ GET /users/:id test passed");
  }
  
  // Test: DELETE /users/:id should work correctly
  async function testDeleteUserById() {
    console.log("Testing DELETE /users/:id...");
    await resetState();
    
    const createRes = await request(app).post("/users").send({ name: "DeleteMe", email: "delete@test.com" });
    const userId = createRes.body.id;
    
    // Delete the user
    await request(app).delete(`/users/${userId}`);
    
    // Try to get the deleted user (should be undefined)
    const getRes = await request(app).get(`/users/${userId}`);
    assert(getRes.body === undefined || getRes.body === null || getRes.body === "", "Deleted user should not be found");
    
    console.log("✓ DELETE /users/:id test passed");
  }
  
  // Test: Pagination should work correctly
  async function testPagination() {
    console.log("Testing pagination...");
    await resetState();
    
    // Create several users for pagination test
    await request(app).post("/users").send({ name: "Page1User1", email: "p1u1@test.com" });
    await request(app).post("/users").send({ name: "Page1User2", email: "p1u2@test.com" });
    await request(app).post("/users").send({ name: "Page2User1", email: "p2u1@test.com" });
    
    // Get page 1 with 2 users per page
    const page1Res = await request(app).get("/users?page=1&perPage=2");
    assert.strictEqual(page1Res.body.users.length, 2, "Page 1 should have 2 users");
    assert.strictEqual(page1Res.body.page, 1, "Should return correct page number");
    
    // Get page 2 with 2 users per page  
    const page2Res = await request(app).get("/users?page=2&perPage=2");
    assert(page2Res.body.users.length >= 1, "Page 2 should have at least 1 user");
    assert.strictEqual(page2Res.body.page, 2, "Should return correct page number");
    
    console.log("✓ Pagination test passed");
  }
  
  // Run tests sequentially to avoid state conflicts
  await testNoIdCollisionAfterDeletion();
  await testGetUserById();
  await testDeleteUserById();
  await testPagination();
}

// Install supertest if not available
try {
  require("supertest");
} catch (e) {
  console.log("Installing supertest for testing...");
  require("child_process").execSync("npm install supertest", { stdio: "inherit" });
}

// Set test environment
process.env.NODE_ENV = "test";

runTests()
  .then(() => {
    console.log("All tests passed!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Test failed:", err.message);
    process.exit(1);
  });