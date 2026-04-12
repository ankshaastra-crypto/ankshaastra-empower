// api/admin/verify-order.js
// Admin endpoint to verify customer data stored in Supabase/PostgreSQL DB
// GET /api/admin/verify-order?orderId=ORD123
// GET /api/admin/verify-order?latest=10   (last N orders)

import '../_utils/suppress-deprecation.js';
import { getPool, DB_SCHEMA } from '../_utils/db.js';

const ADMIN_TOKEN = process.env.ADMIN_VERIFY_TOKEN || 'ankshaastra-admin-verify';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Simple token auth
  const token = req.headers['x-admin-token'] || req.query.token;
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized — set x-admin-token header' });
  }

  const pool = getPool();
  if (!pool) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  try {
    const { orderId, latest } = req.query;
    const ord  = `${DB_SCHEMA}.orders`;
    const cust = `${DB_SCHEMA}.customer_details`;
    const pay  = `${DB_SCHEMA}.payment`;

    // Single order lookup
    if (orderId) {
      const result = await pool.query(`
        SELECT
          o.order_id, o.amount, o.package_type, o.status as order_status, o.created_at,
          c.email, c.name, c.mobile, c.dob, c.gender, c.city, c.pin_code,
          c.person1_first_name, c.person1_middle_name, c.person1_sur_name, c.person1_dob, c.person1_gender,
          c.person2_first_name, c.person2_middle_name, c.person2_sur_name, c.person2_dob, c.person2_gender,
          c.person3_first_name, c.person3_middle_name, c.person3_sur_name, c.person3_dob, c.person3_gender,
          c.father_full_name, c.father_first_name, c.father_last_name,
          c.child_dob, c.time_of_birth, c.place_of_birth,
          c.child_middle_name, c.child_last_name, c.father_first_as_middle, c.name_options,
          p.transaction_id, p.amount_paise, p.status as payment_status, p.created_at as payment_at
        FROM ${ord} o
        LEFT JOIN ${cust} c ON o.order_id = c.order_id
        LEFT JOIN LATERAL (
          SELECT transaction_id, amount_paise, status, created_at
          FROM ${pay} WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1
        ) p ON true
        WHERE o.order_id = $1
      `, [orderId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `Order ${orderId} not found` });
      }

      const row = result.rows[0];
      const validation = validateOrderRow(row);

      return res.status(200).json({
        found: true,
        orderId,
        validation,
        data: row,
      });
    }

    // Latest N orders
    const limit = Math.min(parseInt(latest || '10', 10), 50);
    const result = await pool.query(`
      SELECT
        o.order_id, o.amount, o.package_type, o.status as order_status, o.created_at,
        c.email, c.name, c.mobile, c.city, c.pin_code,
        c.person1_first_name, c.person1_sur_name, c.person1_dob,
        c.father_full_name, c.child_dob, c.time_of_birth,
        p.transaction_id, p.status as payment_status
      FROM ${ord} o
      LEFT JOIN ${cust} c ON o.order_id = c.order_id
      LEFT JOIN LATERAL (
        SELECT transaction_id, status
        FROM ${pay} WHERE order_id = o.order_id ORDER BY created_at DESC LIMIT 1
      ) p ON true
      ORDER BY o.created_at DESC
      LIMIT $1
    `, [limit]);

    const rows = result.rows.map(row => ({
      orderId: row.order_id,
      packageType: row.package_type,
      orderStatus: row.order_status,
      paymentStatus: row.payment_status,
      transactionId: row.transaction_id,
      amount: row.amount,
      createdAt: row.created_at,
      customer: {
        name: row.name || '❌ MISSING',
        email: row.email || '❌ MISSING',
        mobile: row.mobile || '❌ MISSING',
        city: row.city || '⚠️ empty',
        pinCode: row.pin_code || '⚠️ empty',
      },
      details: row.package_type?.startsWith('namecheck')
        ? { person1: `${row.person1_first_name || ''} ${row.person1_sur_name || ''}`.trim() || '⚠️ empty', dob: row.person1_dob || '⚠️ empty' }
        : { fatherName: row.father_full_name || '⚠️ empty', childDob: row.child_dob || '⚠️ empty', timeOfBirth: row.time_of_birth || '⚠️ empty' },
      issues: getIssues(row),
    }));

    const totalIssues = rows.reduce((sum, r) => sum + r.issues.length, 0);

    return res.status(200).json({
      count: rows.length,
      totalIssues,
      summary: `${rows.length} orders checked, ${totalIssues} issue(s) found`,
      orders: rows,
    });

  } catch (err) {
    console.error('verify-order error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

function validateOrderRow(row) {
  const issues = getIssues(row);
  const isBaby = row.package_type === 'single' || row.package_type === 'premium';
  const isNameCheck = row.package_type?.startsWith('namecheck');

  return {
    valid: issues.length === 0,
    issues,
    fields: {
      contact: {
        name: row.name ? '✅' : '❌ MISSING',
        email: row.email ? '✅' : '❌ MISSING',
        mobile: row.mobile ? '✅' : '❌ MISSING',
        city: row.city ? '✅' : '⚠️ empty',
        pinCode: row.pin_code ? '✅' : '⚠️ empty',
      },
      ...(isBaby ? {
        babyReport: {
          fatherFullName: row.father_full_name ? '✅' : '⚠️ empty',
          childDob: row.child_dob ? '✅' : '⚠️ empty',
          timeOfBirth: row.time_of_birth ? '✅' : '⚠️ empty',
          placeOfBirth: row.place_of_birth ? '✅' : '⚠️ empty',
          childLastName: row.child_last_name ? '✅' : '⚠️ empty',
        },
      } : {}),
      ...(isNameCheck ? {
        nameCheck: {
          person1Name: (row.person1_first_name || row.person1_sur_name) ? '✅' : '⚠️ empty',
          person1Dob: row.person1_dob ? '✅' : '⚠️ empty',
        },
      } : {}),
      payment: {
        transactionId: row.transaction_id ? '✅' : '⚠️ pending',
        paymentStatus: row.payment_status || '⚠️ unknown',
        orderStatus: row.order_status || '⚠️ unknown',
      },
    },
  };
}

function getIssues(row) {
  const issues = [];
  if (!row.name) issues.push('Missing customer name');
  if (!row.email) issues.push('Missing email');
  if (!row.mobile) issues.push('Missing mobile');

  const isBaby = row.package_type === 'single' || row.package_type === 'premium';
  if (isBaby) {
    if (!row.child_dob) issues.push('Missing child DOB');
    if (!row.time_of_birth) issues.push('Missing time of birth');
    if (!row.place_of_birth && !row.city) issues.push('Missing birth city/place');
  }

  const isNameCheck = row.package_type?.startsWith('namecheck');
  if (isNameCheck) {
    if (!row.person1_first_name && !row.person1_sur_name) issues.push('Missing person 1 name');
    if (!row.person1_dob) issues.push('Missing person 1 DOB');
  }

  return issues;
}