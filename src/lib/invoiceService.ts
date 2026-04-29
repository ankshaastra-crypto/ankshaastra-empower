// Frontend invoice service.
//
// NOTE: The original implementation called a Supabase Edge Function called
// `generate-invoice`. That function is not deployed in this Cloudflare-only
// project — invoice PDFs are generated server-side inside the Cloudflare
// Function `functions/api/payment-webhook.js` and emailed automatically.
//
// These admin UI helpers (manual generate / backfill / lookup) currently
// have no backing endpoint, so they return a clear "not implemented"
// response. To re-enable, add a Cloudflare Function (e.g. `/api/admin/invoice`)
// that calls the same `generateInvoicePDFLocal` helper and wire it up here.

const NOT_IMPLEMENTED =
  "Invoice admin actions are not configured on this deployment.";

export interface GenerateInvoiceResult {
  success: boolean;
  invoiceId?: string;
  error?: string;
}

export interface BackfillInvoicesResult {
  success: boolean;
  processed: number;
  failed: number;
  error?: string;
}

export interface InvoiceRecord {
  id: number | string;
  invoice_number: string;
  total_amount: number;
  created_at: string;
}

export async function generateInvoice(_orderId: string): Promise<GenerateInvoiceResult> {
  return { success: false, error: NOT_IMPLEMENTED };
}

export async function backfillInvoices(): Promise<BackfillInvoicesResult> {
  return { success: false, processed: 0, failed: 0, error: NOT_IMPLEMENTED };
}

export async function getInvoiceForOrder(
  _orderId: string,
): Promise<InvoiceRecord | null> {
  return null;
}
