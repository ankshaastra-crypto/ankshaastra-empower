// Suppress DEP0169 deprecation warning from dependencies
import '../suppress-deprecation.js';

import { getPool } from '../db.js';

// Schema embedded for Vercel serverless (no filesystem dependency)
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS orders (
  order_id VARCHAR(100) PRIMARY KEY,
  amount DECIMAL(12, 2) NOT NULL,
  package_type VARCHAR(50) NOT NULL DEFAULT 'single',
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_details (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(100) NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  dob VARCHAR(50),
  gender VARCHAR(20),
  city VARCHAR(100),
  pin_code VARCHAR(20),
  person1_name VARCHAR(255),
  person1_first_name VARCHAR(100),
  person1_middle_name VARCHAR(100),
  person1_middle_name_type VARCHAR(50),
  person1_sur_name VARCHAR(100),
  person1_dob VARCHAR(50),
  person1_gender VARCHAR(20),
  person2_name VARCHAR(255),
  person2_first_name VARCHAR(100),
  person2_middle_name VARCHAR(100),
  person2_middle_name_type VARCHAR(50),
  person2_sur_name VARCHAR(100),
  person2_dob VARCHAR(50),
  person2_gender VARCHAR(20),
  person3_name VARCHAR(255),
  person3_first_name VARCHAR(100),
  person3_middle_name VARCHAR(100),
  person3_middle_name_type VARCHAR(50),
  person3_sur_name VARCHAR(100),
  person3_dob VARCHAR(50),
  person3_gender VARCHAR(20),
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

CREATE TABLE IF NOT EXISTS payment (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(100) NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  transaction_id VARCHAR(255),
  amount_paise BIGINT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_details_order_id ON customer_details(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_order_id ON payment(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transaction_id ON payment(transaction_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
`;

/**
 * One-time setup: Run schema to create tables.
 * Call: GET /api/admin/init-db?secret=YOUR_INIT_DB_SECRET
 * Set INIT_DB_SECRET in Vercel env vars (e.g. a random string).
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const secret = process.env.INIT_DB_SECRET;
  const providedSecret = req.query.secret;

  if (!secret || !providedSecret || secret !== providedSecret) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const p = getPool();
  if (!p) {
    return res.status(500).json({
      error: 'Database not configured',
      message: 'Set DATABASE_URL in environment variables.',
    });
  }

  try {
    const statements = SCHEMA_SQL.split(';').map((s) => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      if (stmt) await p.query(stmt + ';');
    }
    return res.status(200).json({
      success: true,
      message: 'Tables created successfully (orders, customer_details, payment).',
    });
  } catch (error) {
    console.error('init-db error:', error.message);
    return res.status(500).json({
      error: 'Schema execution failed',
      message: error.message,
    });
  }
}
