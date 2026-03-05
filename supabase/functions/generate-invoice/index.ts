import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Indian pincode first 2 digits to state mapping
const pincodeToState: Record<string, string> = {
  "11": "Delhi", "12": "Haryana", "13": "Haryana", "14": "Punjab", "15": "Punjab",
  "16": "Punjab", "17": "Himachal Pradesh", "18": "Jammu & Kashmir", "19": "Jammu & Kashmir",
  "20": "Uttar Pradesh", "21": "Uttar Pradesh", "22": "Uttar Pradesh", "23": "Uttar Pradesh",
  "24": "Uttar Pradesh", "25": "Uttar Pradesh", "26": "Uttarakhand", "27": "Uttar Pradesh",
  "28": "Uttar Pradesh", "30": "Rajasthan", "31": "Rajasthan", "32": "Rajasthan",
  "33": "Rajasthan", "34": "Rajasthan", "36": "Gujarat", "37": "Gujarat",
  "38": "Gujarat", "39": "Gujarat", "40": "Maharashtra", "41": "Maharashtra",
  "42": "Maharashtra", "43": "Maharashtra", "44": "Maharashtra", "45": "Madhya Pradesh",
  "46": "Madhya Pradesh", "47": "Madhya Pradesh", "48": "Madhya Pradesh",
  "49": "Chhattisgarh", "50": "Telangana", "51": "Telangana", "52": "Andhra Pradesh",
  "53": "Andhra Pradesh", "56": "Karnataka", "57": "Karnataka", "58": "Karnataka",
  "59": "Karnataka", "60": "Tamil Nadu", "61": "Tamil Nadu", "62": "Tamil Nadu",
  "63": "Tamil Nadu", "64": "Tamil Nadu", "67": "Kerala", "68": "Kerala",
  "69": "Kerala", "70": "West Bengal", "71": "West Bengal", "72": "West Bengal",
  "73": "West Bengal", "74": "West Bengal", "75": "Odisha", "76": "Odisha",
  "77": "Odisha", "78": "Assam", "79": "Assam", "80": "Bihar", "81": "Bihar",
  "82": "Bihar", "83": "Bihar", "84": "Bihar", "85": "Bihar",
  "10": "Delhi",
  "29": "Uttar Pradesh",
  "35": "Rajasthan",
  "54": "Andhra Pradesh", "55": "Andhra Pradesh",
  "65": "Tamil Nadu", "66": "Tamil Nadu",
  "86": "Jharkhand", "87": "Chhattisgarh",
  "90": "Manipur", "91": "Meghalaya", "92": "Mizoram",
  "93": "Nagaland", "94": "Tripura", "95": "Arunachal Pradesh",
  "79": "Assam",
};

function getStateFromPincode(pincode: string): string {
  if (!pincode || pincode.length < 2) return "Unknown";
  const prefix = pincode.substring(0, 2);
  return pincodeToState[prefix] || "Unknown";
}

function getFinancialYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  // Financial year starts April (month 3)
  if (month >= 3) {
    return `${year}-${(year + 1).toString().slice(-2)}`;
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`;
  }
}

const BUSINESS_STATE = "Uttar Pradesh";
const GST_RATE = 6; // Total GST rate in percentage

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      orderId,
      customerName,
      customerEmail,
      customerMobile,
      customerCity,
      customerPincode,
      packageType,
      totalAmount,
      transactionId,
    } = await req.json();

    if (!orderId || !totalAmount) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing orderId or totalAmount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if invoice already exists for this order
    const { data: existing } = await supabase
      .from("invoices")
      .select("invoice_number, id")
      .eq("order_id", orderId)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({
          success: true,
          invoiceNumber: existing.invoice_number,
          invoiceId: existing.id,
          message: "Invoice already exists",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine state from pincode
    const customerState = getStateFromPincode(customerPincode || "");
    const isIntraState = customerState === BUSINESS_STATE;

    // Calculate GST
    // Total amount is inclusive of GST
    // Subtotal = Total / (1 + GST_RATE/100)
    const total = Number(totalAmount);
    const subtotal = Math.round((total / (1 + GST_RATE / 100)) * 100) / 100;
    const totalGst = Math.round((total - subtotal) * 100) / 100;

    let cgstRate = 0, cgstAmount = 0, sgstRate = 0, sgstAmount = 0;
    let igstRate = 0, igstAmount = 0;

    if (isIntraState) {
      cgstRate = GST_RATE / 2; // 3%
      sgstRate = GST_RATE / 2; // 3%
      cgstAmount = Math.round((totalGst / 2) * 100) / 100;
      sgstAmount = Math.round((totalGst / 2) * 100) / 100;
    } else {
      igstRate = GST_RATE; // 6%
      igstAmount = totalGst;
    }

    // Get financial year and next invoice number
    const financialYear = getFinancialYear();
    const { data: seqData, error: seqError } = await supabase.rpc(
      "get_next_invoice_number",
      { p_financial_year: financialYear }
    );

    if (seqError || !seqData || seqData.length === 0) {
      console.error("Error getting invoice number:", seqError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to generate invoice number" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const invoiceNumber = seqData[0].invoice_number;
    const sequenceNum = seqData[0].sequence_num;

    // Insert invoice record
    const { data: invoice, error: insertError } = await supabase
      .from("invoices")
      .insert({
        order_id: orderId,
        invoice_number: invoiceNumber,
        invoice_sequence: sequenceNum,
        financial_year: financialYear,
        customer_name: customerName || "",
        customer_email: customerEmail || "",
        customer_mobile: customerMobile || "",
        customer_city: customerCity || "",
        customer_state: customerState,
        customer_pincode: customerPincode || "",
        package_type: packageType || "single",
        subtotal,
        cgst_rate: cgstRate,
        cgst_amount: cgstAmount,
        sgst_rate: sgstRate,
        sgst_amount: sgstAmount,
        igst_rate: igstRate,
        igst_amount: igstAmount,
        total_amount: total,
        is_intra_state: isIntraState,
        transaction_id: transactionId || "",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting invoice:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to create invoice" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        invoiceNumber,
        invoiceId: invoice.id,
        invoiceData: {
          invoiceNumber,
          financialYear,
          customerState,
          isIntraState,
          subtotal,
          cgstRate,
          cgstAmount,
          sgstRate,
          sgstAmount,
          igstRate,
          igstAmount,
          totalAmount: total,
          hsnSacCode: "998399",
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Invoice generation error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
