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
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Stricter rate limiting for user creation
const createUserLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 user creations per windowMs
  message: { error: "Too many user creation attempts, please try again later." },
});

app.use(express.json({ limit: '10mb' })); // Add request size limit
const users = [];

// Validation middleware
const validateUserInput = [
  body('name')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be a string between 1-100 characters')
    .escape(), // Prevent XSS
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email must be a valid email address')
    .isLength({ max: 255 })
    .withMessage('Email must be less than 255 characters'),
];

const validateUserId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
    .toInt(),
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be a positive integer (max 1000)')
    .toInt(),
  query('perPage')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('PerPage must be between 1-100')
    .toInt(),
];

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: "Validation failed", 
      details: errors.array().map(err => err.msg)
    });
  }
  next();
};

app.post("/users", createUserLimiter, validateUserInput, handleValidationErrors, (req, res) => {
  const { name, email } = req.body;
  
  // Check for duplicate email
  if (users.some(user => user.email === email)) {
    return res.status(409).json({ error: "Email already exists" });
  }
  
  const user = { 
    id: users.length + 1, 
    name: name, 
    email: email 
  };
  users.push(user);
  res.status(201).json(user);
});

app.get("/users/:id", validateUserId, handleValidationErrors, (req, res) => {
  const id = req.params.id; // Already converted to int by validation
  const user = users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(user);
});

app.get("/users", validatePagination, handleValidationErrors, (req, res) => {
  const page = req.query.page || 1; // Already converted to int by validation
  const perPage = req.query.perPage || 10; // Already converted to int by validation
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

app.delete("/users/:id", validateUserId, handleValidationErrors, (req, res) => {
  const id = req.params.id; // Already converted to int by validation
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "User not found" });
  }
  const deletedUser = users.splice(idx, 1)[0];
  res.json({ deleted: true, user: { id: deletedUser.id, name: deletedUser.name } });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

module.exports = app;
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';
  
  app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on http://${HOST}:${PORT}`);
    console.log(`🔒 Security features: Helmet, CORS, Rate limiting, Input validation`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}
