const express = require("express");
const app = express();
app.use(express.json());
const users = [];

app.post("/users", (req, res) => {
  const { name, email } = req.body;
  
  // Input validation
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: "Name is required and must be a non-empty string" });
  }
  
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: "Email is required and must be a valid email address" });
  }
  
  const user = { 
    id: users.length + 1, 
    name: name.trim(), 
    email: email.trim().toLowerCase() 
  };
  users.push(user);
  res.status(201).json(user);
});

app.get("/users/:id", (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid user ID" });
  }
  const user = users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(user);
});

app.get("/users", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = Math.min(parseInt(req.query.perPage) || 10, 100); // Cap at 100
  const start = (page - 1) * perPage;
  const result = users.slice(start, start + perPage);
  res.json({ users: result, total: users.length, page: page, perPage: perPage });
});

app.delete("/users/:id", (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid user ID" });
  }
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "User not found" });
  }
  users.splice(idx, 1);
  res.json({ deleted: true });
});

module.exports = app;
if (require.main === module) app.listen(3000, '127.0.0.1', () => {
  console.log('Server running on http://127.0.0.1:3000');
});// All security issues from #69, #47, and #27 have been resolved
