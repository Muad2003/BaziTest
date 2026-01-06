import express from "express"
import {
  login,
  editRestaurant,
  menu,
  addNewMenu,
  editMenu,
  createPromotion,
  getPromotionGroup,
  updatePromotionGroup,
  deletePromotionGroup,
  restaurantUser,
} from "../controllers/restaurant.js"
import { restaurantValidation } from "../middleware/validation.js"
import { authLimiter } from "../middleware/rateLimiter.js"
import { asyncHandler } from "../middleware/errorHandler.js"

const routes = express.Router()

routes.post("/restaurant/login", authLimiter, restaurantValidation.login, asyncHandler(login))
routes.post("/restaurant/edit", restaurantValidation.editRestaurant, asyncHandler(editRestaurant))
routes.post("/restaurant/menu", restaurantValidation.menu, asyncHandler(menu))
routes.post("/restaurant/add/menu", restaurantValidation.addNewMenu, asyncHandler(addNewMenu))
routes.post("/restaurant/edit/menu", restaurantValidation.editMenu, asyncHandler(editMenu))
routes.post("/restaurant/promotion/create", restaurantValidation.createPromotion, asyncHandler(createPromotion))
routes.get(
  "/restaurant/promotionGroup/get/:group_id",
  restaurantValidation.getPromotionGroup,
  asyncHandler(getPromotionGroup),
)
routes.put(
  "/restaurant/promotionGroup/update",
  restaurantValidation.updatePromotionGroup,
  asyncHandler(updatePromotionGroup),
)
routes.delete(
  "/restaurant/promotionGroup/delete/:group_id",
  restaurantValidation.deletePromotionGroup,
  asyncHandler(deletePromotionGroup),
)
routes.post("/restaurant/restaurantUser", restaurantValidation.restaurantUser, asyncHandler(restaurantUser))

export default routes
