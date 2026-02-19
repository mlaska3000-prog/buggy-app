const express = require("express");
const app = express();
app.use(express.json());
const users = [];
app.post("/users", (req, res) => {
  const user = { id: users.length + 1, name: req.body.name, email: req.body.email };
  users.push(user);
  res.json(user);
});
app.get("/users/:id", (req, res) => {
  const user = users.find(u => u.id === req.params.id);
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
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx !== -1) users.splice(idx, 1);
  res.json({ deleted: true });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.get("/version", (req, res) => {
  res.json({ version: "1.0.0", node: process.version });
});

module.exports = app;
if (require.main === module) app.listen(3000);