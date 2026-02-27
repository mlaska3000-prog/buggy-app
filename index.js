const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const { body, param, query, validationResult } = require("express-validator");

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Stricter rate limiting for user creation
const createUserLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 user creations per windowMs
  message: {
    error: "Too many user creation attempts, please try again later."
  }
});

// Body parsing with size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

const users = [];

// Validation middleware
const userValidation = [
  body('name')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be a string between 1 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, apostrophes, and hyphens'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('Email must be a valid email address')
];

const userIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be a positive integer between 1 and 1000'),
  query('perPage')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Per page must be a positive integer between 1 and 100')
];

// Error handling middleware for validation
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

app.post("/users", createUserLimiter, userValidation, handleValidationErrors, (req, res) => {
  const { name, email } = req.body;
  
  // Check for duplicate email
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(409).json({ error: "User with this email already exists" });
  }
  
  const user = { 
    id: users.length + 1, 
    name: name.trim(), 
    email: email.toLowerCase() 
  };
  users.push(user);
  res.status(201).json(user);
});

app.get("/users/:id", userIdValidation, handleValidationErrors, (req, res) => {
  const id = parseInt(req.params.id);
  const user = users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(user);
});

app.get("/users", paginationValidation, handleValidationErrors, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = Math.min(parseInt(req.query.perPage) || 10, 100);
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

app.delete("/users/:id", userIdValidation, handleValidationErrors, (req, res) => {
  const id = parseInt(req.params.id);
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "User not found" });
  }
  const deletedUser = users.splice(idx, 1)[0];
  res.json({ deleted: true, user: deletedUser });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
if (require.main === module) {
  const host = process.env.NODE_ENV === 'production' ? '127.0.0.1' : '127.0.0.1';
  const port = process.env.PORT || 3000;
  
  app.listen(port, host, () => {
    console.log(`Server running on http://${host}:${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}