-- PostgreSQL Schema for Ankshaastra Payment System
--
-- Source of truth at runtime: `api/db.js` (`ensureSchemaOnce` / SCHEMA_SQL).
-- The app creates schema `ankshaastra` with tables orders, customer_details,
-- payment, and emailDelivery (see README). This file documents the same logical
-- shape for the three core tables in `public` for manual DBA / reference only.
-- Prefer `npm run db:setup` or GET /api/admin/init-db for provisioning.

-- Orders table (primary table - order_id is the merchant transaction ID)
CREATE TABLE IF NOT EXISTS orders (
  order_id VARCHAR(100) PRIMARY KEY,
  amount DECIMAL(12, 2) NOT NULL,
  package_type VARCHAR(50) NOT NULL DEFAULT 'single',
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customer details table (references orders via order_id)
CREATE TABLE IF NOT EXISTS customer_details (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(100) NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  -- Primary contact
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  dob VARCHAR(50),
  gender VARCHAR(20),
  city VARCHAR(100),
  pin_code VARCHAR(20),
  -- Person 1 (Name Check / Single report)
  person1_name VARCHAR(255),
  person1_first_name VARCHAR(100),
  person1_middle_name VARCHAR(100),
  person1_middle_name_type VARCHAR(50),
  person1_sur_name VARCHAR(100),
  person1_dob VARCHAR(50),
  person1_gender VARCHAR(20),
  -- Person 2 (Name Check)
  person2_name VARCHAR(255),
  person2_first_name VARCHAR(100),
  person2_middle_name VARCHAR(100),
  person2_middle_name_type VARCHAR(50),
  person2_sur_name VARCHAR(100),
  person2_dob VARCHAR(50),
  person2_gender VARCHAR(20),
  -- Person 3 (Name Check)
  person3_name VARCHAR(255),
  person3_first_name VARCHAR(100),
  person3_middle_name VARCHAR(100),
  person3_middle_name_type VARCHAR(50),
  person3_sur_name VARCHAR(100),
  person3_dob VARCHAR(50),
  person3_gender VARCHAR(20),
  -- Baby Name Report fields
  father_first_name VARCHAR(100),
  father_middle_name VARCHAR(100),
  father_middle_name_type VARCHAR(50),
  father_last_name VARCHAR(100),
  child_dob VARCHAR(50),
  time_of_birth VARCHAR(50),
  place_of_birth VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(order_id)
);

-- Payment table (references orders via order_id)
CREATE TABLE IF NOT EXISTS payment (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(100) NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  transaction_id VARCHAR(255),
  amount_paise BIGINT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_customer_details_order_id ON customer_details(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_order_id ON payment(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transaction_id ON payment(transaction_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
