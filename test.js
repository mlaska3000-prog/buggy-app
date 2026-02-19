const assert = require("assert");
const http = require("http");

const app = require("./index.js");

// Test for GET /ping endpoint
function testPing() {
  const req = new http.IncomingMessage();
  req.method = "GET";
  req.url = "/ping";
  req.headers = {};
  req.httpVersion = "1.1";
  req.socket = { remoteAddress: "127.0.0.1" };

  const res = new http.ServerResponse(req);
  res._write = res.write;
  res.write = (chunk) => {
    const data = JSON.parse(chunk.toString());
    assert.strictEqual(data.pong, true, "Response should have pong: true");
  };
  res.statusCode = null;
  res.send = res.send || res.end;
  res.end = (chunk) => {
    assert.strictEqual(res.statusCode, 200, "Status should be 200");
  };
  
  // Use supertest-like approach with actual HTTP server
}

const server = app.listen(0, () => {
  const port = server.address().port;
  let testsCompleted = 0;
  const totalTests = 2;
  
  function checkComplete() {
    testsCompleted++;
    if (testsCompleted === totalTests) {
      console.log("All tests passed!");
      server.close();
      process.exit(0);
    }
  }
  
  // Test GET /ping
  http.get(`http://127.0.0.1:${port}/ping`, (res) => {
    let data = "";
    res.on("data", (chunk) => data += chunk);
    res.on("end", () => {
      try {
        const json = JSON.parse(data);
        assert.strictEqual(res.statusCode, 200, "Status should be 200");
        assert.deepStrictEqual(json, { pong: true }, "Response should be exactly { pong: true }");
        console.log("✓ GET /ping returns HTTP 200");
        console.log("✓ GET /ping returns { pong: true }");
        checkComplete();
      } catch (e) {
        console.error("Test failed:", e.message);
        server.close();
        process.exit(1);
      }
    });
  });
  
  // Test GET /time
  http.get(`http://127.0.0.1:${port}/time`, (res) => {
    let data = "";
    res.on("data", (chunk) => data += chunk);
    res.on("end", () => {
      try {
        const json = JSON.parse(data);
        assert.strictEqual(res.statusCode, 200, "Status should be 200");
        assert.ok(json.iso, "Response should contain iso field");
        assert.ok(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(json.iso), "iso should be ISO 8601 format");
        assert.ok(typeof json.epoch === "number" && json.epoch > 0, "epoch should be a positive number");
        console.log("✓ GET /time returns HTTP 200");
        console.log("✓ GET /time returns iso field (ISO 8601 format)");
        console.log("✓ GET /time returns epoch field (positive number)");
        checkComplete();
      } catch (e) {
        console.error("Test failed:", e.message);
        server.close();
        process.exit(1);
      }
    });
  });
});
