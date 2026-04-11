// api/generate-invoice.js - Server-side PDF invoice generation with Puppeteer
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// Static data from public/invoice-data.json (hardcoded for speed, or fetch)
const INVOICE_DATA = {
  company: {
    name: "Ankshaastra",
    description: "Empower Your Name",
    address: "Unit No. O-622, Block-E, Eye of Noida, Sector 140A, Noida-201305",
    phone: "9667305577",
    email: "social@ankshaastra.com",
    gstin: "APPLIED FOR"
  },
  bankDetails: {
    name: "UCO Bank",
    accountNumber: "01200110039892",
    ifsc: "UCBA0000120",
    accountHolder: "Ankshaastra Occult Experts LLP",
    branch: "Parliament Retail Branch"
  },
  upiDetails: {
    upiId: "ankshaastra@paytm"
  },
  notes: [
    "Your personalized numerology report will be delivered within 24-48 hours.",
    "Report will be sent to your registered email address."
  ],
  terms: [
    "Items are non-refundable once the order is confirmed.",
    "All prices are inclusive of taxes unless otherwise stated.",
    "Payment must be made within the due date mentioned above.",
    "For any queries, please contact us at social@ankshaastra.com or +91-9667305577."
  ]
};

// Embedded template from public/templates/invoice.html (minified for speed)
const INVOICE_TEMPLATE = `<!DOCTYPE html>
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

/**
 * Ported from src/pages/PaymentStatus.tsx - populate HTML template
 */
function populateInvoiceTemplate(template, data, invoiceData = INVOICE_DATA, fallback) {
  const invoiceDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric"
  });
  const dueDate = invoiceDate; // Same for cash sale

  const packageNames = {
    namecheck: "Name Check",
    single: "Single Report",
    family: "Family Package (3 Reports)",
    baby: "Perfect Baby Name Report",
    babyname: "Perfect Baby Name Report",
  };
  const packageName = packageNames[data.packageType || "single"] || "Single Report";
  const amount = data.amount || 0;
  const subtotal = amount;
  const total = amount;

  const company = invoiceData.company;
  const bankDetails = invoiceData.bankDetails;
  const upiDetails = invoiceData.upiDetails;
  const notes = invoiceData.notes;
  const terms = invoiceData.terms;

  return template
    .replace(/\{\{COMPANY_NAME\}\}/g, company.name)
    .replace(/\{\{COMPANY_DESCRIPTION\}\}/g, company.description)
    .replace(/\{\{COMPANY_ADDRESS\}\}/g, company.address || "")
    .replace(/\{\{COMPANY_PHONE\}\}/g, company.phone)
    .replace(/\{\{COMPANY_EMAIL\}\}/g, company.email)
    .replace(/\{\{COMPANY_GSTIN_SECTION\}\}/g, company.gstin ? `<p>GSTIN: ${company.gstin}</p>` : "")
    .replace(/\{\{INVOICE_NUMBER\}\}/g, data.orderId || 'INV-001')
    .replace(/\{\{INVOICE_DATE\}\}/g, invoiceDate)
    .replace(/\{\{DUE_DATE\}\}/g, dueDate)
    .replace(/\{\{CUSTOMER_NAME\}\}/g, data.customerName || fallback?.name || "Customer")
    .replace(/\{\{CUSTOMER_EMAIL\}\}/g, data.customerEmail || fallback?.email || "Not provided")
    .replace(/\{\{CUSTOMER_PHONE\}\}/g, data.customerMobile || fallback?.mobile || "Not provided")
    .replace(/\{\{TRANSACTION_ID_SECTION\}\}/g, data.transactionId ? 
      `<div class="info-item"><strong>Transaction ID:</strong><span>${data.transactionId}</span></div>` : "")
    .replace(/\{\{PACKAGE_NAME\}\}/g, packageName)
    .replace(/\{\{SUBTOTAL\}\}/g, subtotal.toLocaleString("en-IN"))
    .replace(/\{\{TOTAL\}\}/g, total.toLocaleString("en-IN"))
    .replace(/\{\{BANK_NAME\}\}/g, bankDetails.name || "")
    .replace(/\{\{BANK_ACCOUNT\}\}/g, bankDetails.accountNumber || "")
    .replace(/\{\{BANK_IFSC\}\}/g, bankDetails.ifsc || "")
    .replace(/\{\{BANK_HOLDER\}\}/g, bankDetails.accountHolder || "")
    .replace(/\{\{BANK_BRANCH_SECTION\}\}/g, bankDetails.branch ? `<p><strong>Branch:</strong> ${bankDetails.branch}</p>` : "")
    .replace(/\{\{UPI_ID_SECTION\}\}/g, upiDetails.upiId ? `<p><strong>UPI ID:</strong> ${upiDetails.upiId}</p>` : "")
    .replace(/\{\{NOTES_SECTION\}\}/g, notes.length > 0 ? 
      `<div class="notes-section"><h4>Notes</h4>${notes.map(n => `<p>${n}</p>`).join("")}</div>` : "")
    .replace(/\{\{TERMS_SECTION\}\}/g, terms.length > 0 ? terms.map(t => `<p>${t}</p>`).join("") : "");
}

/**
 * Generate PDF buffer from order data
 * @param {Object} data - PaymentData from payment-status
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function generateInvoicePDF(data) {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  try {
    const page = await browser.newPage();
    const populatedHTML = populateInvoiceTemplate(INVOICE_TEMPLATE, data);
    await page.setContent(populatedHTML, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
    });
    
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

// Export for API handler
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const data = req.body;
  if (!data.orderId || !data.customerEmail) {
    return res.status(400).json({ error: 'Missing required fields: orderId, customerEmail' });
  }

  try {
    const pdfBuffer = await generateInvoicePDF(data);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${data.orderId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'PDF generation failed', details: error.message });
  }
}
