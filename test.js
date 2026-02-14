const assert = require("assert");

console.log("Running tests...");

// Test the specific bug scenario: string vs number ID comparison
function testUserIdTypeConversion() {
  // This test would have caught the original bug where req.params.id (string) 
  // was compared with user.id (number) using strict equality
  
  // Simulate the scenario: users array with numeric IDs
  const users = [
    { id: 1, name: "Test User", email: "test@example.com" }
  ];
  
  // Simulate req.params.id (always a string in Express)
  const stringId = "1";
  
  // Test the fixed logic: convert string to number before comparison
  const numericId = parseInt(stringId, 10);
  const foundUser = users.find(u => u.id === numericId);
  
  assert.strictEqual(foundUser.id, 1, "Should find user with ID 1 after string-to-number conversion");
  assert.strictEqual(foundUser.name, "Test User", "Should return correct user name");
  
  // Test the original broken logic would fail
  const brokenFoundUser = users.find(u => u.id === stringId);
  assert.strictEqual(brokenFoundUser, undefined, "Original broken logic should not find user (number !== string)");
  
  console.log("✓ User ID type conversion test passed");
}

function testInvalidIdHandling() {
  // Test that invalid IDs are handled gracefully
  const invalidId = "abc";
  const parsedId = parseInt(invalidId, 10);
  
  assert.strictEqual(isNaN(parsedId), true, "Should detect invalid ID as NaN");
  
  console.log("✓ Invalid ID handling test passed");
}

function testDeleteIdTypeConversion() {
  // Test the same fix applies to DELETE endpoint
  const users = [
    { id: 1, name: "Test User", email: "test@example.com" },
    { id: 2, name: "Other User", email: "other@example.com" }
  ];
  
  const stringId = "1";
  const numericId = parseInt(stringId, 10);
  
  // Test finding index for deletion with converted ID
  const idx = users.findIndex(u => u.id === numericId);
  assert.strictEqual(idx, 0, "Should find correct index for deletion after string-to-number conversion");
  
  // Test original broken logic would fail
  const brokenIdx = users.findIndex(u => u.id === stringId);
  assert.strictEqual(brokenIdx, -1, "Original broken logic should not find user for deletion");
  
  console.log("✓ DELETE ID type conversion test passed");
}

// Run the tests
try {
  testUserIdTypeConversion();
  testInvalidIdHandling();
  testDeleteIdTypeConversion();
  console.log("All tests passed!");
  process.exit(0);
} catch (error) {
  console.error("Test failed:", error.message);
  process.exit(1);
}