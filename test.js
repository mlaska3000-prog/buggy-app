const assert = require("assert");
const request = require("supertest");
const app = require("./index.js");

// Tests for health endpoint
describe("GET /health", function() {
  it("should return HTTP 200 status", async function() {
    const res = await request(app).get("/health");
    assert.strictEqual(res.status, 200);
  });

  it("should return JSON with status ok", async function() {
    const res = await request(app).get("/health");
    assert.strictEqual(res.body.status, "ok");
  });

  it("should return uptime as a number", async function() {
    const res = await request(app).get("/health");
    assert.strictEqual(typeof res.body.uptime, "number");
    assert.ok(res.body.uptime >= 0);
  });
});

// Bug 1: GET /users/:id - id comparison is string vs number (will always return undefined)
// Bug 2: DELETE /users/:id - same string vs number comparison
// Bug 3: Pagination - page/perPage are strings, math will be wrong