-- PostgreSQL Database Schema for Restaurant Astrology System
-- Changed from MySQL to PostgreSQL syntax

-- Restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_restaurants_email ON restaurants(email);

-- Users table
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    line_uid VARCHAR(100) NOT NULL,
    restaurant_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    gender gender_type NOT NULL,
    phone VARCHAR(10) NOT NULL,
    birth_date DATE NOT NULL,
    birth_time TIME NOT NULL,
    birth_place VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    UNIQUE (line_uid, restaurant_id)
);

CREATE INDEX IF NOT EXISTS idx_users_line_uid ON users(line_uid);
CREATE INDEX IF NOT EXISTS idx_users_restaurant_id ON users(restaurant_id);

-- User elements table (Bazi data)
CREATE TABLE IF NOT EXISTS user_elements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    main_element VARCHAR(50) NOT NULL,
    favorable_elements JSONB,
    unfavorable_elements JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_elements_main_element ON user_elements(main_element);
CREATE INDEX IF NOT EXISTS idx_user_elements_user_id ON user_elements(user_id);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    prediction_date DATE NOT NULL,
    prediction_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_predictions_user_date ON predictions(user_id, prediction_date);

-- Menu table
CREATE TYPE menu_status_type AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'OUT_OF_STOCK');

CREATE TABLE IF NOT EXISTS menu (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    element JSONB,
    image_url VARCHAR(500),
    status menu_status_type DEFAULT 'AVAILABLE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_menu_restaurant_id ON menu(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_status ON menu(status);
CREATE INDEX IF NOT EXISTS idx_menu_element ON menu USING GIN (element);

-- Promotions table
CREATE TYPE promotion_status_type AS ENUM ('AVAILABLE', 'EXPIRED', 'DISABLED');

CREATE TABLE IF NOT EXISTS promotions (
    id SERIAL PRIMARY KEY,
    promotion_group_id INTEGER NOT NULL,
    menu_id INTEGER NOT NULL,
    description VARCHAR(500),
    discount_value NUMERIC(10, 2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status promotion_status_type DEFAULT 'AVAILABLE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (menu_id) REFERENCES menu(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_promotions_group ON promotions(promotion_group_id);
CREATE INDEX IF NOT EXISTS idx_promotions_menu_id ON promotions(menu_id);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promotions_status ON promotions(status);

-- Coupons table
CREATE TYPE coupon_status_type AS ENUM ('UNUSED', 'USED', 'EXPIRED');

CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    promotion_id INTEGER NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    status coupon_status_type DEFAULT 'UNUSED',
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE,
    UNIQUE (user_id, promotion_id)
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_user_id ON coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables that have updated_at
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_elements_updated_at BEFORE UPDATE ON user_elements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_predictions_updated_at BEFORE UPDATE ON predictions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_updated_at BEFORE UPDATE ON menu FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
