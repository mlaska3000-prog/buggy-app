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
  // Support both limit/offset and page/perPage pagination
  let limit, offset;
  
  if (req.query.limit !== undefined || req.query.offset !== undefined) {
    // limit/offset style (as requested in issue #20)
    limit = parseInt(req.query.limit) || 10;
    offset = parseInt(req.query.offset) || 0;
  } else {
    // page/perPage style (existing)
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;
    limit = perPage;
    offset = (page - 1) * perPage;
  }
  
  // Apply sensible limits to prevent resource exhaustion
  if (limit > 100) limit = 100;
  if (limit < 1) limit = 10;
  if (offset < 0) offset = 0;
  
  const result = users.slice(offset, offset + limit);
  
  // Return response with both pagination metadata styles
  res.json({ 
    users: result, 
    total: users.length,
    // limit/offset metadata
    limit: limit,
    offset: offset,
    // page/perPage metadata (for backward compatibility)
    page: Math.floor(offset / limit) + 1,
    perPage: limit
  });
});

app.delete("/users/:id", (req, res) => {
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx !== -1) users.splice(idx, 1);
  res.json({ deleted: true });
});

module.exports = app;
if (require.main === module) app.listen(3000);