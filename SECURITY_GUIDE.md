# Security Implementation Guide

## Overview
This API has been secured with multiple layers of protection to ensure data integrity, prevent attacks, and maintain reliable service.

---

## Security Features Implemented

### 1. Input Validation & Sanitization
- **express-validator** validates all incoming requests
- Type checking, length limits, and format validation
- SQL injection prevention through parameterized queries
- XSS protection through input sanitization

**Example:**
```javascript
body("email").trim().isEmail().normalizeEmail()
body("phone").matches(/^[0-9]{9,15}$/)
```

### 2. Rate Limiting
Three tiers of rate limiting protect against abuse:

| Endpoint Type | Window | Max Requests | Purpose |
|--------------|--------|--------------|---------|
| Global | 15 min | 100 | General API protection |
| Auth endpoints | 15 min | 20 | Prevent brute force |
| AI/Prediction | 1 hour | 10 | Expensive operations |

### 3. Security Headers (Helmet)
- **Content Security Policy (CSP)** - Prevents XSS attacks
- **HTTP Strict Transport Security (HSTS)** - Forces HTTPS
- **X-Frame-Options** - Prevents clickjacking
- **X-Content-Type-Options** - Prevents MIME sniffing

### 4. CORS Protection
- Whitelist-based origin validation
- Configurable allowed origins via environment variables
- Credential support for authenticated requests
- Method and header restrictions

### 5. Database Security
- **Connection pooling** with limits (max 10 connections)
- **Parameterized queries** prevent SQL injection
- **Transaction support** for data consistency
- **Error handling** prevents information leakage
- **Connection monitoring** detects failures

### 6. Password Security
- **bcrypt hashing** with 12 salt rounds
- Passwords never stored in plain text
- Timing-safe comparison prevents timing attacks
- Minimum 8-character requirement

### 7. Error Handling
- **Structured error responses** don't leak sensitive data
- **Production mode** hides stack traces
- **Error logging** for debugging
- **HTTP status codes** follow REST standards

### 8. API Response Security
- Sensitive data excluded from responses (passwords, tokens)
- Consistent error message format
- No database error details exposed to clients

---

## Security Best Practices

### Environment Variables
Never commit `.env` files. Always use `.env.example` as a template.

```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Database Security
1. Use strong passwords for database users
2. Limit database user permissions (no DROP, ALTER in production)
3. Enable SSL/TLS for database connections in production
4. Regular backups with encryption

### API Keys
1. Rotate API keys regularly (every 90 days)
2. Use different keys for development/production
3. Monitor API key usage for anomalies
4. Revoke compromised keys immediately

### HTTPS
Always use HTTPS in production:
```javascript
// Add to server.js for production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`)
    } else {
      next()
    }
  })
}
```

---

## Known Vulnerabilities & Mitigation

### 1. Bazi API Dependency
**Risk:** Third-party API unavailable or compromised
**Mitigation:** 
- Timeout set to 10 seconds
- Error handling returns safe fallback
- No sensitive user data sent to API

### 2. Groq AI API
**Risk:** Rate limits, costs, or service outages
**Mitigation:**
- Strict rate limiting (10 requests/hour)
- Caching predictions for 24 hours
- Timeout protection

### 3. JSON Parsing
**Risk:** Malformed JSON in database causes crashes
**Mitigation:**
- Try-catch blocks around all JSON.parse()
- Validation before storage
- Type checking after retrieval

---

## Security Checklist for Production

- [ ] Change all default passwords and secrets
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS/TLS
- [ ] Configure firewall (allow only ports 80, 443)
- [ ] Set up database SSL/TLS
- [ ] Enable database access restrictions by IP
- [ ] Configure CORS with production domains only
- [ ] Set up logging and monitoring
- [ ] Enable automated backups
- [ ] Implement JWT authentication
- [ ] Add API key authentication for restaurant endpoints
- [ ] Set up Web Application Firewall (WAF)
- [ ] Regular security audits
- [ ] Keep dependencies updated

---

## Monitoring & Alerts

### Recommended Monitoring
1. **Rate limit hits** - Track blocked requests
2. **Failed authentication attempts** - Detect brute force
3. **Database connection errors** - Infrastructure issues
4. **API response times** - Performance degradation
5. **Error rates** - Application stability

### Log Examples
```javascript
// All errors are logged with context
console.error("[ERROR]", {
  message: err.message,
  method: req.method,
  url: req.url,
  ip: req.ip,
  timestamp: new Date().toISOString()
})
```

---

## Testing Security

### Test Rate Limiting
```bash
# Send 25 requests quickly (should see 429 after 20)
for i in {1..25}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test"}'
done
```

### Test SQL Injection (Should fail safely)
```bash
curl -X POST http://localhost:3000/api/restaurant/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"' OR '1'='1"}'
```

### Test XSS (Should be sanitized)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"<script>alert(1)</script>", ...}'
```

---

## Incident Response

If a security breach occurs:

1. **Immediate**: Disable affected endpoints or take API offline
2. **Assess**: Check logs to determine scope of breach
3. **Contain**: Revoke compromised credentials/API keys
4. **Notify**: Inform affected users if data was exposed
5. **Patch**: Fix vulnerability and test thoroughly
6. **Review**: Update security practices and monitoring

---

## Updates & Maintenance

### Dependency Updates
```bash
# Check for security vulnerabilities
npm audit

# Update packages
npm update

# Fix critical vulnerabilities
npm audit fix
```

### Regular Security Reviews
- Monthly: Review logs for suspicious activity
- Quarterly: Update dependencies and rotate secrets
- Annually: Full security audit and penetration testing

---

## Contact

For security issues, please report to: [your-security-email@example.com]

**DO NOT** post security vulnerabilities in public issues.
