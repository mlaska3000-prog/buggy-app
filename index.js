const express = require("express");
const app = express();
app.use(express.json());
const users = [];

// POST /users - Create user with validation
app.post("/users", (req, res) => {
  const { name, email } = req.body;
  
  // Input validation
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({ error: "Name is required and must be a non-empty string" });
  }
  if (!email || typeof email !== "string" || email.trim().length === 0) {
    return res.status(400).json({ error: "Email is required and must be a non-empty string" });
  }
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ error: "Invalid email format" });
  }
  
  const user = { id: users.length + 1, name: name.trim(), email: email.trim() };
  users.push(user);
  res.status(201).json(user);
});

// GET /users - List users with pagination (must be before /users/:id)
app.get("/users", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 10;
  const start = (page - 1) * perPage;
  const result = users.slice(start, start + perPage);
  res.json({ users: result, total: users.length, page, perPage });
});

// GET /users/:id - Get single user (must be after /users)
app.get("/users/:id", (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid user ID - must be a number" });
  }
  const user = users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(user);
});

// DELETE /users/:id - Delete user
app.delete("/users/:id", (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid user ID - must be a number" });
  }
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "User not found" });
  }
  users.splice(idx, 1);
  res.json({ deleted: true });
});

module.exports = app;
if (require.main === module) {
  // Bind to localhost only for security
  app.listen(3000, '127.0.0.1', () => {
    console.log('Server running on http://127.0.0.1:3000');
  });
}
