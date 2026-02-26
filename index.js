const express = require("express");
const app = express();
app.use(express.json());
const users = [];

// Input validation helper
function isValidUser(input) {
  return input && typeof input.name === 'string' && input.name.trim().length > 0 &&
         typeof input.email === 'string' && input.email.includes('@');
}

app.post("/users", (req, res) => {
  if (!isValidUser(req.body)) {
    return res.status(400).json({ error: "Invalid input: name and email are required" });
  }
  const user = { id: users.length + 1, name: req.body.name.trim(), email: req.body.email.trim() };
  users.push(user);
  res.json(user);
});

app.get("/users/:id", (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id, 10));
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

app.get("/users", (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = parseInt(req.query.offset, 10) || 0;
  const start = offset + (page - 1) * limit;
  const result = users.slice(start, start + limit);
  res.json({ users: result, total: users.length, page, limit, offset });
});

app.delete("/users/:id", (req, res) => {
  const idx = users.findIndex(u => u.id === parseInt(req.params.id, 10));
  if (idx === -1) return res.status(404).json({ error: "User not found" });
  users.splice(idx, 1);
  res.json({ deleted: true });
});

module.exports = app;
if (require.main === module) app.listen(3000, '127.0.0.1');
