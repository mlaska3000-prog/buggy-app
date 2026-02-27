const express = require("express");
const app = express();
app.use(express.json());
const users = [];

// Input validation helper
function validateUser(req, res, next) {
  const { name, email } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required and must be a non-empty string' });
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Email is required and must contain @' });
  }
  next();
}

app.post("/users", validateUser, (req, res) => {
  const user = { id: users.length + 1, name: req.body.name.trim(), email: req.body.email.trim() };
  users.push(user);
  res.json(user);
});

app.get("/users/:id", (req, res) => {
  // Fix: Convert string param to number
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID must be a valid number' });
  }
  const user = users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

app.get("/users", (req, res) => {
  // Fix: Convert string params to numbers and add proper defaults
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10)); // Cap at 100
  const offset = parseInt(req.query.offset) || 0;
  
  // Support both limit/offset and page/limit patterns
  const start = req.query.offset !== undefined ? offset : (page - 1) * limit;
  const result = users.slice(start, start + limit);
  
  res.json({ 
    users: result, 
    total: users.length, 
    page: page,
    limit: limit,
    offset: start
  });
});

app.delete("/users/:id", (req, res) => {
  // Fix: Convert string param to number
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID must be a valid number' });
  }
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  users.splice(idx, 1);
  res.json({ deleted: true });
});

module.exports = app;

// Fix: Bind to localhost only for security
if (require.main === module) {
  app.listen(3000, '127.0.0.1', () => {
    console.log('Server running on http://127.0.0.1:3000');
  });
}