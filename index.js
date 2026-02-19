const express = require("express");
const app = express();
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

const users = [];
app.post("/users", (req, res) => {
  const user = { id: users.length + 1, name: req.body.name, email: req.body.email };
  users.push(user);
  res.json(user);
});
app.get("/users/:id", (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(user);
});
app.get("/users", (req, res) => {
  const page = req.query.page || 1;
  const perPage = req.query.perPage || 10;
  const start = (page - 1) * perPage;
  const result = users.slice(start, start + perPage);
  res.json({ users: result, total: users.length, page: page });
});
app.delete("/users/:id", (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) {
    return res.status(404).json({ error: "User not found" });
  }
  users.splice(idx, 1);
  res.json({ deleted: true });
});
module.exports = app;
if (require.main === module) app.listen(3000);