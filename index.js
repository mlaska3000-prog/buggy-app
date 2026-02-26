const express = require("express");
const app = express();
app.use(express.json());
const users = [];

// Input validation helper
function isValidUser(user) {
  return user && 
    typeof user.name === 'string' && 
    user.name.trim().length > 0 &&
    typeof user.email === 'string' && 
    user.email.includes('@');
}

app.post("/users", (req, res) => {
  const { name, email } = req.body;
  
  // Input validation
  if (!name || !email || typeof name !== 'string' || typeof email !== 'string') {
    return res.status(400).json({ error: 'name and email are required' });
  }
  if (name.trim().length === 0) {
    return res.status(400).json({ error: 'name cannot be empty' });
  }
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'valid email is required' });
  }
  
  const user = { id: users.length + 1, name: name.trim(), email: email.trim() };
  users.push(user);
  res.status(201).json(user);
});

app.get("/users/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }
  const user = users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'user not found' });
  }
  res.json(user);
});

app.get("/users", (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const perPage = parseInt(req.query.perPage, 10) || 10;
  const limit = parseInt(req.query.limit, 10) || perPage;
  const offset = parseInt(req.query.offset, 10) || (page - 1) * perPage;
  
  const result = users.slice(offset, offset + limit);
  res.json({ users: result, total: users.length, page, perPage: limit });
});

app.delete("/users/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'user not found' });
  }
  users.splice(idx, 1);
  res.json({ deleted: true });
});

module.exports = app;
if (require.main === module) app.listen(3000, '127.0.0.1');