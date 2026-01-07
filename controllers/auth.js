import constants from "../lib/constants.js"
import pool, { executeQuery } from "../lib/db.js"
import axios from "axios"
import crypto from "crypto"
import dotenv from "dotenv"
dotenv.config()

const VALID_ELEMENTS = ["ดิน", "น้ำ", "ไฟ", "ทอง", "ไม้"]

export const lineUIDCheck = async (req, res) => {
  try {
    const { lineUid, restaurantId } = req.body

    const checkRestaurant = await executeQuery(constants.CheckRestarant, [restaurantId])
    if (checkRestaurant.rows.length === 0) {
      return res.status(404).json({ message: "Restaurant not found" })
    }

    const checkUser = await executeQuery(constants.CheckUser, [lineUid, restaurantId])

    if (checkUser.rows.length === 0) {
      return res.status(404).json({ action: "Register" })
    }

    return res.status(200).json({
      action: "LOGIN",
      user: {
        id: checkUser.rows[0].id,
        line_uid: checkUser.rows[0].line_uid,
        name: checkUser.rows[0].name,
      },
      bazi: {
        main_element: checkUser.rows[0].main_element,
        favorable_elements: checkUser.rows[0].favorable_elements,
      },
    })
  } catch (error) {
    console.error("[lineUIDCheck Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const register = async (req, res) => {
  const connection = await pool.connect()

  try {
    await connection.query("BEGIN")

    const { lineUid, name, gender, phone, birth_date, birth_time, birth_place, restaurantId } = req.body

    const checkRestaurant = await connection.query(constants.CheckRestarant, [restaurantId])
    if (checkRestaurant.rows.length === 0) {
      await connection.query("ROLLBACK")
      return res.status(404).json({ message: "Restaurant not found" })
    }

    const checkMember = await connection.query(constants.CheckUser, [lineUid, restaurantId])
    if (checkMember.rows.length > 0) {
      await connection.query("ROLLBACK")
      return res.status(409).json({ message: "User already registered" })
    }

    const [year, month, day] = birth_date.split("-").map(Number)
    const [hour, minute] = birth_time.split(":").map(Number)

    const createNewUser = await connection.query(constants.createNewUser, [
      lineUid,
      restaurantId,
      name,
      gender,
      phone,
      birth_date,
      birth_time,
      birth_place,
    ])
    const userId = createNewUser.rows[0].id

    let baziResponse
    try {
      baziResponse = await axios.post(
        "https://www.thailandfxwarrior.com/node/api/v1/bazi",
        {
          name: name,
          bday: day,
          bmonth: month,
          byear: year,
          b_hour: hour,
          b_minute: minute,
          bplace: birth_place,
          script: "zh",
          view: "full",
        },
        {
          timeout: 10000,
          headers: {
            "X-API-Key": process.env.BAZI_API_KEY,
          },
        },
      )
    } catch (apiError) {
      console.error("[Bazi API Error]", apiError.message)
      await connection.query("ROLLBACK")
      return res.status(503).json({ message: "Bazi service unavailable" })
    }

    if (!baziResponse?.data?.summary) {
      await connection.query("ROLLBACK")
      return res.status(502).json({ message: "Invalid Bazi response" })
    }

    const summary = baziResponse.data.summary
    const main_element = summary.dayMaster?.elementTh
    const favorable_elements = summary.favorableElements
    const unfavorable_elements = summary.unfavorableElements

    if (!main_element || !VALID_ELEMENTS.includes(main_element)) {
      await connection.query("ROLLBACK")
      return res.status(502).json({ message: "Invalid element data" })
    }

    await connection.query(constants.insertElement, [
      userId,
      main_element,
      JSON.stringify(favorable_elements),
      JSON.stringify(unfavorable_elements),
    ])

    await connection.query("COMMIT")

    return res.status(201).json({
      action: "LOGIN",
      user: {
        id: userId,
        name,
        line_uid: lineUid,
      },
      bazi: {
        main_element,
        favorable_elements,
        unfavorable_elements,
      },
    })
  } catch (error) {
    await connection.query("ROLLBACK")
    console.error("[Register Error]", error)
    return res.status(500).json({ message: "Server error" })
  } finally {
    connection.release()
  }
}

export const editProfile = async (req, res) => {
  const connection = await pool.connect()

  try {
    await connection.query("BEGIN")

    const { lineUid, restaurantId, name, gender, phone, birth_date, birth_time, birth_place } = req.body

    const checkRestaurant = await connection.query(constants.CheckRestarant, [restaurantId])
    if (checkRestaurant.rows.length === 0) {
      await connection.query("ROLLBACK")
      return res.status(404).json({ message: "Restaurant not found" })
    }

    const checkUser = await connection.query(constants.CheckUser, [lineUid, restaurantId])
    if (checkUser.rows.length === 0) {
      await connection.query("ROLLBACK")
      return res.status(404).json({ message: "User not found" })
    }

    const user = checkUser.rows[0]

    if (name || gender || phone || birth_date || birth_time || birth_place) {
      await connection.query(constants.editProfile, [
        name,
        gender,
        phone,
        birth_date,
        birth_time,
        birth_place,
        user.id,
        restaurantId,
      ])
    }

    const birthChanged =
      (birth_date && birth_date !== user.birth_date) ||
      (birth_time && birth_time !== user.birth_time) ||
      (birth_place && birth_place !== user.birth_place)

    let baziResult = null
    if (birthChanged) {
      const finalBirthDate = birth_date || user.birth_date
      const finalBirthTime = birth_time || user.birth_time
      const finalBirthPlace = birth_place || user.birth_place

      const [year, month, day] = finalBirthDate.split("-").map(Number)
      const [hour, minute] = finalBirthTime.split(":").map(Number)

      let baziResponse
      try {
        baziResponse = await axios.post(
          "https://www.thailandfxwarrior.com/node/api/v1/bazi",
          {
            name: name || user.name,
            bday: day,
            bmonth: month,
            byear: year,
            b_hour: hour,
            b_minute: minute,
            bplace: finalBirthPlace,
            script: "zh",
            view: "full",
          },
          {
            timeout: 10000,
            headers: {
              "X-API-Key": process.env.BAZI_API_KEY,
            },
          },
        )
      } catch (apiError) {
        console.error("[Bazi API Error]", apiError.message)
        await connection.query("ROLLBACK")
        return res.status(503).json({ message: "Bazi service unavailable" })
      }

      if (!baziResponse?.data?.summary) {
        await connection.query("ROLLBACK")
        return res.status(502).json({ message: "Invalid Bazi response" })
      }

      const summary = baziResponse.data.summary
      const main_element = summary.dayMaster?.elementTh
      const favorable_elements = summary.favorableElements
      const unfavorable_elements = summary.unfavorableElements

      if (!main_element || !VALID_ELEMENTS.includes(main_element)) {
        await connection.query("ROLLBACK")
        return res.status(502).json({ message: "Invalid element data" })
      }

      await connection.query(constants.updateElementAfterEditProfile, [
        main_element,
        JSON.stringify(favorable_elements),
        JSON.stringify(unfavorable_elements),
        user.id,
      ])

      baziResult = {
        main_element,
        favorable_elements,
        unfavorable_elements,
      }
    }
    const recommendation = await recalculatePrediction(user.id, main_element)
    await connection.query("COMMIT")

    return res.status(200).json({
      message: "Profile updated",
      bazi_recalculated: birthChanged,
      bazi: baziResult,
    })
  } catch (error) {
    await connection.query("ROLLBACK")
    console.error("[EditProfile Error]", error)
    return res.status(500).json({ message: "Server error" })
  } finally {
    connection.release()
  }
}

export const prediction = async (req, res) => {
  try {
    const { user_id } = req.body

    const checkUser = await executeQuery(constants.checkUserAlready, [user_id])
    if (checkUser.rows.length === 0) {
      return res.status(404).json({ message: "User not found" })
    }

    const today = new Date().toISOString().slice(0, 10)

    const existingPrediction = await executeQuery(constants.checkPrediction, [user_id, today])

    if (existingPrediction.rows.length > 0) {
      return res.status(200).json({ message: existingPrediction.rows[0].prediction_text })
    }

    const element = checkUser.rows[0].main_element

    if (!element || !VALID_ELEMENTS.includes(element)) {
      return res.status(400).json({ message: "Invalid user element data" })
    }

    const groqApiKey = process.env.GROQ_API_KEY
    if (!groqApiKey) {
      return res.status(500).json({ message: "AI service not configured" })
    }

    const prompt = `
คุณเป็นผู้ช่วยโหราศาสตร์ที่เชี่ยวชาญด้านธาตุประจำตัวและสีมงคล

ข้อมูลผู้ใช้:
- ธาตุประจำตัว: ${element}

ข้อกำหนดการตอบ:
- ตอบเป็นข้อความยาวเพียง 1 ประโยคต่อเนื่องเท่านั้น
- ห้ามขึ้นบรรทัดใหม่
- ห้ามใช้หัวข้อหรือสัญลักษณ์รายการ
- ใช้ภาษาไทยสุภาพ อ่านลื่น เหมาะกับหน้าแดชบอร์ด
- ความยาวไม่เกิน 3–4 บรรทัดบนหน้าจอ

เนื้อหาที่ต้องมีครบในประโยคเดียว:
- ดัชนีโชคชะตารายวัน (ดี / ปานกลาง / ระวัง)
- สีมงคล 1–3 สี พร้อมเหตุผลสั้น ๆ ว่าเหมาะกับธาตุอย่างไร
- คำทำนายโดยสรุปด้านโชคชะตา การงาน การเงิน และความรัก
`

    let response
    try {
      response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: "คุณเป็นผู้ช่วยโหราศาสตร์ที่ให้คำทำนายสั้น กระชับ อ่านง่าย สำหรับแสดงบนแดชบอร์ด",
            },
            { role: "user", content: prompt },
          ],
          max_tokens: 250,
          temperature: 0.7,
        },
        {
          timeout: 15000,
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            "Content-Type": "application/json",
          },
        },
      )
    } catch (apiError) {
      console.error("[Groq API Error]", apiError.message)
      return res.status(503).json({ message: "Prediction service unavailable" })
    }

    const recommendation =
      response.data.choices?.[0]?.message?.content ||
      response.data.choices?.[0]?.text ||
      "ขอโทษ ไม่สามารถให้คำทำนายได้ในขณะนี้"

    const predictionBefore = await executeQuery(constants.checkPredictionBefor, [user_id])

    if (predictionBefore.rows.length > 0) {
      await executeQuery(constants.updatePrediction, [recommendation, today, user_id])
    } else {
      await executeQuery(constants.insertPrediction, [user_id, today, recommendation])
    }

    return res.status(200).json({ message: recommendation })
  } catch (error) {
    console.error("[Prediction Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const recalculatePrediction = async (user_id, element) => {
  if (!element || !VALID_ELEMENTS.includes(element)) {
    throw new Error("Invalid element")
  }

  const today = new Date().toISOString().slice(0, 10)
  const existingPrediction = await executeQuery(constants.checkPrediction, [user_id, today])
  if (existingPrediction.rows.length > 0) {
    return existingPrediction.rows[0].prediction_text
  }

  const groqApiKey = process.env.GROQ_API_KEY
  const prompt = `คุณเป็นผู้ช่วยโหราศาสตร์ที่เชี่ยวชาญด้านธาตุประจำตัวและสีมงคล

ข้อมูลผู้ใช้:
- ธาตุประจำตัว: ${element}

ข้อกำหนดการตอบ:
- ตอบเป็นข้อความยาวเพียง 1 ประโยคต่อเนื่องเท่านั้น
- ห้ามขึ้นบรรทัดใหม่
- ห้ามใช้หัวข้อหรือสัญลักษณ์รายการ
- ใช้ภาษาไทยสุภาพ อ่านลื่น เหมาะกับหน้าแดชบอร์ด
- ความยาวไม่เกิน 3–4 บรรทัดบนหน้าจอ

เนื้อหาที่ต้องมีครบในประโยคเดียว:
- ดัชนีโชคชะตารายวัน (ดี / ปานกลาง / ระวัง)
- สีมงคล 1–3 สี พร้อมเหตุผลสั้น ๆ ว่าเหมาะกับธาตุอย่างไร
- คำทำนายโดยสรุปด้านโชคชะตา การงาน การเงิน และความรัก
`

  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "คุณเป็นผู้ช่วยโหราศาสตร์ที่ให้คำทำนายสั้น กระชับ อ่านง่าย สำหรับแสดงบนแดชบอร์ด" },
        { role: "user", content: prompt },
      ],
      max_tokens: 250,
      temperature: 0.7,
    },
    {
      timeout: 15000,
      headers: { Authorization: `Bearer ${groqApiKey}`, "Content-Type": "application/json" },
    }
  )

  const recommendation =
    response.data.choices?.[0]?.message?.content ||
    response.data.choices?.[0]?.text ||
    "ขอโทษ ไม่สามารถให้คำทำนายได้ในขณะนี้"

  const predictionBefore = await executeQuery(constants.checkPredictionBefor, [user_id])
  if (predictionBefore.rows.length > 0) {
    await executeQuery(constants.updatePrediction, [recommendation, today, user_id])
  } else {
    await executeQuery(constants.insertPrediction, [user_id, today, recommendation])
  }

  return recommendation
}

export const findMenu = async (req, res) => {
  try {
    const { user_id } = req.body

    const checkUser = await executeQuery(constants.checkUserAlready, [user_id])
    if (checkUser.rows.length === 0) {
      return res.status(404).json({ message: "User not found" })
    }

    const restaurantId = checkUser.rows[0].restaurant_id

    const menu = await executeQuery(constants.findMenuElementLike, [user_id, restaurantId])

    return res.status(200).json({ menu: menu.rows || [] })
  } catch (error) {
    console.error("[FindMenu Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const createCoupon = async (req, res) => {
  try {
    const { promotion_id, userId } = req.body

    const promotion = await executeQuery(constants.checkPromotion, [promotion_id])

    if (promotion.rows.length === 0) {
      return res.status(400).json({ message: "Promotion is not active or does not exist" })
    }

    const randomBytes = crypto.randomBytes(4).toString("hex").toUpperCase()
    const code = `PROMO-${randomBytes}`

    await executeQuery(constants.addCoupon, [userId, promotion_id, code])

    return res.status(201).json({ message: "Coupon created", code })
  } catch (error) {
    console.error("[CreateCoupon Error]", error)

    if (error.code === "23505") {
      return res.status(409).json({
        message: "You have already claimed this promotion",
      })
    }

    return res.status(500).json({ message: "Server error" })
  }
}

export const useCoupon = async (req, res) => {
  const connection = await pool.connect()

  try {
    await connection.query("BEGIN")

    const { code } = req.body

    const rows = await connection.query(constants.checkCoupon, [code])

    if (rows.rows.length === 0) {
      await connection.query("ROLLBACK")
      return res.status(400).json({ message: "Invalid or expired coupon" })
    }

    const coupon = rows.rows[0]

    if (coupon.status !== "UNUSED") {
      await connection.query("ROLLBACK")
      return res.status(400).json({ message: "Coupon already used" })
    }

    await connection.query(constants.useCoupon, [coupon.coupon_id])

    await connection.query("COMMIT")

    return res.status(200).json({
      message: "Coupon applied successfully",
      discount_value: coupon.discount_value,
    })
  } catch (error) {
    await connection.query("ROLLBACK")
    console.error("[UseCoupon Error]", error)
    return res.status(500).json({ message: "Server error" })
  } finally {
    connection.release()
  }
}
