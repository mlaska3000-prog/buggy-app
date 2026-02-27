const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const Joi = require("joi");

const app = express();

// Security middleware - helmet.js for comprehensive protection
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting - prevent DDoS and brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP",
    retryAfter: "15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS configuration - restrictive whitelist
app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  
  res.header("Access-Control-Allow-Methods", "GET,POST,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.header("Access-Control-Max-Age", "86400"); // 24 hours
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Body parsing with size limits
app.use(express.json({ 
  limit: '1mb',
  strict: true
}));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

const users = [];

// Joi validation schemas
const createUserSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .pattern(/^[a-zA-Z0-9\s\-_.]+$/)
    .required()
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 1 character',
      'string.max': 'Name must not exceed 100 characters',
      'string.pattern.base': 'Name contains invalid characters'
    }),
  email: Joi.string()
    .email()
    .max(254)
    .required()
    .messages({
      'string.email': 'Must be a valid email address',
      'string.max': 'Email must not exceed 254 characters'
    })
});

const userIdSchema = Joi.object({
  id: Joi.number()
    .integer()
    .min(1)
    .max(1000000)
    .required()
    .messages({
      'number.base': 'User ID must be a number',
      'number.integer': 'User ID must be an integer',
      'number.min': 'User ID must be at least 1',
      'number.max': 'User ID must not exceed 1000000'
    })
});

const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .default(1),
  perPage: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
});

// Validation middleware factory
const validateSchema = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = source === 'params' ? req.params : 
                  source === 'query' ? req.query : req.body;
    
    const { error, value } = schema.validate(data, { 
      abortEarly: false,
      stripUnknown: true 
    });
    
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    // Replace validated data
    if (source === 'params') {
      req.params = value;
    } else if (source === 'query') {
      req.query = value;
    } else {
      req.body = value;
    }
    
    next();
  };
};

// API Routes with comprehensive security

// POST /users - Create user with full validation
app.post("/users", 
  validateSchema(createUserSchema, 'body'),
  (req, res) => {
    const { name, email } = req.body;
    
    // Check for duplicate email
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(409).json({ 
        error: 'Email already exists',
        field: 'email'
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
  }
);

// GET /users/:id - Get single user with type-safe ID handling
app.get("/users/:id",
  validateSchema(userIdSchema, 'params'),
  (req, res) => {
    const id = req.params.id;
    const user = users.find(u => u.id === id);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        id: id
      });
    }
    
    res.json(user);
  }
);

// GET /users - Get users with secure pagination
app.get("/users",
  validateSchema(paginationSchema, 'query'),
  (req, res) => {
    const { page, perPage } = req.query;
    const start = (page - 1) * perPage;
    const end = start + perPage;
    
    const result = users.slice(start, end);
    const totalPages = Math.ceil(users.length / perPage);
    
    res.json({
      users: result,
      pagination: {
        total: users.length,
        page: page,
        perPage: perPage,
        totalPages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  }
);

// DELETE /users/:id - Delete user with proper error handling
app.delete("/users/:id",
  validateSchema(userIdSchema, 'params'),
  (req, res) => {
    const id = req.params.id;
    const idx = users.findIndex(u => u.id === id);
    
    if (idx === -1) {
      return res.status(404).json({ 
        error: 'User not found',
        id: id
      });
    }
    
    const deletedUser = users.splice(idx, 1)[0];
    res.json({ 
      deleted: true, 
      user: deletedUser
    });
  }
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    users: users.length
  });
});

// Global error handler - prevent information leakage
app.use((err, req, res, next) => {
  console.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });
  
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

module.exports = app;

// Server startup with secure configuration
if (require.main === module) {
  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '127.0.0.1';
  
  app.listen(port, host, () => {
    console.log(`🔒 Secure server running on http://${host}:${port}`);
    console.log(`🛡️  Security features: Helmet, Rate Limiting, CORS, Input Validation`);
    console.log(`📊 Endpoints: POST/GET/DELETE /users, GET /health`);
  });
}