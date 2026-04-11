// api/_utils/supabase-server.js
// Server-side Supabase client with service_role key (bypasses RLS)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Export null-safe client — callers must check before use
export const supabaseServer =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

if (!supabaseServer) {
  console.warn('⚠️  SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing — PDF storage disabled');
}

// ─── Upload PDF to storage ────────────────────────────────────────────────────

/**
 * Upload a PDF buffer to Supabase Storage bucket "invoices".
 * Returns the storage path.
 */
export async function uploadInvoicePDF(storagePath, pdfBuffer) {
  if (!supabaseServer) throw new Error('Supabase not configured');

  const { error } = await supabaseServer.storage
    .from('invoices')
    .upload(storagePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return storagePath;
}

/**
 * Get a short-lived signed URL for a stored invoice PDF.
 */
export async function getInvoiceSignedUrl(storagePath, expiresIn = 3600) {
  if (!supabaseServer) throw new Error('Supabase not configured');

  const { data, error } = await supabaseServer.storage
    .from('invoices')
    .createSignedUrl(storagePath, expiresIn);

  if (error) throw new Error(`Signed URL error: ${error.message}`);
  return data.signedUrl;
}

// ─── Main entry: generate PDF via Edge Function, store, return buffer ─────────

/**
 * Invoke the Supabase Edge Function `generate-invoice` to:
 *   1. Build the PDF
 *   2. Upload it to storage
 *   3. Return a signed download URL
 * Then fetch the PDF bytes and return them as a Buffer for email attachment.
 *
 * @param {string} orderId
 * @returns {Promise<Buffer>} PDF bytes
 */
export async function generateInvoicePDF(orderId) {
  if (!orderId) throw new Error('orderId required');
  if (!supabaseServer) throw new Error('Supabase not configured — cannot generate invoice PDF');

  // Step 1: Invoke Edge Function to generate + store the PDF
  const { data: genResult, error: genError } = await supabaseServer.functions.invoke(
    'generate-invoice',
    { body: { action: 'generate', orderId } }
  );

  if (genError) {
    throw new Error(`Edge function error: ${genError.message}`);
  }
  if (!genResult?.success || !genResult.invoiceId) {
    throw new Error(
      `Invoice generation failed: ${genResult?.error || 'No invoiceId returned'}`
    );
  }

  const invoiceId = genResult.invoiceId;

  // Step 2: Get signed download URL
  const { data: downloadResult, error: downloadError } = await supabaseServer.functions.invoke(
    'generate-invoice',
    { body: { action: 'download', invoiceId } }
  );

  if (downloadError || !downloadResult?.url) {
    throw new Error(
      `Signed URL failed: ${downloadError?.message || 'No URL returned'}`
    );
  }

  // Step 3: Fetch PDF bytes
  const pdfResponse = await fetch(downloadResult.url);
  if (!pdfResponse.ok) {
    throw new Error(`PDF fetch failed with status ${pdfResponse.status}`);
  }

  const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
  console.log(`✅ Invoice PDF fetched for order ${orderId} — ${pdfBuffer.length} bytes`);
  return pdfBuffer;
}