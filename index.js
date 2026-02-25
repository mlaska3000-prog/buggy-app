const express = require("express");
const app = express();
app.use(express.json());
const users = [];

function isValidEmail(email) {
  return typeof email === "string" && email.includes("@") && email.length > 3;
}

function isValidName(name) {
  return typeof name === "string" && name.trim().length > 0;
}

app.post("/users", (req, res) => {
  const { name, email } = req.body;
  if (!isValidName(name)) {
    return res.status(400).json({ error: "Valid name is required" });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Valid email is required" });
  }
  const user = { id: users.length + 1, name: name.trim(), email: email.trim() };
  users.push(user);
  res.json(user);
});

app.get("/users/:id", (req, res) => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }
  const user = users.find(u => u.id === userId);
  res.json(user);
});

app.get("/users", (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
  const offset = Math.max(parseInt(req.query.offset) || 0, 0);
  const result = users.slice(offset, offset + limit);
  res.json({ users: result, total: users.length, limit, offset });
});

app.delete("/users/:id", (req, res) => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }
  const idx = users.findIndex(u => u.id === userId);
  if (idx !== -1) users.splice(idx, 1);
  res.json({ deleted: true });
});

module.exports = app;
if (require.main === module) app.listen(3000, "127.0.0.1");