import express from "express"
import {
  lineUIDCheck,
  register,
  editProfile,
  prediction,
  findMenu,
  createCoupon,
  useCoupon,
} from "../controllers/auth.js"
import { authValidation } from "../middleware/validation.js"
import { authLimiter, strictLimiter } from "../middleware/rateLimiter.js"
import { asyncHandler } from "../middleware/errorHandler.js"

const routes = express.Router()

routes.post("/auth/lineUIDCheck", authLimiter, authValidation.lineUIDCheck, asyncHandler(lineUIDCheck))
routes.post("/auth/register", authLimiter, authValidation.register, asyncHandler(register))
routes.put("/auth/editProfile", authValidation.editProfile, asyncHandler(editProfile))
routes.post("/auth/prediction", strictLimiter, authValidation.prediction, asyncHandler(prediction))
routes.post("/auth/findmenu", authValidation.findMenu, asyncHandler(findMenu))
routes.post("/auth/coupon/add", authValidation.createCoupon, asyncHandler(createCoupon))
routes.post("/auth/coupon/use", authValidation.useCoupon, asyncHandler(useCoupon))

export default routes
