import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const COMPANY = {
  name: "Ankshaastra",
  description: "Empower Your Name",
  address: "Unit No. O-622, Block-E, Eye of Noida, Sector 140A, Noida-201305",
  phone: "9667305577",
  email: "social@ankshaastra.com",
  gstin: "09AAFFE7583B1ZD",
  hsnSac: "998399",
};

const BANK = {
  name: "Axis Bank",
  account: "925020055368236",
  ifsc: "UTIB0001837",
  holder: "Ankshaastra Occult Experts LLP",
  branch: "Agra Road",
};

const UPI = {
  upiId: "razorpay.me/@ankshaastraoccultexpertsllp",
};

const PACKAGE_NAMES: Record<string, string> = {
  single: "Single Name Numerology Report",
  premium: "Premium Numerology Report (3 Names)",
  namecheck: "Name Check Report",
  baby_name: "Baby Name Numerology Report",
};

// ─── GST LOGIC (GST-INCLUSIVE) ───
function calculateGST(amount: number, pincode: string | null) {
  const totalAmount = amount;
  const gstRate = 0.18;
  const pin = parseInt(pincode || "0", 10);
  const isIntraState = pin >= 200000 && pin <= 289999;
  const subtotal = +(totalAmount / (1 + gstRate)).toFixed(2);

  if (isIntraState) {
    const cgstAmount = +(subtotal * 0.09).toFixed(2);
    const sgstAmount = +(subtotal * 0.09).toFixed(2);
    return { isIntraState: true, subtotal, cgstRate: 9, cgstAmount, sgstRate: 9, sgstAmount, igstRate: 0, igstAmount: 0, totalAmount };
  } else {
    const igstAmount = +(subtotal * gstRate).toFixed(2);
    return { isIntraState: false, subtotal, cgstRate: 0, cgstAmount: 0, sgstRate: 0, sgstAmount: 0, igstRate: 18, igstAmount, totalAmount };
  }
}

// ─── PDF GENERATION ───
async function generateInvoicePDFBytes(data: {
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  packageType: string;
  transactionId: string | null;
  gst: ReturnType<typeof calculateGST>;
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();

  const purple = rgb(0.545, 0.361, 0.965);
  const black = rgb(0, 0, 0);
  const gray = rgb(0.4, 0.4, 0.4);
  const lightGray = rgb(0.95, 0.95, 0.95);
  const white = rgb(1, 1, 1);

  let y = height - 40;
  const leftMargin = 40;
  const rightMargin = width - 40;

  // Header
  page.drawText(COMPANY.name, { x: leftMargin, y, size: 22, font: fontBold, color: purple });
  page.drawText("INVOICE", { x: rightMargin - font.widthOfTextAtSize("INVOICE", 22), y, size: 22, font: fontBold, color: black });
  y -= 18;
  page.drawText(COMPANY.description, { x: leftMargin, y, size: 10, font, color: gray });
  y -= 14;
  page.drawText(COMPANY.address, { x: leftMargin, y, size: 8, font, color: gray });

  const invNoText = `Invoice No: ${data.invoiceNumber}`;
  const invDateText = `Date: ${data.invoiceDate}`;
  page.drawText(invNoText, { x: rightMargin - font.widthOfTextAtSize(invNoText, 9), y: height - 62, size: 9, font, color: gray });
  page.drawText(invDateText, { x: rightMargin - font.widthOfTextAtSize(invDateText, 9), y: height - 74, size: 9, font, color: gray });

  y -= 14;
  page.drawText(`Phone: ${COMPANY.phone}  |  Email: ${COMPANY.email}`, { x: leftMargin, y, size: 8, font, color: gray });
  y -= 14;
  page.drawText(`GSTIN: ${COMPANY.gstin}`, { x: leftMargin, y, size: 8, font, color: gray });

  y -= 10;
  page.drawLine({ start: { x: leftMargin, y }, end: { x: rightMargin, y }, thickness: 2, color: purple });

  // Bill To
  y -= 25;
  page.drawText("Bill To", { x: leftMargin, y, size: 14, font: fontBold, color: purple });
  y -= 18;
  page.drawText(`Name: ${data.customerName}`, { x: leftMargin, y, size: 10, font, color: black });
  page.drawText(`Phone: ${data.customerMobile}`, { x: 320, y, size: 10, font, color: black });
  y -= 15;
  page.drawText(`Email: ${data.customerEmail}`, { x: leftMargin, y, size: 10, font, color: black });
  if (data.transactionId) {
    page.drawText(`Transaction ID: ${data.transactionId}`, { x: 320, y, size: 10, font, color: black });
  }

  // Items Table
  y -= 30;
  page.drawText("Items", { x: leftMargin, y, size: 14, font: fontBold, color: purple });
  y -= 20;
  page.drawRectangle({ x: leftMargin, y: y - 5, width: rightMargin - leftMargin, height: 22, color: purple });
  page.drawText("Description", { x: leftMargin + 10, y, size: 10, font: fontBold, color: white });
  page.drawText("HSN/SAC", { x: 250, y, size: 10, font: fontBold, color: white });
  page.drawText("Qty", { x: 340, y, size: 10, font: fontBold, color: white });
  page.drawText("Unit Price", { x: 400, y, size: 10, font: fontBold, color: white });
  page.drawText("Total", { x: 490, y, size: 10, font: fontBold, color: white });

  y -= 25;
  const packageName = PACKAGE_NAMES[data.packageType] || "Numerology Report";
  page.drawText(packageName, { x: leftMargin + 10, y, size: 9, font, color: black });
  page.drawText(COMPANY.hsnSac, { x: 250, y, size: 9, font, color: black });
  page.drawText("1", { x: 340, y, size: 9, font, color: black });
  page.drawText(`Rs.${data.gst.subtotal.toLocaleString("en-IN")}`, { x: 400, y, size: 9, font, color: black });
  page.drawText(`Rs.${data.gst.subtotal.toLocaleString("en-IN")}`, { x: 490, y, size: 9, font, color: black });

  // GST Breakdown
  y -= 35;
  page.drawLine({ start: { x: 350, y: y + 10 }, end: { x: rightMargin, y: y + 10 }, thickness: 0.5, color: gray });

  const drawTotalRow = (label: string, value: string, yPos: number, isBold = false) => {
    const f = isBold ? fontBold : font;
    const sz = isBold ? 12 : 10;
    page.drawText(label, { x: 350, y: yPos, size: sz, font: f, color: black });
    page.drawText(value, { x: rightMargin - f.widthOfTextAtSize(value, sz) - 5, y: yPos, size: sz, font: f, color: purple });
  };

  drawTotalRow("Subtotal:", `Rs.${data.gst.subtotal.toLocaleString("en-IN")}`, y);
  y -= 18;

  if (data.gst.isIntraState) {
    drawTotalRow(`CGST (${data.gst.cgstRate}%):`, `Rs.${data.gst.cgstAmount.toLocaleString("en-IN")}`, y);
    y -= 18;
    drawTotalRow(`SGST (${data.gst.sgstRate}%):`, `Rs.${data.gst.sgstAmount.toLocaleString("en-IN")}`, y);
    y -= 18;
  } else {
    drawTotalRow(`IGST (${data.gst.igstRate}%):`, `Rs.${data.gst.igstAmount.toLocaleString("en-IN")}`, y);
    y -= 18;
  }

  page.drawLine({ start: { x: 350, y: y + 10 }, end: { x: rightMargin, y: y + 10 }, thickness: 2, color: purple });
  drawTotalRow("Total Amount:", `Rs.${data.gst.totalAmount.toLocaleString("en-IN")}`, y, true);

  // Payment Details
  y -= 40;
  page.drawRectangle({ x: leftMargin, y: y - 70, width: 240, height: 85, color: lightGray });
  page.drawText("Bank Details", { x: leftMargin + 10, y, size: 11, font: fontBold, color: purple });
  y -= 14;
  page.drawText(`Bank: ${BANK.name}`, { x: leftMargin + 10, y, size: 8, font, color: gray });
  y -= 12;
  page.drawText(`A/C: ${BANK.account}`, { x: leftMargin + 10, y, size: 8, font, color: gray });
  y -= 12;
  page.drawText(`IFSC: ${BANK.ifsc}`, { x: leftMargin + 10, y, size: 8, font, color: gray });
  y -= 12;
  page.drawText(`Holder: ${BANK.holder}`, { x: leftMargin + 10, y, size: 8, font, color: gray });
  y -= 12;
  page.drawText(`Branch: ${BANK.branch}`, { x: leftMargin + 10, y, size: 8, font, color: gray });

  const upiBoxY = y + 62;
  page.drawRectangle({ x: 310, y: upiBoxY - 40, width: 240, height: 55, color: lightGray });
  page.drawText("UPI Payment", { x: 320, y: upiBoxY, size: 11, font: fontBold, color: purple });
  page.drawText(`UPI ID: ${UPI.upiId}`, { x: 320, y: upiBoxY - 16, size: 8, font, color: gray });

  // Notes
  y -= 25;
  page.drawRectangle({ x: leftMargin, y: y - 30, width: rightMargin - leftMargin, height: 42, color: rgb(1, 0.973, 0.882) });
  page.drawRectangle({ x: leftMargin, y: y - 30, width: 3, height: 42, color: rgb(1, 0.757, 0.027) });
  page.drawText("Notes", { x: leftMargin + 10, y, size: 11, font: fontBold, color: purple });
  y -= 13;
  page.drawText("Your personalized numerology report will be delivered within 24-48 hours.", { x: leftMargin + 10, y, size: 8, font, color: gray });
  y -= 11;
  page.drawText("Report will be sent to your registered whatsapp number / email address.", { x: leftMargin + 10, y, size: 8, font, color: gray });

  // Terms
  y -= 25;
  page.drawRectangle({ x: leftMargin, y: y - 45, width: rightMargin - leftMargin, height: 58, color: lightGray });
  page.drawText("Terms & Conditions", { x: leftMargin + 10, y, size: 11, font: fontBold, color: purple });
  y -= 13;
  const terms = [
    "Items are non-refundable once the order is confirmed.",
    "All prices are inclusive of taxes unless otherwise stated.",
    "Payment must be made within the due date mentioned above.",
    `For any queries, please contact us at ${COMPANY.email} or +91-${COMPANY.phone}.`,
  ];
  for (const t of terms) {
    page.drawText(`• ${t}`, { x: leftMargin + 10, y, size: 7, font, color: gray });
    y -= 11;
  }

  // Footer
  y -= 15;
  page.drawLine({ start: { x: leftMargin, y: y + 5 }, end: { x: rightMargin, y: y + 5 }, thickness: 0.5, color: lightGray });
  const thankYou = "Thank you for your business!";
  page.drawText(thankYou, { x: (width - font.widthOfTextAtSize(thankYou, 9)) / 2, y, size: 9, font: fontBold, color: gray });
  y -= 12;
  const footerText = "This is a computer-generated invoice and does not require a signature.";
  page.drawText(footerText, { x: (width - font.widthOfTextAtSize(footerText, 8)) / 2, y, size: 8, font, color: gray });

  return await pdfDoc.save();
}

// ─── GET FINANCIAL YEAR ───
function getFinancialYear(date: Date): string {
  const month = date.getMonth();
  const year = date.getFullYear();
  if (month >= 3) return `${year}-${(year + 1).toString().slice(2)}`;
  return `${year - 1}-${year.toString().slice(2)}`;
}

// ─── MAIN HANDLER ───
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "generate") {
      const { orderId } = body;
      if (!orderId) {
        return new Response(JSON.stringify({ error: "orderId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const result = await generateForOrder(supabase as any, orderId);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "backfill") {
      const result = await backfillInvoices(supabase as any);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use: generate, backfill" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Invoice generation error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ─── GENERATE FOR SINGLE ORDER ───
// deno-lint-ignore no-explicit-any
async function generateForOrder(supabase: any, orderId: string, retryCount = 0): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
  try {
    const { data: existing } = await supabase
      .from("invoices")
      .select("id, invoice_number")
      .eq("order_id", orderId)
      .maybeSingle();

    if (existing) {
      return { success: true, invoiceId: existing.id };
    }

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (orderErr || !order) {
      return { success: false, error: `Order not found: ${orderId}` };
    }

    const pincode = order.child_pincode || null;
    const gst = calculateGST(order.amount, pincode);

    const orderDate = new Date(order.created_at);
    const fy = getFinancialYear(orderDate);
    const { data: seqData, error: seqErr } = await supabase.rpc(
      "get_next_invoice_number",
      { p_financial_year: fy },
    );

    if (seqErr || !seqData?.[0]) {
      throw new Error(`Invoice sequence error: ${seqErr?.message}`);
    }

    const { invoice_number, sequence_num } = seqData[0];
    const invoiceDate = orderDate.toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });

    // Generate PDF (not stored, just for DB record)
    await generateInvoicePDFBytes({
      invoiceNumber: invoice_number,
      invoiceDate,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerMobile: order.customer_mobile,
      packageType: order.package_type,
      transactionId: order.transaction_id,
      gst,
    });

    // Save invoice record to DB (no storage_url)
    const { data: inv, error: invErr } = await supabase
      .from("invoices")
      .insert({
        order_id: orderId,
        invoice_number,
        invoice_sequence: sequence_num,
        financial_year: fy,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_mobile: order.customer_mobile,
        customer_city: order.customer_city,
        package_type: order.package_type,
        subtotal: gst.subtotal,
        cgst_rate: gst.cgstRate,
        cgst_amount: gst.cgstAmount,
        sgst_rate: gst.sgstRate,
        sgst_amount: gst.sgstAmount,
        igst_rate: gst.igstRate,
        igst_amount: gst.igstAmount,
        total_amount: gst.totalAmount,
        is_intra_state: gst.isIntraState,
        hsn_sac_code: COMPANY.hsnSac,
        transaction_id: order.transaction_id,
        storage_url: null,
      })
      .select("id")
      .single();

    if (invErr) throw new Error(`DB insert error: ${invErr.message}`);

    return { success: true, invoiceId: inv!.id };
  } catch (err) {
    if (retryCount < 2) {
      console.warn(`Retry ${retryCount + 1} for order ${orderId}:`, (err as Error).message);
      await new Promise((r) => setTimeout(r, 1000 * (retryCount + 1)));
      return generateForOrder(supabase, orderId, retryCount + 1);
    }
    console.error(`Failed after retries for order ${orderId}:`, err);
    return { success: false, error: (err as Error).message };
  }
}

// ─── BACKFILL ───
// deno-lint-ignore no-explicit-any
async function backfillInvoices(supabase: any) {
  const { data: orders, error } = await supabase
    .from("orders")
    .select("order_id")
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Fetch orders error: ${error.message}`);
  if (!orders?.length) return { processed: 0, success: 0, failed: 0, results: [] };

  const { data: existingInvoices } = await supabase
    .from("invoices")
    .select("order_id");

  const existingSet = new Set((existingInvoices || []).map((i: { order_id: string }) => i.order_id));
  const toProcess = orders.filter((o: { order_id: string }) => !existingSet.has(o.order_id));

  const results: Array<{ orderId: string; success: boolean; error?: string }> = [];
  let success = 0;
  let failed = 0;

  for (let i = 0; i < toProcess.length; i += 5) {
    const batch = toProcess.slice(i, i + 5);
    const batchResults = await Promise.allSettled(
      batch.map((o: { order_id: string }) => generateForOrder(supabase, o.order_id)),
    );

    for (let j = 0; j < batchResults.length; j++) {
      const r = batchResults[j];
      const orderId = batch[j].order_id;
      if (r.status === "fulfilled" && r.value.success) {
        success++;
        results.push({ orderId, success: true });
      } else {
        failed++;
        const err = r.status === "fulfilled" ? r.value.error : (r.reason as Error).message;
        results.push({ orderId, success: false, error: err });
      }
    }

    if (i + 5 < toProcess.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return { processed: toProcess.length, success, failed, results };
}
