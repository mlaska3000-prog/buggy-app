const express = require("express");
const app = express();
app.use(express.json());
const users = [];
app.post("/users", (req, res) => {
  const { name, email } = req.body;
  if (!name || typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ error: "Name is required and must be a non-empty string" });
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Email is required and must be a valid email" });
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
  const page = parseInt(req.query.page, 10) || 1;
  const perPage = parseInt(req.query.perPage, 10) || 10;
  const start = (page - 1) * perPage;
  const result = users.slice(start, start + perPage);
  res.json({ users: result, total: users.length, page: page });
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
if (require.main === module) app.listen(3000, '127.0.0.1');