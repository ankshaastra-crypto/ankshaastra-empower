
// // api/_utils/db.js
// import './suppress-deprecation.js';
// import pg from 'pg';

// const { Pool } = pg;

// export const DB_SCHEMA = 'ankshaastra';

// let pool = null;
// let schemaChecked = false;

// // ─── Legacy migration (drop old orders table if it has no order_id column) ────
// const LEGACY_MIGRATION_SQL = `
// DO $$
// BEGIN
//   IF EXISTS (
//     SELECT 1 FROM information_schema.tables
//     WHERE table_schema = '${DB_SCHEMA}' AND table_name = 'orders'
//   ) AND NOT EXISTS (
//     SELECT 1 FROM information_schema.columns
//     WHERE table_schema = '${DB_SCHEMA}' AND table_name = 'orders' AND column_name = 'order_id'
//   ) THEN
//     EXECUTE 'DROP TABLE IF EXISTS ${DB_SCHEMA}.orders CASCADE';
//   END IF;
// END $$;
// `;

// // ─── Full schema (CREATE TABLE IF NOT EXISTS — safe to run repeatedly) ─────────
// const SCHEMA_SQL = `
// CREATE SCHEMA IF NOT EXISTS ${DB_SCHEMA};

// CREATE TABLE IF NOT EXISTS ${DB_SCHEMA}.orders (
//   order_id VARCHAR(100) PRIMARY KEY,
//   amount DECIMAL(12, 2) NOT NULL,
//   package_type VARCHAR(50) NOT NULL DEFAULT 'single',
//   razorpay_order_id VARCHAR(255) UNIQUE,
//   status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
//   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
// );

// CREATE TABLE IF NOT EXISTS ${DB_SCHEMA}.customer_details (
//   id SERIAL PRIMARY KEY,
//   order_id VARCHAR(100) NOT NULL REFERENCES ${DB_SCHEMA}.orders(order_id) ON DELETE CASCADE,
//   email VARCHAR(255) NOT NULL,
//   name VARCHAR(255) NOT NULL,
//   mobile VARCHAR(20) NOT NULL,
//   dob VARCHAR(50),
//   gender VARCHAR(20),
//   city VARCHAR(100),
//   state VARCHAR(100),
//   pin_code VARCHAR(20),
//   person1_name VARCHAR(255),
//   person1_first_name VARCHAR(100),
//   person1_middle_name VARCHAR(100),
//   person1_middle_name_type VARCHAR(50),
//   person1_sur_name VARCHAR(100),
//   person1_dob VARCHAR(50),
//   person1_gender VARCHAR(20),
//   person2_name VARCHAR(255),
//   person2_first_name VARCHAR(100),
//   person2_middle_name VARCHAR(100),
//   person2_middle_name_type VARCHAR(50),
//   person2_sur_name VARCHAR(100),
//   person2_dob VARCHAR(50),
//   person2_gender VARCHAR(20),
//   person3_name VARCHAR(255),
//   person3_first_name VARCHAR(100),
//   person3_middle_name VARCHAR(100),
//   person3_middle_name_type VARCHAR(50),
//   person3_sur_name VARCHAR(100),
//   person3_dob VARCHAR(50),
//   person3_gender VARCHAR(20),
//   father_first_name VARCHAR(100),
//   father_middle_name VARCHAR(100),
//   father_middle_name_type VARCHAR(50),
//   father_last_name VARCHAR(100),
//   child_dob VARCHAR(50),
//   time_of_birth VARCHAR(50),
//   place_of_birth VARCHAR(255),
//   father_full_name VARCHAR(255),
//   child_last_name VARCHAR(255),
//   father_first_as_middle VARCHAR(50),
//   child_middle_name VARCHAR(255),
//   name_options TEXT,
//   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//   UNIQUE(order_id)
// );

// CREATE TABLE IF NOT EXISTS ${DB_SCHEMA}.payment (
//   id SERIAL PRIMARY KEY,
//   order_id VARCHAR(100) NOT NULL REFERENCES ${DB_SCHEMA}.orders(order_id) ON DELETE CASCADE,
//   transaction_id VARCHAR(255),
//   amount_paise BIGINT NOT NULL DEFAULT 0,
//   status VARCHAR(20) NOT NULL,
//   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
// );

// CREATE TABLE IF NOT EXISTS ${DB_SCHEMA}."emailDelivery" (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   email TEXT NOT NULL,
//   order_id VARCHAR(100),
//   status TEXT,
//   sent_at TIMESTAMPTZ,
//   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//   UNIQUE(email, order_id)
// );

// CREATE INDEX IF NOT EXISTS idx_customer_details_order_id ON ${DB_SCHEMA}.customer_details(order_id);
// CREATE INDEX IF NOT EXISTS idx_payment_order_id ON ${DB_SCHEMA}.payment(order_id);
// CREATE INDEX IF NOT EXISTS idx_payment_transaction_id ON ${DB_SCHEMA}.payment(transaction_id);
// CREATE INDEX IF NOT EXISTS idx_orders_created_at ON ${DB_SCHEMA}.orders(created_at);
// CREATE INDEX IF NOT EXISTS idx_orders_status ON ${DB_SCHEMA}.orders(status);

// -- Invoice sequence counter (one row per financial year)
// CREATE TABLE IF NOT EXISTS ${DB_SCHEMA}.invoice_sequence (
//   financial_year VARCHAR(10) PRIMARY KEY,
//   last_sequence  INTEGER NOT NULL DEFAULT 0
// );

// -- Invoice records (one row per order)
// CREATE TABLE IF NOT EXISTS ${DB_SCHEMA}.invoices (
//   id             SERIAL PRIMARY KEY,
//   order_id       VARCHAR(100) NOT NULL UNIQUE,
//   invoice_number VARCHAR(20)  NOT NULL UNIQUE,
//   financial_year VARCHAR(10)  NOT NULL,
//   customer_name  VARCHAR(255),
//   customer_email VARCHAR(255),
//   amount         DECIMAL(12,2),
//   package_type   VARCHAR(50),
//   transaction_id VARCHAR(255),
//   created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
// );

// CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON ${DB_SCHEMA}.invoices(order_id);
// CREATE INDEX IF NOT EXISTS idx_invoices_financial_year ON ${DB_SCHEMA}.invoices(financial_year);
// `;

// // ─── Column migration: ADD missing columns to EXISTING tables ─────────────────
// // This fixes the "column does not exist" error on live DBs created before
// // these columns were added. ALTER TABLE ADD COLUMN IF NOT EXISTS is idempotent.
// const COLUMN_MIGRATION_SQL = `
// ALTER TABLE ${DB_SCHEMA}.customer_details ADD COLUMN IF NOT EXISTS father_full_name VARCHAR(255);
// ALTER TABLE ${DB_SCHEMA}.customer_details ADD COLUMN IF NOT EXISTS child_last_name VARCHAR(255);
// ALTER TABLE ${DB_SCHEMA}.customer_details ADD COLUMN IF NOT EXISTS father_first_as_middle VARCHAR(50);
// ALTER TABLE ${DB_SCHEMA}.customer_details ADD COLUMN IF NOT EXISTS child_middle_name VARCHAR(255);
// ALTER TABLE ${DB_SCHEMA}.customer_details ADD COLUMN IF NOT EXISTS name_options TEXT;
// ALTER TABLE ${DB_SCHEMA}.customer_details ADD COLUMN IF NOT EXISTS place_of_birth VARCHAR(255);
// ALTER TABLE ${DB_SCHEMA}.customer_details ADD COLUMN IF NOT EXISTS last_name_spelling_ok VARCHAR(50);
// ALTER TABLE ${DB_SCHEMA}.customer_details ADD COLUMN IF NOT EXISTS state VARCHAR(100);
// ALTER TABLE ${DB_SCHEMA}.orders ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255);
// `;

// // Create invoice tables if they don't exist yet (separate from SCHEMA_SQL for safety)
// const INVOICE_TABLE_SQL = `
// CREATE TABLE IF NOT EXISTS ${DB_SCHEMA}.invoice_sequence (
//   financial_year VARCHAR(10) PRIMARY KEY,
//   last_sequence  INTEGER NOT NULL DEFAULT 0
// );
// CREATE TABLE IF NOT EXISTS ${DB_SCHEMA}.invoices (
//   id             SERIAL PRIMARY KEY,
//   order_id       VARCHAR(100) NOT NULL UNIQUE,
//   invoice_number VARCHAR(20)  NOT NULL UNIQUE,
//   financial_year VARCHAR(10)  NOT NULL,
//   customer_name  VARCHAR(255),
//   customer_email VARCHAR(255),
//   amount         DECIMAL(12,2),
//   package_type   VARCHAR(50),
//   transaction_id VARCHAR(255),
//   created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
// );
// CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON ${DB_SCHEMA}.invoices(order_id);
// CREATE INDEX IF NOT EXISTS idx_invoices_financial_year ON ${DB_SCHEMA}.invoices(financial_year);
// `;

// const REQUIRED_TABLES = ['orders', 'customer_details', 'payment', 'emailDelivery'];

// // ─── ensureSchemaOnce ──────────────────────────────────────────────────────────
// export async function ensureSchemaOnce(force = false) {
//   if (!force && schemaChecked) return;
//   const p = getPool();
//   if (!p) {
//     schemaChecked = true;
//     return;
//   }

//   try {
//     // Check which tables already exist
//     const tbl = await p.query(
//       `SELECT table_name FROM information_schema.tables
//        WHERE table_schema = $1 AND table_name = ANY($2::text[])`,
//       [DB_SCHEMA, REQUIRED_TABLES]
//     );
//     const found = new Set(tbl.rows.map((row) => row.table_name));
//     const allPresent = REQUIRED_TABLES.every((name) => found.has(name));

//     if (!allPresent) {
//       // Tables missing — run full schema creation
//       await p.query(LEGACY_MIGRATION_SQL);
//       const statements = SCHEMA_SQL.split(';').map(s => s.trim()).filter(Boolean);
//       for (const stmt of statements) {
//         await p.query(stmt + ';');
//       }
//       console.log(`✅ DB schema initialized (${DB_SCHEMA})`);
//     }

//     // Always run column migration — adds missing columns to existing tables
//     // ALTER TABLE ... ADD COLUMN IF NOT EXISTS is safe to run every time
//     const colStatements = COLUMN_MIGRATION_SQL.split(';').map(s => s.trim()).filter(Boolean);
//     for (const stmt of colStatements) {
//       await p.query(stmt + ';');
//     }
//     console.log(`✅ DB column migration complete`);

//     // Create invoice tables (idempotent)
//     const invoiceStmts = INVOICE_TABLE_SQL.split(';').map(s => s.trim()).filter(Boolean);
//     for (const stmt of invoiceStmts) {
//       await p.query(stmt + ';');
//     }

//     // Seed invoice_sequence starting point: 6999 means next invoice = 7000
//     // ON CONFLICT DO NOTHING — never resets an existing sequence
//     await p.query(
//       `INSERT INTO ${DB_SCHEMA}.invoice_sequence (financial_year, last_sequence)
//        SELECT fy, 6999
//        FROM (VALUES
//          ('26-27'), ('27-28'), ('28-29'), ('29-30'), ('30-31')
//        ) AS t(fy)
//        ON CONFLICT (financial_year) DO NOTHING`
//     );
//     console.log('✅ Invoice sequence initialized (starting at 6999)');

//     schemaChecked = true;
//   } catch (err) {
//     console.error('ensureSchema error:', err.message);
//     // Don't block — try to continue anyway
//     schemaChecked = true;
//   }
// }

// // ─── getPool ──────────────────────────────────────────────────────────────────
// export function getPool() {
//   if (!pool) {
//     let connectionString = process.env.DATABASE_URL;
//     if (!connectionString) return null;

//     // Strip sslmode from URI — use explicit ssl object (pooler-friendly)
//     connectionString = connectionString.replace(/[?&]sslmode=[^&]*/g, '');
//     connectionString = connectionString.replace(/\?$/, '').replace(/\?&/, '?');

//     const poolConfig = {
//       connectionString,
//       max: 5,
//       idleTimeoutMillis: 30000,
//       connectionTimeoutMillis: 15000,
//     };
//     if (connectionString.includes('supabase')) {
//       poolConfig.ssl = { rejectUnauthorized: false };
//     }
//     pool = new Pool(poolConfig);
//   }
//   return pool;
// }

// // ─── query ────────────────────────────────────────────────────────────────────
// export async function query(text, params) {
//   const p = getPool();
//   if (!p) return null;
//   try {
//     return await p.query(text, params);
//   } catch (error) {
//     console.error('DB query error:', error.message);
//     throw error;
//   }
// }

// // ─── saveOrderAndCustomer ────────────────────────────────────────────────────
// // Called from initiate-payment — saves order + all customer form fields
// export async function saveOrderAndCustomer(orderId, amount, packageType, customerData) {
//   const p = getPool();
//   if (!p) return false;

//   await ensureSchemaOnce();

//   const client = await p.connect();
//   const ord  = `${DB_SCHEMA}.orders`;
//   const cust = `${DB_SCHEMA}.customer_details`;
//   try {
//     await client.query('BEGIN');

//     // Upsert order with optional Razorpay order mapping
//     await client.query(
//       `INSERT INTO ${ord} (order_id, amount, package_type, razorpay_order_id, status)
//        VALUES ($1, $2, $3, $4, 'PENDING')
//        ON CONFLICT (order_id) DO UPDATE SET
//          amount = EXCLUDED.amount,
//          package_type = EXCLUDED.package_type,
//          razorpay_order_id = COALESCE(EXCLUDED.razorpay_order_id, ${DB_SCHEMA}.orders.razorpay_order_id)`,
//       [orderId, amount, packageType || 'single', customerData.razorpayOrderId || null]
//     );

//     // Upsert customer details — all 41 columns, all 41 values
//     await client.query(
//       `INSERT INTO ${cust} (
//         order_id, email, name, mobile, dob, gender, city, pin_code,
//         person1_name, person1_first_name, person1_middle_name, person1_middle_name_type,
//         person1_sur_name, person1_dob, person1_gender,
//         person2_name, person2_first_name, person2_middle_name, person2_middle_name_type,
//         person2_sur_name, person2_dob, person2_gender,
//         person3_name, person3_first_name, person3_middle_name, person3_middle_name_type,
//         person3_sur_name, person3_dob, person3_gender,
//         father_first_name, father_middle_name, father_middle_name_type, father_last_name,
//         child_dob, time_of_birth, place_of_birth,
//         father_full_name, child_last_name, father_first_as_middle,
//         child_middle_name, name_options, last_name_spelling_ok, state
//       ) VALUES (
//         $1,  $2,  $3,  $4,  $5,  $6,  $7,  $8,
//         $9,  $10, $11, $12, $13, $14, $15,
//         $16, $17, $18, $19, $20, $21, $22,
//         $23, $24, $25, $26, $27, $28, $29,
//         $30, $31, $32, $33,
//         $34, $35, $36,
//         $37, $38, $39,
//         $40, $41, $42, $43
//       )
//       ON CONFLICT (order_id) DO UPDATE SET
//         email = EXCLUDED.email,
//         name = EXCLUDED.name,
//         mobile = EXCLUDED.mobile,
//         dob = EXCLUDED.dob,
//         gender = EXCLUDED.gender,
//         city = EXCLUDED.city,
//         pin_code = EXCLUDED.pin_code,
//         person1_name = EXCLUDED.person1_name,
//         person1_first_name = EXCLUDED.person1_first_name,
//         person1_middle_name = EXCLUDED.person1_middle_name,
//         person1_middle_name_type = EXCLUDED.person1_middle_name_type,
//         person1_sur_name = EXCLUDED.person1_sur_name,
//         person1_dob = EXCLUDED.person1_dob,
//         person1_gender = EXCLUDED.person1_gender,
//         person2_name = EXCLUDED.person2_name,
//         person2_first_name = EXCLUDED.person2_first_name,
//         person2_middle_name = EXCLUDED.person2_middle_name,
//         person2_middle_name_type = EXCLUDED.person2_middle_name_type,
//         person2_sur_name = EXCLUDED.person2_sur_name,
//         person2_dob = EXCLUDED.person2_dob,
//         person2_gender = EXCLUDED.person2_gender,
//         person3_name = EXCLUDED.person3_name,
//         person3_first_name = EXCLUDED.person3_first_name,
//         person3_middle_name = EXCLUDED.person3_middle_name,
//         person3_middle_name_type = EXCLUDED.person3_middle_name_type,
//         person3_sur_name = EXCLUDED.person3_sur_name,
//         person3_dob = EXCLUDED.person3_dob,
//         person3_gender = EXCLUDED.person3_gender,
//         father_first_name = EXCLUDED.father_first_name,
//         father_middle_name = EXCLUDED.father_middle_name,
//         father_middle_name_type = EXCLUDED.father_middle_name_type,
//         father_last_name = EXCLUDED.father_last_name,
//         child_dob = EXCLUDED.child_dob,
//         time_of_birth = EXCLUDED.time_of_birth,
//         place_of_birth = EXCLUDED.place_of_birth,
//         father_full_name = EXCLUDED.father_full_name,
//         child_last_name = EXCLUDED.child_last_name,
//         father_first_as_middle = EXCLUDED.father_first_as_middle,
//         child_middle_name = EXCLUDED.child_middle_name,
//         name_options = EXCLUDED.name_options,
//         last_name_spelling_ok = EXCLUDED.last_name_spelling_ok,
//         state = EXCLUDED.state`,
//       [
//         orderId,
//         customerData.email             || '',
//         customerData.name              || 'Customer',
//         customerData.mobile            || '',
//         customerData.dob               || null,   // $5
//         customerData.gender            || null,   // $6
//         customerData.city              || null,   // $7
//         customerData.pinCode           || null,   // $8
//         customerData.person1Name       || null,   // $9
//         customerData.person1FirstName  || null,   // $10
//         customerData.person1MiddleName || null,   // $11
//         customerData.person1MiddleNameType || null, // $12
//         customerData.person1SurName    || null,   // $13
//         customerData.person1Dob        || null,   // $14
//         customerData.person1Gender     || null,   // $15
//         customerData.person2Name       || null,   // $16
//         customerData.person2FirstName  || null,   // $17
//         customerData.person2MiddleName || null,   // $18
//         customerData.person2MiddleNameType || null, // $19
//         customerData.person2SurName    || null,   // $20
//         customerData.person2Dob        || null,   // $21
//         customerData.person2Gender     || null,   // $22
//         customerData.person3Name       || null,   // $23
//         customerData.person3FirstName  || null,   // $24
//         customerData.person3MiddleName || null,   // $25
//         customerData.person3MiddleNameType || null, // $26
//         customerData.person3SurName    || null,   // $27
//         customerData.person3Dob        || null,   // $28
//         customerData.person3Gender     || null,   // $29
//         customerData.fatherFirstName   || null,   // $30
//         customerData.fatherMiddleName  || null,   // $31
//         customerData.fatherMiddleNameType || null, // $32
//         customerData.fatherLastName    || null,   // $33
//         customerData.childDob          || null,   // $34
//         customerData.timeOfBirth       || null,   // $35
//         customerData.placeOfBirth      || null,   // $36
//         customerData.fatherFullName    || null,   // $37
//         customerData.childLastName     || null,   // $38
//         customerData.fatherFirstNameAsMiddleName || null, // $39
//         customerData.childMiddleName   || null,   // $40
//         customerData.nameOptions       || null,   // $41
//         customerData.lastNameSpellingChangeOk || null, // $42
//         customerData.state             || null,   // $43
//       ]
//     );

//     await client.query('COMMIT');
//     console.log(`✅ Order + customer saved: ${orderId}`);
//     return true;
//   } catch (error) {
//     await client.query('ROLLBACK');
//     console.error('saveOrderAndCustomer error:', error.message);
//     throw error;
//   } finally {
//     client.release();
//   }
// }

// // ─── savePayment ──────────────────────────────────────────────────────────────
// export async function savePayment(orderId, transactionId, amountPaise, status) {
//   const p = getPool();
//   if (!p) return false;

//   await ensureSchemaOnce();

//   const ord = `${DB_SCHEMA}.orders`;
//   const pay = `${DB_SCHEMA}.payment`;

//   try {
//     const amountRupees = (amountPaise || 0) / 100;
//     await p.query(
//       `INSERT INTO ${ord} (order_id, amount, package_type, status)
//        VALUES ($1, $2, 'single', $3)
//        ON CONFLICT (order_id) DO UPDATE SET status = EXCLUDED.status`,
//       [orderId, amountRupees, status]
//     );
//     await p.query(
//       `INSERT INTO ${pay} (order_id, transaction_id, amount_paise, status)
//        VALUES ($1, $2, $3, $4)`,
//       [orderId, transactionId || null, amountPaise || 0, status]
//     );
//     return true;
//   } catch (error) {
//     console.error('savePayment error:', error.message);
//     throw error;
//   }
// }

// // ─── isEmailSent ────────────────────────────────────────────────────────────────
// // Check if email already sent for this order+recipient (deduplication)
// export async function isEmailSent(email, orderId) {
//   const p = getPool();
//   if (!p || !email || !orderId) return false;
//   try {
//     const result = await p.query(
//       `SELECT 1 FROM ${DB_SCHEMA}."emailDelivery" 
//        WHERE email = $1 AND order_id = $2 AND status = 'sent'`,
//       [email, orderId]
//     );
//     return result.rowCount > 0;
//   } catch (error) {
//     console.error('isEmailSent check failed:', error.message);
//     return false; // Fail open — don't block email
//   }
// }

// // ─── recordEmailDelivery ───────────────────────────────────────────────────────
// export async function recordEmailDelivery(email, orderId, deliveryStatus = 'sent') {
//   const p = getPool();
//   if (!p || !email || !orderId) return false;
//   await ensureSchemaOnce();
//   try {
//     await p.query(
//       `INSERT INTO ${DB_SCHEMA}."emailDelivery" (email, order_id, status, sent_at)
//        VALUES ($1, $2, $3, NOW())
//        ON CONFLICT (email, order_id) DO NOTHING`,
//       [email, orderId, deliveryStatus]
//     );
//     return true;
//   } catch (error) {
//     console.error('recordEmailDelivery error:', error.message);
//     return false;
//   }
// }

// // ─── getOrders ────────────────────────────────────────────────────────────────
// export async function getOrders() {
//   const p = getPool();
//   if (!p) return [];
//   await ensureSchemaOnce();

//   const ord  = `${DB_SCHEMA}.orders`;
//   const cust = `${DB_SCHEMA}.customer_details`;
//   const pay  = `${DB_SCHEMA}.payment`;

//   try {
//     const result = await p.query(`
//       SELECT
//         o.order_id, o.amount, o.package_type,
//         o.status as order_status, o.created_at as order_created_at,
//         c.email, c.name, c.mobile, c.dob, c.gender, c.city, c.pin_code,
//         c.person1_name, c.person1_first_name, c.person1_middle_name,
//         c.person1_sur_name, c.person1_dob, c.person1_gender,
//         c.person2_name, c.person2_first_name, c.person2_middle_name,
//         c.person2_sur_name, c.person2_dob, c.person2_gender,
//         c.person3_name, c.person3_first_name, c.person3_middle_name,
//         c.person3_sur_name, c.person3_dob, c.person3_gender,
//         c.father_last_name, c.child_dob, c.time_of_birth, c.place_of_birth,
//         c.father_full_name, c.child_last_name, c.father_first_as_middle,
//         c.child_middle_name, c.name_options,
//         p.id as payment_id, p.transaction_id, p.amount_paise,
//         p.status as payment_status, p.created_at as payment_created_at
//       FROM ${ord} o
//       LEFT JOIN ${cust} c ON o.order_id = c.order_id
//       LEFT JOIN (
//         SELECT DISTINCT ON (order_id)
//           id, order_id, transaction_id, amount_paise, status, created_at
//         FROM ${pay}
//         ORDER BY order_id, created_at DESC
//       ) p ON o.order_id = p.order_id
//       ORDER BY o.created_at DESC
//     `);
//     return result.rows || [];
//   } catch (error) {
//     console.error('getOrders error:', error.message);
//     throw error;
//   }
// }

// // ─── getOrderFull ─────────────────────────────────────────────────────────────
// export async function getOrderFull(orderId) {
//   const p = getPool();
//   if (!p || !orderId) return null;
//   await ensureSchemaOnce();

//   const ord  = `${DB_SCHEMA}.orders`;
//   const cust = `${DB_SCHEMA}.customer_details`;
//   const pay  = `${DB_SCHEMA}.payment`;

//   try {
//     const result = await p.query(`
//       SELECT
//         o.order_id,
//         o.amount,
//         o.package_type,
//         o.created_at,
//         o.status,
//         c.name    AS customer_name,
//         c.email   AS customer_email,
//         c.mobile  AS customer_mobile,
//         c.city    AS customer_city,
//         c.pin_code AS child_pincode,
//         p.transaction_id
//       FROM ${ord} o
//       LEFT JOIN ${cust} c ON o.order_id = c.order_id
//       LEFT JOIN LATERAL (
//         SELECT transaction_id FROM ${pay}
//         WHERE order_id = $1
//         ORDER BY created_at DESC LIMIT 1
//       ) p ON true
//       WHERE o.order_id = $1
//     `, [orderId]);

//     if (result.rows.length === 0) return null;
//     const row = result.rows[0];
//     return {
//       order_id:        row.order_id,
//       amount:          parseFloat(row.amount),
//       package_type:    row.package_type,
//       transaction_id:  row.transaction_id || null,
//       customer_name:   row.customer_name  || 'Customer',
//       customer_email:  row.customer_email || '',
//       customer_mobile: row.customer_mobile || '',
//       customer_city:   row.customer_city  || '',
//       created_at:      row.created_at.toISOString(),
//       child_pincode:   row.child_pincode  || null,
//     };
//   } catch (error) {
//     console.error('getOrderFull error:', error.message);
//     throw error;
//   }
// }

// export async function getCustomerMetadata(orderId, razorpayOrderId) {
//   const p = getPool();
//   if (!p) return null;
//   await ensureSchemaOnce();

//   try {
//     const result = await p.query(
//       `SELECT
//          c.email,
//          c.name,
//          c.mobile,
//          c.dob,
//          c.gender,
//          c.city,
//          c.pin_code AS "pinCode",
//          c.person1_name AS "person1Name",
//          c.person1_first_name AS "person1FirstName",
//          c.person1_middle_name AS "person1MiddleName",
//          c.person1_middle_name_type AS "person1MiddleNameType",
//          c.person1_sur_name AS "person1SurName",
//          c.person1_dob AS "person1Dob",
//          c.person1_gender AS "person1Gender",
//          c.person2_name AS "person2Name",
//          c.person2_first_name AS "person2FirstName",
//          c.person2_middle_name AS "person2MiddleName",
//          c.person2_middle_name_type AS "person2MiddleNameType",
//          c.person2_sur_name AS "person2SurName",
//          c.person2_dob AS "person2Dob",
//          c.person2_gender AS "person2Gender",
//          c.person3_name AS "person3Name",
//          c.person3_first_name AS "person3FirstName",
//          c.person3_middle_name AS "person3MiddleName",
//          c.person3_middle_name_type AS "person3MiddleNameType",
//          c.person3_sur_name AS "person3SurName",
//          c.person3_dob AS "person3Dob",
//          c.person3_gender AS "person3Gender",
//          c.father_first_name AS "fatherFirstName",
//          c.father_middle_name AS "fatherMiddleName",
//          c.father_middle_name_type AS "fatherMiddleNameType",
//          c.father_last_name AS "fatherLastName",
//          c.father_full_name AS "fatherFullName",
//          c.child_dob AS "childDob",
//          c.time_of_birth AS "timeOfBirth",
//          c.place_of_birth AS "placeOfBirth",
//          c.father_first_as_middle AS "fatherFirstNameAsMiddleName",
//          c.child_middle_name AS "childMiddleName",
//          c.child_last_name AS "childLastName",
//          c.name_options AS "nameOptions",
//          c.last_name_spelling_ok AS "lastNameSpellingChangeOk",
//          o.package_type AS "packageType",
//          o.amount
//        FROM ${DB_SCHEMA}.customer_details c
//        JOIN ${DB_SCHEMA}.orders o ON o.order_id = c.order_id
//        WHERE c.order_id = $1 OR o.razorpay_order_id = $2
//        LIMIT 1`,
//       [orderId, razorpayOrderId]
//     );

//     if (result.rows.length === 0) return null;
//     return result.rows[0];
//   } catch (error) {
//     console.error('getCustomerMetadata error:', error.message);
//     throw error;
//   }
// }

// // ─── getNextInvoiceNumber ─────────────────────────────────────────────────────
// // Atomically increments the sequence for the given financial year and returns
// // a GST-compliant invoice number: EYN{FY}/{NNNN} e.g. EYN26-27/7001
// // Max 16 chars: "EYN26-27/7001" = 13 chars ✅
// export async function getNextInvoiceNumber(financialYear) {
//   const p = getPool();
//   if (!p) throw new Error('Database not configured');

//   await ensureSchemaOnce();

//   // Atomic increment using UPDATE ... RETURNING (no race conditions)
//   const result = await p.query(
//     `INSERT INTO ${DB_SCHEMA}.invoice_sequence (financial_year, last_sequence)
//      VALUES ($1, 7000)
//      ON CONFLICT (financial_year) DO UPDATE
//        SET last_sequence = ${DB_SCHEMA}.invoice_sequence.last_sequence + 1
//      RETURNING last_sequence`,
//     [financialYear]
//   );

//   const seq = result.rows[0].last_sequence;
//   const paddedSeq = String(seq).padStart(4, '0'); // 4 digits minimum
//   return `EYN${financialYear}/${paddedSeq}`; // e.g. EYN26-27/7000
// }

// // ─── saveInvoiceRecord ────────────────────────────────────────────────────────
// // Saves invoice metadata to the invoices table for record-keeping
// export async function saveInvoiceRecord({ orderId, invoiceNumber, financialYear, customerName, customerEmail, amount, packageType, transactionId }) {
//   const p = getPool();
//   if (!p) return false;

//   await ensureSchemaOnce();

//   try {
//     await p.query(
//       `INSERT INTO ${DB_SCHEMA}.invoices
//          (order_id, invoice_number, financial_year, customer_name, customer_email, amount, package_type, transaction_id)
//        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
//        ON CONFLICT (order_id) DO NOTHING`, // Never overwrite existing invoice record
//       [orderId, invoiceNumber, financialYear, customerName || '', customerEmail || '', amount || 0, packageType || 'single', transactionId || null]
//     );
//     return true;
//   } catch (error) {
//     console.error('saveInvoiceRecord error:', error.message);
//     return false;
//   }
// }



// api/_utils/db.js
import './suppress-deprecation.js';
import pg from 'pg';

const { Pool } = pg;

export const DB_SCHEMA = 'ankshaastra';

let pool = null;
let schemaChecked = false;

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
  razorpay_order_id VARCHAR(255) UNIQUE,
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
  state VARCHAR(100),
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
  parents_profession TEXT,
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
  order_id VARCHAR(100),
  status TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(email, order_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_details_order_id ON ${DB_SCHEMA}.customer_details(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_order_id ON ${DB_SCHEMA}.payment(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transaction_id ON ${DB_SCHEMA}.payment(transaction_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON ${DB_SCHEMA}.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON ${DB_SCHEMA}.orders(status);

CREATE TABLE IF NOT EXISTS ${DB_SCHEMA}.invoice_sequence (
  financial_year VARCHAR(10) PRIMARY KEY,
  last_sequence  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ${DB_SCHEMA}.invoices (
  id             SERIAL PRIMARY KEY,
  order_id       VARCHAR(100) NOT NULL UNIQUE,
  invoice_number VARCHAR(20)  NOT NULL UNIQUE,
  financial_year VARCHAR(10)  NOT NULL,
  customer_name  VARCHAR(255),
  customer_email VARCHAR(255),
  amount         DECIMAL(12,2),
  package_type   VARCHAR(50),
  transaction_id VARCHAR(255),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON ${DB_SCHEMA}.invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_financial_year ON ${DB_SCHEMA}.invoices(financial_year);
`;

const COLUMN_MIGRATION_SQL = `
ALTER TABLE ${DB_SCHEMA}.customer_details ADD COLUMN IF NOT EXISTS father_full_name VARCHAR(255);
ALTER TABLE ${DB_SCHEMA}.customer_details ADD COLUMN IF NOT EXISTS child_last_name VARCHAR(255);
ALTER TABLE ${DB_SCHEMA}.customer_details ADD COLUMN IF NOT EXISTS father_first_as_middle VARCHAR(50);
ALTER TABLE ${DB_SCHEMA}.customer_details ADD COLUMN IF NOT EXISTS child_middle_name VARCHAR(255);
ALTER TABLE ${DB_SCHEMA}.customer_details ADD COLUMN IF NOT EXISTS name_options TEXT;
ALTER TABLE ${DB_SCHEMA}.customer_details ADD COLUMN IF NOT EXISTS place_of_birth VARCHAR(255);
ALTER TABLE ${DB_SCHEMA}.customer_details ADD COLUMN IF NOT EXISTS last_name_spelling_ok VARCHAR(50);
ALTER TABLE ${DB_SCHEMA}.customer_details ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE ${DB_SCHEMA}.customer_details ADD COLUMN IF NOT EXISTS parents_profession TEXT;
ALTER TABLE ${DB_SCHEMA}.orders ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255);
`;

const INVOICE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS ${DB_SCHEMA}.invoice_sequence (
  financial_year VARCHAR(10) PRIMARY KEY,
  last_sequence  INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS ${DB_SCHEMA}.invoices (
  id             SERIAL PRIMARY KEY,
  order_id       VARCHAR(100) NOT NULL UNIQUE,
  invoice_number VARCHAR(20)  NOT NULL UNIQUE,
  financial_year VARCHAR(10)  NOT NULL,
  customer_name  VARCHAR(255),
  customer_email VARCHAR(255),
  amount         DECIMAL(12,2),
  package_type   VARCHAR(50),
  transaction_id VARCHAR(255),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON ${DB_SCHEMA}.invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_financial_year ON ${DB_SCHEMA}.invoices(financial_year);
`;

const REQUIRED_TABLES = ['orders', 'customer_details', 'payment', 'emailDelivery'];

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

    if (!allPresent) {
      await p.query(LEGACY_MIGRATION_SQL);
      const statements = SCHEMA_SQL.split(';').map(s => s.trim()).filter(Boolean);
      for (const stmt of statements) {
        await p.query(stmt + ';');
      }
      console.log(`✅ DB schema initialized (${DB_SCHEMA})`);
    }

    const colStatements = COLUMN_MIGRATION_SQL.split(';').map(s => s.trim()).filter(Boolean);
    for (const stmt of colStatements) {
      await p.query(stmt + ';');
    }
    console.log(`✅ DB column migration complete`);

    const invoiceStmts = INVOICE_TABLE_SQL.split(';').map(s => s.trim()).filter(Boolean);
    for (const stmt of invoiceStmts) {
      await p.query(stmt + ';');
    }

    await p.query(
      `INSERT INTO ${DB_SCHEMA}.invoice_sequence (financial_year, last_sequence)
       SELECT fy, 6999
       FROM (VALUES
         ('26-27'), ('27-28'), ('28-29'), ('29-30'), ('30-31')
       ) AS t(fy)
       ON CONFLICT (financial_year) DO NOTHING`
    );
    console.log('✅ Invoice sequence initialized (starting at 6999)');

    schemaChecked = true;
  } catch (err) {
    console.error('ensureSchema error:', err.message);
    schemaChecked = true;
  }
}

export function getPool() {
  if (!pool) {
    let connectionString = process.env.DATABASE_URL;
    if (!connectionString) return null;

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

export async function saveOrderAndCustomer(orderId, amount, packageType, customerData) {
  const p = getPool();
  if (!p) return false;

  await ensureSchemaOnce();

  const client = await p.connect();
  const ord  = `${DB_SCHEMA}.orders`;
  const cust = `${DB_SCHEMA}.customer_details`;
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO ${ord} (order_id, amount, package_type, razorpay_order_id, status)
       VALUES ($1, $2, $3, $4, 'PENDING')
       ON CONFLICT (order_id) DO UPDATE SET
         amount = EXCLUDED.amount,
         package_type = EXCLUDED.package_type,
         razorpay_order_id = COALESCE(EXCLUDED.razorpay_order_id, ${DB_SCHEMA}.orders.razorpay_order_id)`,
      [orderId, amount, packageType || 'single', customerData.razorpayOrderId || null]
    );

    await client.query(
      `INSERT INTO ${cust} (
        order_id, email, name, mobile, dob, gender, city, pin_code,
        person1_name, person1_first_name, person1_middle_name, person1_middle_name_type,
        person1_sur_name, person1_dob, person1_gender,
        person2_name, person2_first_name, person2_middle_name, person2_middle_name_type,
        person2_sur_name, person2_dob, person2_gender,
        person3_name, person3_first_name, person3_middle_name, person3_middle_name_type,
        person3_sur_name, person3_dob, person3_gender,
        father_first_name, father_middle_name, father_middle_name_type, father_last_name,
        child_dob, time_of_birth, place_of_birth,
        father_full_name, child_last_name, father_first_as_middle,
        child_middle_name, name_options, last_name_spelling_ok, state, parents_profession
      ) VALUES (
        $1,  $2,  $3,  $4,  $5,  $6,  $7,  $8,
        $9,  $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22,
        $23, $24, $25, $26, $27, $28, $29,
        $30, $31, $32, $33,
        $34, $35, $36,
        $37, $38, $39,
        $40, $41, $42, $43, $44
      )
      ON CONFLICT (order_id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        mobile = EXCLUDED.mobile,
        dob = EXCLUDED.dob,
        gender = EXCLUDED.gender,
        city = EXCLUDED.city,
        pin_code = EXCLUDED.pin_code,
        person1_name = EXCLUDED.person1_name,
        person1_first_name = EXCLUDED.person1_first_name,
        person1_middle_name = EXCLUDED.person1_middle_name,
        person1_middle_name_type = EXCLUDED.person1_middle_name_type,
        person1_sur_name = EXCLUDED.person1_sur_name,
        person1_dob = EXCLUDED.person1_dob,
        person1_gender = EXCLUDED.person1_gender,
        person2_name = EXCLUDED.person2_name,
        person2_first_name = EXCLUDED.person2_first_name,
        person2_middle_name = EXCLUDED.person2_middle_name,
        person2_middle_name_type = EXCLUDED.person2_middle_name_type,
        person2_sur_name = EXCLUDED.person2_sur_name,
        person2_dob = EXCLUDED.person2_dob,
        person2_gender = EXCLUDED.person2_gender,
        person3_name = EXCLUDED.person3_name,
        person3_first_name = EXCLUDED.person3_first_name,
        person3_middle_name = EXCLUDED.person3_middle_name,
        person3_middle_name_type = EXCLUDED.person3_middle_name_type,
        person3_sur_name = EXCLUDED.person3_sur_name,
        person3_dob = EXCLUDED.person3_dob,
        person3_gender = EXCLUDED.person3_gender,
        father_first_name = EXCLUDED.father_first_name,
        father_middle_name = EXCLUDED.father_middle_name,
        father_middle_name_type = EXCLUDED.father_middle_name_type,
        father_last_name = EXCLUDED.father_last_name,
        child_dob = EXCLUDED.child_dob,
        time_of_birth = EXCLUDED.time_of_birth,
        place_of_birth = EXCLUDED.place_of_birth,
        father_full_name = EXCLUDED.father_full_name,
        child_last_name = EXCLUDED.child_last_name,
        father_first_as_middle = EXCLUDED.father_first_as_middle,
        child_middle_name = EXCLUDED.child_middle_name,
        name_options = EXCLUDED.name_options,
        last_name_spelling_ok = EXCLUDED.last_name_spelling_ok,
        state = EXCLUDED.state,
        parents_profession = EXCLUDED.parents_profession`,
      [
        orderId,
        customerData.email             || '',
        customerData.name              || 'Customer',
        customerData.mobile            || '',
        customerData.dob               || null,
        customerData.gender            || null,
        customerData.city              || null,
        customerData.pinCode           || null,
        customerData.person1Name       || null,
        customerData.person1FirstName  || null,
        customerData.person1MiddleName || null,
        customerData.person1MiddleNameType || null,
        customerData.person1SurName    || null,
        customerData.person1Dob        || null,
        customerData.person1Gender     || null,
        customerData.person2Name       || null,
        customerData.person2FirstName  || null,
        customerData.person2MiddleName || null,
        customerData.person2MiddleNameType || null,
        customerData.person2SurName    || null,
        customerData.person2Dob        || null,
        customerData.person2Gender     || null,
        customerData.person3Name       || null,
        customerData.person3FirstName  || null,
        customerData.person3MiddleName || null,
        customerData.person3MiddleNameType || null,
        customerData.person3SurName    || null,
        customerData.person3Dob        || null,
        customerData.person3Gender     || null,
        customerData.fatherFirstName   || null,
        customerData.fatherMiddleName  || null,
        customerData.fatherMiddleNameType || null,
        customerData.fatherLastName    || null,
        customerData.childDob          || null,
        customerData.timeOfBirth       || null,
        customerData.placeOfBirth      || null,
        customerData.fatherFullName    || null,
        customerData.childLastName     || null,
        customerData.fatherFirstNameAsMiddleName || null,
        customerData.childMiddleName   || null,
        customerData.nameOptions       || null,
        customerData.lastNameSpellingChangeOk || null,
        customerData.state             || null,
        customerData.parentsProfession || null,
      ]
    );

    await client.query('COMMIT');
    console.log(`✅ Order + customer saved: ${orderId}`);
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('saveOrderAndCustomer error:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

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

// Informational check only — kept for any read-only status reporting.
// NOT safe for deduplication by itself; use tryReserveEmailSend() for that.
export async function isEmailSent(email, orderId) {
  const p = getPool();
  if (!p || !email || !orderId) return false;
  try {
    const result = await p.query(
      `SELECT 1 FROM ${DB_SCHEMA}."emailDelivery" 
       WHERE email = $1 AND order_id = $2 AND status = 'sent'`,
      [email, orderId]
    );
    return result.rowCount > 0;
  } catch (error) {
    console.error('isEmailSent check failed:', error.message);
    return false;
  }
}

// Atomic reservation: INSERT guarded by UNIQUE(email, order_id). Only the
// caller whose INSERT succeeds is allowed to send.
// FAIL-CLOSED on any DB error or missing DB config — on error we do NOT
// send. Previously this returned true ("send anyway") on error, and under
// concurrent load (webhook + payment-status firing together) that caused
// every concurrent caller to send, producing duplicate emails. A missed
// email (recoverable) is safer than a duplicate (looks unprofessional).
export async function tryReserveEmailSend(email, orderId) {
  const p = getPool();
  if (!p || !email || !orderId) return false;

  try {
    await ensureSchemaOnce();
  } catch {
    // Schema check failing doesn't mean the table is missing — still try
    // the reservation insert below.
  }

  try {
    const result = await p.query(
      `INSERT INTO ${DB_SCHEMA}."emailDelivery" (email, order_id, status, sent_at)
       VALUES ($1, $2, 'pending', NOW())
       ON CONFLICT (email, order_id) DO NOTHING
       RETURNING id`,
      [email, orderId]
    );
    return result.rowCount > 0;
  } catch (error) {
    console.error('tryReserveEmailSend failed — skipping send to avoid duplicate:', error.message);
    return false;
  }
}

// Call after a reserved email has actually been sent successfully.
export async function markEmailSent(email, orderId) {
  const p = getPool();
  if (!p || !email || !orderId) return false;
  try {
    await p.query(
      `UPDATE ${DB_SCHEMA}."emailDelivery" SET status = 'sent', sent_at = NOW()
       WHERE email = $1 AND order_id = $2`,
      [email, orderId]
    );
    return true;
  } catch (error) {
    console.error('markEmailSent error:', error.message);
    return false;
  }
}

// If sending fails after a successful reservation, remove the pending row so
// a future retry for this order isn't permanently blocked.
export async function releaseEmailReservation(email, orderId) {
  const p = getPool();
  if (!p || !email || !orderId) return false;
  try {
    await p.query(
      `DELETE FROM ${DB_SCHEMA}."emailDelivery"
       WHERE email = $1 AND order_id = $2 AND status = 'pending'`,
      [email, orderId]
    );
    return true;
  } catch (error) {
    console.error('releaseEmailReservation error:', error.message);
    return false;
  }
}

// Kept for any other call sites still using the old pattern directly.
export async function recordEmailDelivery(email, orderId, deliveryStatus = 'sent') {
  const p = getPool();
  if (!p || !email || !orderId) return false;
  await ensureSchemaOnce();
  try {
    await p.query(
      `INSERT INTO ${DB_SCHEMA}."emailDelivery" (email, order_id, status, sent_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (email, order_id) DO UPDATE SET status = EXCLUDED.status, sent_at = NOW()`,
      [email, orderId, deliveryStatus]
    );
    return true;
  } catch (error) {
    console.error('recordEmailDelivery error:', error.message);
    return false;
  }
}

export async function getOrders() {
  const p = getPool();
  if (!p) return [];
  await ensureSchemaOnce();

  const ord  = `${DB_SCHEMA}.orders`;
  const cust = `${DB_SCHEMA}.customer_details`;
  const pay  = `${DB_SCHEMA}.payment`;

  try {
    const result = await p.query(`
      SELECT
        o.order_id, o.amount, o.package_type,
        o.status as order_status, o.created_at as order_created_at,
        c.email, c.name, c.mobile, c.dob, c.gender, c.city, c.pin_code,
        c.person1_name, c.person1_first_name, c.person1_middle_name,
        c.person1_sur_name, c.person1_dob, c.person1_gender,
        c.person2_name, c.person2_first_name, c.person2_middle_name,
        c.person2_sur_name, c.person2_dob, c.person2_gender,
        c.person3_name, c.person3_first_name, c.person3_middle_name,
        c.person3_sur_name, c.person3_dob, c.person3_gender,
        c.father_last_name, c.child_dob, c.time_of_birth, c.place_of_birth,
        c.father_full_name, c.child_last_name, c.father_first_as_middle,
        c.child_middle_name, c.name_options,
        p.id as payment_id, p.transaction_id, p.amount_paise,
        p.status as payment_status, p.created_at as payment_created_at
      FROM ${ord} o
      LEFT JOIN ${cust} c ON o.order_id = c.order_id
      LEFT JOIN (
        SELECT DISTINCT ON (order_id)
          id, order_id, transaction_id, amount_paise, status, created_at
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

export async function getOrderFull(orderId) {
  const p = getPool();
  if (!p || !orderId) return null;
  await ensureSchemaOnce();

  const ord  = `${DB_SCHEMA}.orders`;
  const cust = `${DB_SCHEMA}.customer_details`;
  const pay  = `${DB_SCHEMA}.payment`;

  try {
    const result = await p.query(`
      SELECT
        o.order_id,
        o.amount,
        o.package_type,
        o.created_at,
        o.status,
        c.name    AS customer_name,
        c.email   AS customer_email,
        c.mobile  AS customer_mobile,
        c.city    AS customer_city,
        c.pin_code AS child_pincode,
        p.transaction_id
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
      order_id:        row.order_id,
      amount:          parseFloat(row.amount),
      package_type:    row.package_type,
      transaction_id:  row.transaction_id || null,
      customer_name:   row.customer_name  || 'Customer',
      customer_email:  row.customer_email || '',
      customer_mobile: row.customer_mobile || '',
      customer_city:   row.customer_city  || '',
      created_at:      row.created_at.toISOString(),
      child_pincode:   row.child_pincode  || null,
    };
  } catch (error) {
    console.error('getOrderFull error:', error.message);
    throw error;
  }
}

export async function getCustomerMetadata(orderId, razorpayOrderId) {
  const p = getPool();
  if (!p) return null;
  await ensureSchemaOnce();

  try {
    const result = await p.query(
      `SELECT
         c.email,
         c.name,
         c.mobile,
         c.dob,
         c.gender,
         c.city,
         c.pin_code AS "pinCode",
         c.person1_name AS "person1Name",
         c.person1_first_name AS "person1FirstName",
         c.person1_middle_name AS "person1MiddleName",
         c.person1_middle_name_type AS "person1MiddleNameType",
         c.person1_sur_name AS "person1SurName",
         c.person1_dob AS "person1Dob",
         c.person1_gender AS "person1Gender",
         c.person2_name AS "person2Name",
         c.person2_first_name AS "person2FirstName",
         c.person2_middle_name AS "person2MiddleName",
         c.person2_middle_name_type AS "person2MiddleNameType",
         c.person2_sur_name AS "person2SurName",
         c.person2_dob AS "person2Dob",
         c.person2_gender AS "person2Gender",
         c.person3_name AS "person3Name",
         c.person3_first_name AS "person3FirstName",
         c.person3_middle_name AS "person3MiddleName",
         c.person3_middle_name_type AS "person3MiddleNameType",
         c.person3_sur_name AS "person3SurName",
         c.person3_dob AS "person3Dob",
         c.person3_gender AS "person3Gender",
         c.father_first_name AS "fatherFirstName",
         c.father_middle_name AS "fatherMiddleName",
         c.father_middle_name_type AS "fatherMiddleNameType",
         c.father_last_name AS "fatherLastName",
         c.father_full_name AS "fatherFullName",
         c.child_dob AS "childDob",
         c.time_of_birth AS "timeOfBirth",
         c.place_of_birth AS "placeOfBirth",
         c.father_first_as_middle AS "fatherFirstNameAsMiddleName",
         c.child_middle_name AS "childMiddleName",
         c.child_last_name AS "childLastName",
          c.name_options AS "nameOptions",
          c.last_name_spelling_ok AS "lastNameSpellingChangeOk",
          c.parents_profession AS "parentsProfession",
          o.package_type AS "packageType",
          o.amount
       FROM ${DB_SCHEMA}.customer_details c
       JOIN ${DB_SCHEMA}.orders o ON o.order_id = c.order_id
       WHERE c.order_id = $1 OR o.razorpay_order_id = $2
       LIMIT 1`,
      [orderId, razorpayOrderId]
    );

    if (result.rows.length === 0) return null;
    return result.rows[0];
  } catch (error) {
    console.error('getCustomerMetadata error:', error.message);
    throw error;
  }
}

export async function getNextInvoiceNumber(financialYear) {
  const p = getPool();
  if (!p) throw new Error('Database not configured');

  await ensureSchemaOnce();

  const result = await p.query(
    `INSERT INTO ${DB_SCHEMA}.invoice_sequence (financial_year, last_sequence)
     VALUES ($1, 7000)
     ON CONFLICT (financial_year) DO UPDATE
       SET last_sequence = ${DB_SCHEMA}.invoice_sequence.last_sequence + 1
     RETURNING last_sequence`,
    [financialYear]
  );

  const seq = result.rows[0].last_sequence;
  const paddedSeq = String(seq).padStart(4, '0');
  return `EYN${financialYear}/${paddedSeq}`;
}

export async function saveInvoiceRecord({ orderId, invoiceNumber, financialYear, customerName, customerEmail, amount, packageType, transactionId }) {
  const p = getPool();
  if (!p) return false;

  await ensureSchemaOnce();

  try {
    await p.query(
      `INSERT INTO ${DB_SCHEMA}.invoices
         (order_id, invoice_number, financial_year, customer_name, customer_email, amount, package_type, transaction_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (order_id) DO NOTHING`,
      [orderId, invoiceNumber, financialYear, customerName || '', customerEmail || '', amount || 0, packageType || 'single', transactionId || null]
    );
    return true;
  } catch (error) {
    console.error('saveInvoiceRecord error:', error.message);
    return false;
  }
}

