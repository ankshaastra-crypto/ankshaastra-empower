import { supabase } from "@/integrations/supabase/client";

export async function generateInvoice(orderId: string) {
  const { data, error } = await supabase.functions.invoke("generate-invoice", {
    body: { action: "generate", orderId },
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function getInvoiceDownloadUrl(invoiceId: string) {
  const { data, error } = await supabase.functions.invoke("generate-invoice", {
    body: { action: "download", invoiceId },
  });
  if (error) throw new Error(error.message);
  return data?.url as string;
}

export async function backfillInvoices() {
  const { data, error } = await supabase.functions.invoke("generate-invoice", {
    body: { action: "backfill" },
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function getInvoiceForOrder(orderId: string) {
  const { data } = await supabase
    .from("invoices")
    .select("id, invoice_number, storage_url, total_amount, created_at")
    .eq("order_id", orderId)
    .maybeSingle();
  return data;
}
