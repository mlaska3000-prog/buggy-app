const express = require("express");
const app = express();
app.use(express.json());
const users = [];

// Input validation helper
function isValidEmail(email) {
  return typeof email === "string" && email.includes("@") && email.length > 3;
}
function isValidName(name) {
  return typeof name === "string" && name.trim().length > 0;
}

app.post("/users", (req, res) => {
  const { name, email } = req.body;
  if (!isValidName(name)) {
    return res.status(400).json({ error: "Invalid name" });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }
  const user = { id: users.length + 1, name: name.trim(), email: email.trim() };
  users.push(user);
  res.json(user);
});

// GET /users must come BEFORE /users/:id to avoid route conflict
app.get("/users", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 10;
  const offset = parseInt(req.query.offset) || 0;
  const start = (page - 1) * perPage + offset;
  const result = users.slice(start, start + perPage);
  res.json({ users: result, total: users.length, page: page, perPage: perPage });
});

app.get("/users/:id", (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }
  const user = users.find(u => u.id === id);
  res.json(user);
});

app.delete("/users/:id", (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }
  const idx = users.findIndex(u => u.id === id);
  if (idx !== -1) users.splice(idx, 1);
  res.json({ deleted: true });
});

module.exports = app;
if (require.main === module) app.listen(3000, '127.0.0.1');