// api/_utils/supabase-server.js
// PDF generation (local pdf-lib) — no Supabase Storage dependency

import { generateInvoicePDFLocal } from './generate-invoice-pdf.js';

/**
 * Generate invoice PDF for an order.
 * 1. Uses fallbackData directly (passed from payment-status / webhook)
 * 2. Also tries DB lookup for extra fields
 * 3. Generates PDF using pdf-lib (local — no external service needed)
 * 4. Returns Buffer for email attachment
 *
 * @param {string} orderId
 * @param {object} [fallbackData] - customer data if DB lookup fails
 * @returns {Promise<Buffer|null>}
 */
export async function generateInvoicePDF(orderId, fallbackData = null) {
  if (!orderId) throw new Error('orderId required');

  let invoiceData = null;

  // Try DB lookup first
  try {
    const { getOrderFull } = await import('./db.js');
    const order = await getOrderFull(orderId);
    if (order) {
      const invoiceDate = new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      });
      invoiceData = {
        orderId,
        invoiceNumber: null,
        invoiceDate,
        customerName:   order.customer_name  || fallbackData?.customerName  || 'Customer',
        customerEmail:  order.customer_email || fallbackData?.customerEmail || '',
        customerMobile: order.customer_mobile || fallbackData?.customerMobile || '',
        customerCity:   order.customer_city  || fallbackData?.customerCity  || '',
        pinCode:        order.child_pincode  || fallbackData?.pinCode       || '',
        packageType:    order.package_type   || fallbackData?.packageType   || 'single',
        transactionId:  order.transaction_id || fallbackData?.transactionId || '',
        amount:         parseFloat(order.amount) || fallbackData?.amount   || 0,
      };
    }
  } catch (dbErr) {
    console.warn('DB lookup failed for PDF, using fallback data:', dbErr.message);
  }

  if (!invoiceData && fallbackData) {
    const invoiceDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
    invoiceData = {
      orderId,
      invoiceNumber:  null,
      invoiceDate,
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

  const pdfBuffer = await generateInvoicePDFLocal(invoiceData);
  if (!pdfBuffer) throw new Error('PDF generation returned null');

  console.log(`✅ Invoice PDF generated for order ${orderId} — ${pdfBuffer.length} bytes`);

  return pdfBuffer;
}
