# คู่มือการติดตั้งและใช้งาน

## ขั้นตอนการติดตั้ง

### 1. ติดตั้ง Dependencies

```bash
npm install mysql2 bcrypt axios dotenv express
```

### 2. ตั้งค่า Environment Variables

คัดลอกไฟล์ `.env.example` เป็น `.env` และแก้ไขค่าต่างๆ:

```bash
cp .env.example .env
```

แก้ไขค่าใน `.env`:
- `DB_HOST` - ที่อยู่ของ database server
- `DB_USER` - username สำหรับเข้าถึง database
- `DB_PASSWORD` - password สำหรับเข้าถึง database
- `DB_NAME` - ชื่อของ database
- `JWT_SECRET` - สร้าง secret key แบบสุ่ม (แนะนำใช้ `openssl rand -base64 32`)
- `BAZI_API_KEY` - API key จาก thailandfxwarrior.com
- `GROQ_API_KEY` - API key จาก Groq

### 3. สร้าง Database

สร้าง database ใหม่:

```sql
CREATE DATABASE restaurant_astrology CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. รัน Database Migration

ถ้าคุณใช้ v0, คุณสามารถรัน SQL script ได้โดยตรงจาก UI
หรือรันผ่าน MySQL client:

```bash
mysql -u your_user -p restaurant_astrology < scripts/001_create_tables.sql
```

### 5. สร้าง Restaurant Account แรก

เนื่องจากยังไม่มี registration endpoint สำหรับ restaurant, คุณต้องสร้าง account แรกด้วยตนเอง:

```sql
-- Replace with your actual email and hashed password
INSERT INTO restaurants (name, email, password) 
VALUES (
    'My Restaurant',
    'admin@restaurant.com',
    -- This is bcrypt hash of 'Password123' - CHANGE THIS!
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5Y0JvnBct1SvG'
);
```

หรือใช้ Node.js เพื่อสร้าง password hash:

```javascript
const bcrypt = require('bcrypt');
const password = 'YourPassword123';
bcrypt.hash(password, 12).then(hash => console.log(hash));
```

## โครงสร้างโปรเจค

```
├── controllers/
│   ├── auth.controller.js       # User authentication & profile
│   └── restaurant.controller.js # Restaurant & menu management
├── lib/
│   ├── db.js                    # Database connection pool
│   └── constants.js             # SQL query constants
├── scripts/
│   └── 001_create_tables.sql   # Database schema
├── .env                         # Environment variables (ไม่ commit)
├── .env.example                 # Template สำหรับ .env
├── SECURITY_RECOMMENDATIONS.md  # คำแนะนำด้านความปลอดภัย
└── SETUP_INSTRUCTIONS.md        # ไฟล์นี้
```

## การใช้งาน Controllers

### Authentication Controller (auth.controller.js)

**1. ตรวจสอบ LINE UID**
```javascript
POST /api/auth/line-check
Body: {
  "lineUid": "U1234567890abcdef",
  "restaurantId": 1
}
```

**2. ลงทะเบียนผู้ใช้ใหม่**
```javascript
POST /api/auth/register
Body: {
  "lineUid": "U1234567890abcdef",
  "name": "สมชาย ใจดี",
  "gender": "male",
  "phone": "0812345678",
  "birth_date": "1990-01-15",
  "birth_time": "08:30",
  "birth_place": "กรุงเทพมหานคร",
  "restaurantId": 1
}
```

**3. แก้ไขโปรไฟล์**
```javascript
PUT /api/auth/profile
Body: {
  "lineUid": "U1234567890abcdef",
  "restaurantId": 1,
  "name": "สมชาย ใจดี (แก้ไข)",
  "phone": "0898765432"
}
```

**4. ดูคำทำนายประจำวัน**
```javascript
POST /api/auth/prediction
Body: {
  "user_id": 1
}
```

**5. ค้นหาเมนูที่เหมาะกับธาตุ**
```javascript
POST /api/auth/menu
Body: {
  "user_id": 1
}
```

**6. สร้างคูปอง**
```javascript
POST /api/auth/coupon/create
Body: {
  "promotion_id": 1,
  "userId": 1
}
```

**7. ใช้คูปอง**
```javascript
POST /api/auth/coupon/use
Body: {
  "code": "PROMO-ABC123"
}
```

### Restaurant Controller (restaurant.controller.js)

**1. เข้าสู่ระบบ (Restaurant)**
```javascript
POST /api/restaurant/login
Body: {
  "email": "admin@restaurant.com",
  "password": "Password123"
}
```

**2. แก้ไขข้อมูลร้าน**
```javascript
PUT /api/restaurant/edit
Body: {
  "restaurant_id": 1,
  "name": "ร้านอาหารใหม่",
  "email": "new@restaurant.com",
  "password": "NewPassword123"
}
```

**3. ดูเมนู (แบบแบ่งหน้า)**
```javascript
POST /api/restaurant/menu
Body: {
  "restaurant_id": 1,
  "page": 1
}
```

**4. เพิ่มเมนูใหม่**
```javascript
POST /api/restaurant/menu/add
Body: {
  "restaurant_id": 1,
  "name": "ผัดไทย",
  "price": 60.00,
  "element": ["ไฟ", "ไม้"],
  "image_url": "https://example.com/padthai.jpg",
  "status": "AVAILABLE"
}
```

**5. แก้ไขเมนู**
```javascript
PUT /api/restaurant/menu/edit
Body: {
  "menuid": 1,
  "name": "ผัดไทยพิเศษ",
  "price": 80.00
}
```

**6. สร้างโปรโมชั่น**
```javascript
POST /api/restaurant/promotion/create
Body: {
  "element": ["ไฟ"],
  "description": "ลด 10% สำหรับเมนูธาตุไฟ",
  "discount_value": 10.00,
  "start_date": "2025-01-01",
  "end_date": "2025-01-31"
}
```

**7. ดูข้อมูลโปรโมชั่น**
```javascript
GET /api/restaurant/promotion/:group_id
```

**8. แก้ไขโปรโมชั่น**
```javascript
PUT /api/restaurant/promotion/update
Body: {
  "group_id": 1,
  "start_date": "2025-02-01",
  "end_date": "2025-02-28",
  "status": "AVAILABLE"
}
```

**9. ลบโปรโมชั่น**
```javascript
DELETE /api/restaurant/promotion/:group_id
```

**10. ดูรายชื่อลูกค้า**
```javascript
POST /api/restaurant/users
Body: {
  "restaurant_id": 1
}
```

## ธาตุที่รองรับ

ระบบรองรับธาตุทั้ง 5:
- `"ไฟ"` - ธาตุไฟ
- `"น้ำ"` - ธาตุน้ำ
- `"ไม้"` - ธาตุไม้
- `"ดิน"` - ธาตุดิน
- `"โลหะ"` - ธาตุโลหะ

## Status ที่ใช้ในระบบ

### Menu Status
- `AVAILABLE` - พร้อมให้บริการ
- `UNAVAILABLE` - ไม่พร้อมให้บริการชั่วคราว
- `OUT_OF_STOCK` - สินค้าหมด

### Promotion Status
- `AVAILABLE` - ใช้งานได้
- `EXPIRED` - หมดอายุ
- `DISABLED` - ปิดใช้งาน

### Coupon Status
- `UNUSED` - ยังไม่ได้ใช้
- `USED` - ใช้แล้ว
- `EXPIRED` - หมดอายุ

## การแก้ไขปัญหา

### Database Connection Error
- ตรวจสอบว่า MySQL server กำลังทำงาน
- ตรวจสอบ credentials ใน `.env`
- ตรวจสอบว่า database ถูกสร้างแล้ว

### Import Errors
- ตรวจสอบว่าไฟล์ `lib/db.js` และ `lib/constants.js` มีอยู่
- ตรวจสอบว่ามี `export default` ในไฟล์ทั้งสอง

### API Errors (Bazi/Groq)
- ตรวจสอบว่ามี API keys ที่ถูกต้องใน `.env`
- ตรวจสอบ internet connection
- ตรวจสอบ API rate limits

### Bcrypt Error
- ตรวจสอบว่าติดตั้ง `bcrypt` แล้ว: `npm install bcrypt`
- ถ้ายังมีปัญหาลองใช้: `npm rebuild bcrypt`

## ความปลอดภัย

อ่านเพิ่มเติมใน `SECURITY_RECOMMENDATIONS.md` เพื่อดูคำแนะนำด้านความปลอดภัยแบบละเอียด

**สิ่งสำคัญที่ต้องทำก่อน production:**
- เปลี่ยน JWT_SECRET เป็นค่าที่แข็งแกร่งและสุ่ม
- เปิดใช้ HTTPS
- ตั้งค่า Rate Limiting
- เพิ่ม Authentication Middleware
- ตั้งค่า CORS อย่างเหมาะสม
- Enable Audit Logging

## ติดต่อ & สนับสนุน

หากมีปัญหาหรือคำถาม สามารถ:
1. ตรวจสอบ error logs
2. อ่านเอกสารประกอบ
3. ตรวจสอบ API response messages

---

สร้างโดย v0 - Vercel's AI Assistant
