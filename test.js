const assert = require("assert");
const express = require("express");
const app = require("./index.js");

// Helper to make HTTP requests without external dependencies
function makeRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const req = {
      method,
      url: path,
      body: body || {},
      params: {},
      query: {},
      headers: { 'content-type': 'application/json' }
    };
    
    // Parse URL parameters and query string
    const [pathname, querystring] = path.split('?');
    if (querystring) {
      req.query = Object.fromEntries(new URLSearchParams(querystring));
    }
    
    // Parse path parameters (simple :id pattern)
    const pathMatch = pathname.match(/^\/users\/(.+)$/);
    if (pathMatch) {
      req.params.id = pathMatch[1];
    }
    
    const res = {
      json: (data) => resolve(data),
      status: (code) => ({ json: (data) => resolve({ statusCode: code, body: data }) })
    };
    
    // Find the matching route and execute it
    if (method === 'POST' && pathname === '/users') {
      app._router.stack.find(layer => layer.route && layer.route.path === '/users' && layer.route.methods.post).route.stack[0].handle(req, res);
    } else if (method === 'GET' && pathname === '/users') {
      app._router.stack.find(layer => layer.route && layer.route.path === '/users' && layer.route.methods.get).route.stack[0].handle(req, res);
    } else if (method === 'GET' && pathMatch) {
      app._router.stack.find(layer => layer.route && layer.route.path === '/users/:id' && layer.route.methods.get).route.stack[0].handle(req, res);
    } else if (method === 'DELETE' && pathMatch) {
      app._router.stack.find(layer => layer.route && layer.route.path === '/users/:id' && layer.route.methods.delete).route.stack[0].handle(req, res);
    } else {
      reject(new Error('Route not found'));
    }
  });
}

async function runTests() {
  console.log("Running regression tests for user API type conversion bugs...");
  
  // Test 1: Verify GET /users/:id works with string ID parameters
  console.log("Test 1: GET /users/:id should find user when ID is passed as string");
  
  // Create a user first
  const newUser = await makeRequest('POST', '/users', { name: 'John Doe', email: 'john@test.com' });
  assert.strictEqual(newUser.id, 1, 'Created user should have numeric ID 1');
  assert.strictEqual(newUser.name, 'John Doe', 'Created user should have correct name');
  
  // Try to fetch the user by ID (this would fail before the fix)
  const fetchedUser = await makeRequest('GET', '/users/1');
  assert.strictEqual(fetchedUser.id, 1, 'GET /users/1 should return user with ID 1');
  assert.strictEqual(fetchedUser.name, 'John Doe', 'GET /users/1 should return user with correct name');
  assert.notStrictEqual(fetchedUser, undefined, 'GET /users/1 should not return undefined');
  
  // Test 2: Verify DELETE /users/:id works with string ID parameters
  console.log("Test 2: DELETE /users/:id should delete user when ID is passed as string");
  
  // Create another user
  const userToDelete = await makeRequest('POST', '/users', { name: 'Jane Doe', email: 'jane@test.com' });
  assert.strictEqual(userToDelete.id, 2, 'Second user should have ID 2');
  
  // Delete the user (this would fail before the fix)
  const deleteResult = await makeRequest('DELETE', '/users/2');
  assert.strictEqual(deleteResult.deleted, true, 'DELETE should return success');
  
  // Verify user was actually deleted
  const deletedUser = await makeRequest('GET', '/users/2');
  assert.strictEqual(deletedUser, undefined, 'Deleted user should return undefined when fetched');
  
  // Test 3: Verify pagination works correctly with string query parameters
  console.log("Test 3: Pagination should work correctly with string page and perPage parameters");
  
  // Create multiple users for pagination test
  await makeRequest('POST', '/users', { name: 'User A', email: 'a@test.com' });
  await makeRequest('POST', '/users', { name: 'User B', email: 'b@test.com' });
  await makeRequest('POST', '/users', { name: 'User C', email: 'c@test.com' });
  
  // Test pagination with string parameters (would return wrong results before fix)
  const page1 = await makeRequest('GET', '/users?page=1&perPage=2');
  assert.strictEqual(page1.page, 1, 'Page number should be numeric 1, not string "1"');
  assert.strictEqual(page1.users.length, 2, 'First page should return 2 users');
  assert.strictEqual(page1.total, 4, 'Total should be 4 users (John still exists)');
  
  const page2 = await makeRequest('GET', '/users?page=2&perPage=2');
  assert.strictEqual(page2.page, 2, 'Page number should be numeric 2, not string "2"');
  assert.strictEqual(page2.users.length, 2, 'Second page should return 2 users');
  
  console.log("✅ All regression tests passed!");
  console.log("These tests verify the fixes for:");
  console.log("- GET /users/:id correctly converts string ID to number for comparison");
  console.log("- DELETE /users/:id correctly converts string ID to number for comparison");
  console.log("- Pagination correctly converts string page/perPage parameters to numbers");
}

// Simple test runner that works without external frameworks
runTests().then(() => {
  console.log("\n🎉 All tests completed successfully!");
  process.exit(0);
}).catch((error) => {
  console.error("\n❌ Test failed:", error.message);
  console.error(error.stack);
  process.exit(1);
});