const express = require("express");
const app = express();
app.use(express.json());

// Validation helper functions
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && emailRegex.test(email);
};

const isValidName = (name) => {
  return typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 100;
};

const isValidUserId = (id) => {
  const num = parseInt(id);
  return Number.isInteger(num) && num > 0;
};

const users = [];

app.post("/users", (req, res) => {
  const { name, email } = req.body;
  
  // Input validation
  if (!isValidName(name)) {
    return res.status(400).json({ error: "Name is required and must be 1-100 characters" });
  }
  
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Valid email is required" });
  }
  
  const user = { id: users.length + 1, name: name.trim(), email: email.trim() };
  users.push(user);
  res.json(user);
});

app.get("/users/:id", (req, res) => {
  // Convert string param to number and validate
  if (!isValidUserId(req.params.id)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }
  
  const userId = parseInt(req.params.id);
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  
  res.json(user);
});

app.get("/users", (req, res) => {
  // Convert query params to numbers and validate
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 10;
  
  // Validate pagination parameters
  if (page < 1 || perPage < 1 || perPage > 100) {
    return res.status(400).json({ error: "Invalid pagination parameters (page >= 1, perPage 1-100)" });
  }
  
  const start = (page - 1) * perPage;
  const result = users.slice(start, start + perPage);
  res.json({ users: result, total: users.length, page: page, perPage: perPage });
});

app.delete("/users/:id", (req, res) => {
  // Convert string param to number and validate
  if (!isValidUserId(req.params.id)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }
  
  const userId = parseInt(req.params.id);
  const idx = users.findIndex(u => u.id === userId);
  
  if (idx === -1) {
    return res.status(404).json({ error: "User not found" });
  }
  
  users.splice(idx, 1);
  res.json({ deleted: true });
});

module.exports = app;

// Bind to localhost only for security (not all interfaces)
if (require.main === module) {
  app.listen(3000, '127.0.0.1', () => {
    console.log('Server running on http://127.0.0.1:3000');
  });
}