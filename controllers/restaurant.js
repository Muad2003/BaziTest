import constants from "../lib/constants.js"
import pool, { executeQuery } from "../lib/db.js"
import bcrypt from "bcrypt"
import dotenv from "dotenv"
dotenv.config()

const SALT_ROUNDS = 12

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const checkLogin = await executeQuery(constants.restaurantLogin, [email])

    if (checkLogin.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    const isMatch = await bcrypt.compare(password, checkLogin.rows[0].password)
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    return res.status(200).json({
      message: "Login successful",
      user: {
        restaurant_id: checkLogin.rows[0].id,
        name: checkLogin.rows[0].name,
        email: checkLogin.rows[0].email,
      },
    })
  } catch (error) {
    console.error("[Restaurant Login Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const editRestaurant = async (req, res) => {
  try {
    const { restaurant_id, name, email, password } = req.body

    if (!restaurant_id) {
      return res.status(400).json({ message: "restaurant_id is required" })
    }

    let hashPassword = null
    if (password) {
      hashPassword = await bcrypt.hash(password, SALT_ROUNDS)
    }

    await executeQuery(constants.editRestaurant, [name, email, hashPassword, restaurant_id])

    return res.status(200).json({ message: "Restaurant updated successfully" })
  } catch (error) {
    console.error("[EditRestaurant Error]", error)

    if (error.code === "23505") {
      return res.status(409).json({ message: "Email already exists" })
    }

    return res.status(500).json({ message: "Server error" })
  }
}

export const menu = async (req, res) => {
  try {
    const { restaurant_id, page } = req.body

    const limit = 10
    const offset = (page - 1) * limit

    const getMenu = await executeQuery(constants.getMenu, [restaurant_id, limit, offset])

    if (getMenu.rows.length === 0) {
      return res.status(200).json({ message: "No menus found", menu: [] })
    }

    return res.status(200).json({ menu: getMenu.rows })
  } catch (error) {
    console.error("[Menu Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const addNewMenu = async (req, res) => {
  try {
    const { restaurant_id, name, price, element, image_url, status } = req.body

    await executeQuery(constants.addNewMenu, [
      restaurant_id,
      name,
      price,
      element || null,
      image_url || null,
      status || "AVAILABLE",
    ])

    return res.status(201).json({ message: "Menu created successfully" })
  } catch (error) {
    console.error("[AddNewMenu Error]", error)

    if (error.code === "23503") {
      return res.status(404).json({ message: "Restaurant not found" })
    }

    return res.status(500).json({ message: "Server error" })
  }
}

export const editMenu = async (req, res) => {
  try {
    const { menuid, name, price, element, image_url, status } = req.body

    if (!menuid) {
      return res.status(400).json({ message: "menuid is required" })
    }

    const result = await executeQuery(constants.editMenu, [name, price, element, image_url, status, menuid])

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Menu not found" })
    }

    return res.status(200).json({ message: "Menu updated successfully" })
  } catch (error) {
    console.error("[EditMenu Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const createPromotion = async (req, res) => {
  const connection = await pool.connect()

  try {
    await connection.query("BEGIN")

    const { element, description, discount_value, start_date, end_date } = req.body

    const menus = await connection.query(constants.findMenuelelemet, [JSON.stringify(element)])

    if (menus.rows.length === 0) {
      await connection.query("ROLLBACK")
      return res.status(404).json({ message: "No menus match the specified elements" })
    }

    const groupResult = await connection.query(constants.createGroupPromotion)
    const promotionGroupId = groupResult.rows[0].nextgroup

    for (const menu of menus.rows) {
      await connection.query(constants.createPromotion, [
        promotionGroupId,
        menu.id,
        description || null,
        discount_value,
        start_date,
        end_date,
        "AVAILABLE",
      ])
    }

    await connection.query("COMMIT")

    return res.status(201).json({
      message: "Promotion created successfully",
      promotion_group_id: promotionGroupId,
      menu_count: menus.rows.length,
    })
  } catch (error) {
    await connection.query("ROLLBACK")
    console.error("[CreatePromotion Error]", error)
    return res.status(500).json({ message: "Server error" })
  } finally {
    connection.release()
  }
}

export const getPromotionGroup = async (req, res) => {
  try {
    const { group_id } = req.params

    const rows = await executeQuery(constants.getPromotionGroup, [group_id])

    if (rows.rows.length === 0) {
      return res.status(404).json({ message: "Promotion group not found" })
    }

    return res.status(200).json(rows.rows[0])
  } catch (error) {
    console.error("[GetPromotionGroup Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const updatePromotionGroup = async (req, res) => {
  try {
    const { group_id, start_date, end_date, status } = req.body

    const result = await executeQuery(constants.updatePromotionGroup, [
      start_date || null,
      end_date || null,
      status || null,
      group_id,
    ])

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Promotion group not found" })
    }

    return res.status(200).json({ message: "Promotion group updated successfully" })
  } catch (error) {
    console.error("[UpdatePromotionGroup Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const deletePromotionGroup = async (req, res) => {
  try {
    const { group_id } = req.params

    const result = await executeQuery(constants.deletePromotionGroup, [group_id])

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Promotion group not found" })
    }

    return res.status(200).json({ message: "Promotion group deleted successfully" })
  } catch (error) {
    console.error("[DeletePromotionGroup Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const restaurantUser = async (req, res) => {
  try {
    const { restaurant_id } = req.body

    const user = await executeQuery(constants.findUser, [restaurant_id])

    if (user.rows.length === 0) {
      return res.status(404).json({ message: "No users found in restaurant" })
    }

    const element = await executeQuery(constants.coolactElement)

    return res.status(200).json({
      element: element.rows || [],
      user: user.rows || [],
    })
  } catch (error) {
    console.error("[RestaurantUser Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}
