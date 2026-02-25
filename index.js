const express = require("express");
const app = express();
app.use(express.json());
const users = [];

// Input validation helper
function validateUserInput(body) {
  const errors = [];
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    errors.push('name is required and must be a non-empty string');
  }
  if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
    errors.push('email is required and must be a valid email');
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

app.get("/users/:id", (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  const user = users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

app.get("/users", (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 100);
  const offset = parseInt(req.query.offset) || 0;
  const result = users.slice(offset, offset + limit);
  res.json({ users: result, total: users.length, limit, offset });
});

app.delete("/users/:id", (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  users.splice(idx, 1);
  res.json({ deleted: true });
});

module.exports = app;
if (require.main === module) app.listen(3000, '127.0.0.1');