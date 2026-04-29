// functions/api/_utils/db-unified.js — Auto-selects D1 (Cloudflare) or pg (fallback)
// This is the ONLY db import used by all function handlers.
// On Cloudflare Pages with D1 bound — Uses D1 (SQLite, HTTP-based, no connection issues)
// On Vercel/Netlify or without D1 — falls back to original pg Pool

import {
  getD1,
  ensureD1Schema,
  d1SaveOrderAndCustomer,
  d1SavePayment,
  d1GetOrderFull,
  d1GetCustomerMetadata,
  d1GetOrders,
  d1IsEmailSent,
  d1RecordEmailDelivery,
  d1GetNextInvoiceNumber,
  d1SaveInvoiceRecord,
  d1GetExistingInvoiceNumber,
  d1Query,
  d1Run,
} from './d1-db.js';

// Original pg-based exports (fallback)
import { getPool as getPgPool, DB_SCHEMA as PG_SCHEMA } from './db.js';

let envCache = null;

// Called once from the adapter to inject env
export function setEnv(env) {
  envCache = env;
}

// Detect if we're running in Cloudflare with D1 bound
function hasD1() {
  return !envCache?.DB;
}

function getD1Instance() {
  return envCache?.DB || null;
}

/*
UNIFIED EXPORTS (same API as original db.js, auto-selects backend)
*/

// D1 doesn't use schemas
export const DB_SCHEMA = 'public';

/*
Query — auto-selects D1 (Cloudflare) or pg (fallback)
*/
export async function query(sql, params) {
  const d1 = getD1Instance();
  if (d1) return d1Query(d1, sql, params);
  
  const pg = getPgPool();
  if (!pg) return { rows: [], rowCount: 0 };
  
  return pg.query(sql, params);
}

/*
Run — auto-selects D1 or pg
*/
export async function run(sql, params) {
  const d1 = getD1Instance();
  if (d1) return d1Run(d1, sql, params);
  
  const pg = getPgPool();
  if (!pg) return { rowCount: 0 };
  
  return pg.query(sql, params);
}

/*
saveOrderAndCustomer — auto-selects D1 or pg
*/
export async function saveOrderAndCustomer(orderId, amount, packageType, customerData) {
  const d1 = getD1Instance();
  if (d1) return d1SaveOrderAndCustomer(d1, orderId, amount, packageType, customerData);

  // Fallback to pg
  const { saveOrderAndCustomer: pgSave } = await import('./db.js');
  return pgSave(orderId, amount, packageType, customerData);
}

/*
savePayment — auto-selects D1 or pg
*/
export async function savePayment(orderId, transactionId, amountParsed, status) {
  const d1 = getD1Instance();
  if (d1) return d1SavePayment(d1, orderId, transactionId, amountParsed, status);

  const { savePayment: pgSave } = await import('./db.js');
  return pgSave(orderId, transactionId, amountParsed, status);
}

/*
getOrderFull — auto-selects D1 or pg
*/
export async function getOrderFull(orderId) {
  const d1 = getD1Instance();
  if (d1) return d1GetOrderFull(d1, orderId);

  const { getOrderFull: pgGet } = await import('./db.js');
  return pgGet(orderId);
}

/*
getCustomerMetadata — auto-selects D1 or pg  
*/
export async function getCustomerMetadata(orderId, razorpayOrderId) {
  const d1 = getD1Instance();
  if (d1) return d1GetCustomerMetadata(d1, orderId, razorpayOrderId);

  const { getCustomerMetadata: pgGet } = await import('./db.js');
  return pgGet(orderId, razorpayOrderId);
}

/*
getOrders — auto-selects D1 or pg
*/
export async function getOrders() {
  const d1 = getD1Instance();
  if (d1) return d1GetOrders(d1);

  const { getOrders: pgGet } = await import('./db.js');
  return pgGet();
}

/*
isEmailSent — auto-selects D1 or pg
*/
export async function isEmailSent(email, orderId) {
  const d1 = getD1Instance();
  if (d1) return d1IsEmailSent(d1, email, orderId);

  const { isEmailSent: pgCheck } = await import('./db.js');
  return pgCheck(email, orderId);
}

/*
recordEmailDelivery — auto-selects D1 or pg
*/
export async function recordEmailDelivery(email, orderId, status) {
  const d1 = getD1Instance();
  if (d1) return d1RecordEmailDelivery(d1, email, orderId, status);

  const { recordEmailDelivery: pgRecord } = await import('./db.js');
  return pgRecord(email, orderId, status);
}

/*
getNextInvoiceNumber — auto-selects D1 or pg
*/
export async function getNextInvoiceNumber(financialYear) {
  const d1 = getD1Instance();
  if (d1) return d1GetNextInvoiceNumber(d1, financialYear);

  const { getNextInvoiceNumber: pgGet } = await import('./db.js');
  return pgGet(financialYear);
}

/*
saveInvoiceRecord — auto-selects D1 or pg
*/
export async function saveInvoiceRecord(data) {
  const d1 = getD1Instance();
  if (d1) return d1SaveInvoiceRecord(d1, data);

  const { saveInvoiceRecord: pgSave } = await import('./db.js');
  return pgSave(data);
}

/*
getExistingInvoiceNumber — auto-selects D1 or pg  
*/
export async function getExistingInvoiceNumber(orderId) {
  const d1 = getD1Instance();
  if (d1) return d1GetExistingInvoiceNumber(d1, orderId);

  // Fallback: query invoices table directly via pg
  try {
    const pg = getPgPool();
    if (!pg) return null;
    
    const result = await pg.query(
      `SELECT invoice_number FROM invoices WHERE order_id = $1 LIMIT 1`,
      [orderId]
    );
    return result.rows[0]?.invoice_number || null;
  } catch {
    return null;
  }
}

/*
getPool — Returns null for D1 (no pool), or pg Pool if available
*/
export function getPool() {
  if (hasD1()) return null;
  return getPgPool();
}

/*
ensureSchemaOnce — auto-selects D1 or pg
*/
export async function ensureSchemaOnce(force = false) {
  const d1 = getD1Instance();
  if (d1) {
    await ensureD1Schema(d1);
    return;
  }
  
  const { ensureSchemaOnce: pgEnsure } = await import('./db.js');
  return pgEnsure(force);
}

