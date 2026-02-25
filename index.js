const express = require("express");
const app = express();
app.use(express.json());
const users = [];
app.get("/ping", (req, res) => {
  res.json({ pong: true });
});

app.get("/time", (req, res) => {
  res.json({ iso: new Date().toISOString(), epoch: Date.now() });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), memory: process.memoryUsage().heapUsed });
});
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
  // Support both limit/offset and page/perPage (backward compatibility)
  let limit = parseInt(req.query.limit) || parseInt(req.query.perPage) || 10;
  let offset = parseInt(req.query.offset) || 0;
  
  // If page is provided (legacy), calculate offset from it
  if (req.query.page && !req.query.offset) {
    const page = parseInt(req.query.page) || 1;
    offset = (page - 1) * limit;
  }
  
  // Ensure positive values
  limit = Math.max(1, limit);
  offset = Math.max(0, offset);
  
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