const express = require("express");
const app = express();
app.use(express.json());
const users = [];

// Listen for test events (for test suite)
app.on("test:addUser", (user) => {
  users.push(user);
});

// Input validation helper
function validateUserInput(name, email) {
  const errors = [];
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    errors.push("name is required and must be a non-empty string");
  }
  if (!email || typeof email !== "string" || email.trim().length === 0) {
    errors.push("email is required and must be a non-empty string");
  }
  // Basic email format check
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("email must be a valid email address");
  }
  return errors;
}

app.post("/users", (req, res) => {
  const errors = validateUserInput(req.body.name, req.body.email);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(", ") });
  }
  const user = { id: users.length + 1, name: req.body.name.trim(), email: req.body.email.trim() };
  users.push(user);
  res.json(user);
});

app.get("/users/:id", (req, res) => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "invalid id" });
  }
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "user not found" });
  }
  res.json(user);
});

app.get("/users", (req, res) => {
  // Validate and cap limit (1-100), default 10
  let limit = parseInt(req.query.limit, 10) || 10;
  limit = Math.max(1, Math.min(100, limit));
  
  // Validate and cap offset (minimum 0), default 0
  let offset = parseInt(req.query.offset, 10) || 0;
  offset = Math.max(0, offset);
  
  // Convert 1-based offset to 0-based array index
  const arrayOffset = offset > 0 ? offset - 1 : 0;
  const result = users.slice(arrayOffset, arrayOffset + limit);
  res.json({ users: result, total: users.length, limit, offset });
});

app.delete("/users/:id", (req, res) => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "invalid id" });
  }
  const idx = users.findIndex(u => u.id === userId);
  if (idx !== -1) users.splice(idx, 1);
  res.json({ deleted: true });
});

module.exports = app;
if (require.main === module) app.listen(3000, "127.0.0.1");