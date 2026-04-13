// api/_utils/supabase-server.js
// PDF generation (local pdf-lib) + sequential GST invoice numbering + optional Supabase Storage

import { createClient } from '@supabase/supabase-js';
import { generateInvoicePDFLocal } from './generate-invoice-pdf.js';
import { getOrderFull, getNextInvoiceNumber, saveInvoiceRecord } from './db.js';

// ── Supabase client (optional — only used for storage upload) ─────────────────
const supabaseUrl        = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseServer =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

if (!supabaseServer) {
  console.warn('⚠️  Supabase env missing — PDF generated locally only (no cloud storage)');
}

// ── Upload PDF to Supabase Storage (optional) ─────────────────────────────────
export async function uploadInvoicePDF(storagePath, pdfBuffer) {
  if (!supabaseServer) throw new Error('Supabase not configured');
  const { error } = await supabaseServer.storage
    .from('invoices')
    .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: true });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return storagePath;
}

export async function getInvoiceSignedUrl(storagePath, expiresIn = 3600) {
  if (!supabaseServer) throw new Error('Supabase not configured');
  const { data, error } = await supabaseServer.storage
    .from('invoices')
    .createSignedUrl(storagePath, expiresIn);
  if (error) throw new Error(`Signed URL error: ${error.message}`);
  return data.signedUrl;
}

// ── GST-compliant financial year ──────────────────────────────────────────────
// Indian financial year: April (month 3) → March
// FY 2026-27 = April 2026 – March 2027  → label "26-27"
function getFinancialYear(date = new Date()) {
  const month = date.getMonth(); // 0-based
  const year  = date.getFullYear();
  if (month >= 3) {
    // April or later → FY starts this year
    return `${String(year).slice(2)}-${String(year + 1).slice(2)}`; // e.g. "26-27"
  }
  // Jan–March → FY started last year
  return `${String(year - 1).slice(2)}-${String(year).slice(2)}`; // e.g. "25-26"
}

// ── Main: generate sequential invoice number + PDF ────────────────────────────
/**
 * Generate a GST-compliant sequential invoice PDF for an order.
 *
 * Invoice number format: EYN{FY}/{NNNN}
 * Examples: EYN26-27/0001, EYN26-27/0042, EYN26-27/9999
 * Starting sequence: 6999 (as requested → next new invoice = 7000)
 *
 * Flow:
 *  1. Check if invoice already exists for this order (idempotent)
 *  2. Get next sequential number from DB (atomic — no duplicates)
 *  3. Build PDF using pdf-lib (local, no external service)
 *  4. Save invoice record to DB
 *  5. Optionally upload to Supabase Storage
 *  6. Return PDF Buffer for email attachment
 *
 * @param {string} orderId
 * @param {object} [fallbackData] - customer data if DB order lookup fails
 * @returns {Promise<Buffer|null>}
 */
export async function generateInvoicePDF(orderId, fallbackData = null) {
  if (!orderId) throw new Error('orderId required');

  // ── Step 1: Check for existing invoice (idempotent) ───────────────────────
  let existingInvoiceNumber = null;
  try {
    existingInvoiceNumber = await getExistingInvoiceNumber(orderId);
    if (existingInvoiceNumber) {
      console.log(`ℹ️  Invoice already exists for ${orderId}: ${existingInvoiceNumber}`);
    }
  } catch { /* non-fatal */ }

  // ── Step 2: Build invoice data ────────────────────────────────────────────
  let invoiceData = null;

  try {
    const order = await getOrderFull(orderId);
    if (order) {
      const orderDate = new Date(order.created_at || Date.now());
      const invoiceDate = orderDate.toLocaleDateString('en-IN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      });
      const fy = getFinancialYear(orderDate);

      // Get invoice number (existing or generate new)
      let invoiceNumber = existingInvoiceNumber;
      if (!invoiceNumber) {
        invoiceNumber = await getNextInvoiceNumber(fy);
        console.log(`📄 New invoice number: ${invoiceNumber}`);
      }

      invoiceData = {
        orderId,
        invoiceNumber,
        financialYear: fy,
        invoiceDate,
        customerName:   order.customer_name   || fallbackData?.customerName   || 'Customer',
        customerEmail:  order.customer_email  || fallbackData?.customerEmail  || '',
        customerMobile: order.customer_mobile || fallbackData?.customerMobile || '',
        customerCity:   order.customer_city   || fallbackData?.customerCity   || '',
        pinCode:        order.child_pincode   || fallbackData?.pinCode        || '',
        packageType:    order.package_type    || fallbackData?.packageType    || 'single',
        transactionId:  order.transaction_id  || fallbackData?.transactionId  || '',
        amount:         parseFloat(order.amount) || fallbackData?.amount || 0,
      };
    }
  } catch (dbErr) {
    console.warn('DB lookup failed for PDF:', dbErr.message);
  }

  // Fallback to passed-in data if DB unavailable
  if (!invoiceData && fallbackData) {
    const now    = new Date();
    const fy     = getFinancialYear(now);
    let invoiceNumber = existingInvoiceNumber;
    if (!invoiceNumber) {
      try {
        invoiceNumber = await getNextInvoiceNumber(fy);
      } catch {
        invoiceNumber = `EYN${fy}/${String(Date.now()).slice(-4)}`; // emergency fallback
      }
    }
    invoiceData = {
      orderId,
      invoiceNumber,
      financialYear: fy,
      invoiceDate: now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      customerName:   fallbackData.customerName   || 'Customer',
      customerEmail:  fallbackData.customerEmail  || '',
      customerMobile: fallbackData.customerMobile || '',
      customerCity:   fallbackData.customerCity   || '',
      pinCode:        fallbackData.pinCode        || '',
      packageType:    fallbackData.packageType    || 'single',
      transactionId:  fallbackData.transactionId || '',
      amount:         fallbackData.amount        || 0,
    };
  }

  if (!invoiceData) {
    throw new Error(`No data available for order ${orderId}`);
  }

  // ── Step 3: Generate PDF locally ──────────────────────────────────────────
  const pdfBuffer = await generateInvoicePDFLocal(invoiceData);
  if (!pdfBuffer) throw new Error('PDF generation returned null');
  console.log(`✅ Invoice PDF generated for ${orderId} [${invoiceData.invoiceNumber}] — ${pdfBuffer.length} bytes`);

  // ── Step 4: Save invoice record to DB (if not already saved) ─────────────
  if (!existingInvoiceNumber) {
    try {
      await saveInvoiceRecord({
        orderId,
        invoiceNumber: invoiceData.invoiceNumber,
        financialYear: invoiceData.financialYear,
        customerName:  invoiceData.customerName,
        customerEmail: invoiceData.customerEmail,
        amount:        invoiceData.amount,
        packageType:   invoiceData.packageType,
        transactionId: invoiceData.transactionId,
      });
      console.log(`✅ Invoice record saved: ${invoiceData.invoiceNumber}`);
    } catch (saveErr) {
      console.warn('⚠️  Invoice record save failed (non-fatal):', saveErr.message);
    }
  }

  // ── Step 5: Upload to Supabase Storage (optional archival) ───────────────
  if (supabaseServer) {
    try {
      const date      = new Date();
      const year      = date.getFullYear();
      const month     = String(date.getMonth() + 1).padStart(2, '0');
      const safeNum   = invoiceData.invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
      const storagePath = `${year}/${month}/${safeNum}_${orderId}.pdf`;
      await uploadInvoicePDF(storagePath, pdfBuffer);
      console.log(`✅ Invoice uploaded to Supabase: ${storagePath}`);
    } catch (uploadErr) {
      console.warn('⚠️  Supabase upload failed (non-fatal, PDF still in email):', uploadErr.message);
    }
  }

  return pdfBuffer;
}

// ── Helper: check if invoice already exists for this order ───────────────────
async function getExistingInvoiceNumber(orderId) {
  try {
    const { getPool, DB_SCHEMA } = await import('./db.js');
    const p = getPool();
    if (!p) return null;
    const result = await p.query(
      `SELECT invoice_number FROM ${DB_SCHEMA}.invoices WHERE order_id = $1 LIMIT 1`,
      [orderId]
    );
    return result.rows[0]?.invoice_number || null;
  } catch {
    return null;
  }
}