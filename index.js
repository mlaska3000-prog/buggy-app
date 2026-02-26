const express = require("express");
const app = express();
app.use(express.json());
const users = [];

// Input validation helper
function validateUserInput(body) {
  const errors = [];
  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
    errors.push('name is required and must be a non-empty string');
  }
  if (!body.email || typeof body.email !== 'string' || body.email.trim() === '') {
    errors.push('email is required and must be a non-empty string');
  }
  // Basic email format validation
  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.push('email must be a valid email format');
  }
  return errors;
}

app.post("/users", (req, res) => {
  const errors = validateUserInput(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') });
  }
  const user = { id: users.length + 1, name: req.body.name.trim(), email: req.body.email.trim() };
  users.push(user);
  res.json(user);
});

// GET /users must come BEFORE /users/:id to avoid route conflicts
app.get("/users", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 10;
  const start = (page - 1) * perPage;
  const result = users.slice(start, start + perPage);
  res.json({ users: result, total: users.length, page: page, perPage: perPage });
});

app.get("/users/:id", (req, res) => {
  const userId = parseInt(req.params.id);
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

app.delete("/users/:id", (req, res) => {
  const userId = parseInt(req.params.id);
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  users.splice(idx, 1);
  res.json({ deleted: true });
});

module.exports = app;
if (require.main === module) app.listen(3000, '127.0.0.1');
