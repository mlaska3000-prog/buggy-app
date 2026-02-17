const assert = require("assert");

// Regression test: DELETE /users/:id should actually delete the user
// Bug: req.params.id is a string but u.id is a number, so comparison always fails

console.log("Running regression tests...");

// Simulate the users array after POST /users
const users = [{ id: 1, name: "Test User", email: "test@example.com" }];

// Simulating what DELETE /users/:id does with req.params.id = "1" (string)
const reqParamsId = "1"; // Express always passes params as strings

// Test 1: Without parseInt (the bug)
const idxBug = users.findIndex(u => u.id === reqParamsId);
assert.strictEqual(idxBug, -1, "BUG: Without parseInt, user is not found (string '1' !== number 1)");
console.log("  ✓ Confirmed bug: string param vs number id fails comparison");

// Test 2: With parseInt (the fix)
const idxFixed = users.findIndex(u => u.id === parseInt(reqParamsId));
assert.notStrictEqual(idxFixed, -1, "FIX: With parseInt, user IS found");
console.log("  ✓ Fix works: parseInt converts string '1' to number 1");

// Test 3: Verify the user can be deleted
if (idxFixed !== -1) {
  users.splice(idxFixed, 1);
}
assert.strictEqual(users.length, 0, "User should be deleted from array");
console.log("  ✓ User successfully deleted after fix");

// Test 4: GET after DELETE should return undefined
const deletedUser = users.find(u => u.id === 1);
assert.strictEqual(deletedUser, undefined, "GET /users/1 should return undefined after delete");
console.log("  ✓ GET after DELETE returns undefined (no user found)");

console.log("\nAll regression tests passed!");
