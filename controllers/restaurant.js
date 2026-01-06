import constants from "../lib/constants.js"
import db from "../lib/db.js"
import bcrypt from "bcrypt"
import dotenv from "dotenv"
dotenv.config()

const SALT_ROUNDS = 12

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const [checkLogin] = await db.query(constants.restaurantLogin, [email])

    if (checkLogin.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    const isMatch = await bcrypt.compare(password, checkLogin[0].password)
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    return res.status(200).json({
      message: "Login successful",
      user: {
        restaurant_id: checkLogin[0].id,
        name: checkLogin[0].name,
        email: checkLogin[0].email,
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

    const update = {}
    if (name) update.name = name
    if (email) update.email = email

    if (password) {
      const hashPassword = await bcrypt.hash(password, SALT_ROUNDS)
      update.password = hashPassword
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "No data to update" })
    }

    await db.query(constants.editRestaurant, [update, restaurant_id])

    return res.status(200).json({ message: "Restaurant updated successfully" })
  } catch (error) {
    console.error("[EditRestaurant Error]", error)

    if (error.code === "ER_DUP_ENTRY") {
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

    const [getMenu] = await db.query(constants.getMenu, [restaurant_id, limit, offset])

    if (getMenu.length === 0) {
      return res.status(200).json({ message: "No menus found", menu: [] })
    }

    const menuWithParsedElement = getMenu.map((item) => ({
      ...item,
      element: typeof item.element === "string" ? JSON.parse(item.element) : item.element,
    }))

    return res.status(200).json({ menu: menuWithParsedElement })
  } catch (error) {
    console.error("[Menu Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const addNewMenu = async (req, res) => {
  try {
    const { restaurant_id, name, price, element, image_url, status } = req.body

    const addNew = {
      restaurant_id,
      name,
      price,
      element: element ? JSON.stringify(element) : null,
      image_url: image_url || null,
      status: status || "AVAILABLE",
    }

    await db.query(constants.addNewMenu, [addNew])

    return res.status(201).json({ message: "Menu created successfully" })
  } catch (error) {
    console.error("[AddNewMenu Error]", error)

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
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

    const update = {}
    if (name) update.name = name
    if (price !== undefined) update.price = price
    if (element) update.element = JSON.stringify(element)
    if (image_url) update.image_url = image_url
    if (status) update.status = status

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "No data to update" })
    }

    const [result] = await db.query(constants.editMenu, [update, menuid])

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Menu not found" })
    }

    return res.status(200).json({ message: "Menu updated successfully" })
  } catch (error) {
    console.error("[EditMenu Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const createPromotion = async (req, res) => {
  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const { element, description, discount_value, start_date, end_date } = req.body

    const [menus] = await connection.query(constants.findMenuelelemet, [JSON.stringify(element)])

    if (menus.length === 0) {
      await connection.rollback()
      return res.status(404).json({ message: "No menus match the specified elements" })
    }

    const [groupResult] = await connection.query(constants.createGroupPromotion)
    const promotionGroupId = groupResult[0].nextGroup

    const values = menus.map((menu) => [
      promotionGroupId,
      menu.id,
      description || null,
      discount_value,
      start_date,
      end_date,
      "AVAILABLE",
    ])

    await connection.query(constants.createPromotion, [values])

    await connection.commit()

    return res.status(201).json({
      message: "Promotion created successfully",
      promotion_group_id: promotionGroupId,
      menu_count: menus.length,
    })
  } catch (error) {
    await connection.rollback()
    console.error("[CreatePromotion Error]", error)
    return res.status(500).json({ message: "Server error" })
  } finally {
    connection.release()
  }
}

export const getPromotionGroup = async (req, res) => {
  try {
    const { group_id } = req.params

    const [rows] = await db.query(constants.getPromotionGroup, [group_id])

    if (rows.length === 0) {
      return res.status(404).json({ message: "Promotion group not found" })
    }

    return res.status(200).json(rows[0])
  } catch (error) {
    console.error("[GetPromotionGroup Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const updatePromotionGroup = async (req, res) => {
  try {
    const { group_id, start_date, end_date, status } = req.body

    const [result] = await db.query(constants.updatePromotionGroup, [
      start_date || null,
      end_date || null,
      status || null,
      group_id,
    ])

    if (result.affectedRows === 0) {
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

    const [result] = await db.query(constants.deletePromotionGroup, [group_id])

    if (result.affectedRows === 0) {
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

    const [user] = await db.query(constants.findUser, [restaurant_id])

    if (user.length === 0) {
      return res.status(404).json({ message: "No users found in restaurant" })
    }

    const [element] = await db.query(constants.coolactElement)

    return res.status(200).json({
      element: element || [],
      user: user || [],
    })
  } catch (error) {
    console.error("[RestaurantUser Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}
