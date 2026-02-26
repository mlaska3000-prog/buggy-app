const express = require("express");
const app = express();
app.use(express.json());
const users = [];

// Input validation helpers
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && emailRegex.test(email);
};

const isValidName = (name) => {
  return typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 100;
};

const isValidId = (id) => {
  const num = parseInt(id, 10);
  return !isNaN(num) && num > 0 && String(num) === String(id);
};

app.post("/users", (req, res) => {
  const { name, email } = req.body;
  
  // Input validation
  if (!isValidName(name)) {
    return res.status(400).json({ error: "Invalid name: must be a non-empty string (max 100 chars)" });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid email: must be a valid email address" });
  }
  
  const user = { id: users.length + 1, name: name.trim(), email: email.trim().toLowerCase() };
  users.push(user);
  res.status(201).json(user);
});

app.get("/users/:id", (req, res) => {
  // Validate and convert id to number
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ error: "Invalid id: must be a positive integer" });
  }
  const userId = parseInt(req.params.id, 10);
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(user);
});

app.get("/users", (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const perPage = parseInt(req.query.perPage, 10) || 10;
  const limit = Math.min(parseInt(req.query.limit, 10) || perPage, 100);
  const offset = Math.max(parseInt(req.query.offset, 10) || (page - 1) * perPage, 0);
  
  const result = users.slice(offset, offset + limit);
  res.json({ users: result, total: users.length, page, perPage: limit });
});

app.delete("/users/:id", (req, res) => {
  // Validate and convert id to number
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ error: "Invalid id: must be a positive integer" });
  }
  const userId = parseInt(req.params.id, 10);
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) {
    return res.status(404).json({ error: "User not found" });
  }
  users.splice(idx, 1);
  res.json({ deleted: true });
});

module.exports = app;
if (require.main === module) app.listen(3000, '127.0.0.1');
