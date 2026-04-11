import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, Download, MessageCircle, User, CreditCard, Package, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trackPurchase } from "@/lib/metaPixel";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentData {
  success: boolean;
  status: "SUCCESS" | "FAILED";
  orderId: string;
  transactionId?: string;
  amount?: number;
  // Customer contact
  customerEmail?: string;
  customerName?: string;
  customerMobile?: string;
  customerDob?: string;
  customerGender?: string;
  customerCity?: string;
  packageType?: string;
  // Name Check — Person 1
  person1Name?: string;
  person1FirstName?: string;
  person1MiddleName?: string;
  person1SurName?: string;
  person1Dob?: string;
  person1Gender?: string;
  person1MiddleNameType?: string;
  // Name Check — Person 2
  person2Name?: string;
  person2FirstName?: string;
  person2MiddleName?: string;
  person2SurName?: string;
  person2Dob?: string;
  person2Gender?: string;
  person2MiddleNameType?: string;
  // Name Check — Person 3
  person3Name?: string;
  person3FirstName?: string;
  person3MiddleName?: string;
  person3SurName?: string;
  person3Dob?: string;
  person3Gender?: string;
  person3MiddleNameType?: string;
  // Baby Name / Single / Premium report fields
  fatherFirstName?: string;
  fatherMiddleName?: string;
  fatherMiddleNameType?: string;
  fatherLastName?: string;
  fatherFullName?: string;
  childDob?: string;
  childMiddleName?: string;
  childLastName?: string;
  fatherFirstNameAsMiddleName?: string;
  nameOptions?: string;
  gender?: string;
  timeOfBirth?: string;
  placeOfBirth?: string;
  pinCode?: string;
  data?: unknown;
}

interface InvoiceTemplateData {
  company?: {
    name?: string;
    description?: string;
    address?: string;
    phone?: string;
    email?: string;
    gstin?: string;
  };
  bankDetails?: {
    name?: string;
    accountNumber?: string;
    ifsc?: string;
    accountHolder?: string;
    branch?: string;
  };
  upiDetails?: { upiId?: string };
  notes?: string[];
  terms?: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const packageNames: Record<string, string> = {
  namecheck: "Name Check",
  "namecheck-1": "Name Check (1 Person)",
  "namecheck-2": "Name Check (2 Persons)",
  "namecheck-3": "Name Check (3 Persons)",
  single: "Perfect Baby Name Report",
  premium: "Premium Report + Live Session",
  family: "Family Package (3 Reports)",
  baby: "Perfect Baby Name Report",
  babyname: "Perfect Baby Name Report",
};

// ─── Component ────────────────────────────────────────────────────────────────

const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [orderFallback, setOrderFallback] = useState<{
    email?: string;
    name?: string;
    mobile?: string;
  } | null>(null);

  // ── Fetch & verify payment status ──────────────────────────────────────────
  useEffect(() => {
    const checkPaymentStatus = async () => {
      const internalOrderId =
        searchParams.get("orderId") ||
        searchParams.get("order_id") ||
        searchParams.get("merchantTransactionId") ||
        searchParams.get("txnId") ||
        searchParams.get("transactionId") ||
        searchParams.get("transaction_id");

      const razorpayOrderId =
        searchParams.get("razorpay_order_id") ||
        searchParams.get("razorpayOrderId");

      const razorpayPaymentId =
        searchParams.get("razorpay_payment_id") ||
        searchParams.get("razorpayPaymentId");

      const emailParam = searchParams.get("email");
      const nameParam = searchParams.get("name");
      const packageTypeParam = searchParams.get("package");

      // Load order details stored in localStorage before Razorpay redirect
      let storedOrderData: Record<string, string> | null = null;
      if (internalOrderId) {
        try {
          const stored = localStorage.getItem(`order_${internalOrderId}`);
          if (stored) {
            storedOrderData = JSON.parse(stored);
            localStorage.removeItem(`order_${internalOrderId}`);
          }
        } catch {
          // silent fail
        }
      }

      const finalEmail = storedOrderData?.email || emailParam || "";
      const finalName = storedOrderData?.name || nameParam || "";
      const finalMobile =
        storedOrderData?.mobile || searchParams.get("mobile") || "";
      const finalPackageType =
        storedOrderData?.packageType || packageTypeParam || "single";

      setOrderFallback(
        finalEmail || finalName || finalMobile
          ? { email: finalEmail, name: finalName, mobile: finalMobile }
          : null
      );

      if (!internalOrderId) {
        console.error("No internal order ID found in URL parameters.");
        setStatus("failed");
        return;
      }

      try {
        // Build API params — include ALL stored fields
        const params = new URLSearchParams({
          orderId: internalOrderId,
          email: finalEmail,
          name: finalName,
          package: finalPackageType,
        });

        if (razorpayOrderId) params.append("razorpay_order_id", razorpayOrderId);
        if (razorpayPaymentId) params.append("razorpay_payment_id", razorpayPaymentId);

        if (storedOrderData) {
          const fields = [
            // Name Check persons
            "person1Name", "person1FirstName", "person1MiddleName", "person1SurName",
            "person1Dob", "person1Gender", "person1MiddleNameType",
            "person2Name", "person2FirstName", "person2MiddleName", "person2SurName",
            "person2Dob", "person2Gender", "person2MiddleNameType",
            "person3Name", "person3FirstName", "person3MiddleName", "person3SurName",
            "person3Dob", "person3Gender", "person3MiddleNameType",
            // Baby / Single / Premium fields
            "fatherFirstName", "fatherMiddleName", "fatherMiddleNameType", "fatherLastName",
            "fatherFullName", "childDob", "childMiddleName", "childLastName",
            "fatherFirstNameAsMiddleName", "nameOptions", "gender",
            "timeOfBirth", "placeOfBirth", "pinCode",
            // misc
            "mobile", "dob", "city",
          ];
          for (const field of fields) {
            if (storedOrderData[field]) params.append(field, storedOrderData[field]);
          }
        }

        const currentParams = new URLSearchParams(searchParams.toString());
        const dataParam = currentParams.get("data");
        const orderIdParam = currentParams.get("orderId") || internalOrderId;
        if (dataParam) params.append("data", dataParam);

        // Minimal URL params for navigation only
        const newParams = new URLSearchParams();
        if (orderIdParam) newParams.append("orderId", orderIdParam);
        if (dataParam) newParams.append("data", dataParam);
        if (razorpayOrderId) newParams.append("razorpay_order_id", razorpayOrderId);
        if (razorpayPaymentId) newParams.append("razorpay_payment_id", razorpayPaymentId);

        const response = await fetch(`/api/payment-status?${params.toString()}`);

        if (!response.ok) {
          console.error("API Error:", response.status, response.statusText);
          setStatus("failed");
          if (!location.pathname.includes("/failed") && orderIdParam) {
            navigate(`/payment/failed?${newParams.toString()}`, { replace: true });
          }
          return;
        }

        const result = await response.json();

        // Merge ALL stored order data into paymentData so WhatsApp message is complete
        const mergedData: PaymentData = {
          ...(storedOrderData || {}),
          ...result,
          customerEmail: result.customerEmail || storedOrderData?.email || finalEmail,
          customerName: result.customerName || storedOrderData?.name || finalName,
          customerMobile: result.customerMobile || storedOrderData?.mobile || finalMobile,
        };

        if (result.success && result.status === "SUCCESS") {
          setStatus("success");
          setPaymentData(mergedData);

          const amount = result.amount || 0;
          if (amount > 0) {
            trackPurchase(
              amount,
              "INR",
              result.orderId || internalOrderId,
              packageTypeParam || "single"
            );
          }

          if (!location.pathname.includes("/success")) {
            navigate(`/payment/success?${newParams.toString()}`, { replace: true });
          }
        } else {
          console.warn("Payment marked as failed");
          setStatus("failed");
          setPaymentData(mergedData);

          if (!location.pathname.includes("/failed")) {
            navigate(`/payment/failed?${newParams.toString()}`, { replace: true });
          }
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
        setStatus("failed");

        const oid =
          searchParams.get("orderId") ||
          searchParams.get("merchantTransactionId") ||
          searchParams.get("txnId") ||
          searchParams.get("transactionId");
        const dp = searchParams.get("data");
        const rzo = searchParams.get("razorpay_order_id") || searchParams.get("razorpayOrderId");
        const rzp = searchParams.get("razorpay_payment_id") || searchParams.get("razorpayPaymentId");

        if (!location.pathname.includes("/failed") && oid) {
          const ep = new URLSearchParams();
          ep.append("orderId", oid);
          if (dp) ep.append("data", dp);
          if (rzo) ep.append("razorpay_order_id", rzo);
          if (rzp) ep.append("razorpay_payment_id", rzp);
          navigate(`/payment/failed?${ep.toString()}`, { replace: true });
        }
      }
    };

    checkPaymentStatus();
  }, [searchParams, location.pathname, navigate]);

  // ── Build WhatsApp message URL ─────────────────────────────────────────────
  const buildWhatsAppUrl = useCallback(
    (d: PaymentData, fb: typeof orderFallback) => {
      const pkg =
        packageNames[d.packageType || "single"] ||
        d.packageType ||
        "Numerology Report";

      // single / premium / baby / babyname = Baby Name report
      const isBabyReport =
        d.packageType === "single" ||
        d.packageType === "premium" ||
        d.packageType === "baby" ||
        d.packageType === "babyname";

      let personDetails = "";

      if (isBabyReport) {
        const fatherName =
          d.fatherFullName ||
          [d.fatherFirstName, d.fatherMiddleName, d.fatherLastName]
            .filter(Boolean)
            .join(" ") ||
          "";
        const childDob = d.childDob || d.customerDob || "";
        const gender = d.gender || d.customerGender || d.person1Gender || "";

        personDetails =
          `\n\n*Child & Report Details:*` +
          (fatherName ? `\nFather's Full Name: ${fatherName}` : "") +
          (childDob ? `\nChild's Date of Birth: ${childDob}` : "") +
          (d.timeOfBirth ? `\nTime of Birth: ${d.timeOfBirth}` : "") +
          (d.placeOfBirth ? `\nBirth City: ${d.placeOfBirth}` : "") +
          (d.pinCode ? `\nPin Code: ${d.pinCode}` : "") +
          (gender ? `\nChild's Gender: ${gender}` : "") +
          (d.childMiddleName ? `\nChild's Middle Name: ${d.childMiddleName}` : "") +
          (d.childLastName ? `\nChild's Last Name: ${d.childLastName}` : "") +
          (d.fatherFirstNameAsMiddleName
            ? `\nFather's First Name as Child's Middle Name: ${
                d.fatherFirstNameAsMiddleName === "yes" ? "Yes" : "No"
              }`
            : "") +
          (d.nameOptions ? `\nPreferred Name Options: ${d.nameOptions}` : "");
      } else {
        // Name Check — one block per person
        const buildPersonBlock = (
          label: string,
          name?: string,
          firstName?: string,
          middleName?: string,
          surName?: string,
          dob?: string,
          gender?: string,
          middleNameType?: string
        ) => {
          const fullName =
            name || [firstName, middleName, surName].filter(Boolean).join(" ");
          if (!fullName) return "";
          let block = `\n\n*${label}:*\nName: ${fullName}`;
          if (dob) block += `\nDOB: ${dob}`;
          if (gender) block += `\nGender: ${gender}`;
          if (middleName && middleNameType)
            block += `\nMiddle Name is ${
              middleNameType === "yes" ? "Father's/Husband's" : "Not Father/Husband's"
            } name`;
          return block;
        };

        personDetails = buildPersonBlock(
          "Person 1",
          d.person1Name, d.person1FirstName, d.person1MiddleName, d.person1SurName,
          d.person1Dob, d.person1Gender, d.person1MiddleNameType
        );
        personDetails += buildPersonBlock(
          "Person 2",
          d.person2Name, d.person2FirstName, d.person2MiddleName, d.person2SurName,
          d.person2Dob, d.person2Gender, d.person2MiddleNameType
        );
        personDetails += buildPersonBlock(
          "Person 3",
          d.person3Name, d.person3FirstName, d.person3MiddleName, d.person3SurName,
          d.person3Dob, d.person3Gender, d.person3MiddleNameType
        );
        if (d.customerCity) personDetails += `\n\nCity: ${d.customerCity}`;
        if (d.pinCode) personDetails += `\nPin Code: ${d.pinCode}`;
      }

      const msg = encodeURIComponent(
        `✅ *Payment Confirmed*\n\n` +
          `*Order Details:*\n` +
          `Order ID: ${d.orderId}\n` +
          `Amount: ₹${d.amount?.toLocaleString("en-IN") || "—"}\n` +
          `Package: ${pkg}\n\n` +
          `*Customer Details:*\n` +
          `Name: ${d.customerName || fb?.name || "—"}\n` +
          `Email: ${d.customerEmail || fb?.email || "—"}\n` +
          `WhatsApp: ${d.customerMobile || fb?.mobile || "—"}` +
          personDetails +
          `\n\nPlease process my report. Thank you! 🙏`
      );

      return `https://wa.me/919667305577?text=${msg}`;
    },
    []
  );

  // Auto-open WhatsApp after successful payment
  useEffect(() => {
    if (status === "success" && paymentData) {
      const url = buildWhatsAppUrl(paymentData, orderFallback);
      const timer = setTimeout(() => {
        window.location.href = url;
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [status, paymentData, orderFallback, buildWhatsAppUrl]);

  // ── Invoice download ────────────────────────────────────────────────────────
  const handleDownloadInvoice = async () => {
    if (!paymentData) return;

    let invoiceHtml = "";
    let invoiceData: InvoiceTemplateData | null = null;

    try {
      const invoiceDataResponse = await fetch("/invoice-data.json");
      if (invoiceDataResponse.ok) invoiceData = await invoiceDataResponse.json();

      const templateResponse = await fetch("/templates/invoice.html");
      invoiceHtml = templateResponse.ok
        ? await templateResponse.text()
        : getEmbeddedInvoiceTemplate();
    } catch {
      invoiceHtml = getEmbeddedInvoiceTemplate();
    }

    invoiceHtml = populateInvoiceTemplate(
      invoiceHtml,
      paymentData,
      invoiceData,
      orderFallback || undefined
    );

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to download the invoice");
      return;
    }
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
    printWindow.onload = () => setTimeout(() => printWindow.print(), 250);
  };

  const populateInvoiceTemplate = (
    template: string,
    data: PaymentData,
    invoiceData: InvoiceTemplateData | null = null,
    fallback?: { email?: string; name?: string; mobile?: string }
  ): string => {
    const invoiceDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const packageName =
      packageNames[data.packageType || "single"] || "Numerology Report";
    const amount = data.amount || 0;
    const subtotal = +(amount / 1.18).toFixed(2);

    const company = invoiceData?.company || {
      name: "Ankshaastra",
      description: "Empower Your Name",
      address: "Unit No. O-622, Block-E, Eye of Noida, Sector 140A, Noida-201305",
      phone: "9667305577",
      email: "social@ankshaastra.com",
      gstin: "09AAFFE7583B1ZD",
    };

    const bankDetails = invoiceData?.bankDetails || {
      name: "Axis Bank",
      accountNumber: "925020055368236",
      ifsc: "UTIB0001837",
      accountHolder: "Ankshaastra Occult Experts LLP",
      branch: "Agra Road",
    };

    const upiDetails = invoiceData?.upiDetails || {
      upiId: "razorpay.me/@ankshaastraoccultexpertsllp",
    };

    const notes = invoiceData?.notes || [
      "Your personalized numerology report will be delivered within 24-48 hours.",
      "Report will be sent to your registered WhatsApp number / email address.",
    ];

    const terms = invoiceData?.terms || [
      "Items are non-refundable once the order is confirmed.",
      "All prices are inclusive of taxes unless otherwise stated.",
      `For queries, contact us at ${company.email} or +91-${company.phone}.`,
    ];

    return template
      .replace(/\{\{COMPANY_NAME\}\}/g, company.name || "Ankshaastra")
      .replace(/\{\{COMPANY_DESCRIPTION\}\}/g, company.description || "")
      .replace(/\{\{COMPANY_ADDRESS\}\}/g, company.address || "")
      .replace(/\{\{COMPANY_PHONE\}\}/g, company.phone || "")
      .replace(/\{\{COMPANY_EMAIL\}\}/g, company.email || "")
      .replace(
        /\{\{COMPANY_GSTIN_SECTION\}\}/g,
        company.gstin ? `<p>GSTIN: ${company.gstin}</p>` : ""
      )
      .replace(/\{\{INVOICE_NUMBER\}\}/g, data.orderId)
      .replace(/\{\{INVOICE_DATE\}\}/g, invoiceDate)
      .replace(/\{\{DUE_DATE\}\}/g, invoiceDate)
      .replace(
        /\{\{CUSTOMER_NAME\}\}/g,
        data.customerName || fallback?.name || "Customer"
      )
      .replace(
        /\{\{CUSTOMER_EMAIL\}\}/g,
        data.customerEmail || fallback?.email || "Not provided"
      )
      .replace(
        /\{\{CUSTOMER_PHONE\}\}/g,
        data.customerMobile || fallback?.mobile || "Not provided"
      )
      .replace(
        /\{\{TRANSACTION_ID_SECTION\}\}/g,
        data.transactionId
          ? `<div class="info-item"><strong>Transaction ID:</strong><span>${data.transactionId}</span></div>`
          : ""
      )
      .replace(/\{\{PACKAGE_NAME\}\}/g, packageName)
      .replace(/\{\{SUBTOTAL\}\}/g, subtotal.toLocaleString("en-IN"))
      .replace(/\{\{TOTAL\}\}/g, amount.toLocaleString("en-IN"))
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
          ? `<div class="notes-section"><h4>Notes</h4>${notes
              .map((n: string) => `<p>${n}</p>`)
              .join("")}</div>`
          : ""
      )
      .replace(
        /\{\{TERMS_SECTION\}\}/g,
        terms.length > 0
          ? terms.map((t: string) => `<p>${t}</p>`).join("")
          : ""
      );
  };

  const getEmbeddedInvoiceTemplate = (): string => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice {{INVOICE_NUMBER}}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,sans-serif;background:#fff;padding:20px}
    .invoice-container{max-width:800px;margin:0 auto;padding:30px;position:relative}
    .watermark{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);opacity:.05;font-size:80px;font-weight:700;color:#000;z-index:0;pointer-events:none}
    .content{position:relative;z-index:1}
    .header{display:flex;justify-content:space-between;margin-bottom:30px;border-bottom:2px solid #8B5CF6;padding-bottom:20px}
    .company-info h1{color:#8B5CF6;font-size:24px;margin-bottom:10px}
    .company-info p,.invoice-details p{color:#666;font-size:12px;line-height:1.6;margin:4px 0}
    .invoice-details{text-align:right}
    .invoice-details h2{color:#333;font-size:24px;margin-bottom:10px}
    .customer-section{margin-bottom:20px}
    .customer-section h3{color:#8B5CF6;font-size:16px;margin-bottom:10px;border-bottom:1px solid #f0f0f0;padding-bottom:5px}
    .customer-info{display:grid;grid-template-columns:1fr 1fr;gap:15px}
    .info-item{margin-bottom:8px}
    .info-item strong{color:#333;display:block;margin-bottom:4px;font-size:12px}
    .info-item span{color:#666;font-size:12px}
    .items-section{margin:20px 0}
    .items-section h3{color:#8B5CF6;font-size:16px;margin-bottom:10px;border-bottom:1px solid #f0f0f0;padding-bottom:5px}
    .items-table{width:100%;border-collapse:collapse;margin-bottom:20px}
    .items-table th{background:#8B5CF6;color:#fff;padding:10px;text-align:left;font-weight:600;font-size:12px}
    .items-table td{padding:10px;border-bottom:1px solid #f0f0f0;font-size:12px}
    .text-right{text-align:right}
    .total-section{margin-top:20px;text-align:right}
    .total-row{display:flex;justify-content:flex-end;margin-bottom:8px}
    .total-label{width:150px;text-align:right;padding-right:20px;font-weight:600;color:#333;font-size:12px}
    .total-value{width:120px;text-align:right;color:#8B5CF6;font-weight:700;font-size:14px}
    .grand-total{border-top:2px solid #8B5CF6;padding-top:10px;margin-top:10px}
    .grand-total .total-value{font-size:18px}
    .payment-section{margin-top:20px;display:grid;grid-template-columns:1fr 1fr;gap:15px}
    .bank-details,.upi-section{background:#f9f9f9;padding:12px;border-radius:6px}
    .bank-details h4,.upi-section h4{color:#8B5CF6;margin-bottom:8px;font-size:13px}
    .bank-details p,.upi-section p{color:#666;font-size:11px;margin:4px 0;line-height:1.4}
    .notes-section{margin-top:20px;padding:12px;background:#fff8e1;border-left:3px solid #ffc107}
    .notes-section h4{color:#8B5CF6;margin-bottom:8px;font-size:13px}
    .notes-section p{color:#666;font-size:11px;line-height:1.4;margin:4px 0}
    .terms-section{margin-top:20px;padding:12px;background:#f5f5f5;border-radius:6px}
    .terms-section h4{color:#8B5CF6;margin-bottom:8px;font-size:13px}
    .terms-section p{color:#666;font-size:10px;line-height:1.4;margin:3px 0}
    .footer{margin-top:30px;text-align:center;color:#999;font-size:10px;border-top:1px solid #f0f0f0;padding-top:15px}
    @media print{body{padding:0}.invoice-container{box-shadow:none}@page{margin:.5cm}}
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
            <div class="info-item"><strong>Name:</strong><span>{{CUSTOMER_NAME}}</span></div>
            <div class="info-item"><strong>Email:</strong><span>{{CUSTOMER_EMAIL}}</span></div>
          </div>
          <div>
            <div class="info-item"><strong>Phone:</strong><span>{{CUSTOMER_PHONE}}</span></div>
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
              <th class="text-right">Qty</th>
              <th class="text-right">Unit Price</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>{{PACKAGE_NAME}}</strong><br /><small style="color:#666">Numerology Report</small></td>
              <td class="text-right">1</td>
              <td class="text-right">&#8377;{{SUBTOTAL}}</td>
              <td class="text-right">&#8377;{{SUBTOTAL}}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="total-section">
        <div class="total-row"><div class="total-label">Subtotal:</div><div class="total-value">&#8377;{{SUBTOTAL}}</div></div>
        <div class="total-row grand-total"><div class="total-label">Total Amount:</div><div class="total-value">&#8377;{{TOTAL}}</div></div>
      </div>
      <div class="payment-section">
        <div class="bank-details">
          <h4>Bank Details</h4>
          <p><strong>Bank:</strong> {{BANK_NAME}}</p>
          <p><strong>A/C:</strong> {{BANK_ACCOUNT}}</p>
          <p><strong>IFSC:</strong> {{BANK_IFSC}}</p>
          <p><strong>Holder:</strong> {{BANK_HOLDER}}</p>
          {{BANK_BRANCH_SECTION}}
        </div>
        <div class="upi-section">
          <h4>UPI Payment</h4>
          {{UPI_ID_SECTION}}
        </div>
      </div>
      {{NOTES_SECTION}}
      <div class="terms-section">
        <h4>Terms &amp; Conditions</h4>
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

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="section-padding bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">

              {/* Loading */}
              {status === "loading" && (
                <div className="text-center py-20">
                  <Loader2 className="w-16 h-16 animate-spin text-accent mx-auto mb-4" />
                  <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
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

              {/* Success */}
              {status === "success" && (
                <div className="bg-card rounded-2xl p-8 shadow-card">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-12 h-12 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
                      Payment Successful!
                    </h1>
                    <p className="text-muted-foreground">
                      Your payment has been processed successfully
                    </p>
                  </div>

                  {paymentData && (
                    <div className="bg-muted/50 rounded-xl p-6 mb-6">
                      <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-accent" />
                        Order Summary
                      </h3>
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                          <span className="text-muted-foreground text-sm flex items-center gap-2">
                            <CreditCard className="w-4 h-4" /> Order ID
                          </span>
                          <span className="font-semibold text-foreground text-sm break-all sm:text-right">
                            {paymentData.orderId}
                          </span>
                        </div>
                        {paymentData.transactionId && (
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                            <span className="text-muted-foreground text-sm flex items-center gap-2">
                              <CreditCard className="w-4 h-4" /> Transaction ID
                            </span>
                            <span className="font-semibold text-foreground text-sm break-all sm:text-right">
                              {paymentData.transactionId}
                            </span>
                          </div>
                        )}
                        {paymentData.packageType && (
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                            <span className="text-muted-foreground text-sm flex items-center gap-2">
                              <Package className="w-4 h-4" /> Package
                            </span>
                            <span className="font-semibold text-foreground text-sm sm:text-right">
                              {packageNames[paymentData.packageType] || paymentData.packageType}
                            </span>
                          </div>
                        )}
                        {paymentData.customerName && (
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                            <span className="text-muted-foreground text-sm flex items-center gap-2">
                              <User className="w-4 h-4" /> Name
                            </span>
                            <span className="font-semibold text-foreground text-sm sm:text-right">
                              {paymentData.customerName}
                            </span>
                          </div>
                        )}
                        {paymentData.customerEmail && (
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                            <span className="text-muted-foreground text-sm flex items-center gap-2">
                              <Mail className="w-4 h-4" /> Email
                            </span>
                            <span className="font-semibold text-foreground text-sm sm:text-right">
                              {paymentData.customerEmail}
                            </span>
                          </div>
                        )}
                        {paymentData.customerMobile && (
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                            <span className="text-muted-foreground text-sm flex items-center gap-2">
                              <Phone className="w-4 h-4" /> WhatsApp
                            </span>
                            <span className="font-semibold text-foreground text-sm sm:text-right">
                              {paymentData.customerMobile}
                            </span>
                          </div>
                        )}
                        {paymentData.amount !== undefined && (
                          <div className="flex justify-between items-center pt-3 border-t border-border">
                            <span className="text-muted-foreground text-sm font-medium">
                              Amount Paid
                            </span>
                            <span className="font-bold text-accent text-xl">
                              ₹{paymentData.amount.toLocaleString("en-IN")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="bg-accent/10 border border-accent/30 rounded-xl p-6 mb-6">
                    <p className="text-foreground mb-2">
                      <strong>What's Next?</strong>
                    </p>
                    <ul className="text-muted-foreground text-sm space-y-2 list-disc list-inside">
                      <li>
                        <strong>Confirm on WhatsApp:</strong> Your order details are being sent to WhatsApp for faster processing.
                      </li>
                      <li>
                        <strong>Download Invoice:</strong> Click below to download your invoice.
                      </li>
                      <li>
                        <strong>Your Report:</strong> Your personalized numerology report will be delivered via email within 24–48 hours.
                      </li>
                      <li>
                        <strong>Check Spam:</strong> Please check your spam/junk folder if you don't see the email.
                      </li>
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      variant="hero"
                      onClick={() => {
                        if (!paymentData) return;
                        const url = buildWhatsAppUrl(paymentData, orderFallback);
                        window.open(url, "_blank");
                      }}
                      className="flex items-center gap-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Resend on WhatsApp
                    </Button>
                    <Button
                      variant="outline"
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

              {/* Failed */}
              {status === "failed" && (
                <div className="bg-card rounded-2xl p-8 shadow-card text-center">
                  <div className="mb-6">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <XCircle className="w-12 h-12 text-red-600" />
                    </div>
                    <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
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
                        <span className="font-semibold text-foreground">
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
