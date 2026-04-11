// api/_utils/generate-invoice-pdf.js
// Self-contained PDF generation using pdf-lib (no Supabase required)
// Falls back gracefully if pdf-lib is unavailable

/**
 * Generate a professional invoice PDF as a Buffer.
 * Uses pdf-lib which runs in Node.js without any browser/puppeteer dependency.
 *
 * @param {object} invoiceData
 * @returns {Promise<Buffer|null>}
 */
export async function generateInvoicePDFLocal(invoiceData) {
  try {
    const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');

    const {
      orderId,
      invoiceNumber,
      invoiceDate,
      customerName,
      customerEmail,
      customerMobile,
      customerCity,
      pinCode,
      packageType,
      transactionId,
      amount, // in rupees (already converted)
    } = invoiceData;

    // ── GST calculation (GST-inclusive prices) ────────────────────────────────
    const totalWithGst = amount || 0;
    const pin = parseInt(pinCode || '0', 10);
    const isIntraState = pin >= 200000 && pin <= 289999;
    const subtotal = +(totalWithGst / 1.18).toFixed(2);
    const cgstAmount = isIntraState ? +(subtotal * 0.09).toFixed(2) : 0;
    const sgstAmount = isIntraState ? +(subtotal * 0.09).toFixed(2) : 0;
    const igstAmount = isIntraState ? 0 : +(subtotal * 0.18).toFixed(2);

    const packageNames = {
      single: 'Perfect Baby Name Report',
      premium: 'Premium Report + Live Session',
      namecheck: 'Name Check Report',
      'namecheck-1': 'Name Check (1 Person)',
      'namecheck-2': 'Name Check (2 Persons)',
      'namecheck-3': 'Name Check (3 Persons)',
      baby_name: 'Baby Name Numerology Report',
    };
    const packageName = packageNames[packageType] || 'Numerology Report';

    const fmt = (n) => `Rs.${n.toLocaleString('en-IN')}`;

    // ── PDF setup ─────────────────────────────────────────────────────────────
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const { width, height } = page.getSize();

    const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const purple    = rgb(0.18, 0.10, 0.28);   // #2E1A47
    const gold      = rgb(0.79, 0.65, 0.30);   // #C9A84C
    const black     = rgb(0, 0, 0);
    const gray      = rgb(0.40, 0.40, 0.40);
    const lightGray = rgb(0.95, 0.95, 0.95);
    const white     = rgb(1, 1, 1);

    let y = height - 40;
    const L = 40;  // left margin
    const R = width - 40; // right edge

    // ── Header band ───────────────────────────────────────────────────────────
    page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: purple });
    page.drawText('Ankshaastra', { x: L, y: height - 35, size: 22, font: fontBold, color: gold });
    page.drawText('TAX INVOICE', {
      x: R - fontBold.widthOfTextAtSize('TAX INVOICE', 16),
      y: height - 35, size: 16, font: fontBold, color: white,
    });
    page.drawText('Empower Your Name', { x: L, y: height - 55, size: 9, font, color: white });
    page.drawText(`Invoice No: ${invoiceNumber || orderId}`, {
      x: R - font.widthOfTextAtSize(`Invoice No: ${invoiceNumber || orderId}`, 8),
      y: height - 52, size: 8, font, color: white,
    });
    page.drawText(`Date: ${invoiceDate}`, {
      x: R - font.widthOfTextAtSize(`Date: ${invoiceDate}`, 8),
      y: height - 63, size: 8, font, color: white,
    });

    y = height - 100;

    // ── Company & Bill To ─────────────────────────────────────────────────────
    page.drawText('From:', { x: L, y, size: 9, font: fontBold, color: purple });
    page.drawText('Bill To:', { x: 320, y, size: 9, font: fontBold, color: purple });
    y -= 14;

    const companyLines = [
      'Unit No. O-622, Block-E, Eye of Noida,',
      'Sector 140A, Noida - 201305',
      'Phone: 9667305577',
      'Email: social@ankshaastra.com',
      'GSTIN: 09AAFFE7583B1ZD',
    ];
    for (const line of companyLines) {
      page.drawText(line, { x: L, y, size: 8, font, color: gray });
      y -= 12;
    }

    let billY = height - 114;
    const billLines = [
      customerName || 'Customer',
      customerEmail || '',
      customerMobile ? `Phone: ${customerMobile}` : '',
      customerCity || '',
      pinCode ? `PIN: ${pinCode}` : '',
    ].filter(Boolean);
    for (const line of billLines) {
      page.drawText(line, { x: 320, y: billY, size: 8, font, color: gray });
      billY -= 12;
    }

    y -= 10;

    // Order meta
    page.drawText(`Order ID: ${orderId}`, { x: L, y, size: 8, font, color: gray });
    if (transactionId) {
      page.drawText(`Transaction ID: ${transactionId}`, { x: 320, y, size: 8, font, color: gray });
    }
    y -= 20;

    // Divider
    page.drawLine({ start: { x: L, y }, end: { x: R, y }, thickness: 1.5, color: gold });
    y -= 20;

    // ── Items table header ────────────────────────────────────────────────────
    page.drawRectangle({ x: L, y: y - 6, width: R - L, height: 22, color: purple });
    page.drawText('Description',  { x: L + 8, y, size: 9, font: fontBold, color: white });
    page.drawText('HSN/SAC',      { x: 260, y, size: 9, font: fontBold, color: white });
    page.drawText('Qty',          { x: 350, y, size: 9, font: fontBold, color: white });
    page.drawText('Amount',       { x: R - fontBold.widthOfTextAtSize('Amount', 9) - 5, y, size: 9, font: fontBold, color: white });
    y -= 26;

    // Table row
    page.drawRectangle({ x: L, y: y - 6, width: R - L, height: 22, color: lightGray });
    page.drawText(packageName,    { x: L + 8, y, size: 9, font, color: black });
    page.drawText('998399',       { x: 260, y, size: 9, font, color: black });
    page.drawText('1',            { x: 353, y, size: 9, font, color: black });
    page.drawText(fmt(subtotal),  { x: R - font.widthOfTextAtSize(fmt(subtotal), 9) - 5, y, size: 9, font, color: black });
    y -= 30;

    // ── Totals ────────────────────────────────────────────────────────────────
    const drawRow = (label, value, bold = false, lineAbove = false) => {
      const f = bold ? fontBold : font;
      const sz = bold ? 11 : 9;
      if (lineAbove) {
        page.drawLine({ start: { x: 340, y: y + 14 }, end: { x: R, y: y + 14 }, thickness: 0.5, color: gray });
      }
      page.drawText(label, { x: 340, y, size: sz, font: f, color: bold ? purple : black });
      page.drawText(value, { x: R - f.widthOfTextAtSize(value, sz) - 5, y, size: sz, font: f, color: bold ? purple : black });
      y -= bold ? 18 : 14;
    };

    drawRow('Subtotal:', fmt(subtotal));
    if (isIntraState) {
      drawRow('CGST (9%):', fmt(cgstAmount));
      drawRow('SGST (9%):', fmt(sgstAmount));
    } else {
      drawRow('IGST (18%):', fmt(igstAmount));
    }
    drawRow('Total Amount:', fmt(totalWithGst), true, true);

    y -= 20;

    // ── Bank & UPI ────────────────────────────────────────────────────────────
    page.drawLine({ start: { x: L, y }, end: { x: R, y }, thickness: 1, color: gold });
    y -= 18;

    page.drawRectangle({ x: L, y: y - 60, width: 240, height: 75, color: lightGray });
    page.drawText('Bank Details', { x: L + 8, y, size: 10, font: fontBold, color: purple });
    y -= 14;
    const bankLines = [
      'Bank: Axis Bank',
      'A/C: 925020055368236',
      'IFSC: UTIB0001837',
      'Holder: Ankshaastra Occult Experts LLP',
      'Branch: Agra Road',
    ];
    for (const line of bankLines) {
      page.drawText(line, { x: L + 8, y, size: 8, font, color: gray });
      y -= 11;
    }

    const upiY = y + 60;
    page.drawRectangle({ x: 310, y: upiY - 35, width: 245, height: 50, color: lightGray });
    page.drawText('UPI Payment', { x: 318, y: upiY, size: 10, font: fontBold, color: purple });
    page.drawText('UPI ID: razorpay.me/@ankshaastraoccultexpertsllp', { x: 318, y: upiY - 15, size: 7.5, font, color: gray });

    y -= 25;

    // ── Notes ─────────────────────────────────────────────────────────────────
    page.drawRectangle({ x: L, y: y - 32, width: R - L, height: 44, color: rgb(1, 0.97, 0.88) });
    page.drawRectangle({ x: L, y: y - 32, width: 3, height: 44, color: rgb(1, 0.76, 0.03) });
    page.drawText('Notes', { x: L + 10, y, size: 10, font: fontBold, color: purple });
    y -= 13;
    page.drawText('Your personalized numerology report will be delivered within 24-48 hours.', { x: L + 10, y, size: 8, font, color: gray });
    y -= 11;
    page.drawText('Report will be sent to your registered WhatsApp number / email address.', { x: L + 10, y, size: 8, font, color: gray });
    y -= 25;

    // ── Footer ────────────────────────────────────────────────────────────────
    page.drawLine({ start: { x: L, y }, end: { x: R, y }, thickness: 0.5, color: lightGray });
    y -= 14;
    const ty = 'Thank you for your business!';
    page.drawText(ty, { x: (width - fontBold.widthOfTextAtSize(ty, 9)) / 2, y, size: 9, font: fontBold, color: gray });
    y -= 12;
    const fy = 'This is a computer-generated invoice and does not require a signature.';
    page.drawText(fy, { x: (width - font.widthOfTextAtSize(fy, 8)) / 2, y, size: 8, font, color: gray });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (err) {
    console.error('❌ generateInvoicePDFLocal error:', err.message);
    return null;
  }
}