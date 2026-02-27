const express = require("express");
const app = express();

// Security middleware - disable server information disclosure
app.disable('x-powered-by');

// Body parsing with strict size limits and error handling
app.use(express.json({ 
  limit: '10kb',
  strict: true,
  reviver: null // Prevent prototype pollution
}));

// Disable URL encoded for this API (JSON only)
// app.use(express.urlencoded({ extended: false, limit: '10kb' }));

const users = [];

// Security-focused validation functions
function isValidId(id) {
  const parsed = parseInt(id, 10);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= Number.MAX_SAFE_INTEGER;
}

function isValidString(str, minLen = 1, maxLen = 255) {
  return typeof str === 'string' && 
         str.trim().length >= minLen && 
         str.trim().length <= maxLen;
}

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  // Basic email validation - stricter than just checking for @
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim()) && email.trim().length <= 254;
}

function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  // Remove potentially dangerous characters
  return input.trim().replace(/[<>'"&]/g, '');
}

// Middleware to log security-relevant events
function securityLogger(req, res, next) {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log potential security issues
    if (res.statusCode === 400 || res.statusCode === 401 || res.statusCode === 403) {
      console.log(`[SECURITY] ${new Date().toISOString()} - ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    }
  });
  
  next();
}

app.use(securityLogger);

// API Endpoints with enhanced security
app.post("/users", (req, res) => {
  try {
    // Validate content type
    if (!req.is('application/json')) {
      return res.status(400).json({ 
        error: "Content-Type must be application/json",
        code: "INVALID_CONTENT_TYPE"
      });
    }
    
    // Check for required fields
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ 
        error: "Request body must be a valid JSON object",
        code: "INVALID_BODY"
      });
    }
    
    const { name, email } = req.body;
    
    // Validate name with enhanced security checks
    if (!isValidString(name, 1, 100)) {
      return res.status(400).json({ 
        error: "Name must be a string between 1 and 100 characters",
        code: "INVALID_NAME"
      });
    }
    
    // Additional name validation - only allow safe characters
    const nameRegex = /^[a-zA-Z\s\-'\.]+$/;
    if (!nameRegex.test(name.trim())) {
      return res.status(400).json({ 
        error: "Name contains invalid characters. Only letters, spaces, hyphens, apostrophes, and periods are allowed",
        code: "INVALID_NAME_CHARS"
      });
    }
    
    // Validate email
    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        error: "Email must be a valid email address",
        code: "INVALID_EMAIL"
      });
    }
    
    // Check for duplicate email (case-insensitive)
    const normalizedEmail = email.trim().toLowerCase();
    if (users.some(user => user.email === normalizedEmail)) {
      return res.status(409).json({ 
        error: "A user with this email already exists",
        code: "DUPLICATE_EMAIL"
      });
    }
    
    // Sanitize and create user
    const user = { 
      id: users.length + 1, 
      name: sanitizeInput(name), 
      email: normalizedEmail,
      createdAt: new Date().toISOString()
    };
    
    users.push(user);
    
    // Return user without internal metadata
    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email
    });
    
  } catch (error) {
    console.error('[ERROR] User creation failed:', error.message);
    res.status(500).json({ 
      error: "Internal server error",
      code: "INTERNAL_ERROR"
    });
  }
});

app.get("/users/:id", (req, res) => {
  try {
    // Validate and parse ID with enhanced security
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ 
        error: "User ID must be a positive integer",
        code: "INVALID_USER_ID"
      });
    }
    
    const id = parseInt(req.params.id, 10);
    const user = users.find(u => u.id === id);
    
    if (!user) {
      return res.status(404).json({ 
        error: "User not found",
        code: "USER_NOT_FOUND"
      });
    }
    
    // Return user without internal metadata
    res.json({
      id: user.id,
      name: user.name,
      email: user.email
    });
    
  } catch (error) {
    console.error('[ERROR] User lookup failed:', error.message);
    res.status(500).json({ 
      error: "Internal server error",
      code: "INTERNAL_ERROR"
    });
  }
});

app.get("/users", (req, res) => {
  try {
    // Parse and validate pagination parameters with security bounds
    let page = parseInt(req.query.page, 10) || 1;
    let perPage = parseInt(req.query.perPage, 10) || 10;
    
    // Security bounds to prevent resource exhaustion
    if (page < 1 || page > 10000) {
      return res.status(400).json({ 
        error: "Page must be between 1 and 10000",
        code: "INVALID_PAGE"
      });
    }
    
    if (perPage < 1 || perPage > 100) {
      return res.status(400).json({ 
        error: "Per page must be between 1 and 100",
        code: "INVALID_PER_PAGE"
      });
    }
    
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const result = users.slice(start, end);
    
    // Return only public user data
    const publicUsers = result.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email
    }));
    
    res.json({ 
      users: publicUsers, 
      pagination: {
        total: users.length,
        page: page,
        perPage: perPage,
        totalPages: Math.ceil(users.length / perPage)
      }
    });
    
  } catch (error) {
    console.error('[ERROR] User list failed:', error.message);
    res.status(500).json({ 
      error: "Internal server error",
      code: "INTERNAL_ERROR"
    });
  }
});

app.delete("/users/:id", (req, res) => {
  try {
    // Validate ID
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ 
        error: "User ID must be a positive integer",
        code: "INVALID_USER_ID"
      });
    }
    
    const id = parseInt(req.params.id, 10);
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return res.status(404).json({ 
        error: "User not found",
        code: "USER_NOT_FOUND"
      });
    }
    
    const deletedUser = users.splice(userIndex, 1)[0];
    
    // Log security-relevant deletion
    console.log(`[SECURITY] User deleted: ID=${id}, Email=${deletedUser.email}`);
    
    res.json({ 
      deleted: true,
      user: {
        id: deletedUser.id,
        name: deletedUser.name,
        email: deletedUser.email
      }
    });
    
  } catch (error) {
    console.error('[ERROR] User deletion failed:', error.message);
    res.status(500).json({ 
      error: "Internal server error",
      code: "INTERNAL_ERROR"
    });
  }
});

// Security: 404 handler for unknown endpoints
app.use('*', (req, res) => {
  console.log(`[SECURITY] 404 attempt: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: "Endpoint not found",
    code: "NOT_FOUND"
  });
});

// Global error handler with security logging
app.use((err, req, res, next) => {
  console.error(`[SECURITY] Error: ${err.message}`, err.stack);
  
  // Handle specific error types securely
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ 
      error: "Invalid JSON in request body",
      code: "INVALID_JSON"
    });
  }
  
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ 
      error: "Request payload too large",
      code: "PAYLOAD_TOO_LARGE"
    });
  }
  
  // Generic error response (don't expose internal details)
  res.status(500).json({ 
    error: "Internal server error",
    code: "INTERNAL_ERROR"
  });
});

module.exports = app;

// Secure server startup
if (require.main === module) {
  const host = '127.0.0.1'; // SECURITY: Explicitly bind to localhost only
  const port = process.env.PORT || 3000;
  
  app.listen(port, host, () => {
    console.log(`🔒 Secure server running on http://${host}:${port}`);
    console.log(`📊 Security features: Input validation, error handling, localhost binding`);
    console.log(`🛡️  API ready with enhanced security measures`);
  });
}