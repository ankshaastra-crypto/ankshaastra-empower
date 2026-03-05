import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, Download, MessageCircle, User, CreditCard, Package, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trackPurchase } from "@/lib/metaPixel";
import { supabase } from "@/integrations/supabase/client";

interface PaymentData {
  success: boolean;
  status: "SUCCESS" | "FAILED";
  orderId: string;
  transactionId?: string;
  amount?: number;
  customerEmail?: string;
  customerName?: string;
  customerMobile?: string;
  customerCity?: string;
  customerPincode?: string;
  packageType?: string;
  data?: unknown;
}

interface InvoiceData {
  invoiceNumber: string;
  financialYear: string;
  customerState: string;
  isIntraState: boolean;
  subtotal: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalAmount: number;
  hsnSacCode: string;
}

const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  // Generate invoice after successful payment
  const generateInvoice = async (data: PaymentData) => {
    setInvoiceLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("generate-invoice", {
        body: {
          orderId: data.orderId,
          customerName: data.customerName || "",
          customerEmail: data.customerEmail || "",
          customerMobile: data.customerMobile || "",
          customerCity: data.customerCity || "",
          customerPincode: data.customerPincode || "",
          packageType: data.packageType || "single",
          totalAmount: data.amount || 0,
          transactionId: data.transactionId || "",
        },
      });

      if (error) {
        console.error("Invoice generation error:", error);
        return;
      }

      if (result?.success && result?.invoiceData) {
        setInvoiceData(result.invoiceData);
      } else if (result?.success && result?.invoiceNumber) {
        // Invoice already existed, fetch from DB
        const { data: inv } = await supabase
          .from("invoices")
          .select("*")
          .eq("order_id", data.orderId)
          .maybeSingle();
        if (inv) {
          setInvoiceData({
            invoiceNumber: inv.invoice_number,
            financialYear: inv.financial_year,
            customerState: inv.customer_state || "",
            isIntraState: inv.is_intra_state,
            subtotal: Number(inv.subtotal),
            cgstRate: Number(inv.cgst_rate),
            cgstAmount: Number(inv.cgst_amount),
            sgstRate: Number(inv.sgst_rate),
            sgstAmount: Number(inv.sgst_amount),
            igstRate: Number(inv.igst_rate),
            igstAmount: Number(inv.igst_amount),
            totalAmount: Number(inv.total_amount),
            hsnSacCode: inv.hsn_sac_code,
          });
        }
      }
    } catch (err) {
      console.error("Invoice generation failed:", err);
    } finally {
      setInvoiceLoading(false);
    }
  };

  useEffect(() => {
    const checkPaymentStatus = async () => {
      const merchantTransactionId =
        searchParams.get("merchantTransactionId") ||
        searchParams.get("txnId") ||
        searchParams.get("transactionId") ||
        searchParams.get("transaction_id") ||
        searchParams.get("orderId") ||
        searchParams.get("merchantTransactionId");

      const email = searchParams.get("email");
      const name = searchParams.get("name");
      const packageType = searchParams.get("package");

      let storedOrderData = null;
      if (merchantTransactionId) {
        try {
          const stored = localStorage.getItem(`order_${merchantTransactionId}`);
          if (stored) {
            storedOrderData = JSON.parse(stored);
            localStorage.removeItem(`order_${merchantTransactionId}`);
          }
        } catch (e) {
          // Silent fail
        }
      }

      const finalEmail = storedOrderData?.email || email || "";
      const finalName = storedOrderData?.name || name || "";
      const finalPackageType = storedOrderData?.packageType || packageType || "single";

      if (!merchantTransactionId) {
        console.error("No transaction ID found in URL parameters.");
        setStatus("failed");
        return;
      }

      try {
        const params = new URLSearchParams({
          merchantTransactionId,
          email: finalEmail,
          name: finalName,
          package: finalPackageType,
        });

        if (storedOrderData) {
          if (storedOrderData.person1Name) params.append("person1Name", storedOrderData.person1Name);
          if (storedOrderData.person1Dob) params.append("person1Dob", storedOrderData.person1Dob);
          if (storedOrderData.person2Name) params.append("person2Name", storedOrderData.person2Name);
          if (storedOrderData.person2Dob) params.append("person2Dob", storedOrderData.person2Dob);
          if (storedOrderData.person3Name) params.append("person3Name", storedOrderData.person3Name);
          if (storedOrderData.person3Dob) params.append("person3Dob", storedOrderData.person3Dob);
          if (storedOrderData.mobile) params.append("mobile", storedOrderData.mobile);
          if (storedOrderData.dob) params.append("dob", storedOrderData.dob);
        }

        const currentParams = new URLSearchParams(searchParams.toString());
        const dataParam = currentParams.get("data");
        const orderIdParam = currentParams.get("orderId") || merchantTransactionId;
        
        const newParams = new URLSearchParams();
        if (orderIdParam) newParams.append("orderId", orderIdParam);
        if (dataParam) newParams.append("data", dataParam);

        const response = await fetch(`/api/payment-status?${params.toString()}`);

        if (!response.ok) {
          setStatus("failed");
          if (!location.pathname.includes("/failed") && orderIdParam) {
            navigate(`/payment/failed${newParams.toString() ? '?' + newParams.toString() : ''}`, { replace: true });
          }
          return;
        }

        const result = await response.json();

        if (result.success && result.status === "SUCCESS") {
          setStatus("success");
          setPaymentData(result);

          const amount = result.amount || 0;
          const orderId = result.orderId || merchantTransactionId;
          const pkgType = packageType || "single";

          if (amount > 0) {
            trackPurchase(amount, "INR", orderId, pkgType);
          }

          // Generate GST invoice
          generateInvoice(result);

          if (!location.pathname.includes("/success")) {
            navigate(`/payment/success${newParams.toString() ? '?' + newParams.toString() : ''}`, { replace: true });
          }
        } else {
          setStatus("failed");
          setPaymentData(result);
          if (!location.pathname.includes("/failed")) {
            navigate(`/payment/failed${newParams.toString() ? '?' + newParams.toString() : ''}`, { replace: true });
          }
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
        setStatus("failed");
        const orderIdParam = searchParams.get("orderId") || 
          searchParams.get("merchantTransactionId") ||
          searchParams.get("txnId") ||
          searchParams.get("transactionId");
        const dataParam = searchParams.get("data");
        if (!location.pathname.includes("/failed") && orderIdParam) {
          const newParams = new URLSearchParams();
          newParams.append("orderId", orderIdParam);
          if (dataParam) newParams.append("data", dataParam);
          navigate(`/payment/failed${newParams.toString() ? '?' + newParams.toString() : ''}`, { replace: true });
        }
      }
    };

    checkPaymentStatus();
  }, [searchParams]);

  const packageNames: Record<string, string> = {
    namecheck: "Name Check",
    single: "Single Report",
    family: "Family Package (3 Reports)",
  };

  const handleDownloadInvoice = async () => {
    if (!paymentData) return;

    let companyData = null;
    try {
      const invoiceDataResponse = await fetch("/invoice-data.json");
      if (invoiceDataResponse.ok) {
        companyData = await invoiceDataResponse.json();
      }
    } catch (e) { /* use defaults */ }

    const company = companyData?.company || {
      name: "Ankshaastra",
      description: "Empower Your Name",
      address: "Unit No. O-622, Block-E, Eye of Noida, Sector 140A, Noida-201305",
      phone: "9667305577",
      email: "social@ankshaastra.com",
      gstin: "APPLIED FOR",
    };

    const bankDetails = companyData?.bankDetails || {
      name: "UCO Bank",
      accountNumber: "01200110039892",
      ifsc: "UCBA0000120",
      accountHolder: "Ankshaastra Occult Experts LLP",
      branch: "Parliament Retail Branch",
    };

    const upiDetails = companyData?.upiDetails || { upiId: "ankshaastra@paytm" };
    const notes = companyData?.notes || [];
    const terms = companyData?.terms || [];

    const invoiceDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const packageName = packageNames[paymentData.packageType || "single"] || "Single Report";

    // GST data
    const inv = invoiceData;
    const invoiceNumber = inv?.invoiceNumber || paymentData.orderId;
    const subtotal = inv?.subtotal ?? paymentData.amount ?? 0;
    const totalAmount = inv?.totalAmount ?? paymentData.amount ?? 0;

    let gstRows = "";
    if (inv) {
      if (inv.isIntraState) {
        gstRows = `
          <div class="total-row">
            <div class="total-label">CGST @ ${inv.cgstRate}%:</div>
            <div class="total-value">₹${inv.cgstAmount.toLocaleString("en-IN")}</div>
          </div>
          <div class="total-row">
            <div class="total-label">SGST @ ${inv.sgstRate}%:</div>
            <div class="total-value">₹${inv.sgstAmount.toLocaleString("en-IN")}</div>
          </div>`;
      } else {
        gstRows = `
          <div class="total-row">
            <div class="total-label">IGST @ ${inv.igstRate}%:</div>
            <div class="total-value">₹${inv.igstAmount.toLocaleString("en-IN")}</div>
          </div>`;
      }
    }

    const customerStateSection = inv?.customerState ? `
      <div class="info-item">
        <strong>State:</strong>
        <span>${inv.customerState}</span>
      </div>` : "";

    const hsnCode = inv?.hsnSacCode || "998399";
    const supplyType = inv?.isIntraState ? "Intra-State (CGST + SGST)" : "Inter-State (IGST)";

    const invoiceHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tax Invoice ${invoiceNumber}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; background: white; padding: 20px; }
        .invoice-container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; position: relative; }
        .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); opacity: 0.05; font-size: 80px; font-weight: bold; color: #000; z-index: 0; pointer-events: none; }
        .content { position: relative; z-index: 1; }
        .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #8B5CF6; padding-bottom: 20px; }
        .company-info h1 { color: #8B5CF6; font-size: 24px; margin-bottom: 10px; }
        .company-info p { color: #666; font-size: 12px; line-height: 1.6; margin: 4px 0; }
        .invoice-details { text-align: right; }
        .invoice-details h2 { color: #333; font-size: 24px; margin-bottom: 10px; }
        .invoice-details p { color: #666; font-size: 12px; margin: 4px 0; }
        .tax-invoice-badge { background: #8B5CF6; color: white; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: bold; display: inline-block; margin-bottom: 8px; }
        .customer-section { margin-bottom: 20px; }
        .customer-section h3 { color: #8B5CF6; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #f0f0f0; padding-bottom: 5px; }
        .customer-info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .info-item { margin-bottom: 8px; }
        .info-item strong { color: #333; display: block; margin-bottom: 4px; font-size: 12px; }
        .info-item span { color: #666; font-size: 12px; }
        .supply-info { background: #f8f4ff; padding: 10px 15px; border-radius: 6px; margin-bottom: 20px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
        .supply-info p { font-size: 11px; color: #555; }
        .supply-info strong { color: #333; }
        .items-section { margin: 20px 0; }
        .items-section h3 { color: #8B5CF6; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #f0f0f0; padding-bottom: 5px; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .items-table th { background: #8B5CF6; color: white; padding: 10px; text-align: left; font-weight: 600; font-size: 12px; }
        .items-table td { padding: 10px; border-bottom: 1px solid #f0f0f0; font-size: 12px; }
        .text-right { text-align: right; }
        .total-section { margin-top: 20px; text-align: right; }
        .total-row { display: flex; justify-content: flex-end; margin-bottom: 8px; }
        .total-label { width: 180px; text-align: right; padding-right: 20px; font-weight: 600; color: #333; font-size: 12px; }
        .total-value { width: 120px; text-align: right; color: #555; font-weight: bold; font-size: 13px; }
        .grand-total { border-top: 2px solid #8B5CF6; padding-top: 10px; margin-top: 10px; }
        .grand-total .total-value { font-size: 18px; color: #8B5CF6; }
        .payment-section { margin-top: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .bank-details, .upi-section { background: #f9f9f9; padding: 12px; border-radius: 6px; }
        .bank-details h4, .upi-section h4 { color: #8B5CF6; margin-bottom: 8px; font-size: 13px; }
        .bank-details p, .upi-section p { color: #666; font-size: 11px; margin: 4px 0; line-height: 1.4; }
        .notes-section { margin-top: 20px; padding: 12px; background: #fff8e1; border-left: 3px solid #ffc107; }
        .notes-section h4 { color: #8B5CF6; margin-bottom: 8px; font-size: 13px; }
        .notes-section p { color: #666; font-size: 11px; line-height: 1.4; margin: 4px 0; }
        .terms-section { margin-top: 20px; padding: 12px; background: #f5f5f5; border-radius: 6px; }
        .terms-section h4 { color: #8B5CF6; margin-bottom: 8px; font-size: 13px; }
        .terms-section p { color: #666; font-size: 10px; line-height: 1.4; margin: 3px 0; }
        .footer { margin-top: 30px; text-align: center; color: #999; font-size: 10px; border-top: 1px solid #f0f0f0; padding-top: 15px; }
        @media print { body { background: white; padding: 0; } .invoice-container { box-shadow: none; } @page { margin: 0.5cm; } }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="watermark">${company.name}</div>
        <div class="content">
            <div class="header">
                <div class="company-info">
                    <h1>${company.name}</h1>
                    <p>${company.description}</p>
                    <p>${company.address}</p>
                    <p>Phone: ${company.phone}</p>
                    <p>Email: ${company.email}</p>
                    ${company.gstin ? `<p><strong>GSTIN:</strong> ${company.gstin}</p>` : ""}
                </div>
                <div class="invoice-details">
                    <span class="tax-invoice-badge">TAX INVOICE</span>
                    <h2>INVOICE</h2>
                    <p><strong>Invoice No:</strong> ${invoiceNumber}</p>
                    <p><strong>Date:</strong> ${invoiceDate}</p>
                    <p><strong>Place of Supply:</strong> ${inv?.customerState || "N/A"}</p>
                </div>
            </div>

            <div class="supply-info">
                <p><strong>HSN/SAC Code:</strong> ${hsnCode}</p>
                <p><strong>Supply Type:</strong> ${supplyType}</p>
                <p><strong>State of Supply:</strong> ${inv?.customerState || "N/A"}</p>
            </div>
            
            <div class="customer-section">
                <h3>Bill To</h3>
                <div class="customer-info">
                    <div>
                        <div class="info-item">
                            <strong>Name:</strong>
                            <span>${paymentData.customerName || "Customer"}</span>
                        </div>
                        <div class="info-item">
                            <strong>Email:</strong>
                            <span>${paymentData.customerEmail || "N/A"}</span>
                        </div>
                        ${customerStateSection}
                    </div>
                    <div>
                        <div class="info-item">
                            <strong>Phone:</strong>
                            <span>${paymentData.customerMobile || "N/A"}</span>
                        </div>
                        ${paymentData.transactionId ? `<div class="info-item"><strong>Transaction ID:</strong><span>${paymentData.transactionId}</span></div>` : ""}
                    </div>
                </div>
            </div>
            
            <div class="items-section">
                <h3>Items</h3>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th class="text-right">HSN/SAC</th>
                            <th class="text-right">Qty</th>
                            <th class="text-right">Rate</th>
                            <th class="text-right">Taxable Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <strong>${packageName}</strong>
                                <br><small style="color: #666;">Numerology Consultation Service</small>
                            </td>
                            <td class="text-right">${hsnCode}</td>
                            <td class="text-right">1</td>
                            <td class="text-right">₹${subtotal.toLocaleString("en-IN")}</td>
                            <td class="text-right">₹${subtotal.toLocaleString("en-IN")}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="total-section">
                <div class="total-row">
                    <div class="total-label">Taxable Amount:</div>
                    <div class="total-value">₹${subtotal.toLocaleString("en-IN")}</div>
                </div>
                ${gstRows}
                <div class="total-row grand-total">
                    <div class="total-label">Total Amount:</div>
                    <div class="total-value">₹${totalAmount.toLocaleString("en-IN")}</div>
                </div>
            </div>
            
            <div class="payment-section">
                <div class="bank-details">
                    <h4>Bank Details</h4>
                    <p><strong>Bank Name:</strong> ${bankDetails.name}</p>
                    <p><strong>Account Number:</strong> ${bankDetails.accountNumber}</p>
                    <p><strong>IFSC Code:</strong> ${bankDetails.ifsc}</p>
                    <p><strong>Account Holder:</strong> ${bankDetails.accountHolder}</p>
                    ${bankDetails.branch ? `<p><strong>Branch:</strong> ${bankDetails.branch}</p>` : ""}
                </div>
                <div class="upi-section">
                    <h4>UPI Payment</h4>
                    ${upiDetails.upiId ? `<p><strong>UPI ID:</strong> ${upiDetails.upiId}</p>` : ""}
                </div>
            </div>
            
            ${notes.length > 0 ? `<div class="notes-section"><h4>Notes</h4>${notes.map((n: string) => `<p>${n}</p>`).join("")}</div>` : ""}
            
            <div class="terms-section">
                <h4>Terms & Conditions</h4>
                ${terms.length > 0 ? terms.map((t: string) => `<p>${t}</p>`).join("") : "<p>All prices are inclusive of GST.</p>"}
            </div>
            
            <div class="footer">
                <p>Thank you for your business!</p>
                <p>This is a computer-generated tax invoice and does not require a signature.</p>
            </div>
        </div>
    </div>
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to download the invoice");
      return;
    }
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => printWindow.print(), 250);
    };
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="section-padding bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              {status === "loading" && (
                <div className="text-center py-20">
                  <Loader2 className="w-16 h-16 animate-spin text-accent mx-auto mb-4" />
                  <h2 className="text-2xl font-heading font-bold text-ink-black mb-2">
                    Checking Payment Status...
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Please wait while we verify your payment
                  </p>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-md mx-auto">
                    <p className="text-amber-800 font-semibold text-sm flex items-center justify-center gap-2">
                      ⚠️ Please do not close, refresh, or press back on this page.
                    </p>
                    <p className="text-amber-700 text-xs mt-1">
                      This may take a few seconds. Closing the page may result in payment confirmation issues.
                    </p>
                  </div>
                </div>
              )}

              {status === "success" && (
                <div className="bg-card rounded-2xl p-8 shadow-card">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-12 h-12 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-heading font-bold text-ink-black mb-2">
                      Payment Successful!
                    </h1>
                    <p className="text-muted-foreground">
                      Your payment has been processed successfully
                    </p>
                  </div>

                  {paymentData && (
                    <div className="bg-muted/50 rounded-xl p-6 mb-6">
                      <h3 className="font-heading font-bold text-lg text-ink-black mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-accent" />
                        Order Summary
                      </h3>
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                          <span className="text-muted-foreground text-sm flex items-center gap-2">
                            <CreditCard className="w-4 h-4" /> Order ID
                          </span>
                          <span className="font-semibold text-ink-black text-sm break-all sm:text-right">
                            {paymentData.orderId}
                          </span>
                        </div>
                        {paymentData.transactionId && (
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                            <span className="text-muted-foreground text-sm flex items-center gap-2">
                              <CreditCard className="w-4 h-4" /> Transaction ID
                            </span>
                            <span className="font-semibold text-ink-black text-sm break-all sm:text-right">
                              {paymentData.transactionId}
                            </span>
                          </div>
                        )}
                        {paymentData.packageType && (
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                            <span className="text-muted-foreground text-sm flex items-center gap-2">
                              <Package className="w-4 h-4" /> Package
                            </span>
                            <span className="font-semibold text-ink-black text-sm sm:text-right">
                              {packageNames[paymentData.packageType] || paymentData.packageType}
                            </span>
                          </div>
                        )}
                        {paymentData.customerName && (
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                            <span className="text-muted-foreground text-sm flex items-center gap-2">
                              <User className="w-4 h-4" /> Name
                            </span>
                            <span className="font-semibold text-ink-black text-sm sm:text-right">
                              {paymentData.customerName}
                            </span>
                          </div>
                        )}
                        {paymentData.customerEmail && (
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                            <span className="text-muted-foreground text-sm flex items-center gap-2">
                              <Mail className="w-4 h-4" /> Email
                            </span>
                            <span className="font-semibold text-ink-black text-sm sm:text-right">
                              {paymentData.customerEmail}
                            </span>
                          </div>
                        )}
                        {paymentData.customerMobile && (
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                            <span className="text-muted-foreground text-sm flex items-center gap-2">
                              <Phone className="w-4 h-4" /> Mobile
                            </span>
                            <span className="font-semibold text-ink-black text-sm sm:text-right">
                              {paymentData.customerMobile}
                            </span>
                          </div>
                        )}
                        {paymentData.amount && (
                          <div className="flex justify-between items-center pt-3 border-t border-border">
                            <span className="text-muted-foreground text-sm font-medium">
                              Amount Paid
                            </span>
                            <span className="font-bold text-accent text-xl">
                              ₹{paymentData.amount.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* GST Breakdown */}
                      {invoiceData && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <h4 className="text-sm font-semibold text-ink-black mb-2">
                            GST Breakdown
                          </h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Invoice No.</span>
                              <span className="font-medium">{invoiceData.invoiceNumber}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Taxable Amount</span>
                              <span>₹{invoiceData.subtotal.toLocaleString("en-IN")}</span>
                            </div>
                            {invoiceData.isIntraState ? (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">CGST @ {invoiceData.cgstRate}%</span>
                                  <span>₹{invoiceData.cgstAmount.toLocaleString("en-IN")}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">SGST @ {invoiceData.sgstRate}%</span>
                                  <span>₹{invoiceData.sgstAmount.toLocaleString("en-IN")}</span>
                                </div>
                              </>
                            ) : (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">IGST @ {invoiceData.igstRate}%</span>
                                <span>₹{invoiceData.igstAmount.toLocaleString("en-IN")}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Supply: {invoiceData.isIntraState ? "Intra-State (UP)" : `Inter-State (${invoiceData.customerState})`}</span>
                              <span>HSN: {invoiceData.hsnSacCode}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {invoiceLoading && (
                        <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating GST invoice...
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bg-accent/10 border border-accent/30 rounded-xl p-6 mb-6">
                    <p className="text-ink-black mb-2">
                      <strong>What's Next?</strong>
                    </p>
                    <ul className="text-muted-foreground text-sm space-y-2 list-disc list-inside">
                      <li>
                        <strong>Confirm on WhatsApp:</strong> Share your order details on WhatsApp for faster processing.
                      </li>
                      <li>
                        <strong>Download Tax Invoice:</strong> Click below to download your GST invoice with tax breakdown.
                      </li>
                      <li>
                        <strong>Your Report:</strong> Your personalized numerology report will be delivered via email within 24-48 hours.
                      </li>
                      <li>
                        <strong>Check Spam:</strong> Please check your spam/junk folder if you don't see the emails.
                      </li>
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      variant="hero"
                      onClick={() => {
                        if (!paymentData) return;
                        const msg = encodeURIComponent(
                          `✅ *Payment Confirmed*\n\n` +
                          `Order ID: ${paymentData.orderId}\n` +
                          `Amount: ₹${paymentData.amount?.toLocaleString() || "N/A"}\n` +
                          `Package: ${packageNames[paymentData.packageType || "single"] || paymentData.packageType}\n` +
                          `Name: ${paymentData.customerName || "N/A"}\n` +
                          `Email: ${paymentData.customerEmail || "N/A"}\n` +
                          `Mobile: ${paymentData.customerMobile || "N/A"}\n\n` +
                          `Please process my report. Thank you! 🙏`
                        );
                        window.open(`https://wa.me/919667305577?text=${msg}`, "_blank");
                      }}
                      className="flex items-center gap-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Confirm on WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDownloadInvoice}
                      disabled={invoiceLoading}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      {invoiceLoading ? "Generating..." : "Download Tax Invoice"}
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/")}>
                      Return to Home
                    </Button>
                  </div>
                </div>
              )}

              {status === "failed" && (
                <div className="bg-card rounded-2xl p-8 shadow-card text-center">
                  <div className="mb-6">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <XCircle className="w-12 h-12 text-red-600" />
                    </div>
                    <h1 className="text-3xl font-heading font-bold text-ink-black mb-2">
                      Payment Failed
                    </h1>
                    <p className="text-muted-foreground">
                      We're sorry, but your payment could not be processed
                    </p>
                  </div>

                  {paymentData?.orderId && (
                    <div className="bg-muted/50 rounded-xl p-6 mb-6 text-left">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Order ID:</span>
                        <span className="font-semibold text-ink-black">
                          {paymentData.orderId}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                    <p className="text-red-800 mb-2">
                      <strong>What to do?</strong>
                    </p>
                    <p className="text-red-700 text-sm">
                      Please try again or contact us at{" "}
                      <a href="tel:9667305577" className="underline font-semibold">
                        9667305577
                      </a>{" "}
                      for assistance.
                    </p>
                  </div>

                  <div className="flex gap-4 justify-center">
                    <Button variant="outline" onClick={() => navigate("/#order-form")}>
                      Try Again
                    </Button>
                    <Button variant="hero" onClick={() => navigate("/")}>
                      Return to Home
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentStatus;
