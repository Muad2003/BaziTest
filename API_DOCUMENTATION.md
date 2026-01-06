# API Documentation

Complete reference for all Restaurant Bazi API endpoints.

---

## Base URL

```
http://localhost:3000/api
```

---

## Authentication

Currently using simple authentication. JWT implementation recommended for production.

---

## User Endpoints

### 1. Check LINE UID

Check if a LINE user is registered in the system.

**Endpoint:** `POST /auth/lineUIDCheck`

**Rate Limit:** 20 requests per 15 minutes

**Request Body:**
```json
{
  "lineUid": "U1234567890abcdef",
  "restaurantId": 1
}
```

**Success Response (New User):**
```json
{
  "action": "Register"
}
```

**Success Response (Existing User):**
```json
{
  "action": "LOGIN",
  "user": {
    "id": 1,
    "line_uid": "U1234567890abcdef",
    "name": "สมชาย ใจดี"
  },
  "bazi": {
    "main_element": "ไฟ",
    "favorable_elements": ["ไม้", "ไฟ"]
  }
}
```

**Error Responses:**
- `400` - Missing required fields
- `404` - Restaurant not found
- `500` - Server error

---

### 2. Register User

Register a new user with birth chart calculation.

**Endpoint:** `POST /auth/register`

**Rate Limit:** 20 requests per 15 minutes

**Request Body:**
```json
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

**Validation Rules:**
- `name`: 2-100 characters
- `gender`: "male", "female", or "other"
- `phone`: 9-15 digits
- `birth_date`: YYYY-MM-DD format
- `birth_time`: HH:MM format (24-hour)

**Success Response:**
```json
{
  "action": "LOGIN",
  "user": {
    "id": 5,
    "name": "สมชาย ใจดี",
    "line_uid": "U1234567890abcdef"
  },
  "bazi": {
    "main_element": "ไฟ",
    "favorable_elements": ["ไม้", "ไฟ"],
    "unfavorable_elements": ["น้ำ"]
  }
}
```

**Error Responses:**
- `400` - Validation error
- `404` - Restaurant not found
- `409` - User already registered
- `503` - Bazi service unavailable
- `502` - Invalid Bazi response

---

### 3. Edit Profile

Update user profile information.

**Endpoint:** `PUT /auth/editProfile`

**Request Body:**
```json
{
  "lineUid": "U1234567890abcdef",
  "restaurantId": 1,
  "name": "สมชาย ใจดีมาก",
  "phone": "0898765432",
  "birth_date": "1990-05-16"
}
```

**Note:** If birth information changes, Bazi will be recalculated.

**Success Response:**
```json
{
  "message": "Profile updated",
  "bazi_recalculated": true,
  "bazi": {
    "main_element": "ดิน",
    "favorable_elements": ["ทอง", "น้ำ"],
    "unfavorable_elements": ["ไม้"]
  }
}
```

---

### 4. Get Daily Prediction

Get AI-generated daily fortune prediction.

**Endpoint:** `POST /auth/prediction`

**Rate Limit:** 10 requests per hour (strict)

**Request Body:**
```json
{
  "user_id": 1
}
```

**Success Response:**
```json
{
  "message": "วันนี้ดัชนีโชคชะตาของคุณอยู่ในระดับดี สีมงคลที่เหมาะสมคือ สีแดงและสีส้ม เพราะเข้ากับธาตุไฟของคุณ การงานราบรื่น การเงินมีโอกาสเพิ่มพูน และความรักอบอุ่น"
}
```

**Note:** Predictions are cached for 24 hours per user.

---

### 5. Find Recommended Menu

Get menu items that match user's favorable elements.

**Endpoint:** `POST /auth/findmenu`

**Request Body:**
```json
{
  "user_id": 1
}
```

**Success Response:**
```json
{
  "menu": [
    {
      "id": 5,
      "name": "ส้มตำไทย",
      "price": 60.00,
      "element": ["ไฟ", "ไม้"],
      "image_url": "https://example.com/somtam.jpg",
      "status": "AVAILABLE"
    }
  ]
}
```

---

### 6. Create Coupon

Generate a coupon code for a promotion.

**Endpoint:** `POST /auth/coupon/add`

**Request Body:**
```json
{
  "promotion_id": 3,
  "userId": 1
}
```

**Success Response:**
```json
{
  "message": "Coupon created",
  "code": "PROMO-A3F5B2C1"
}
```

**Error Responses:**
- `400` - Promotion not active
- `409` - Already claimed this promotion

---

### 7. Use Coupon

Redeem a coupon code.

**Endpoint:** `POST /auth/coupon/use`

**Request Body:**
```json
{
  "code": "PROMO-A3F5B2C1"
}
```

**Success Response:**
```json
{
  "message": "Coupon applied successfully",
  "discount_value": 15.00
}
```

**Error Responses:**
- `400` - Invalid, expired, or already used coupon

---

## Restaurant Endpoints

### 1. Restaurant Login

Authenticate restaurant user.

**Endpoint:** `POST /restaurant/login`

**Rate Limit:** 20 requests per 15 minutes

**Request Body:**
```json
{
  "email": "restaurant@example.com",
  "password": "securepassword123"
}
```

**Success Response:**
```json
{
  "message": "Login successful",
  "user": {
    "restaurant_id": 1,
    "name": "ร้านอาหารดีมาก",
    "email": "restaurant@example.com"
  }
}
```

**Error Response:**
- `401` - Invalid email or password

---

### 2. Edit Restaurant

Update restaurant information.

**Endpoint:** `POST /restaurant/edit`

**Request Body:**
```json
{
  "restaurant_id": 1,
  "name": "ร้านอาหารดีมากๆ",
  "email": "newemail@example.com",
  "password": "newpassword456"
}
```

**Success Response:**
```json
{
  "message": "Restaurant updated successfully"
}
```

---

### 3. Get Menu

List restaurant menu items with pagination.

**Endpoint:** `POST /restaurant/menu`

**Request Body:**
```json
{
  "restaurant_id": 1,
  "page": 1
}
```

**Success Response:**
```json
{
  "menu": [
    {
      "id": 1,
      "name": "ผัดไทย",
      "price": 50.00,
      "element": ["ไฟ"],
      "image_url": null,
      "status": "AVAILABLE"
    }
  ]
}
```

**Note:** Returns 10 items per page.

---

### 4. Add Menu Item

Create a new menu item.

**Endpoint:** `POST /restaurant/add/menu`

**Request Body:**
```json
{
  "restaurant_id": 1,
  "name": "ข้าวผัดกะเพรา",
  "price": 55.00,
  "element": ["ไฟ", "ไม้"],
  "image_url": "https://example.com/kaprao.jpg",
  "status": "AVAILABLE"
}
```

**Success Response:**
```json
{
  "message": "Menu created successfully"
}
```

---

### 5. Edit Menu Item

Update existing menu item.

**Endpoint:** `POST /restaurant/edit/menu`

**Request Body:**
```json
{
  "menuid": 5,
  "name": "ข้าวผัดกะเพราพิเศษ",
  "price": 65.00,
  "status": "UNAVAILABLE"
}
```

**Success Response:**
```json
{
  "message": "Menu updated successfully"
}
```

---

### 6. Create Promotion

Create promotion for menu items matching specific elements.

**Endpoint:** `POST /restaurant/promotion/create`

**Request Body:**
```json
{
  "element": ["ไฟ"],
  "description": "โปรโมชั่นเมนูธาตุไฟ",
  "discount_value": 10.00,
  "start_date": "2025-01-01T00:00:00Z",
  "end_date": "2025-01-31T23:59:59Z"
}
```

**Success Response:**
```json
{
  "message": "Promotion created successfully",
  "promotion_group_id": 3,
  "menu_count": 5
}
```

---

### 7. Get Promotion Group

Retrieve promotion details by group ID.

**Endpoint:** `GET /restaurant/promotionGroup/get/:group_id`

**Success Response:**
```json
{
  "promotion_group_id": 3,
  "description": "โปรโมชั่นเมนูธาตุไฟ",
  "discount_value": 10.00,
  "start_date": "2025-01-01T00:00:00.000Z",
  "end_date": "2025-01-31T23:59:59.000Z",
  "status": "AVAILABLE",
  "menus": [
    {
      "promotion_id": 10,
      "menu_id": 5,
      "menu_name": "ข้าวผัดกะเพรา"
    }
  ]
}
```

---

### 8. Update Promotion Group

Modify promotion group details.

**Endpoint:** `PUT /restaurant/promotionGroup/update`

**Request Body:**
```json
{
  "group_id": 3,
  "start_date": "2025-01-05T00:00:00Z",
  "end_date": "2025-02-05T23:59:59Z",
  "status": "UNAVAILABLE"
}
```

---

### 9. Delete Promotion Group

Remove promotion group and all associated promotions.

**Endpoint:** `DELETE /restaurant/promotionGroup/delete/:group_id`

**Success Response:**
```json
{
  "message": "Promotion group deleted successfully"
}
```

---

### 10. Get Restaurant Users

Get user statistics and element distribution.

**Endpoint:** `POST /restaurant/restaurantUser`

**Request Body:**
```json
{
  "restaurant_id": 1
}
```

**Success Response:**
```json
{
  "element": [
    {
      "main_element": "ไฟ",
      "total_users": 15
    },
    {
      "main_element": "น้ำ",
      "total_users": 12
    }
  ],
  "user": [
    {
      "name": "สมชาย",
      "main_element": "ไฟ"
    }
  ]
}
```

---

## Rate Limiting

All endpoints are protected by rate limiting:

- **Global**: 100 requests per 15 minutes
- **Auth endpoints**: 20 requests per 15 minutes
- **Prediction endpoint**: 10 requests per hour

When rate limit is exceeded:
```json
{
  "message": "Too many requests, please try again later"
}
```

Response headers include:
- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Requests remaining
- `RateLimit-Reset`: Time when limit resets

---

## Error Handling

All errors follow consistent format:

```json
{
  "message": "Error description"
}
```

### Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
| 502 | Bad Gateway |
| 503 | Service Unavailable |
