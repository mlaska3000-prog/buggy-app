const express = require("express");
const app = express();
app.use(express.json());
const users = [];

// Input validation helper
function validateUser(user) {
  if (!user.name || typeof user.name !== 'string' || user.name.trim() === '') {
    return { valid: false, error: 'Name is required and must be a non-empty string' };
  }
  if (!user.email || typeof user.email !== 'string' || !user.email.includes('@')) {
    return { valid: false, error: 'Valid email is required' };
  }
  return { valid: true };
}

app.post("/users", (req, res) => {
  const validation = validateUser(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
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
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 10;
  
  // Validate pagination params
  if (page < 1) {
    return res.status(400).json({ error: 'Page must be >= 1' });
  }
  if (perPage < 1 || perPage > 100) {
    return res.status(400).json({ error: 'perPage must be between 1 and 100' });
  }
  
  const start = (page - 1) * perPage;
  const result = users.slice(start, start + perPage);
  res.json({ users: result, total: users.length, page: page, perPage: perPage });
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