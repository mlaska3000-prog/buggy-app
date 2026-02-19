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
        server.close(() => {
          console.log("All tests passed!");
          process.exit(0);
        });
      } catch (e) {
        console.error("Test failed:", e.message);
        server.close();
        process.exit(1);
      }
    });
  });
});
