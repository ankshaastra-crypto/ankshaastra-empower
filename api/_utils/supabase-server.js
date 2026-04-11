// api/_utils/supabase-server.js
// PDF generation (local pdf-lib) + optional Supabase Storage upload

import { generateInvoicePDFLocal } from './generate-invoice-pdf.js';

// ── Supabase client (optional — only used for storage upload) ─────────────────
let supabaseServer = null;
try {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && supabaseServiceKey) {
    const { createClient } = await import('@supabase/supabase-js');
    supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  } else {
    console.warn('⚠️  Supabase env missing — PDF will be generated locally only (no cloud storage)');
  }
} catch {
  console.warn('⚠️  Supabase client init failed — PDF will be generated locally only');
}

export { supabaseServer };

// ── Upload to Supabase Storage (optional) ─────────────────────────────────────
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

// ── Main: generate PDF locally, optionally upload to Supabase ─────────────────
/**
 * Generate invoice PDF for an order.
 * 1. Fetch order from DB
 * 2. Generate PDF using pdf-lib (local, no external service)
 * 3. If Supabase is configured, upload for archival
 * 4. Return Buffer for email attachment
 *
 * @param {string} orderId
 * @param {object} [fallbackData] - customer data if DB lookup fails
 * @returns {Promise<Buffer|null>}
 */
export async function generateInvoicePDF(orderId, fallbackData = null) {
  if (!orderId) throw new Error('orderId required');

  // Build invoice data — try DB first, fall back to passed data
  let invoiceData = null;

  try {
    const { getOrderFull } = await import('./db.js');
    const order = await getOrderFull(orderId);
    if (order) {
      const invoiceDate = new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      });
      invoiceData = {
        orderId,
        invoiceNumber: null, // will use orderId as fallback
        invoiceDate,
        customerName: order.customer_name || fallbackData?.customerName || 'Customer',
        customerEmail: order.customer_email || fallbackData?.customerEmail || '',
        customerMobile: order.customer_mobile || fallbackData?.customerMobile || '',
        customerCity: order.customer_city || fallbackData?.customerCity || '',
        pinCode: order.child_pincode || fallbackData?.pinCode || '',
        packageType: order.package_type || fallbackData?.packageType || 'single',
        transactionId: order.transaction_id || fallbackData?.transactionId || '',
        amount: parseFloat(order.amount) || fallbackData?.amount || 0,
      };
    }
  } catch (dbErr) {
    console.warn('DB lookup failed for PDF, using fallback data:', dbErr.message);
  }

  // If DB failed, use fallback data passed in directly
  if (!invoiceData && fallbackData) {
    const invoiceDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
    invoiceData = {
      orderId,
      invoiceNumber: null,
      invoiceDate,
      customerName: fallbackData.customerName || 'Customer',
      customerEmail: fallbackData.customerEmail || '',
      customerMobile: fallbackData.customerMobile || '',
      customerCity: fallbackData.customerCity || '',
      pinCode: fallbackData.pinCode || '',
      packageType: fallbackData.packageType || 'single',
      transactionId: fallbackData.transactionId || '',
      amount: fallbackData.amount || 0,
    };
  }

  if (!invoiceData) {
    throw new Error(`No data found for order ${orderId} and no fallback provided`);
  }

  // Generate PDF locally
  const pdfBuffer = await generateInvoicePDFLocal(invoiceData);
  if (!pdfBuffer) throw new Error('PDF generation returned null');

  console.log(`✅ Invoice PDF generated locally for order ${orderId} — ${pdfBuffer.length} bytes`);

  // Optional: upload to Supabase Storage for archival
  if (supabaseServer) {
    try {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const safeEmail = (invoiceData.customerEmail || 'unknown').replace(/[^a-zA-Z0-9@._-]/g, '_');
      const storagePath = `${year}/${month}/${safeEmail}_${orderId}.pdf`;
      await uploadInvoicePDF(storagePath, pdfBuffer);
      console.log(`✅ Invoice uploaded to Supabase: ${storagePath}`);
    } catch (uploadErr) {
      console.warn('⚠️  Supabase upload failed (non-fatal):', uploadErr.message);
      // Don't throw — PDF buffer is still valid for email attachment
    }
  }

  return pdfBuffer;
}