const express = require("express");
const app = express();
app.use(express.json());
const users = [];

// POST /users - create new user
app.post("/users", (req, res) => {
  const { name, email } = req.body;
  
  // Input validation (Security fix for issue #27)
  if (!name || typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ error: "Name is required" });
  }
  if (!email || typeof email !== "string" || email.trim() === "") {
    return res.status(400).json({ error: "Email is required" });
  }
  
  const user = { id: users.length + 1, name: name.trim(), email: email.trim() };
  users.push(user);
  res.json(user);
});

// GET /users/:id - get single user (must be BEFORE /users to avoid route conflict)
app.get("/users/:id", (req, res) => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(user);
});

// DELETE /users/:id - delete user
app.delete("/users/:id", (req, res) => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) {
    return res.status(404).json({ error: "User not found" });
  }
  users.splice(idx, 1);
  res.json({ deleted: true });
});

// GET /users - list users with pagination (fixed for issue #20)
app.get("/users", (req, res) => {
  // Support both limit/offset and page/perPage for backward compatibility
  let limit = parseInt(req.query.limit || req.query.perPage || 10, 10);
  let offset = parseInt(req.query.offset || ((req.query.page || 1) - 1) * limit, 10);
  
  // Ensure valid values
  limit = Math.max(1, Math.min(limit, 100)); // Cap at 100
  offset = Math.max(0, offset);
  
  const result = users.slice(offset, offset + limit);
  res.json({ 
    users: result, 
    total: users.length,
    limit: limit,
    offset: offset,
    hasMore: offset + limit < users.length
  });
});

module.exports = app;
if (require.main === module) {
  // Security fix: bind to localhost only (issue #27)
  app.listen(3000, "127.0.0.1");
}
