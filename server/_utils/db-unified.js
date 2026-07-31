// functions/api/_utils/db-unified.js — Postgres/Supabase adapter for Vercel.
import {
  DB_SCHEMA,
  getPool,
  query,
  ensureSchemaOnce,
  saveOrderAndCustomer,
  savePayment,
  getOrderFull,
  getCustomerMetadata,
  getOrders,
  isEmailSent,
  recordEmailDelivery,
  getNextInvoiceNumber,
  saveInvoiceRecord,
  getExistingInvoiceNumber,
} from './db.js';

export {
  DB_SCHEMA,
  getPool,
  query,
  ensureSchemaOnce,
  saveOrderAndCustomer,
  savePayment,
  getOrderFull,
  getCustomerMetadata,
  getOrders,
  isEmailSent,
  recordEmailDelivery,
  getNextInvoiceNumber,
  saveInvoiceRecord,
  getExistingInvoiceNumber,
};

