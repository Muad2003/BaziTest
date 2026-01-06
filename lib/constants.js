const constants = {
  // Restaurant queries
  CheckRestarant: "SELECT id, name, email FROM restaurants WHERE id = $1",
  restaurantLogin: "SELECT id, name, email, password FROM restaurants WHERE email = $1",
  editRestaurant:
    "UPDATE restaurants SET name = COALESCE($1, name), email = COALESCE($2, email), password = COALESCE($3, password), updated_at = CURRENT_TIMESTAMP WHERE id = $4",

  // User queries
  CheckUser: `
    SELECT u.id, u.line_uid, u.name, u.gender, u.phone, u.birth_date, u.birth_time, u.birth_place, u.restaurant_id,
           e.main_element, e.favorable_elements, e.unfavorable_elements
    FROM users u
    LEFT JOIN user_elements e ON u.id = e.user_id
    WHERE u.line_uid = $1 AND u.restaurant_id = $2
  `,

  checkUserAlready: `
    SELECT u.id, u.name, u.restaurant_id, e.main_element, e.favorable_elements, e.unfavorable_elements
    FROM users u
    LEFT JOIN user_elements e ON u.id = e.user_id
    WHERE u.id = $1
  `,

  createNewUser: `
    INSERT INTO users (line_uid, restaurant_id, name, gender, phone, birth_date, birth_time, birth_place, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
    RETURNING id
  `,

  editProfile:
    "UPDATE users SET name = COALESCE($1, name), gender = COALESCE($2, gender), phone = COALESCE($3, phone), birth_date = COALESCE($4, birth_date), birth_time = COALESCE($5, birth_time), birth_place = COALESCE($6, birth_place), updated_at = CURRENT_TIMESTAMP WHERE id = $7 AND restaurant_id = $8",

  findUser: `
    SELECT u.id, u.name, u.line_uid, u.phone, u.gender, u.created_at,
           e.main_element, e.favorable_elements
    FROM users u
    LEFT JOIN user_elements e ON u.id = e.user_id
    WHERE u.restaurant_id = $1
    ORDER BY u.created_at DESC
  `,

  // User elements queries
  insertElement: `
    INSERT INTO user_elements (user_id, main_element, favorable_elements, unfavorable_elements, created_at)
    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
    RETURNING id
  `,

  updateElementAfterEditProfile: `
    UPDATE user_elements 
    SET main_element = $1, favorable_elements = $2, unfavorable_elements = $3, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $4
  `,

  coolactElement: `
    SELECT main_element, COUNT(*) as count
    FROM user_elements
    GROUP BY main_element
    ORDER BY count DESC
  `,

  // Prediction queries
  checkPrediction: `
    SELECT prediction_text
    FROM predictions
    WHERE user_id = $1 AND prediction_date = $2
    LIMIT 1
  `,

  checkPredictionBefor: `
    SELECT id
    FROM predictions
    WHERE user_id = $1
    LIMIT 1
  `,

  insertPrediction: `
    INSERT INTO predictions (user_id, prediction_date, prediction_text, created_at)
    VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
    RETURNING id
  `,

  updatePrediction: `
    UPDATE predictions
    SET prediction_text = $1, prediction_date = $2, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $3
  `,

  // Menu queries
  getMenu: `
    SELECT id, name, price, element, image_url, status, created_at
    FROM menu
    WHERE restaurant_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `,

  addNewMenu:
    "INSERT INTO menu (restaurant_id, name, price, element, image_url, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",

  editMenu:
    "UPDATE menu SET name = COALESCE($1, name), price = COALESCE($2, price), element = COALESCE($3, element), image_url = COALESCE($4, image_url), status = COALESCE($5, status), updated_at = CURRENT_TIMESTAMP WHERE id = $6",

  findMenuElementLike: `
    SELECT m.id, m.name, m.price, m.element, m.image_url, m.status
    FROM menu m
    INNER JOIN users u ON m.restaurant_id = u.restaurant_id
    INNER JOIN user_elements ue ON u.id = ue.user_id
    WHERE u.id = $1 
      AND m.restaurant_id = $2
      AND m.status = 'AVAILABLE'
      AND m.element @> to_jsonb(ue.main_element::text)
    ORDER BY m.created_at DESC
  `,

  findMenuelelemet: `
    SELECT id, name, price
    FROM menu
    WHERE element @> $1
      AND status = 'AVAILABLE'
  `,

  // Promotion queries
  checkPromotion: `
    SELECT id, discount_value, start_date, end_date
    FROM promotions
    WHERE id = $1
      AND status = 'AVAILABLE'
      AND start_date <= CURRENT_DATE
      AND end_date >= CURRENT_DATE
    LIMIT 1
  `,

  createGroupPromotion: `
    SELECT COALESCE(MAX(promotion_group_id), 0) + 1 as nextGroup
    FROM promotions
  `,

  createPromotion: `
    INSERT INTO promotions (promotion_group_id, menu_id, description, discount_value, start_date, end_date, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id
  `,

  getPromotionGroup: `
    SELECT 
      promotion_group_id,
      STRING_AGG(menu_id::text, ',') as menu_ids,
      description,
      discount_value,
      start_date,
      end_date,
      status,
      COUNT(*) as menu_count
    FROM promotions
    WHERE promotion_group_id = $1
    GROUP BY promotion_group_id, description, discount_value, start_date, end_date, status
  `,

  updatePromotionGroup: `
    UPDATE promotions
    SET start_date = COALESCE($1, start_date),
        end_date = COALESCE($2, end_date),
        status = COALESCE($3, status),
        updated_at = CURRENT_TIMESTAMP
    WHERE promotion_group_id = $4
  `,

  deletePromotionGroup: `
    DELETE FROM promotions
    WHERE promotion_group_id = $1
  `,

  // Coupon queries
  addCoupon: `
    INSERT INTO coupons (user_id, promotion_id, code, status, created_at)
    VALUES ($1, $2, $3, 'UNUSED', CURRENT_TIMESTAMP)
    RETURNING id
  `,

  checkCoupon: `
    SELECT c.id as coupon_id, c.status, c.code, p.discount_value, p.end_date as expires_at
    FROM coupons c
    INNER JOIN promotions p ON c.promotion_id = p.id
    WHERE c.code = $1
    LIMIT 1
  `,

  useCoupon: `
    UPDATE coupons
    SET status = 'USED', used_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `,
}

export default constants
