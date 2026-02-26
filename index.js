const express = require("express");
const app = express();
app.use(express.json());
const users = [];

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

app.post("/users", (req, res) => {
  const { name, email } = req.body;
  
  if (!name || typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ error: "Valid name is required" });
  }
  if (!email || typeof email !== "string" || !validateEmail(email)) {
    return res.status(400).json({ error: "Valid email is required" });
  }
  
  const user = { id: users.length + 1, name: name.trim(), email: email.trim() };
  users.push(user);
  res.json(user);
});

app.get("/users/:id", (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id, 10));
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(user);
});

app.get("/users", (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const perPage = parseInt(req.query.perPage, 10) || 10;
  const start = (page - 1) * perPage;
  const result = users.slice(start, start + perPage);
  res.json({ users: result, total: users.length, page: page, perPage: perPage });
});

app.delete("/users/:id", (req, res) => {
  const idx = users.findIndex(u => u.id === parseInt(req.params.id, 10));
  if (idx === -1) {
    return res.status(404).json({ error: "User not found" });
  }
  users.splice(idx, 1);
  res.json({ deleted: true });
});

module.exports = app;
if (require.main === module) app.listen(3000, '127.0.0.1');
