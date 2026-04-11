// api/_utils/supabase-server.js - Server-side Supabase client with service_role key (bypass RLS)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

export const supabaseServer = createClient<Database>(supabaseUrl, supabaseServiceKey, {
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
