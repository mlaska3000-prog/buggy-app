const assert = require("assert");
const http = require("http");

const app = require("./index.js");

// Helper to make HTTP requests
function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3000,
      path: path,
      method: method,
      headers: { "Content-Type": "application/json" }
    };
    
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  // Start server for testing
  const server = app.listen(3001);
  
  try {
    // Create a test user
    const createRes = await request("POST", "/users", { name: "Test User", email: "test@example.com" });
    assert.strictEqual(createRes.status, 200, "User creation should succeed");
    const userId = createRes.body.id;
    console.log(`Created user with id: ${userId}`);
    
    // Regression test: GET /users/:id with numeric id
    // Bug was: req.params.id is string "1", but user.id is number 1
    // So 1 === "1" returns false, causing undefined
    const getRes = await request("GET", `/users/${userId}`);
    assert.strictEqual(getRes.status, 200, "GET should return 200");
    assert.strictEqual(getRes.body.id, userId, "GET should return the correct user");
    assert.strictEqual(getRes.body.name, "Test User", "GET should return correct user data");
    console.log("REGRESSION TEST: GET /users/:id returns user object - PASSED");
    
    // Test invalid ID returns 400
    const invalidRes = await request("GET", "/users/invalid");
    assert.strictEqual(invalidRes.status, 400, "Invalid ID should return 400");
    console.log("REGRESSION TEST: Invalid ID returns 400 - PASSED");
    
    // Regression test: DELETE /users/:id 
    const deleteRes = await request("DELETE", `/users/${userId}`);
    assert.strictEqual(deleteRes.status, 200, "DELETE should return 200");
    console.log("REGRESSION TEST: DELETE /users/:id works - PASSED");
    
    // Verify user was deleted
    const afterDelete = await request("GET", `/users/${userId}`);
    assert.strictEqual(afterDelete.body, null, "User should be deleted");
    console.log("REGRESSION TEST: User actually deleted - PASSED");
    
    console.log("\nAll regression tests passed!");
  } finally {
    server.close();
  }
}

runTests().catch(err => {
  console.error("Tests failed:", err);
  process.exit(1);
});
