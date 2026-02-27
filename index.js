const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { body, param, query, validationResult } = require("express-validator");

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration with whitelist
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001', // For development/testing
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  }
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// Body parsing middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const users = [];

// Input validation middleware
const validateUserInput = [
  body('name')
    .isString()
    .withMessage('Name must be a string')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z\s\-'\.]+$/)
    .withMessage('Name contains invalid characters'),
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters'),
];

const validateUserId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('perPage')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('PerPage must be between 1 and 100')
];

// Error handling middleware for validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

app.post("/users", validateUserInput, handleValidationErrors, (req, res) => {
  const { name, email } = req.body;
  
  // Check for duplicate email
  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(409).json({ 
      error: "User with this email already exists",
      field: "email"
    });
  }
  
  const user = { 
    id: users.length + 1, 
    name: name.trim(), 
    email: email.toLowerCase().trim(),
    createdAt: new Date().toISOString()
  };
  users.push(user);
  res.status(201).json(user);
});

app.get("/users/:id", validateUserId, handleValidationErrors, (req, res) => {
  const id = parseInt(req.params.id);
  const user = users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ 
      error: "User not found",
      id: id
    });
  }
  res.json(user);
});

app.get("/users", validatePagination, handleValidationErrors, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = Math.min(parseInt(req.query.perPage) || 10, 100);
  const start = (page - 1) * perPage;
  const result = users.slice(start, start + perPage);
  
  res.json({ 
    users: result, 
    pagination: {
      total: users.length,
      page: page,
      perPage: perPage,
      totalPages: Math.ceil(users.length / perPage)
    }
  });
});

app.delete("/users/:id", validateUserId, handleValidationErrors, (req, res) => {
  const id = parseInt(req.params.id);
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) {
    return res.status(404).json({ 
      error: "User not found",
      id: id
    });
  }
  const deletedUser = users.splice(idx, 1)[0];
  res.json({ 
    deleted: true,
    user: deletedUser
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS policy violation' });
  }
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  res.status(500).json({ 
    error: 'Internal server error',
    ...(isDevelopment && { details: err.message })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    method: req.method,
    path: req.path
  });
});

module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '127.0.0.1';
  
  app.listen(port, host, () => {
    console.log(`Server running on http://${host}:${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}
