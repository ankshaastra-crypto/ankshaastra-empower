// Suppress DEP0169 deprecation warning from dependencies
import './suppress-deprecation.js';

// Load .env for local development (Vercel injects env in production)
import 'dotenv/config';

import pg from 'pg';

const { Pool } = pg;

let pool = null;
let schemaChecked = false;

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
 * Ensure tables exist - runs once per serverless instance on first DB use.
 * Creates tables if they don't exist (idempotent).
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
    const r = await p.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders'`
    );
    if (r.rows && r.rows.length > 0) {
      schemaChecked = true;
      return;
    }
  } catch {
    /* tables don't exist, fall through to create */
  }
  try {
    const statements = SCHEMA_SQL.split(';').map((s) => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      if (stmt) await p.query(stmt + ';');
    }
    console.log('DB schema initialized (tables created)');
    schemaChecked = true;
  } catch (err) {
    console.error('ensureSchema error:', err.message);
    // Don't set schemaChecked so we retry on next request
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
    // Supabase requires SSL - append sslmode if not present
    if (connectionString.includes('supabase') && !connectionString.includes('sslmode=')) {
      connectionString += (connectionString.includes('?') ? '&' : '?') + 'sslmode=require';
    }
    const poolConfig = {
      connectionString,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };
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
  try {
    await client.query('BEGIN');

    // Insert order
    await client.query(
      `INSERT INTO orders (order_id, amount, package_type, status)
       VALUES ($1, $2, $3, 'PENDING')
       ON CONFLICT (order_id) DO UPDATE SET amount = EXCLUDED.amount, package_type = EXCLUDED.package_type`,
      [orderId, amount, packageType || 'single']
    );

    // Insert/update customer details
    await client.query(
      `INSERT INTO customer_details (
        order_id, email, name, mobile, dob, gender, city, pin_code,
        person1_name, person1_first_name, person1_middle_name, person1_middle_name_type, person1_sur_name, person1_dob, person1_gender,
        person2_name, person2_first_name, person2_middle_name, person2_middle_name_type, person2_sur_name, person2_dob, person2_gender,
        person3_name, person3_first_name, person3_middle_name, person3_middle_name_type, person3_sur_name, person3_dob, person3_gender,
        father_first_name, father_middle_name, father_middle_name_type, father_last_name, child_dob, time_of_birth, place_of_birth
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35)
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

  try {
    // Ensure order exists (webhook may fire before user returns; order created at initiate-payment)
    const amountRupees = (amountPaise || 0) / 100;
    await p.query(
      `INSERT INTO orders (order_id, amount, package_type, status)
       VALUES ($1, $2, 'single', $3)
       ON CONFLICT (order_id) DO UPDATE SET status = EXCLUDED.status`,
      [orderId, amountRupees, status]
    );

    // Insert payment record
    await p.query(
      `INSERT INTO payment (order_id, transaction_id, amount_paise, status)
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
 * Fetch all orders with customer details and payments (for admin)
 */
export async function getOrders() {
  const p = getPool();
  if (!p) return [];

  await ensureSchemaOnce();

  try {
    const result = await p.query(`
      SELECT 
        o.order_id, o.amount, o.package_type, o.status as order_status, o.created_at as order_created_at,
        c.email, c.name, c.mobile, c.dob, c.gender, c.city, c.pin_code,
        c.person1_name, c.person1_first_name, c.person1_middle_name, c.person1_sur_name, c.person1_dob, c.person1_gender,
        c.person2_name, c.person2_first_name, c.person2_middle_name, c.person2_sur_name, c.person2_dob, c.person2_gender,
        c.person3_name, c.person3_first_name, c.person3_middle_name, c.person3_sur_name, c.person3_dob, c.person3_gender,
        c.father_first_name, c.father_middle_name, c.father_last_name, c.child_dob, c.time_of_birth, c.place_of_birth,
        p.id as payment_id, p.transaction_id, p.amount_paise, p.status as payment_status, p.created_at as payment_created_at
      FROM orders o
      LEFT JOIN customer_details c ON o.order_id = c.order_id
      LEFT JOIN (
        SELECT DISTINCT ON (order_id) id, order_id, transaction_id, amount_paise, status, created_at
        FROM payment
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
