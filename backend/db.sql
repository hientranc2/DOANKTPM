-- ============================================================
-- PostgreSQL schema for the e-commerce app (frontend on Vercel, backend on Render)
-- Safe to run multiple times (uses IF NOT EXISTS / DO blocks).
-- Tables: users, products, orders, order_items.
-- Includes a small seed for products when table is empty (relative image paths, no localhost).
-- ============================================================

-- ======================
-- USERS
-- ======================
CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('customer','admin')),
    status      VARCHAR(50) DEFAULT 'active'   CHECK (status IN ('active','suspended')),
    cart_data   JSONB        DEFAULT '{}',
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ======================
-- PRODUCTS
-- ======================
CREATE TABLE IF NOT EXISTS products (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    image      VARCHAR(255),
    images     JSONB DEFAULT '[]',
    category   VARCHAR(100),
    new_price  DECIMAL(10,2) NOT NULL,
    old_price  DECIMAL(10,2),
    available  BOOLEAN DEFAULT TRUE,
    date       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======================
-- ORDERS
-- ======================
CREATE TABLE IF NOT EXISTS orders (
    id            SERIAL PRIMARY KEY,
    order_id      INTEGER NOT NULL UNIQUE,
    customer_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
    customer_name  VARCHAR(255),
    customer_email VARCHAR(255),
    total         DECIMAL(10,2) NOT NULL,
    status        VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending','processing','shipped')),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======================
-- ORDER ITEMS
-- ======================
CREATE TABLE IF NOT EXISTS order_items (
    id         SERIAL PRIMARY KEY,
    order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER,
    name       VARCHAR(255),
    quantity   INTEGER NOT NULL DEFAULT 1,
    price      DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======================
-- INDEXES
-- ======================
CREATE INDEX IF NOT EXISTS idx_users_email         ON users(email);
CREATE INDEX IF NOT EXISTS idx_products_category   ON products(category);
CREATE INDEX IF NOT EXISTS idx_orders_customer     ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_id     ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order   ON order_items(order_id);

-- ======================
-- SEED SAMPLE PRODUCTS (chỉ chạy nếu bảng rỗng)
-- Lưu ý: dùng đường dẫn tương đối /images/... để tránh localhost.
-- ======================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products LIMIT 1) THEN
    INSERT INTO products (name, image, images, category, new_price, old_price, available, date, updated_at)
    VALUES
      ('Áo thun A', '/images/sample1.png', '["/images/sample1.png"]'::jsonb, 'men',   250000, 300000, TRUE, NOW(), NOW()),
      ('Áo sơ mi B', '/images/sample2.png', '["/images/sample2.png"]'::jsonb, 'women', 320000, 380000, TRUE, NOW(), NOW());
  END IF;
END $$;

-- ======================
-- NOTES
-- - Đảm bảo backend có biến DATABASE_URL trỏ đúng Postgres và (nếu cần) sslmode=require.
-- - Nếu dùng Render, bật CORS_ORIGIN phù hợp.
-- - Mặc định không seed admin qua SQL; backend tự seed khi chạy nếu bạn đặt ADMIN_EMAIL/ADMIN_PASSWORD trong env.
-- ======================
