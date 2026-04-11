// api/_utils/supabase-server.js - Server-side Supabase client with service_role key (bypass RLS)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;


if (!supabaseUrl || !supabaseServiceKey) {
  console.log('Supabase env missing - PDF generation disabled');
module.exports = { supabaseServer: null };
}

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {

  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Get next invoice number for financial year (calls Supabase RPC)
 */
export async function getNextInvoiceNumber(financialYear) {
  const { data, error } = await supabaseServer.rpc('get_next_invoice_number', {
    p_financial_year: financialYear
  });
  if (error) throw error;
  return data[0];
}

/**
 * Insert invoice metadata
 */
export async function insertInvoice(invoiceData) {
  const { data, error } = await supabaseServer
    .from('invoices')
    .insert([invoiceData])
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Upload PDF to storage/invoices/{year}/{filename}
 */
export async function uploadInvoicePDF(year, filename, pdfBuffer) {
  const { data, error } = await supabaseServer.storage
    .from('invoices')
    .upload(`${year}/${filename}`, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true
    });
  if (error) throw error;
  return supabaseServer.storage.from('invoices').getPublicUrl(`${year}/${filename}`).data.publicUrl;
}

/**
 * Generate invoice PDF buffer for order (via Edge function)
 * @param orderId - Order ID from PG orders table
 * @returns PDF Buffer or null if failed
 */
export async function generateInvoicePDF(orderId) {
  if (!orderId) throw new Error('orderId required');

  try {
    // 1. Invoke Edge function to generate invoice
    const { data: genResult, error: genError } = await supabaseServer.functions.invoke('generate-invoice', {
      body: { action: 'generate', orderId }
    });

    if (genError || !genResult?.success || !genResult.invoiceId) {
      throw new Error(`Edge generation failed: ${genError?.message || 'No invoiceId returned'}`);
    }

    const invoiceId = genResult.invoiceId;

    // 2. Get signed download URL
    const { data: signedResult, error: signedError } = await supabaseServer.functions.invoke('generate-invoice', {
      body: { action: 'download', invoiceId }
    });

    if (signedError || !signedResult?.url) {
      throw new Error(`Signed URL failed: ${signedError?.message || 'No URL returned'}`);
    }

    const signedUrl = signedResult.url;

    // 3. Fetch PDF buffer
    const pdfResponse = await fetch(signedUrl);
    if (!pdfResponse.ok || !pdfResponse.body) {
      throw new Error(`PDF fetch failed: ${pdfResponse.status}`);
    }

    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

    return pdfBuffer;
  } catch (error) {
    console.error('generateInvoicePDF error:', error);
    throw new Error(`Invoice PDF generation failed: ${error.message}`);
  }
}

