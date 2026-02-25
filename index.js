const express = require("express");
const app = express();
app.use(express.json());
const users = [];
app.post("/users", (req, res) => {
  const { name, email } = req.body;
  if (!name || typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ error: "name is required" });
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "valid email is required" });
  }
  const user = { id: users.length + 1, name: name.trim(), email: email.trim() };
  users.push(user);
  res.json(user);
});
app.get("/users/:id", (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
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
  const idx = users.findIndex(u => u.id === parseInt(req.params.id));
  if (idx !== -1) users.splice(idx, 1);
  res.json({ deleted: true });
});
module.exports = app;
if (require.main === module) app.listen(3000, "127.0.0.1");