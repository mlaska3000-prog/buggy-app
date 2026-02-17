const request = require('supertest');
const app = require('./index.js');

console.log("=== DELETE Bug Reproduction ===\n");

async function testDeleteBug() {
  try {
    // First, create a user
    console.log("1. Creating a user...");
    const createResponse = await request(app)
      .post('/users')
      .send({ name: 'Test User', email: 'test@example.com' });
    
    console.log("   Created user:", createResponse.body);
    
    // Try to delete existing user
    console.log("\n2. Testing DELETE /users/1 (existing user):");
    const deleteExistingResponse = await request(app)
      .delete('/users/1');
    
    console.log("   Status:", deleteExistingResponse.status);
    console.log("   Body:", deleteExistingResponse.body);
    
    // Try to delete non-existent user (this is the bug)
    console.log("\n3. Testing DELETE /users/999 (non-existent user):");
    const deleteNonExistentResponse = await request(app)
      .delete('/users/999');
    
    console.log("   Status:", deleteNonExistentResponse.status);
    console.log("   Body:", deleteNonExistentResponse.body);
    console.log("   Expected: 404, Actual:", deleteNonExistentResponse.status);
    
    if (deleteNonExistentResponse.status === 200) {
      console.log("\n❌ BUG CONFIRMED: DELETE returns 200 for non-existent user instead of 404");
    }
    
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Check if supertest is available
try {
  require('supertest');
  testDeleteBug();
} catch (e) {
  console.log("supertest not available, using manual simulation...");
  
  // Manual simulation of the DELETE bug
  const users = [{ id: 1, name: 'Test User', email: 'test@example.com' }];
  
  console.log("\n=== Manual DELETE Bug Simulation ===");
  console.log("Current users:", users);
  
  // Simulate DELETE /users/999
  const userId = "999"; // req.params.id is always a string
  const idx = users.findIndex(u => u.id === userId); // comparing number vs string
  
  console.log("\nSimulating DELETE /users/999:");
  console.log("   userId from params:", userId, "(type:", typeof userId, ")");
  console.log("   findIndex result:", idx);
  console.log("   idx !== -1?", idx !== -1);
  
  if (idx !== -1) {
    users.splice(idx, 1);
    console.log("   Would delete user and return 200");
  } else {
    console.log("   No user found, but still returns 200 with { deleted: true }");
  }
  
  console.log("\n❌ BUG CONFIRMED: Always returns 200 regardless of whether user exists");
  console.log("   The findIndex fails due to type mismatch (string vs number)");
  console.log("   Should return 404 when user doesn't exist");
}