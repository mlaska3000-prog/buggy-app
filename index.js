const express = require("express");
const app = express();
app.use(express.json());
const users = [];

const validateUserInput = (name, email) => {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return 'Name is required and must be a non-empty string';
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return 'Valid email is required';
  }
  return null;
};

app.post("/users", (req, res) => {
  const validationError = validateUserInput(req.body.name, req.body.email);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }
  const user = { id: users.length + 1, name: req.body.name.trim(), email: req.body.email.trim() };
  users.push(user);
  res.json(user);
});
app.get("/users/:id", (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});
app.get("/users", (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 100);
  const offset = parseInt(req.query.offset) || 0;
  const result = users.slice(offset, offset + limit);
  res.json({ users: result, total: users.length, limit, offset });
});
app.delete("/users/:id", (req, res) => {
  const idx = users.findIndex(u => u.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  users.splice(idx, 1);
  res.json({ deleted: true });
});
module.exports = app;
if (require.main === module) app.listen(3000, '127.0.0.1');