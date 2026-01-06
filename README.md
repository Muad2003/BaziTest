# Restaurant Bazi API

A secure REST API for managing restaurant operations with Thai astrology (Bazi) predictions and personalized menu recommendations.

## Features

- User registration with birth chart calculation
- Daily fortune predictions using AI
- Personalized menu recommendations based on favorable elements
- Promotion and coupon management
- Restaurant administration
- Multiple layers of security protection

---

## Tech Stack

- **Node.js** + **Express.js** - Backend framework
- **MySQL** - Database
- **bcrypt** - Password hashing
- **express-validator** - Input validation
- **helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **Groq AI** - Fortune predictions
- **Thailand Bazi API** - Birth chart calculations

---

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- MySQL 8+ installed and running
- API keys for Bazi and Groq services

### 2. Clone & Install

```bash
# Clone the repository
git clone <repository-url>
cd restaurant-bazi-api

# Install dependencies
npm install
```

### 3. Database Setup

```bash
# Create database
mysql -u root -p
CREATE DATABASE restaurant_bazi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# Run migration script (if you have one)
# mysql -u root -p restaurant_bazi_db < scripts/001_create_tables.sql
```

### 4. Environment Configuration

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your actual values
nano .env
```

**Required variables:**
```env
DATABASE_HOST=localhost
DATABASE_USER=your_user
DATABASE_PASS=your_password
DATABASE_NAME=restaurant_bazi_db
DATABASE_PORT=3306

BAZI_API_KEY=your_bazi_key
GROQ_API_KEY=your_groq_key

NODE_ENV=development
PORT=3000
ALLOWED_ORIGINS=http://localhost:3000
```

### 5. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will start at `http://localhost:3000`

---

## API Endpoints

### Authentication & User Management

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/auth/lineUIDCheck` | Check if LINE user exists | 20/15min |
| POST | `/api/auth/register` | Register new user | 20/15min |
| PUT | `/api/auth/editProfile` | Update user profile | 100/15min |
| POST | `/api/auth/prediction` | Get daily fortune | 10/hour |
| POST | `/api/auth/findmenu` | Get personalized menu | 100/15min |
| POST | `/api/auth/coupon/add` | Create coupon | 100/15min |
| POST | `/api/auth/coupon/use` | Use coupon | 100/15min |

### Restaurant Management

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/restaurant/login` | Restaurant login | 20/15min |
| POST | `/api/restaurant/edit` | Update restaurant info | 100/15min |
| POST | `/api/restaurant/menu` | Get menu list | 100/15min |
| POST | `/api/restaurant/add/menu` | Add new menu item | 100/15min |
| POST | `/api/restaurant/edit/menu` | Edit menu item | 100/15min |
| POST | `/api/restaurant/promotion/create` | Create promotion | 100/15min |
| GET | `/api/restaurant/promotionGroup/get/:id` | Get promotion | 100/15min |
| PUT | `/api/restaurant/promotionGroup/update` | Update promotion | 100/15min |
| DELETE | `/api/restaurant/promotionGroup/delete/:id` | Delete promotion | 100/15min |
| POST | `/api/restaurant/restaurantUser` | Get user statistics | 100/15min |

---

## Request Examples

### Register User

```bash
POST /api/auth/register
Content-Type: application/json

{
  "lineUid": "U1234567890abcdef",
  "restaurantId": 1,
  "name": "สมชาย ใจดี",
  "gender": "male",
  "phone": "0812345678",
  "birth_date": "1990-05-15",
  "birth_time": "14:30",
  "birth_place": "กรุงเทพมหานคร"
}
```

### Get Daily Prediction

```bash
POST /api/auth/prediction
Content-Type: application/json

{
  "user_id": 1
}
```

### Restaurant Login

```bash
POST /api/restaurant/login
Content-Type: application/json

{
  "email": "restaurant@example.com",
  "password": "securepassword123"
}
```

---

## Security Features

- **Input Validation** - All requests validated before processing
- **Rate Limiting** - Prevents abuse and DDoS attacks
- **SQL Injection Protection** - Parameterized queries only
- **XSS Protection** - Input sanitization
- **CORS** - Configurable origin whitelist
- **Helmet** - Security headers (CSP, HSTS, etc.)
- **Password Hashing** - bcrypt with 12 salt rounds
- **Error Handling** - Safe error messages in production

See [SECURITY_GUIDE.md](./SECURITY_GUIDE.md) for detailed security documentation.

---

## Error Responses

All errors follow this format:

```json
{
  "message": "Error description"
}
```

### Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication failed)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
- `503` - Service Unavailable (external API down)

---

## Development

### Project Structure

```
restaurant-bazi-api/
├── controllers/
│   ├── auth.js          # User authentication logic
│   └── restaurant.js    # Restaurant management logic
├── middleware/
│   ├── validation.js    # Input validation rules
│   ├── rateLimiter.js   # Rate limiting configs
│   └── errorHandler.js  # Error handling utilities
├── routes/
│   ├── auth.js          # User routes
│   └── restaurant.js    # Restaurant routes
├── lib/
│   ├── db.js            # Database connection
│   └── constants.js     # SQL queries
├── scripts/
│   └── 001_create_tables.sql  # Database schema
├── server.js            # Entry point
├── package.json
├── .env.example
├── README.md
└── SECURITY_GUIDE.md
```

### Adding New Endpoints

1. Add SQL query to `lib/constants.js`
2. Create controller function in `controllers/`
3. Add validation rules in `middleware/validation.js`
4. Register route in `routes/`
5. Test with rate limiting

---

## Testing

```bash
# Test server is running
curl http://localhost:3000/

# Test rate limiting
for i in {1..25}; do curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'; done
```

---

## Deployment

### Production Checklist

1. Set `NODE_ENV=production`
2. Use strong passwords and secrets
3. Enable HTTPS
4. Configure firewall
5. Set up database backups
6. Monitor logs and errors
7. Use process manager (PM2)

### PM2 Deployment

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name restaurant-api

# Auto-restart on system reboot
pm2 startup
pm2 save

# Monitor
pm2 monit
```

---

## Troubleshooting

### Database Connection Failed
- Check MySQL is running: `sudo systemctl status mysql`
- Verify credentials in `.env`
- Check firewall allows port 3306

### API Keys Not Working
- Verify keys are correct in `.env`
- Check API key quotas haven't been exceeded
- Test external APIs directly

### Rate Limit Issues
- Adjust limits in `middleware/rateLimiter.js`
- Check if legitimate traffic is being blocked
- Review logs for patterns

---

## License

ISC

## Support

For issues and questions, please open an issue in the repository.
