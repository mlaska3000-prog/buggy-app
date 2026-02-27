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
  // Support both limit/offset and page/perPage patterns
  let limit, offset;
  
  if (req.query.limit !== undefined || req.query.offset !== undefined) {
    // Limit/offset pattern
    limit = parseInt(req.query.limit) || 10;
    offset = parseInt(req.query.offset) || 0;
  } else {
    // Page/perPage pattern (backward compatibility)
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;
    limit = perPage;
    offset = (page - 1) * perPage;
  }
  
  // Apply sensible defaults and limits
  limit = Math.min(Math.max(limit, 1), 100); // Between 1-100
  offset = Math.max(offset, 0); // Non-negative
  
  const result = users.slice(offset, offset + limit);
  
  res.json({ 
    users: result, 
    total: users.length, 
    limit: limit,
    offset: offset,
    // Include page info for backward compatibility
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