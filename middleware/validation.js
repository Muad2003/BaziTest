import { body, param, validationResult } from "express-validator"

export const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    })
  }
  next()
}

export const sanitizeString = (str) => {
  if (typeof str !== "string") return str
  return str.trim().replace(/[<>]/g, "")
}

export const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== "object") return obj
  const sanitized = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value)
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}

// Validation rules for auth routes
export const authValidation = {
  lineUIDCheck: [
    body("lineUid").trim().notEmpty().withMessage("lineUid is required").isString().isLength({ max: 100 }),
    body("restaurantId").isInt({ min: 1 }).withMessage("Valid restaurantId is required"),
    validate,
  ],

  register: [
    body("lineUid").trim().notEmpty().isString().isLength({ max: 100 }),
    body("name").trim().notEmpty().isString().isLength({ min: 2, max: 100 }),
    body("gender").isIn(["male", "female", "other"]).withMessage("Invalid gender"),
    body("phone")
      .trim()
      .matches(/^[0-9]{9,15}$/)
      .withMessage("Invalid phone number"),
    body("birth_date").isDate({ format: "YYYY-MM-DD" }).withMessage("Invalid birth date"),
    body("birth_time")
      .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Invalid time format"),
    body("birth_place").trim().notEmpty().isString().isLength({ max: 200 }),
    body("restaurantId").isInt({ min: 1 }),
    validate,
  ],

  editProfile: [
    body("lineUid").trim().notEmpty().isString(),
    body("restaurantId").isInt({ min: 1 }),
    body("name").optional().trim().isString().isLength({ min: 2, max: 100 }),
    body("gender").optional().isIn(["male", "female", "other"]),
    body("phone")
      .optional()
      .trim()
      .matches(/^[0-9]{9,15}$/),
    body("birth_date").optional().isDate({ format: "YYYY-MM-DD" }),
    body("birth_time")
      .optional()
      .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
    body("birth_place").optional().trim().isString().isLength({ max: 200 }),
    validate,
  ],

  prediction: [body("user_id").isInt({ min: 1 }).withMessage("Valid user_id is required"), validate],

  findMenu: [body("user_id").isInt({ min: 1 }).withMessage("Valid user_id is required"), validate],

  createCoupon: [
    body("promotion_id").isInt({ min: 1 }).withMessage("Valid promotion_id is required"),
    body("userId").isInt({ min: 1 }).withMessage("Valid userId is required"),
    validate,
  ],

  useCoupon: [body("code").trim().notEmpty().isString().isLength({ min: 5, max: 50 }), validate],
}

// Validation rules for restaurant routes
export const restaurantValidation = {
  login: [
    body("email").trim().isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password").notEmpty().isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    validate,
  ],

  editRestaurant: [
    body("restaurant_id").isInt({ min: 1 }),
    body("name").optional().trim().isString().isLength({ min: 2, max: 200 }),
    body("email").optional().trim().isEmail().normalizeEmail(),
    body("password").optional().isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
    validate,
  ],

  menu: [
    body("restaurant_id").isInt({ min: 1 }),
    body("page").isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    validate,
  ],

  addNewMenu: [
    body("restaurant_id").isInt({ min: 1 }),
    body("name").trim().notEmpty().isString().isLength({ min: 2, max: 200 }),
    body("price").isFloat({ min: 0 }).withMessage("Price must be a positive number"),
    body("element").optional().isArray().withMessage("Element must be an array"),
    body("image_url").optional().trim().isURL().withMessage("Invalid URL"),
    body("status").optional().isIn(["AVAILABLE", "UNAVAILABLE"]),
    validate,
  ],

  editMenu: [
    body("menuid").isInt({ min: 1 }),
    body("name").optional().trim().isString().isLength({ min: 2, max: 200 }),
    body("price").optional().isFloat({ min: 0 }),
    body("element").optional().isArray(),
    body("image_url").optional().trim().isURL(),
    body("status").optional().isIn(["AVAILABLE", "UNAVAILABLE"]),
    validate,
  ],

  createPromotion: [
    body("element").isArray().notEmpty().withMessage("Element array is required"),
    body("description").optional().trim().isString().isLength({ max: 500 }),
    body("discount_value").isFloat({ min: 0, max: 100 }).withMessage("Discount must be between 0-100"),
    body("start_date").isISO8601().withMessage("Invalid start date"),
    body("end_date").isISO8601().withMessage("Invalid end date"),
    validate,
  ],

  getPromotionGroup: [param("group_id").isInt({ min: 1 }).withMessage("Valid group_id is required"), validate],

  updatePromotionGroup: [
    body("group_id").isInt({ min: 1 }),
    body("start_date").optional().isISO8601(),
    body("end_date").optional().isISO8601(),
    body("status").optional().isIn(["AVAILABLE", "UNAVAILABLE"]),
    validate,
  ],

  deletePromotionGroup: [param("group_id").isInt({ min: 1 }).withMessage("Valid group_id is required"), validate],

  restaurantUser: [body("restaurant_id").isInt({ min: 1 }), validate],
}
