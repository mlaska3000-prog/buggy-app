const http = require("http");
const app = require("./index.js");

// Regression test for user ID type mismatch bug
// Bug: GET /users/:id and DELETE /users/:id use strict equality (===) 
// comparing number user.id with string req.params.id, causing all lookups to fail

let server;
let baseURL;

async function runTests() {
  return new Promise((resolve, reject) => {
    server = app.listen(0, () => {
      baseURL = `http://localhost:${server.address().port}`;
      resolve();
    });
  });
}

async function createUser(name, email) {
  return new Promise((resolve, reject) => {
    const req = http.request(`${baseURL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(JSON.parse(data)));
    });
    req.write(JSON.stringify({ name, email }));
    req.end();
  });
}

async function getUser(id) {
  return new Promise((resolve, reject) => {
    http.get(`${baseURL}/users/${id}`, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(data ? JSON.parse(data) : undefined));
    });
  });
}

async function deleteUser(id) {
  return new Promise((resolve, reject) => {
    const req = http.request(`${baseURL}/users/${id}`, { method: "DELETE" }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(JSON.parse(data)));
    });
    req.end();
  });
}

async function clearUsers() {
  // Get all users and delete them
  return new Promise((resolve) => {
    http.get(`${baseURL}/users`, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", async () => {
        const result = JSON.parse(data);
        for (const user of result.users) {
          await deleteUser(user.id);
        }
        resolve();
      });
    });
  });
}

async function run() {
  let passed = 0;
  let failed = 0;

  try {
    await runTests();
    console.log("Server started on", baseURL);

    // Clear any existing users
    await clearUsers();

    // Test 1: GET /users/:id should return user when id is passed as string number
    console.log("\nTest 1: GET /users/:id with string number id...");
    const user1 = await createUser("Alice", "alice@test.com");
    const fetchedUser1 = await getUser(String(user1.id));
    if (fetchedUser1 && fetchedUser1.id === user1.id && fetchedUser1.name === "Alice") {
      console.log("  ✓ PASSED");
      passed++;
    } else {
      console.log("  ✗ FAILED - user not found or incorrect");
      failed++;
    }

    // Clear for next test
    await clearUsers();

    // Test 2: GET /users/:id should return user when id has leading zeros
    console.log("\nTest 2: GET /users/:id with leading zeros...");
    const user2 = await createUser("Bob", "bob@test.com");
    const fetchedUser2 = await getUser("0" + user2.id);
    if (fetchedUser2 && fetchedUser2.id === user2.id && fetchedUser2.name === "Bob") {
      console.log("  ✓ PASSED");
      passed++;
    } else {
      console.log("  ✗ FAILED - user not found with leading zero id");
      failed++;
    }

    // Clear for next test
    await clearUsers();

    // Test 3: DELETE /users/:id should delete user when id is passed as string
    console.log("\nTest 3: DELETE /users/:id with string id...");
    const user3 = await createUser("Charlie", "charlie@test.com");
    const deleteResult = await deleteUser(String(user3.id));
    if (deleteResult.deleted) {
      // Verify deleted
      const deletedUser = await getUser(user3.id);
      if (!deletedUser) {
        console.log("  ✓ PASSED");
        passed++;
      } else {
        console.log("  ✗ FAILED - user still exists after delete");
        failed++;
      }
    } else {
      console.log("  ✗ FAILED - delete returned deleted: false");
      failed++;
    }

    console.log(`\n=============================`);
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log(`=============================`);

    server.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error("Test error:", err);
    if (server) server.close();
    process.exit(1);
  }
}

run();
