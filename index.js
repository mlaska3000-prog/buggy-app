const express = require("express");
const app = express();

// Enhanced body parsing with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

const users = [];

// Enhanced email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Enhanced name validation (letters, spaces, hyphens, apostrophes)
const NAME_REGEX = /^[a-zA-Z\s'-]+$/;

// Input sanitization helper
function sanitizeString(input) {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>]/g, ''); // Basic XSS prevention
}

// Validation helper functions
function validateName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: "Name is required and must be a string" };
  }
  
  const sanitized = sanitizeString(name);
  if (sanitized.length === 0) {
    return { valid: false, error: "Name cannot be empty" };
  }
  
  if (sanitized.length > 100) {
    return { valid: false, error: "Name must be 100 characters or less" };
  }
  
  if (!NAME_REGEX.test(sanitized)) {
    return { valid: false, error: "Name can only contain letters, spaces, hyphens, and apostrophes" };
  }
  
  return { valid: true, value: sanitized };
}

function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: "Email is required and must be a string" };
  }
  
  const sanitized = sanitizeString(email).toLowerCase();
  if (sanitized.length === 0) {
    return { valid: false, error: "Email cannot be empty" };
  }
  
  if (sanitized.length > 254) {
    return { valid: false, error: "Email must be 254 characters or less" };
  }
  
  if (!EMAIL_REGEX.test(sanitized)) {
    return { valid: false, error: "Email must be a valid email address" };
  }
  
  // Check for duplicate
  if (users.find(u => u.email === sanitized)) {
    return { valid: false, error: "User with this email already exists" };
  }
  
  return { valid: true, value: sanitized };
}

function validateUserId(id) {
  const numId = parseInt(id);
  if (isNaN(numId) || numId <= 0 || numId > Number.MAX_SAFE_INTEGER) {
    return { valid: false, error: "User ID must be a valid positive integer" };
  }
  return { valid: true, value: numId };
}

function validatePaginationParams(page, perPage) {
  const pageNum = parseInt(page) || 1;
  const perPageNum = parseInt(perPage) || 10;
  
  if (pageNum < 1 || pageNum > 10000) {
    return { valid: false, error: "Page must be between 1 and 10000" };
  }
  
  if (perPageNum < 1 || perPageNum > 100) {
    return { valid: false, error: "Per page must be between 1 and 100" };
  }
  
  return { valid: true, page: pageNum, perPage: perPageNum };
}

app.post("/users", (req, res) => {
  // Check content type
  if (!req.is('application/json')) {
    return res.status(400).json({ error: "Content-Type must be application/json" });
  }
  
  const { name, email } = req.body;
  
  // Validate name
  const nameValidation = validateName(name);
  if (!nameValidation.valid) {
    return res.status(400).json({ error: nameValidation.error });
  }
  
  // Validate email
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    return res.status(400).json({ error: emailValidation.error });
  }
  
  const user = { 
    id: users.length + 1, 
    name: nameValidation.value, 
    email: emailValidation.value 
  };
  users.push(user);
  res.status(201).json(user);
});

app.get("/users/:id", (req, res) => {
  const idValidation = validateUserId(req.params.id);
  if (!idValidation.valid) {
    return res.status(400).json({ error: idValidation.error });
  }
  
  const user = users.find(u => u.id === idValidation.value);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(user);
});

app.get("/users", (req, res) => {
  const paginationValidation = validatePaginationParams(req.query.page, req.query.perPage);
  if (!paginationValidation.valid) {
    return res.status(400).json({ error: paginationValidation.error });
  }
  
  const { page, perPage } = paginationValidation;
  const start = (page - 1) * perPage;
  const result = users.slice(start, start + perPage);
  
  res.json({ 
    users: result, 
    total: users.length, 
    page: page, 
    perPage: perPage,
    totalPages: Math.ceil(users.length / perPage)
  });
});

app.delete("/users/:id", (req, res) => {
  const idValidation = validateUserId(req.params.id);
  if (!idValidation.valid) {
    return res.status(400).json({ error: idValidation.error });
  }
  
  const idx = users.findIndex(u => u.id === idValidation.value);
  if (idx === -1) {
    return res.status(404).json({ error: "User not found" });
  }
  
  const deletedUser = users.splice(idx, 1)[0];
  res.json({ deleted: true, user: deletedUser });
});

// 404 handler for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }
  
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: "Request payload too large" });
  }
  
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;
if (require.main === module) {
  const host = '127.0.0.1';
  const port = process.env.PORT || 3000;
  
  app.listen(port, host, () => {
    console.log(`Server running securely on http://${host}:${port}`);
  });
}