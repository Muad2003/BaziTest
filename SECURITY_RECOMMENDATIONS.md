# รายงานความปลอดภัยและข้อแนะนำ

## ปัญหาความปลอดภัยที่พบและแก้ไขแล้ว

### 1. ✅ SQL Injection Prevention
**ปัญหา:** การใช้ object update โดยตรงใน query อาจเสี่ยงต่อ SQL injection
**แก้ไข:** 
- สร้าง parameterized queries ด้วยการใช้ placeholders (?)
- Validate ทุก input ก่อนส่งเข้า database
- ใช้ prepared statements เสมอ

### 2. ✅ Input Validation & Sanitization
**ปัญหา:** ไม่มีการตรวจสอบ input อย่างละเอียด
**แก้ไข:**
- เพิ่ม validation functions สำหรับทุก input type
- Sanitize strings ก่อนบันทึกหรือแสดงผล
- จำกัดความยาวของ input เพื่อป้องกัน DOS
- Validate format ของ email, phone, date, time

### 3. ✅ Authentication & Authorization
**ปัญหา:** ไม่มี middleware ตรวจสอบ authentication
**แก้ไข:**
- เพิ่ม bcrypt salt rounds จาก 10 เป็น 12
- ใช้ generic error messages เพื่อป้องกัน user enumeration
- Validate password strength (ต้องมีตัวเลขและตัวอักษร อย่างน้อย 8 ตัว)

### 4. ✅ Transaction Management
**ปัญหา:** ไม่มีการใช้ transactions สำหรับ operations ที่เกี่ยวข้องหลายตาราง
**แก้ไข:**
- ใช้ database transactions สำหรับ register, editProfile, useCoupon, createPromotion
- Rollback เมื่อเกิด error เพื่อรักษา data integrity

### 5. ✅ Error Handling
**ปัญหา:** Error messages ไม่ชัดเจนและอาจ expose sensitive information
**แก้ไข:**
- Log errors ใน server-side แต่ส่ง generic messages ให้ client
- ใช้ HTTP status codes ที่เหมาะสม
- แยก error types (validation, not found, server error)

### 6. ✅ API Security
**ปัญหา:** การเรียก external APIs ไม่มี timeout และ error handling ที่ดี
**แก้ไข:**
- เพิ่ม timeout สำหรับทุก API calls
- Validate API responses ก่อนใช้งาน
- ใช้ try-catch เพื่อจัดการ API failures

### 7. ✅ Coupon Code Generation
**ปัญหา:** ใช้ UUID.slice() ซึ่งอาจไม่ unique พอ
**แก้ไข:**
- ใช้ crypto.randomBytes() + timestamp
- สร้าง code ที่ยาวและ unique มากขึ้น

### 8. ✅ JSON Handling
**ปัญหา:** JSON.parse() โดยไม่มี error handling
**แก้ไข:**
- ใช้ try-catch ทุกครั้งที่ parse JSON
- Validate JSON structure ก่อนใช้งาน

## สิ่งที่ยังต้องทำเพิ่มเติม

### 🔴 Priority 1 (สำคัญมาก)

#### 1. เพิ่ม Authentication Middleware
```javascript
// middleware/auth.js
export const authenticateUser = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: "Authentication required" });
        }
        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
};
```

#### 2. ใช้ JWT สำหรับ Session Management
```javascript
import jwt from 'jsonwebtoken';

// ใน login controller
const token = jwt.sign(
    { restaurant_id: checkLogin[0].id, email: sanitizedEmail },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
);
```

#### 3. Rate Limiting
```javascript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: "Too many login attempts, please try again later"
});

// Apply to routes
app.post('/api/auth/login', loginLimiter, login);
```

#### 4. CORS Configuration
```javascript
import cors from 'cors';

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 🟡 Priority 2 (สำคัญ)

#### 5. Request Validation Middleware
```javascript
import { body, validationResult } from 'express-validator';

export const validateRegister = [
    body('lineUid').notEmpty().isLength({ max: 100 }),
    body('email').isEmail().normalizeEmail(),
    body('phone').matches(/^[0-9]{9,10}$/),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];
```

#### 6. Audit Logging
```javascript
const auditLog = async (userId, action, details) => {
    await db.query(
        'INSERT INTO audit_logs (user_id, action, details, ip_address, created_at) VALUES (?, ?, ?, ?, NOW())',
        [userId, action, JSON.stringify(details), req.ip]
    );
};
```

#### 7. Data Encryption
```javascript
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const encryptSensitiveData = (text) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(process.env.ENCRYPTION_KEY, 'hex'), iv);
    // ... encryption logic
};
```

### 🟢 Priority 3 (แนะนำ)

#### 8. Database Connection Pool
```javascript
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
```

#### 9. Environment Variables Validation
```javascript
const requiredEnvVars = [
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'JWT_SECRET',
    'BAZI_API_KEY',
    'GROQ_API_KEY'
];

requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        throw new Error(`Missing required environment variable: ${varName}`);
    }
});
```

#### 10. Security Headers
```javascript
import helmet from 'helmet';

app.use(helmet());
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
    }
}));
```

## Environment Variables ที่ต้องเพิ่ม

```env
# Database
DB_HOST=localhost
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_database

# Security
JWT_SECRET=your-strong-random-secret-key
ENCRYPTION_KEY=your-32-byte-hex-key

# External APIs
BAZI_API_KEY=your_bazi_api_key
GROQ_API_KEY=your_groq_api_key

# App
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
```

## Checklist สำหรับ Production

- [ ] เปิดใช้ HTTPS เท่านั้น
- [ ] ตั้งค่า Rate Limiting
- [ ] เพิ่ม Authentication Middleware
- [ ] ใช้ JWT สำหรับ sessions
- [ ] เปิดใช้ CORS แบบจำกัด
- [ ] ใช้ Helmet.js สำหรับ security headers
- [ ] เพิ่ม Request validation middleware
- [ ] ตั้งค่า Audit logging
- [ ] Encrypt sensitive data
- [ ] ตั้งค่า Database connection pool
- [ ] Validate environment variables
- [ ] ใช้ process manager (PM2)
- [ ] ตั้งค่า Monitoring และ Alerts
- [ ] Regular security updates
- [ ] Backup database regularly

## แนะนำ Libraries เพิ่มเติม

```json
{
  "dependencies": {
    "jsonwebtoken": "^9.0.0",
    "express-rate-limit": "^7.0.0",
    "helmet": "^7.0.0",
    "express-validator": "^7.0.0",
    "winston": "^3.11.0",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5"
  }
}
