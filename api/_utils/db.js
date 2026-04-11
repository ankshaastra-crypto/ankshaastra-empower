// Suppress DEP0169 deprecation warning from dependencies
import './suppress-deprecation.js'; // already in _utils

// Load .env for local development (Vercel injects env in production)
import 'dotenv/config';

import pg from 'pg';

const { Pool } = pg;

/** All app tables live in this schema (see api/admin/init-db.js). */
export const DB_SCHEMA = 'ankshaastra';

let pool = null;
let schemaChecked = false;

/**
 * Drop legacy minimal `ankshaastra.orders` if present (UUID id, no order_id)
 * so the real orders table can be created.
 */
const LEGACY_MIGRATION_SQL = `
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = '${DB_SCHEMA}' AND table_name = 'orders'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = '${DB_SCHEMA}' AND table_name = 'orders' AND column_name = 'order_id'
  ) THEN
    EXECUTE 'DROP TABLE IF EXISTS ${DB_SCHEMA}.orders CASCADE';
  END IF;
END $$;
`;

const SCHEMA_SQL = `
CREATE SCHEMA IF NOT EXISTS ${DB_SCHEMA};

CREATE TABLE IF NOT EXISTS ${DB_SCHEMA}.orders (
  order_id VARCHAR(100) PRIMARY KEY,
  amount DECIMAL(12, 2) NOT NULL,
  package_type VARCHAR(50) NOT NULL DEFAULT 'single',
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ${DB_SCHEMA}.customer_details (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(100) NOT NULL REFERENCES ${DB_SCHEMA}.orders(order_id) ON DELETE CASCADE,
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
  father_full_name VARCHAR(255),
  child_last_name VARCHAR(255),
  father_first_as_middle VARCHAR(50),
  child_middle_name VARCHAR(255),
  name_options TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(order_id)
);

CREATE TABLE IF NOT EXISTS ${DB_SCHEMA}.payment (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(100) NOT NULL REFERENCES ${DB_SCHEMA}.orders(order_id) ON DELETE CASCADE,
  transaction_id VARCHAR(255),
  amount_paise BIGINT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ${DB_SCHEMA}."emailDelivery" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  status TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_details_order_id ON ${DB_SCHEMA}.customer_details(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_order_id ON ${DB_SCHEMA}.payment(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transaction_id ON ${DB_SCHEMA}.payment(transaction_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON ${DB_SCHEMA}.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON ${DB_SCHEMA}.orders(status);
`;

/** Must all exist before we skip running SCHEMA_SQL (avoids partial deploys where only `orders` was created). */
const REQUIRED_TABLES = ['orders', 'customer_details', 'payment', 'emailDelivery'];

/**
 * Ensure tables exist - runs once per serverless instance on first DB use.
 * Creates schema `ankshaastra` and tables if they don't exist (idempotent).
 * @param {boolean} force - If true, run schema creation even if already checked (for manual init-db).
 */
export async function ensureSchemaOnce(force = false) {
  if (!force && schemaChecked) return;
  const p = getPool();
  if (!p) {
    schemaChecked = true;
    return;
  }
  try {
    const tbl = await p.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = $1 AND table_name = ANY($2::text[])`,
      [DB_SCHEMA, REQUIRED_TABLES]
    );
    const found = new Set(tbl.rows.map((row) => row.table_name));
    const allPresent = REQUIRED_TABLES.every((name) => found.has(name));
    if (allPresent) {
      schemaChecked = true;
      return;
    }
  } catch {
    /* fall through to create */
  }

  try {
    await p.query(LEGACY_MIGRATION_SQL);

    const statements = SCHEMA_SQL.split(';')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const stmt of statements) {
      if (stmt) await p.query(stmt + ';');
    }
    console.log(`DB schema initialized (${DB_SCHEMA}: orders, customer_details, payment, emailDelivery)`);
    schemaChecked = true;
  } catch (err) {
    console.error('ensureSchema error:', err.message);
  }
}

/**
 * Get PostgreSQL connection pool (singleton)
 * Uses DATABASE_URL environment variable
 */
export function getPool() {
  if (!pool) {
    let connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      return null;
    }
    // Strip sslmode from URI; use explicit ssl object below (pooler-friendly)
    connectionString = connectionString.replace(/[?&]sslmode=[^&]*/g, '');
    connectionString = connectionString.replace(/\?$/, '').replace(/\?&/, '?');

    const poolConfig = {
      connectionString,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    };

    if (connectionString.includes('supabase')) {
      poolConfig.ssl = { rejectUnauthorized: false };
    }

    pool = new Pool(poolConfig);
  }
  return pool;
}

/**
 * Execute a query - returns null if DB not configured
 */
export async function query(text, params) {
  const p = getPool();
  if (!p) return null;
  try {
    return await p.query(text, params);
  } catch (error) {
    console.error('DB query error:', error.message);
    throw error;
  }
}

/**
 * Save order and customer details (called from initiate-payment)
 */
export async function saveOrderAndCustomer(orderId, amount, packageType, customerData) {
  const p = getPool();
  if (!p) return false;

  await ensureSchemaOnce();

  const client = await p.connect();
  const ord = `${DB_SCHEMA}.orders`;
  const cust = `${DB_SCHEMA}.customer_details`;
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO ${ord} (order_id, amount, package_type, status)
       VALUES ($1, $2, $3, 'PENDING')
       ON CONFLICT (order_id) DO UPDATE SET amount = EXCLUDED.amount, package_type = EXCLUDED.package_type`,
      [orderId, amount, packageType || 'single']
    );

    await client.query(
      `INSERT INTO ${cust} (
        order_id, email, name, mobile, dob, gender, city, pin_code,
        person1_name, person1_first_name, person1_middle_name, person1_middle_name_type, person1_sur_name, person1_dob, person1_gender,
        person2_name, person2_first_name, person2_middle_name, person2_middle_name_type, person2_sur_name, person2_dob, person2_gender,
        person3_name, person3_first_name, person3_middle_name, person3_middle_name_type, person3_sur_name, person3_dob, person3_gender,
        father_first_name, father_middle_name, father_middle_name_type, father_last_name, child_dob, time_of_birth, place_of_birth,
        father_full_name, child_last_name, father_first_as_middle, child_middle_name, name_options
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41)
      ON CONFLICT (order_id) DO UPDATE SET
        email = EXCLUDED.email, name = EXCLUDED.name, mobile = EXCLUDED.mobile, dob = EXCLUDED.dob, gender = EXCLUDED.gender,
        city = EXCLUDED.city, pin_code = EXCLUDED.pin_code,
        person1_name = EXCLUDED.person1_name, person1_first_name = EXCLUDED.person1_first_name, person1_middle_name = EXCLUDED.person1_middle_name,
        person1_middle_name_type = EXCLUDED.person1_middle_name_type, person1_sur_name = EXCLUDED.person1_sur_name,
        person1_dob = EXCLUDED.person1_dob, person1_gender = EXCLUDED.person1_gender,
        person2_name = EXCLUDED.person2_name, person2_first_name = EXCLUDED.person2_first_name, person2_middle_name = EXCLUDED.person2_middle_name,
        person2_middle_name_type = EXCLUDED.person2_middle_name_type, person2_sur_name = EXCLUDED.person2_sur_name,
        person2_dob = EXCLUDED.person2_dob, person2_gender = EXCLUDED.person2_gender,
        person3_name = EXCLUDED.person3_name, person3_first_name = EXCLUDED.person3_first_name, person3_middle_name = EXCLUDED.person3_middle_name,
        person3_middle_name_type = EXCLUDED.person3_middle_name_type, person3_sur_name = EXCLUDED.person3_sur_name,
        person3_dob = EXCLUDED.person3_dob, person3_gender = EXCLUDED.person3_gender,
        father_first_name = EXCLUDED.father_first_name, father_middle_name = EXCLUDED.father_middle_name,
        father_middle_name_type = EXCLUDED.father_middle_name_type, father_last_name = EXCLUDED.father_last_name,
        child_dob = EXCLUDED.child_dob, time_of_birth = EXCLUDED.time_of_birth, place_of_birth = EXCLUDED.place_of_birth`,
      [
        orderId,
        customerData.email || '',
        customerData.name || 'Customer',
        customerData.mobile || '',
        customerData.dob || null,
        customerData.gender || null,
        customerData.city || null,
        customerData.pinCode || null,
        customerData.person1Name || null,
        customerData.person1FirstName || null,
        customerData.person1MiddleName || null,
        customerData.person1MiddleNameType || null,
        customerData.person1SurName || null,
        customerData.person1Dob || null,
        customerData.person1Gender || null,
        customerData.person2Name || null,
        customerData.person2FirstName || null,
        customerData.person2MiddleName || null,
        customerData.person2MiddleNameType || null,
        customerData.person2SurName || null,
        customerData.person2Dob || null,
        customerData.person2Gender || null,
        customerData.person3Name || null,
        customerData.person3FirstName || null,
        customerData.person3MiddleName || null,
        customerData.person3MiddleNameType || null,
        customerData.person3SurName || null,
        customerData.person3Dob || null,
        customerData.person3Gender || null,
        customerData.fatherFirstName || null,
        customerData.fatherMiddleName || null,
        customerData.fatherMiddleNameType || null,
        customerData.fatherLastName || null,
        customerData.childDob || null,
        customerData.timeOfBirth || null,
        customerData.placeOfBirth || null,
      ]
    );

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('saveOrderAndCustomer error:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Save or update payment record and update order status (called from payment-status and webhook)
 */
export async function savePayment(orderId, transactionId, amountPaise, status) {
  const p = getPool();
  if (!p) return false;

  await ensureSchemaOnce();

  const ord = `${DB_SCHEMA}.orders`;
  const pay = `${DB_SCHEMA}.payment`;

  try {
    const amountRupees = (amountPaise || 0) / 100;
    await p.query(
      `INSERT INTO ${ord} (order_id, amount, package_type, status)
       VALUES ($1, $2, 'single', $3)
       ON CONFLICT (order_id) DO UPDATE SET status = EXCLUDED.status`,
      [orderId, amountRupees, status]
    );

    await p.query(
      `INSERT INTO ${pay} (order_id, transaction_id, amount_paise, status)
       VALUES ($1, $2, $3, $4)`,
      [orderId, transactionId || null, amountPaise || 0, status]
    );

    return true;
  } catch (error) {
    console.error('savePayment error:', error.message);
    throw error;
  }
}

/**
 * Log a sent email for analytics/debugging (optional table `emailDelivery`).
 */
export async function recordEmailDelivery(email, deliveryStatus = 'sent') {
  const p = getPool();
  if (!p || !email) return false;
  await ensureSchemaOnce();
  try {
    await p.query(
      `INSERT INTO ${DB_SCHEMA}."emailDelivery" (email, status, sent_at)
       VALUES ($1, $2, NOW())`,
      [email, deliveryStatus]
    );
    return true;
  } catch (error) {
    console.error('recordEmailDelivery error:', error.message);
    return false;
  }
}

/**
 * Fetch all orders with customer details and payments (for admin)
 */
export async function getOrders() {
  const p = getPool();
  if (!p) return [];

  await ensureSchemaOnce();

  const ord = `${DB_SCHEMA}.orders`;
  const cust = `${DB_SCHEMA}.customer_details`;
  const pay = `${DB_SCHEMA}.payment`;

  try {
    const result = await p.query(`
      SELECT 
        o.order_id, o.amount, o.package_type, o.status as order_status, o.created_at as order_created_at,
        c.email, c.name, c.mobile, c.dob, c.gender, c.city, c.pin_code,
        c.person1_name, c.person1_first_name, c.person1_middle_name, c.person1_sur_name, c.person1_dob, c.person1_gender,
        c.person2_name, c.person2_first_name, c.person2_middle_name, c.person2_sur_name, c.person2_dob, c.person2_gender,
        c.person3_name, c.person3_first_name, c.person3_middle_name, c.person3_sur_name, c.person3_dob, c.person3_gender,
father_last_name, c.child_dob, c.time_of_birth, c.place_of_birth,
  c.father_full_name, c.child_last_name, c.father_first_as_middle, c.child_middle_name, c.name_options,
        p.id as payment_id, p.transaction_id, p.amount_paise, p.status as payment_status, p.created_at as payment_created_at
      FROM ${ord} o
      LEFT JOIN ${cust} c ON o.order_id = c.order_id
      LEFT JOIN (
        SELECT DISTINCT ON (order_id) id, order_id, transaction_id, amount_paise, status, created_at
        FROM ${pay}
        ORDER BY order_id, created_at DESC
      ) p ON o.order_id = p.order_id
      ORDER BY o.created_at DESC
    `);
    return result.rows || [];
  } catch (error) {
    console.error('getOrders error:', error.message);
    throw error;
  }
}

/**
 * Get full order details for invoice generation (Edge function format)
 * @param orderId - The merchant order ID
 */
export async function getOrderFull(orderId) {
  const p = getPool();
  if (!p || !orderId) return null;

  await ensureSchemaOnce();

  const ord = `${DB_SCHEMA}.orders`;
  const cust = `${DB_SCHEMA}.customer_details`;
  const pay = `${DB_SCHEMA}.payment`;

  try {
    const result = await p.query(`
      SELECT 
        o.order_id,
        o.amount,
        o.package_type,
        o.created_at,
        c.name as customer_name,
        c.email as customer_email,
        c.mobile as customer_mobile, 
        c.city as customer_city,
        c.pin_code as child_pincode,
        p.transaction_id,
        o.status
      FROM ${ord} o
      LEFT JOIN ${cust} c ON o.order_id = c.order_id
      LEFT JOIN LATERAL (
        SELECT transaction_id FROM ${pay} 
        WHERE order_id = $1 
        ORDER BY created_at DESC LIMIT 1
      ) p ON true
      WHERE o.order_id = $1
    `, [orderId]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      order_id: row.order_id,
      amount: parseFloat(row.amount),
      package_type: row.package_type,
      transaction_id: row.transaction_id || null,
      customer_name: row.name || 'Customer',
      customer_email: row.email || '',
      customer_mobile: row.mobile || '',
      customer_city: row.city || '',
      created_at: row.created_at.toISOString(),
      child_pincode: row.child_pincode || null
    };
  } catch (error) {
    console.error('getOrderFull error:', error.message);
    throw error;
  }
}