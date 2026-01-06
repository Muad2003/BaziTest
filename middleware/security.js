import helmet from "helmet"
import rateLimit from "express-rate-limit"

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
})

// Global rate limiter - 100 requests per 15 minutes
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
})

// Auth rate limiter - stricter for login/register
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many authentication attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
})

// API rate limiter for external API calls
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { message: "Too many API requests, please slow down" },
  standardHeaders: true,
  legacyHeaders: false,
})

// Input sanitization middleware
export const sanitizeInput = (req, res, next) => {
  // Sanitize request body
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === "string") {
        req.body[key] = req.body[key].trim()
      }
    })
  }

  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      if (typeof req.query[key] === "string") {
        req.query[key] = req.query[key].trim()
      }
    })
  }

  next()
}

// Request logging for security audit
export const securityLogger = (req, res, next) => {
  const timestamp = new Date().toISOString()
  const method = req.method
  const url = req.originalUrl
  const ip = req.ip || req.connection.remoteAddress

  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`)

  next()
}
