const express = require("express");
const app = express();
app.use(express.json());
const users = [];

// Input validation helper
function validateUser(name, email) {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return "Name is required and must be a non-empty string";
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return "Email is required and must be a valid email address";
  }
  return null;
}

app.post("/users", (req, res) => {
  const { name, email } = req.body;
  
  // Validate input
  const validationError = validateUser(name, email);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }
  
  const user = { id: users.length + 1, name: name.trim(), email: email.trim() };
  users.push(user);
  res.json(user);
});

app.get("/users/:id", (req, res) => {
  // Convert string param to number and validate
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "ID must be a valid number" });
  }
  
  const user = users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(user);
});

app.get("/users", (req, res) => {
  // Convert and validate pagination params
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 10;
  
  if (page < 1 || perPage < 1 || perPage > 100) {
    return res.status(400).json({ error: "Invalid pagination parameters" });
  }
  
  const start = (page - 1) * perPage;
  const result = users.slice(start, start + perPage);
  res.json({ users: result, total: users.length, page: page, perPage: perPage });
});

app.delete("/users/:id", (req, res) => {
  // Convert string param to number and validate
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "ID must be a valid number" });
  }
  
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "User not found" });
  }
  
  users.splice(idx, 1);
  res.json({ deleted: true });
});

module.exports = app;
// Bind to localhost only for security
if (require.main === module) app.listen(3000, '127.0.0.1');