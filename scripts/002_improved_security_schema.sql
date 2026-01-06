-- Adding security improvements to database schema

-- Add indexes for better performance and security
CREATE INDEX idx_users_line_uid_restaurant ON users(line_uid, restaurant_id);
CREATE INDEX idx_users_restaurant_id ON users(restaurant_id);
CREATE INDEX idx_user_elements_user_id ON user_elements(user_id);
CREATE INDEX idx_daily_predictions_user_date ON daily_predictions(user_id, prediction_date);
CREATE INDEX idx_menus_restaurant_status ON menus(restaurant_id, status);
CREATE INDEX idx_promotions_dates ON promotions(start_date, end_date, status);
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_user_status ON coupons(user_id, status);

-- Add updated_at columns for audit trail
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE user_elements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE menus ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS used_at TIMESTAMP NULL DEFAULT NULL;

-- Rename daily_predictions to predictions for consistency
ALTER TABLE daily_predictions RENAME TO predictions;

-- Add constraint to ensure end_date is after start_date
ALTER TABLE promotions ADD CONSTRAINT chk_promotion_dates CHECK (end_date >= start_date);

-- Add constraint for valid discount values
ALTER TABLE promotions ADD CONSTRAINT chk_discount_value CHECK (discount_value >= 0 AND discount_value <= 100);

-- Update menus table name for consistency
ALTER TABLE menus RENAME TO menu;
