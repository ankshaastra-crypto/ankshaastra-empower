import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trackPurchase } from "@/lib/metaPixel";

interface PaymentData {
  success: boolean;
  status: "SUCCESS" | "FAILED";
  orderId: string;
  transactionId?: string;
  amount?: number;
  customerEmail?: string;
  customerName?: string;
  customerMobile?: string;
  packageType?: string;
  data?: unknown;
}

const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "failed">(
    "loading"
  );
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      // PhonePe may redirect with different parameter names
      // Check multiple possible parameter names that PhonePe might use
      // Also check for orderId which we include in our redirect URL
      const merchantTransactionId =
        searchParams.get("merchantTransactionId") ||
        searchParams.get("txnId") ||
        searchParams.get("transactionId") ||
        searchParams.get("transaction_id") ||
        searchParams.get("orderId") || // Use orderId as fallback since we include it in redirect URL
        searchParams.get("merchantTransactionId");

      const email = searchParams.get("email");
      const name = searchParams.get("name");
      const packageType = searchParams.get("package");

      // Try to retrieve order data from localStorage (backup if PhonePe stripped query params)
      let storedOrderData = null;
      if (merchantTransactionId) {
        try {
          const stored = localStorage.getItem(`order_${merchantTransactionId}`);
          if (stored) {
            storedOrderData = JSON.parse(stored);
            // Clean up localStorage after retrieving
            localStorage.removeItem(`order_${merchantTransactionId}`);
          }
        } catch (e) {
          // Silent fail
        }
      }

      // Use stored data if available, otherwise use URL params
      const finalEmail = storedOrderData?.email || email || "";
      const finalName = storedOrderData?.name || name || "";
      const finalPackageType =
        storedOrderData?.packageType || packageType || "single";

      if (!merchantTransactionId) {
        console.error(
          "No transaction ID found in URL parameters. Available params:",
          Object.fromEntries(searchParams.entries())
        );
        setStatus("failed");
        return;
      }

      try {
        // Build query parameters - include stored order data if available
        const params = new URLSearchParams({
          merchantTransactionId,
          email: finalEmail,
          name: finalName,
          package: finalPackageType,
        });

        // Add person details if available from stored data
        if (storedOrderData) {
          if (storedOrderData.person1Name)
            params.append("person1Name", storedOrderData.person1Name);
          if (storedOrderData.person1Dob)
            params.append("person1Dob", storedOrderData.person1Dob);
          if (storedOrderData.person2Name)
            params.append("person2Name", storedOrderData.person2Name);
          if (storedOrderData.person2Dob)
            params.append("person2Dob", storedOrderData.person2Dob);
          if (storedOrderData.person3Name)
            params.append("person3Name", storedOrderData.person3Name);
          if (storedOrderData.person3Dob)
            params.append("person3Dob", storedOrderData.person3Dob);
          if (storedOrderData.mobile)
            params.append("mobile", storedOrderData.mobile);
          if (storedOrderData.dob) params.append("dob", storedOrderData.dob);
        }

        // Preserve all query parameters for navigation (build before API call)
        const currentParams = new URLSearchParams(searchParams.toString());
        const dataParam = currentParams.get("data");
        const orderIdParam = currentParams.get("orderId") || merchantTransactionId;
        
        // Build new params object with orderId and data
        const newParams = new URLSearchParams();
        if (orderIdParam) {
          newParams.append("orderId", orderIdParam);
        }
        if (dataParam) {
          newParams.append("data", dataParam);
        }

        // Call our API to check payment status
        const response = await fetch(
          `/api/payment-status?${params.toString()}`
        );

        if (!response.ok) {
          console.error("API Error:", response.status, response.statusText);
          setStatus("failed");
          // Navigate to failed URL if not already there and we have params
          if (!location.pathname.includes("/failed") && orderIdParam) {
            const failedUrl = `/payment/failed${newParams.toString() ? '?' + newParams.toString() : ''}`;
            navigate(failedUrl, { replace: true });
          }
          return;
        }

        const result = await response.json();

        if (result.success && result.status === "SUCCESS") {
          setStatus("success");
          setPaymentData(result);

          // Track purchase event with Meta Pixel
          const amount = result.amount || 0;
          const orderId = result.orderId || merchantTransactionId;
          const pkgType = packageType || "single";

          if (amount > 0) {
            trackPurchase(amount, "INR", orderId, pkgType);
          }

          // Navigate to success URL if not already there
          if (!location.pathname.includes("/success")) {
            const successUrl = `/payment/success${newParams.toString() ? '?' + newParams.toString() : ''}`;
            navigate(successUrl, { replace: true });
          }
        } else {
          console.warn("Payment marked as failed");
          setStatus("failed");
          setPaymentData(result);

          // Navigate to failed URL if not already there
          if (!location.pathname.includes("/failed")) {
            const failedUrl = `/payment/failed${newParams.toString() ? '?' + newParams.toString() : ''}`;
            navigate(failedUrl, { replace: true });
          }
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
        setStatus("failed");
        // Navigate to failed URL if not already there and we have params
        const orderIdParam = searchParams.get("orderId") || 
          searchParams.get("merchantTransactionId") ||
          searchParams.get("txnId") ||
          searchParams.get("transactionId");
        const dataParam = searchParams.get("data");
        if (!location.pathname.includes("/failed") && orderIdParam) {
          const newParams = new URLSearchParams();
          newParams.append("orderId", orderIdParam);
          if (dataParam) {
            newParams.append("data", dataParam);
          }
          const failedUrl = `/payment/failed${newParams.toString() ? '?' + newParams.toString() : ''}`;
          navigate(failedUrl, { replace: true });
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

    let invoiceHtml = "";
    let invoiceData = null;

    try {
      // Fetch invoice data configuration
      const invoiceDataResponse = await fetch("/invoice-data.json");
      if (invoiceDataResponse.ok) {
        invoiceData = await invoiceDataResponse.json();
      }

      // Fetch the invoice template
      const templateResponse = await fetch("/templates/invoice.html");
      if (templateResponse.ok) {
        invoiceHtml = await templateResponse.text();
      } else {
        invoiceHtml = getEmbeddedInvoiceTemplate();
      }
    } catch (error) {
      console.error("Error loading invoice template:", error);
      // Fallback: try to fetch invoice data
      try {
        const invoiceDataResponse = await fetch("/invoice-data.json");
        if (invoiceDataResponse.ok) {
          invoiceData = await invoiceDataResponse.json();
        }
      } catch (e) {
        // Ignore error, use defaults
      }
      invoiceHtml = getEmbeddedInvoiceTemplate();
    }

    // Replace placeholders with actual data
    invoiceHtml = populateInvoiceTemplate(
      invoiceHtml,
      paymentData,
      invoiceData
    );

    // Create a new window with the invoice HTML
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to download the invoice");
      return;
    }

    printWindow.document.write(invoiceHtml);
    printWindow.document.close();

    // Wait for content to load, then trigger print dialog
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  };

  const populateInvoiceTemplate = (
    template: string,
    data: PaymentData,
    invoiceData: any = null
  ): string => {
    const invoiceDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const dueDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const packageName =
      packageNames[data.packageType || "single"] || "Single Report";
    const amount = data.amount || 0;
    const subtotal = amount;
    const total = amount;

    // Get company data from JSON or use defaults
    const company = invoiceData?.company || {
      name: "Ankshaastra",
      description: "Your Numerology Partner",
      address: "",
      phone: "9667305577",
      email: "info@ankshaastra.com",
      gstin: "",
    };

    const bankDetails = invoiceData?.bankDetails || {
      name: "",
      accountNumber: "",
      ifsc: "",
      accountHolder: "",
      branch: "",
    };

    const upiDetails = invoiceData?.upiDetails || {
      upiId: "",
    };

    const notes = invoiceData?.notes || [];
    const terms = invoiceData?.terms || [];

    // Replace placeholders
    return template
      .replace(/\{\{COMPANY_NAME\}\}/g, company.name)
      .replace(/\{\{COMPANY_DESCRIPTION\}\}/g, company.description)
      .replace(/\{\{COMPANY_ADDRESS\}\}/g, company.address || "")
      .replace(/\{\{COMPANY_PHONE\}\}/g, company.phone)
      .replace(/\{\{COMPANY_EMAIL\}\}/g, company.email)
      .replace(
        /\{\{COMPANY_GSTIN_SECTION\}\}/g,
        company.gstin ? `<p>GSTIN: ${company.gstin}</p>` : ""
      )
      .replace(/\{\{INVOICE_NUMBER\}\}/g, data.orderId)
      .replace(/\{\{INVOICE_DATE\}\}/g, invoiceDate)
      .replace(/\{\{DUE_DATE\}\}/g, dueDate)
      .replace(/\{\{CUSTOMER_NAME\}\}/g, data.customerName || "Customer")
      .replace(/\{\{CUSTOMER_EMAIL\}\}/g, data.customerEmail || "N/A")
      .replace(/\{\{CUSTOMER_PHONE\}\}/g, data.customerMobile || "N/A")
      .replace(
        /\{\{TRANSACTION_ID_SECTION\}\}/g,
        data.transactionId
          ? `<div class="info-item">
            <strong>Transaction ID:</strong>
            <span>${data.transactionId}</span>
          </div>`
          : ""
      )
      .replace(/\{\{PACKAGE_NAME\}\}/g, packageName)
      .replace(/\{\{SUBTOTAL\}\}/g, subtotal.toLocaleString("en-IN"))
      .replace(/\{\{TOTAL\}\}/g, total.toLocaleString("en-IN"))
      .replace(/\{\{BANK_NAME\}\}/g, bankDetails.name || "")
      .replace(/\{\{BANK_ACCOUNT\}\}/g, bankDetails.accountNumber || "")
      .replace(/\{\{BANK_IFSC\}\}/g, bankDetails.ifsc || "")
      .replace(/\{\{BANK_HOLDER\}\}/g, bankDetails.accountHolder || "")
      .replace(
        /\{\{BANK_BRANCH_SECTION\}\}/g,
        bankDetails.branch
          ? `<p><strong>Branch:</strong> ${bankDetails.branch}</p>`
          : ""
      )
      .replace(
        /\{\{UPI_ID_SECTION\}\}/g,
        upiDetails.upiId
          ? `<p><strong>UPI ID:</strong> ${upiDetails.upiId}</p>`
          : ""
      )
      .replace(
        /\{\{NOTES_SECTION\}\}/g,
        notes.length > 0
          ? `<div class="notes-section">
              <h4>Notes</h4>
              ${notes.map((note: string) => `<p>${note}</p>`).join("")}
            </div>`
          : ""
      )
      .replace(
        /\{\{TERMS_SECTION\}\}/g,
        terms.length > 0
          ? terms.map((term: string) => `<p>${term}</p>`).join("")
          : ""
      );
  };

  const getEmbeddedInvoiceTemplate = (): string => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice {{INVOICE_NUMBER}}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            background: white;
            padding: 20px;
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            position: relative;
        }
        
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            opacity: 0.05;
            font-size: 80px;
            font-weight: bold;
            color: #000;
            z-index: 0;
            pointer-events: none;
        }
        
        .content {
            position: relative;
            z-index: 1;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            border-bottom: 2px solid #8B5CF6;
            padding-bottom: 20px;
        }
        
        .company-info h1 {
            color: #8B5CF6;
            font-size: 24px;
            margin-bottom: 10px;
        }
        
        .company-info p {
            color: #666;
            font-size: 12px;
            line-height: 1.6;
            margin: 4px 0;
        }
        
        .invoice-details {
            text-align: right;
        }
        
        .invoice-details h2 {
            color: #333;
            font-size: 24px;
            margin-bottom: 10px;
        }
        
        .invoice-details p {
            color: #666;
            font-size: 12px;
            margin: 4px 0;
        }
        
        .customer-section {
            margin-bottom: 20px;
        }
        
        .customer-section h3 {
            color: #8B5CF6;
            font-size: 16px;
            margin-bottom: 10px;
            border-bottom: 1px solid #f0f0f0;
            padding-bottom: 5px;
        }
        
        .customer-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .info-item {
            margin-bottom: 8px;
        }
        
        .info-item strong {
            color: #333;
            display: block;
            margin-bottom: 4px;
            font-size: 12px;
        }
        
        .info-item span {
            color: #666;
            font-size: 12px;
        }
        
        .items-section {
            margin: 20px 0;
        }
        
        .items-section h3 {
            color: #8B5CF6;
            font-size: 16px;
            margin-bottom: 10px;
            border-bottom: 1px solid #f0f0f0;
            padding-bottom: 5px;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        .items-table th {
            background: #8B5CF6;
            color: white;
            padding: 10px;
            text-align: left;
            font-weight: 600;
            font-size: 12px;
        }
        
        .items-table td {
            padding: 10px;
            border-bottom: 1px solid #f0f0f0;
            font-size: 12px;
        }
        
        .text-right {
            text-align: right;
        }
        
        .total-section {
            margin-top: 20px;
            text-align: right;
        }
        
        .total-row {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 8px;
        }
        
        .total-label {
            width: 150px;
            text-align: right;
            padding-right: 20px;
            font-weight: 600;
            color: #333;
            font-size: 12px;
        }
        
        .total-value {
            width: 120px;
            text-align: right;
            color: #8B5CF6;
            font-weight: bold;
            font-size: 14px;
        }
        
        .grand-total {
            border-top: 2px solid #8B5CF6;
            padding-top: 10px;
            margin-top: 10px;
        }
        
        .grand-total .total-value {
            font-size: 18px;
            color: #8B5CF6;
        }
        
        .payment-section {
            margin-top: 20px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .bank-details, .upi-section {
            background: #f9f9f9;
            padding: 12px;
            border-radius: 6px;
        }
        
        .bank-details h4, .upi-section h4 {
            color: #8B5CF6;
            margin-bottom: 8px;
            font-size: 13px;
        }
        
        .bank-details p, .upi-section p {
            color: #666;
            font-size: 11px;
            margin: 4px 0;
            line-height: 1.4;
        }
        
        .notes-section {
            margin-top: 20px;
            padding: 12px;
            background: #fff8e1;
            border-left: 3px solid #ffc107;
        }
        
        .notes-section h4 {
            color: #8B5CF6;
            margin-bottom: 8px;
            font-size: 13px;
        }
        
        .notes-section p {
            color: #666;
            font-size: 11px;
            line-height: 1.4;
            margin: 4px 0;
        }
        
        .terms-section {
            margin-top: 20px;
            padding: 12px;
            background: #f5f5f5;
            border-radius: 6px;
        }
        
        .terms-section h4 {
            color: #8B5CF6;
            margin-bottom: 8px;
            font-size: 13px;
        }
        
        .terms-section p {
            color: #666;
            font-size: 10px;
            line-height: 1.4;
            margin: 3px 0;
        }
        
        .footer {
            margin-top: 30px;
            text-align: center;
            color: #999;
            font-size: 10px;
            border-top: 1px solid #f0f0f0;
            padding-top: 15px;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .invoice-container {
                box-shadow: none;
            }
            
            @page {
                margin: 0.5cm;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="watermark">{{COMPANY_NAME}}</div>
        
        <div class="content">
            <div class="header">
                <div class="company-info">
                    <h1>{{COMPANY_NAME}}</h1>
                    <p>{{COMPANY_DESCRIPTION}}</p>
                    <p>{{COMPANY_ADDRESS}}</p>
                    <p>Phone: {{COMPANY_PHONE}}</p>
                    <p>Email: {{COMPANY_EMAIL}}</p>
                    {{COMPANY_GSTIN_SECTION}}
                </div>
                
                <div class="invoice-details">
                    <h2>INVOICE</h2>
                    <p><strong>Invoice No:</strong> {{INVOICE_NUMBER}}</p>
                    <p><strong>Date:</strong> {{INVOICE_DATE}}</p>
                    <p><strong>Due Date:</strong> {{DUE_DATE}}</p>
                </div>
            </div>
            
            <div class="customer-section">
                <h3>Bill To</h3>
                <div class="customer-info">
                    <div>
                        <div class="info-item">
                            <strong>Name:</strong>
                            <span>{{CUSTOMER_NAME}}</span>
                        </div>
                        <div class="info-item">
                            <strong>Email:</strong>
                            <span>{{CUSTOMER_EMAIL}}</span>
                        </div>
                    </div>
                    <div>
                        <div class="info-item">
                            <strong>Phone:</strong>
                            <span>{{CUSTOMER_PHONE}}</span>
                        </div>
                        {{TRANSACTION_ID_SECTION}}
                    </div>
                </div>
            </div>
            
            <div class="items-section">
                <h3>Items</h3>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th class="text-right">Quantity</th>
                            <th class="text-right">Unit Price</th>
                            <th class="text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <strong>{{PACKAGE_NAME}}</strong>
                                <br><small style="color: #666;">Numerology Report</small>
                            </td>
                            <td class="text-right">1</td>
                            <td class="text-right">₹{{SUBTOTAL}}</td>
                            <td class="text-right">₹{{SUBTOTAL}}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="total-section">
                <div class="total-row">
                    <div class="total-label">Subtotal:</div>
                    <div class="total-value">₹{{SUBTOTAL}}</div>
                </div>
                <div class="total-row grand-total">
                    <div class="total-label">Total Amount:</div>
                    <div class="total-value">₹{{TOTAL}}</div>
                </div>
            </div>
            
            <div class="payment-section">
                <div class="bank-details">
                    <h4>Bank Details</h4>
                    <p><strong>Bank Name:</strong> {{BANK_NAME}}</p>
                    <p><strong>Account Number:</strong> {{BANK_ACCOUNT}}</p>
                    <p><strong>IFSC Code:</strong> {{BANK_IFSC}}</p>
                    <p><strong>Account Holder:</strong> {{BANK_HOLDER}}</p>
                    {{BANK_BRANCH_SECTION}}
                </div>
                
                <div class="upi-section">
                    <h4>UPI Payment</h4>
                    {{UPI_ID_SECTION}}
                </div>
            </div>
            
            {{NOTES_SECTION}}
            
            <div class="terms-section">
                <h4>Terms & Conditions</h4>
                {{TERMS_SECTION}}
            </div>
            
            <div class="footer">
                <p>Thank you for your business!</p>
                <p>This is a computer-generated invoice and does not require a signature.</p>
            </div>
        </div>
    </div>
</body>
</html>`;
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
                  <p className="text-muted-foreground">
                    Please wait while we verify your payment
                  </p>
                </div>
              )}

              {status === "success" && (
                <div className="bg-card rounded-2xl p-8 shadow-card text-center">
                  <div className="mb-6">
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
                    <div className="bg-muted/50 rounded-xl p-6 mb-6 text-left">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Order ID:
                          </span>
                          <span className="font-semibold text-ink-black">
                            {paymentData.orderId}
                          </span>
                        </div>
                        {paymentData.transactionId && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Transaction ID:
                            </span>
                            <span className="font-semibold text-ink-black">
                              {paymentData.transactionId}
                            </span>
                          </div>
                        )}
                        {paymentData.amount && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Amount Paid:
                            </span>
                            <span className="font-semibold text-accent">
                              ₹{paymentData.amount.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="bg-accent/10 border border-accent/30 rounded-xl p-6 mb-6">
                    <p className="text-ink-black mb-2">
                      <strong>What's Next?</strong>
                    </p>
                    <ul className="text-muted-foreground text-sm space-y-2 list-disc list-inside">
                      <li>
                        <strong>Download Invoice:</strong> Click the button
                        below to download your invoice in PDF format.
                      </li>
                      <li>
                        <strong>Your Report:</strong> Your personalized
                        numerology report will be delivered via email within
                        24-48 hours.
                      </li>
                      <li>
                        <strong>Check Spam:</strong> Please check your spam/junk
                        folder if you don't see the emails.
                      </li>
                    </ul>
                  </div>

                  <div className="flex gap-4 justify-center">
                    <Button
                      variant="hero"
                      onClick={handleDownloadInvoice}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Download Invoice
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
                      <a
                        href="tel:9667305577"
                        className="underline font-semibold"
                      >
                        9667305577
                      </a>{" "}
                      for assistance.
                    </p>
                  </div>

                  <div className="flex gap-4 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => navigate("/#order-form")}
                    >
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
