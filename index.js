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
  const limit = Math.min(parseInt(req.query.limit) || 10, 100);
  const offset = Math.max(parseInt(req.query.offset) || 0, 0);
  const result = users.slice(offset, offset + limit);
  res.json({ users: result, total: users.length, limit, offset });
});
app.delete("/users/:id", (req, res) => {
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx !== -1) users.splice(idx, 1);
  res.json({ deleted: true });
});
module.exports = app;
if (require.main === module) app.listen(3000);