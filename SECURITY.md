# Security Features

This document outlines the security measures implemented in this application.

## Implemented Security Features

### 1. Input Validation
- POST /users: Uses express-validator for name and email validation
- Route parameters: User ID validated as positive integer
- Query parameters: Pagination validated with min/max limits

### 2. Network Security
- Server binds to localhost (127.0.0.1) by default
- Can be configured via HOST environment variable
- CORS configured with whitelist for allowed origins

### 3. Type Safety
- Route parameters (id) are converted to integers before comparison
- Query parameters (page, perPage) are parsed as integers

### 4. Additional Security
- Helmet.js for security headers
- Rate limiting (100 requests per 15 minutes)
- Body size limits (10mb)
- Error handling that doesn't leak sensitive information

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| HOST | 127.0.0.1 | Server binding address |
| NODE_ENV | development | Environment (production enables extra security) |
