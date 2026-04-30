// functions/api/_utils/d1-db.js — Cloudflare D1 SQLite adapter
// Replaces pg Pool for Cloudflare Workers. Uses SQLite syntax.

// ─── Get D1 database from request context ───────────────────────────────────
// In Cloudflare Pages Functions, D1 is bound via env.DB
export function getD1(env) {
  if (!env?.DB) return null;
  return env.DB;
}

// ─── Helper: convert PostgreSQL named params ($1, $2) to SQLite (?, ?) ─────
function toSQLiteParams(sql, params) {
  const sqliteSql = sql.replace(/\$\d+/g, () => '?');
  return { sql: sqliteSql, params };
}

// ─── d1Query: run a SELECT query and return { rows, success, meta, rowCount } ─
export async function d1Query(d1, sql, params = []) {
  if (!d1) throw new Error('D1 not available');
  try {
    const { sql: sqliteSql, params: sqliteParams } = toSQLiteParams(sql, params);
    const stmt = d1.prepare(sqliteSql).bind(...sqliteParams);
    const result = await stmt.all();
    return {
      rows: result.results || [],
      success: true,
      meta: result.meta,
      rowCount: result.results?.length || 0,
    };
  } catch (error) {
    console.error('D1 query error:', error.message, 'SQL:', sql);
    throw error;
  }
}

// ─── d1Run: for INSERT/UPDATE/DELETE, returns { success, meta, changes, lastRowId } ─
export async function d1Run(d1, sql, params = []) {
  if (!d1) throw new Error('D1 not available');
  try {
    const { sql: sqliteSql, params: sqliteParams } = toSQLiteParams(sql, params);
    const stmt = d1.prepare(sqliteSql).bind(...sqliteParams);
    const result = await stmt.run();
    return {
      success: true,
      meta: result.meta,
      changes: result.meta?.changes || 0,
      lastRowId: result.meta?.last_row_id || null,
    };
  } catch (error) {
    console.error('D1 run error:', error.message, 'SQL:', sql);
    throw error;
  }
}

// ─── d1Exec: for raw SQL (schema creation) ─────────────────────────────────
// D1 doesn't support multi-statement exec - need to split and run each statement
export async function d1Exec(d1, sql) {
  if (!d1) throw new Error('D1 not available');
  // Split by semicolon to get individual statements
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));
  
  let successCount = 0;
  for (const stmt of statements) {
    try {
      await d1.prepare(stmt).run();
      successCount++;
    } catch (e) {
      // Log but don't fail - table may already exist
      console.warn('D1 stmt warning:', e.message, '_stmt:', stmt.substring(0, 50));
    }
  }
  return { success: true, executed: successCount };
}

// ═════════════════════════════════════════════════════════════════════════════
// SCHEMA INITIALIZATION (SQLite version)
// ═════════════════════════════════════════════════════════════════════════════

const D1_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS orders (
  order_id TEXT PRIMARY KEY,
  amount REAL NOT NULL,
  package_type TEXT NOT NULL DEFAULT 'single',
  razorpay_order_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_details (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  dob TEXT,
  gender TEXT,
  city TEXT,
  pin_code TEXT,
  person1_name TEXT,
  person1_first_name TEXT,
  person1_middle_name TEXT,
  person1_middle_name_type TEXT,
  person1_sur_name TEXT,
  person1_dob TEXT,
  person1_gender TEXT,
  person2_name TEXT,
  person2_first_name TEXT,
  person2_middle_name TEXT,
  person2_middle_name_type TEXT,
  person2_sur_name TEXT,
  person2_dob TEXT,
  person2_gender TEXT,
  person3_name TEXT,
  person3_first_name TEXT,
  person3_middle_name TEXT,
  person3_middle_name_type TEXT,
  person3_sur_name TEXT,
  person3_dob TEXT,
  person3_gender TEXT,
  father_first_name TEXT,
  father_middle_name TEXT,
  father_middle_name_type TEXT,
  father_last_name TEXT,
  child_dob TEXT,
  time_of_birth TEXT,
  place_of_birth TEXT,
  father_full_name TEXT,
  child_last_name TEXT,
  father_first_as_middle TEXT,
  child_middle_name TEXT,
  name_options TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(order_id)
);

CREATE TABLE IF NOT EXISTS payment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  transaction_id TEXT,
  amount_paise INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emailDelivery (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT NOT NULL,
  order_id TEXT,
  status TEXT,
  sent_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(email, order_id)
);

CREATE TABLE IF NOT EXISTS invoice_sequence (
  financial_year TEXT PRIMARY KEY,
  last_sequence INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL UNIQUE,
  invoice_number TEXT NOT NULL UNIQUE,
  financial_year TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  amount REAL,
  package_type TEXT,
  transaction_id TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customer_details_order_id ON customer_details(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_order_id ON payment(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transaction_id ON payment(transaction_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_financial_year ON invoices(financial_year);
`;

const D1_SEED_SQL = `
INSERT OR IGNORE INTO invoice_sequence (financial_year, last_sequence) VALUES
  ('26-27', 6999),
  ('27-28', 6999),
  ('28-29', 6999),
  ('29-30', 6999),
  ('30-31', 6999);
`;

let schemaInitialized = false;

export async function ensureD1Schema(d1) {
  if (!d1 || schemaInitialized) return;
  try {
    await d1Exec(d1, D1_SCHEMA_SQL);
    await d1Exec(d1, D1_SEED_SQL);
    schemaInitialized = true;
    console.log('✅ D1 schema initialized');
  } catch (err) {
    console.error('D1 schema init error:', err.message);
    throw err;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// DATA OPERATIONS
// ═════════════════════════════════════════════════════════════════════════════

export async function d1SaveOrderAndCustomer(d1, orderId, amount, packageType, customerData) {
  await ensureD1Schema(d1);

  await d1Run(d1, `
    INSERT INTO orders (order_id, amount, package_type, razorpay_order_id, status)
    VALUES (?1, ?2, ?3, ?4, 'PENDING')
    ON CONFLICT(order_id) DO UPDATE SET
      amount = excluded.amount,
      package_type = excluded.package_type,
      razorpay_order_id = COALESCE(excluded.razorpay_order_id, orders.razorpay_order_id)
  `, [orderId, amount, packageType || 'single', customerData.razorpayOrderId || null]);

  await d1Run(d1, `
    INSERT INTO customer_details (
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
      child_middle_name, name_options
    ) VALUES (
      ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8,
      ?9, ?10, ?11, ?12, ?13, ?14, ?15,
      ?16, ?17, ?18, ?19, ?20, ?21, ?22,
      ?23, ?24, ?25, ?26, ?27, ?28, ?29,
      ?30, ?31, ?32, ?33,
      ?34, ?35, ?36,
      ?37, ?38, ?39,
      ?40, ?41
    )
    ON CONFLICT(order_id) DO UPDATE SET
      email = excluded.email,
      name = excluded.name,
      mobile = excluded.mobile,
      dob = excluded.dob,
      gender = excluded.gender,
      city = excluded.city,
      pin_code = excluded.pin_code,
      person1_name = excluded.person1_name,
      person1_first_name = excluded.person1_first_name,
      person1_middle_name = excluded.person1_middle_name,
      person1_middle_name_type = excluded.person1_middle_name_type,
      person1_sur_name = excluded.person1_sur_name,
      person1_dob = excluded.person1_dob,
      person1_gender = excluded.person1_gender,
      person2_name = excluded.person2_name,
      person2_first_name = excluded.person2_first_name,
      person2_middle_name = excluded.person2_middle_name,
      person2_middle_name_type = excluded.person2_middle_name_type,
      person2_sur_name = excluded.person2_sur_name,
      person2_dob = excluded.person2_dob,
      person2_gender = excluded.person2_gender,
      person3_name = excluded.person3_name,
      person3_first_name = excluded.person3_first_name,
      person3_middle_name = excluded.person3_middle_name,
      person3_middle_name_type = excluded.person3_middle_name_type,
      person3_sur_name = excluded.person3_sur_name,
      person3_dob = excluded.person3_dob,
      person3_gender = excluded.person3_gender,
      father_first_name = excluded.father_first_name,
      father_middle_name = excluded.father_middle_name,
      father_middle_name_type = excluded.father_middle_name_type,
      father_last_name = excluded.father_last_name,
      child_dob = excluded.child_dob,
      time_of_birth = excluded.time_of_birth,
      place_of_birth = excluded.place_of_birth,
      father_full_name = excluded.father_full_name,
      child_last_name = excluded.child_last_name,
      father_first_as_middle = excluded.father_first_as_middle,
      child_middle_name = excluded.child_middle_name,
      name_options = excluded.name_options
  `, [
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
    customerData.fatherFullName || null,
    customerData.childLastName || null,
    customerData.fatherFirstNameAsMiddleName || null,
    customerData.childMiddleName || null,
    customerData.nameOptions || null,
  ]);

  console.log(`✅ D1: Order + customer saved: ${orderId}`);
  return true;
}

export async function d1SavePayment(d1, orderId, transactionId, amountPaise, status) {
  await ensureD1Schema(d1);

  const amountRupees = (amountPaise || 0) / 100;

  await d1Run(d1, `
    INSERT INTO orders (order_id, amount, package_type, status)
    VALUES (?1, ?2, 'single', ?3)
    ON CONFLICT(order_id) DO UPDATE SET status = excluded.status
  `, [orderId, amountRupees, status]);

  await d1Run(d1, `
    INSERT INTO payment (order_id, transaction_id, amount_paise, status)
    VALUES (?1, ?2, ?3, ?4)
  `, [orderId, transactionId || null, amountPaise || 0, status]);

  return true;
}

export async function d1GetOrderFull(d1, orderId) {
  await ensureD1Schema(d1);
  if (!orderId) return null;

  const result = await d1Query(d1, `
    SELECT
      o.order_id,
      o.amount,
      o.package_type,
      o.created_at,
      o.status,
      c.name AS customer_name,
      c.email AS customer_email,
      c.mobile AS customer_mobile,
      c.city AS customer_city,
      c.pin_code AS child_pincode,
      p.transaction_id
    FROM orders o
    LEFT JOIN customer_details c ON o.order_id = c.order_id
    LEFT JOIN (
      SELECT transaction_id, order_id
      FROM payment
      WHERE order_id = ?1
      ORDER BY created_at DESC LIMIT 1
    ) p ON o.order_id = p.order_id
    WHERE o.order_id = ?1
  `, [orderId]);

  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    order_id: row.order_id,
    amount: parseFloat(row.amount),
    package_type: row.package_type,
    transaction_id: row.transaction_id || null,
    customer_name: row.customer_name || 'Customer',
    customer_email: row.customer_email || '',
    customer_mobile: row.customer_mobile || '',
    customer_city: row.customer_city || '',
    created_at: row.created_at,
    child_pincode: row.child_pincode || null,
  };
}

export async function d1GetCustomerMetadata(d1, orderId, razorpayOrderId) {
  await ensureD1Schema(d1);
  if (!d1) return null;

  const result = await d1Query(d1, `
    SELECT
      c.email,
      c.name,
      c.mobile,
      c.dob,
      c.gender,
      c.city,
      c.pin_code AS pinCode,
      c.person1_name AS person1Name,
      c.person1_first_name AS person1FirstName,
      c.person1_middle_name AS person1MiddleName,
      c.person1_middle_name_type AS person1MiddleNameType,
      c.person1_sur_name AS person1SurName,
      c.person1_dob AS person1Dob,
      c.person1_gender AS person1Gender,
      c.person2_name AS person2Name,
      c.person2_first_name AS person2FirstName,
      c.person2_middle_name AS person2MiddleName,
      c.person2_middle_name_type AS person2MiddleNameType,
      c.person2_sur_name AS person2SurName,
      c.person2_dob AS person2Dob,
      c.person2_gender AS person2Gender,
      c.person3_name AS person3Name,
      c.person3_first_name AS person3FirstName,
      c.person3_middle_name AS person3MiddleName,
      c.person3_middle_name_type AS person3MiddleNameType,
      c.person3_sur_name AS person3SurName,
      c.person3_dob AS person3Dob,
      c.person3_gender AS person3Gender,
      c.father_first_name AS fatherFirstName,
      c.father_middle_name AS fatherMiddleName,
      c.father_middle_name_type AS fatherMiddleNameType,
      c.father_last_name AS fatherLastName,
      c.father_full_name AS fatherFullName,
      c.child_dob AS childDob,
      c.time_of_birth AS timeOfBirth,
      c.place_of_birth AS placeOfBirth,
      c.father_first_as_middle AS fatherFirstNameAsMiddleName,
      c.child_middle_name AS childMiddleName,
      c.child_last_name AS childLastName,
      c.name_options AS nameOptions,
      o.package_type AS packageType,
      o.amount
    FROM customer_details c
    JOIN orders o ON o.order_id = c.order_id
    WHERE c.order_id = ?1 OR o.razorpay_order_id = ?2
    LIMIT 1
  `, [orderId, razorpayOrderId]);

  if (result.rows.length === 0) return null;
  return result.rows[0];
}

export async function d1GetOrders(d1) {
  await ensureD1Schema(d1);
  const result = await d1Query(d1, `
    SELECT
      o.order_id, o.amount, o.package_type,
      o.status AS order_status, o.created_at AS order_created_at,
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
      p.id AS payment_id, p.transaction_id, p.amount_paise,
      p.status AS payment_status, p.created_at AS payment_created_at
    FROM orders o
    LEFT JOIN customer_details c ON o.order_id = c.order_id
    LEFT JOIN (
      SELECT id, order_id, transaction_id, amount_paise, status, created_at
      FROM payment p1
      WHERE created_at = (
        SELECT MAX(created_at) FROM payment p2 WHERE p2.order_id = p1.order_id
      )
    ) p ON o.order_id = p.order_id
    ORDER BY o.created_at DESC
  `);
  return result.rows || [];
}

export async function d1IsEmailSent(d1, email, orderId) {
  if (!d1 || !email || !orderId) return false;
  const result = await d1Query(d1, `
    SELECT 1 FROM emailDelivery
    WHERE email = ?1 AND order_id = ?2 AND status = 'sent'
  `, [email, orderId]);
  return result.rowCount > 0;
}

export async function d1RecordEmailDelivery(d1, email, orderId, deliveryStatus = 'sent') {
  if (!d1 || !email || !orderId) return false;
  await ensureD1Schema(d1);
  try {
    await d1Run(d1, `
      INSERT INTO emailDelivery (email, order_id, status, sent_at)
      VALUES (?1, ?2, ?3, CURRENT_TIMESTAMP)
      ON CONFLICT(email, order_id) DO NOTHING
    `, [email, orderId, deliveryStatus]);
    return true;
  } catch (error) {
    console.error('D1 recordEmailDelivery error:', error.message);
    return false;
  }
}

export async function d1GetNextInvoiceNumber(d1, financialYear) {
  if (!d1) throw new Error('D1 not available');
  await ensureD1Schema(d1);

  // D1 doesn't support RETURNING - need separate queries
  try {
    // Try insert first (starting from 7000)
    await d1Run(d1, `
      INSERT INTO invoice_sequence (financial_year, last_sequence)
      VALUES (?1, 7000)
      ON CONFLICT(financial_year) DO NOTHING
    `, [financialYear]);
  } catch (e) {
    // Ignore duplicate key errors
  }
  
  // Get current sequence which should be >= 7000
  const result = await d1Query(d1, `
    SELECT last_sequence FROM invoice_sequence WHERE financial_year = ?1
  `, [financialYear]);
  
  // Current sequence starts from 7000 (or higher if already used)
  // Get next number by incrementing
  let currentSeq = result.rows[0]?.last_sequence || 7000;
  let nextSeq = currentSeq + 1;
  
  // Update for next time (only if we successfully got a number)
  if (currentSeq >= 7000) {
    await d1Run(d1, `
      UPDATE invoice_sequence SET last_sequence = ?1 WHERE financial_year = ?2
    `, [nextSeq, financialYear]);
  }

  const paddedSeq = String(currentSeq).padStart(4, '0');
  return `EYN${financialYear}/${paddedSeq}`;
}

export async function d1SaveInvoiceRecord(d1, { orderId, invoiceNumber, financialYear, customerName, customerEmail, amount, packageType, transactionId }) {
  if (!d1) return false;
  await ensureD1Schema(d1);
  try {
    await d1Run(d1, `
      INSERT INTO invoices
        (order_id, invoice_number, financial_year, customer_name, customer_email, amount, package_type, transaction_id)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
      ON CONFLICT(order_id) DO NOTHING
    `, [orderId, invoiceNumber, financialYear, customerName || '', customerEmail || '', amount || 0, packageType || 'single', transactionId || null]);
    return true;
  } catch (error) {
    console.error('D1 saveInvoiceRecord error:', error.message);
    return false;
  }
}

export async function d1GetExistingInvoiceNumber(d1, orderId) {
  if (!d1) return null;
  const result = await d1Query(d1, `
    SELECT invoice_number FROM invoices WHERE order_id = ?1 LIMIT 1
  `, [orderId]);
  return result.rows[0]?.invoice_number || null;
}
