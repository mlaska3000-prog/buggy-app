const express = require("express");
const app = express();
app.use(express.json());
const users = [];
app.post("/users", (req, res) => {
  // Input validation
  const { name, email } = req.body;
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'name is required and must be a non-empty string' });
  }
  if (!email || typeof email !== 'string' || email.trim() === '') {
    return res.status(400).json({ error: 'email is required and must be a non-empty string' });
  }
  const user = { id: users.length + 1, name: name.trim(), email: email.trim() };
  users.push(user);
  res.json(user);
});
app.get("/users/:id", (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id, 10));
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});
app.get("/users", (req, res) => {
  // Pagination with limit/offset (issue #20)
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
  const result = users.slice(offset, offset + limit);
  res.json({ users: result, total: users.length, limit, offset });
});
app.delete("/users/:id", (req, res) => {
  const idx = users.findIndex(u => u.id === parseInt(req.params.id, 10));
  if (idx === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  users.splice(idx, 1);
  res.json({ deleted: true });
});
module.exports = app;
if (require.main === module) app.listen(3000, '127.0.0.1');