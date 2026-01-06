// SQL Query Constants
// All queries use parameterized statements to prevent SQL injection

const constants = {
  // Restaurant queries
  CheckRestarant: "SELECT id, name, email FROM restaurants WHERE id = ?",
  restaurantLogin: "SELECT id, name, email, password FROM restaurants WHERE email = ?",
  editRestaurant: "UPDATE restaurants SET ? WHERE id = ?",

  // User queries
  CheckUser: `
    SELECT u.id, u.line_uid, u.name, u.gender, u.phone, u.birth_date, u.birth_time, u.birth_place, u.restaurant_id,
           e.main_element, e.favorable_elements, e.unfavorable_elements
    FROM users u
    LEFT JOIN user_elements e ON u.id = e.user_id
    WHERE u.line_uid = ? AND u.restaurant_id = ?
  `,

  checkUserAlready: `
    SELECT u.id, u.name, u.restaurant_id, e.main_element, e.favorable_elements, e.unfavorable_elements
    FROM users u
    LEFT JOIN user_elements e ON u.id = e.user_id
    WHERE u.id = ?
  `,

  createNewUser: `
    INSERT INTO users (line_uid, restaurant_id, name, gender, phone, birth_date, birth_time, birth_place, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `,

  editProfile: "UPDATE users SET ? WHERE id = ? AND restaurant_id = ?",

  findUser: `
    SELECT u.id, u.name, u.line_uid, u.phone, u.gender, u.created_at,
           e.main_element, e.favorable_elements
    FROM users u
    LEFT JOIN user_elements e ON u.id = e.user_id
    WHERE u.restaurant_id = ?
    ORDER BY u.created_at DESC
  `,

  // User elements queries
  insertElement: `
    INSERT INTO user_elements (user_id, main_element, favorable_elements, unfavorable_elements, created_at)
    VALUES (?, ?, ?, ?, NOW())
  `,

  updateElementAfterEditProfile: `
    UPDATE user_elements 
    SET main_element = ?, favorable_elements = ?, unfavorable_elements = ?, updated_at = NOW()
    WHERE user_id = ?
  `,

  coolactElement: `
    SELECT DISTINCT main_element, COUNT(*) as count
    FROM user_elements
    GROUP BY main_element
    ORDER BY count DESC
  `,

  // Prediction queries
  checkPrediction: `
    SELECT prediction_text
    FROM predictions
    WHERE user_id = ? AND prediction_date = ?
    LIMIT 1
  `,

  checkPredictionBefor: `
    SELECT id
    FROM predictions
    WHERE user_id = ?
    LIMIT 1
  `,

  insertPrediction: `
    INSERT INTO predictions (user_id, prediction_date, prediction_text, created_at)
    VALUES (?, ?, ?, NOW())
  `,

  updatePrediction: `
    UPDATE predictions
    SET prediction_text = ?, prediction_date = ?, updated_at = NOW()
    WHERE user_id = ?
  `,

  // Menu queries
  getMenu: `
    SELECT id, name, price, element, image_url, status, created_at
    FROM menu
    WHERE restaurant_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `,

  addNewMenu: "INSERT INTO menu SET ?",

  editMenu: "UPDATE menu SET ? WHERE id = ?",

  findMenuElementLike: `
    SELECT m.id, m.name, m.price, m.element, m.image_url, m.status
    FROM menu m
    INNER JOIN users u ON m.restaurant_id = u.restaurant_id
    INNER JOIN user_elements ue ON u.id = ue.user_id
    WHERE u.id = ? 
      AND m.restaurant_id = ?
      AND m.status = 'AVAILABLE'
      AND JSON_CONTAINS(m.element, JSON_QUOTE(ue.main_element))
    ORDER BY m.created_at DESC
  `,

  findMenuelelemet: `
    SELECT id, name, price
    FROM menu
    WHERE JSON_CONTAINS(element, ?)
      AND status = 'AVAILABLE'
  `,

  // Promotion queries
  checkPromotion: `
    SELECT id, discount_value, start_date, end_date
    FROM promotions
    WHERE id = ?
      AND status = 'AVAILABLE'
      AND start_date <= CURDATE()
      AND end_date >= CURDATE()
    LIMIT 1
  `,

  createGroupPromotion: `
    SELECT COALESCE(MAX(promotion_group_id), 0) + 1 as nextGroup
    FROM promotions
  `,

  createPromotion: `
    INSERT INTO promotions (promotion_group_id, menu_id, description, discount_value, start_date, end_date, status)
    VALUES ?
  `,

  getPromotionGroup: `
    SELECT 
      promotion_group_id,
      GROUP_CONCAT(menu_id) as menu_ids,
      description,
      discount_value,
      start_date,
      end_date,
      status,
      COUNT(*) as menu_count
    FROM promotions
    WHERE promotion_group_id = ?
    GROUP BY promotion_group_id, description, discount_value, start_date, end_date, status
  `,

  updatePromotionGroup: `
    UPDATE promotions
    SET start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        status = COALESCE(?, status),
        updated_at = NOW()
    WHERE promotion_group_id = ?
  `,

  deletePromotionGroup: `
    DELETE FROM promotions
    WHERE promotion_group_id = ?
  `,

  // Coupon queries
  addCoupon: `
    INSERT INTO coupons (user_id, promotion_id, code, status, created_at)
    VALUES (?, ?, ?, 'UNUSED', NOW())
  `,

  checkCoupon: `
    SELECT c.id as coupon_id, c.status, c.code, p.discount_value, p.end_date as expires_at
    FROM coupons c
    INNER JOIN promotions p ON c.promotion_id = p.id
    WHERE c.code = ?
    LIMIT 1
  `,

  useCoupon: `
    UPDATE coupons
    SET status = 'USED', used_at = NOW()
    WHERE id = ?
  `,
}

// Export as default
export default constants
