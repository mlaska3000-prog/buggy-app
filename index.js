const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { body, param, query, validationResult } = require("express-validator");

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});
app.use(limiter);

// CORS configuration (restrictive)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "localhost");
  res.header("Access-Control-Allow-Methods", "GET,POST,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.use(express.json({ limit: '10mb' }));
const users = [];

// Validation middleware
const validateUser = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be 1-100 characters')
    .trim()
    .escape(),
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .isLength({ max: 254 })
    .withMessage('Email too long')
    .normalizeEmail()
];

const validateUserId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
    .toInt()
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000')
    .toInt(),
  query('perPage')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('perPage must be between 1 and 100')
    .toInt()
];

// Error handling middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
  }
  next();
};

app.post("/users", validateUser, handleValidationErrors, (req, res) => {
  const { name, email } = req.body;
  const user = { id: users.length + 1, name, email };
  users.push(user);
  res.status(201).json(user);
});
app.get("/users/:id", validateUserId, handleValidationErrors, (req, res) => {
  const id = req.params.id; // Already converted to int by validator
  const user = users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(user);
});

app.get("/users", validatePagination, handleValidationErrors, (req, res) => {
  const page = req.query.page || 1;
  const perPage = req.query.perPage || 10;
  const start = (page - 1) * perPage;
  const result = users.slice(start, start + parseInt(perPage));
  res.json({ 
    users: result, 
    total: users.length, 
    page: parseInt(page),
    perPage: parseInt(perPage),
    totalPages: Math.ceil(users.length / perPage)
  });
});

app.delete("/users/:id", validateUserId, handleValidationErrors, (req, res) => {
  const id = req.params.id; // Already converted to int by validator
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "User not found" });
  }
  users.splice(idx, 1);
  res.json({ deleted: true, id });
});
module.exports = app;
// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '127.0.0.1';
  
  app.listen(port, host, () => {
    console.log(`Server running securely on http://${host}:${port}`);
  });
}