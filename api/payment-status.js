// api/payment-status.js
// Handles Razorpay redirect after payment — fast poll, decrypt, send email+PDF, return status

import './suppress-deprecation.js';
import { decryptCustomerData } from './_utils/encryption.js';
import { rateLimiter } from './_utils/rate-limiter.js';
import { savePayment } from './_utils/db.js';
import { sendPaymentEmail } from './_utils/send-email.js';
import { generateInvoicePDF } from './_utils/supabase-server.js';

export default async function handler(req, res) {
  await rateLimiter(req, res, () => {});
  if (res.headersSent) return;

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const internalOrderId =
      req.query.orderId || req.query.order_id ||
      req.query.merchantTransactionId || req.query.txnId ||
      req.query.transactionId || req.query.transaction_id;

    const razorpayOrderId =
      req.query.razorpay_order_id || req.query.razorpayOrderId;

    const razorpayKeyId     = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      return res.status(500).json({ error: 'Server configuration error' });
    }
    if (!internalOrderId || !razorpayOrderId) {
      return res.status(400).json({ error: 'Missing order ID or Razorpay order ID' });
    }

    // ── Poll Razorpay (max 4 attempts × 1s — fast path usually returns on attempt 1) ──
    const auth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');
    let statusResult = null;
    let isSuccess    = false;

    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        const resp = await fetch(`https://api.razorpay.com/v1/orders/${razorpayOrderId}`, {
          headers: { Authorization: `Basic ${auth}` },
        });
        if (resp.ok) {
          statusResult = await resp.json();
          isSuccess    = statusResult.status === 'paid';
          if (isSuccess) {
            console.log(`✅ Razorpay order paid on attempt ${attempt}`);
            break;
          }
        }
      } catch (fetchErr) {
        console.warn(`Razorpay fetch attempt ${attempt} failed:`, fetchErr.message);
      }
      if (attempt < 4) await new Promise(r => setTimeout(r, 1000));
    }

    const paymentStatus  = isSuccess ? 'SUCCESS' : 'FAILED';
    const transactionId  = statusResult?.id;
    const amountInPaise  = statusResult?.amount || 0;
    const amountInRupees = amountInPaise / 100;

    // ── Save payment to DB (non-fatal) ────────────────────────────────────────
    try {
      await savePayment(internalOrderId, transactionId, amountInPaise, paymentStatus);
    } catch (dbErr) {
      console.error('DB save payment error:', dbErr.message);
    }

    // ── Decrypt customer data from URL param ─────────────────────────────────
    let customerData = {};
    const encryptedData = req.query.data || '';
    if (encryptedData) {
      try {
        customerData = decryptCustomerData(encryptedData) || {};
      } catch (decErr) {
        console.error('Decryption failed:', decErr.message);
      }
    }

    // Helper: decrypt → query param → empty string
    const get = (field) =>
      (customerData[field] && customerData[field].toString().trim()) ||
      (req.query[field] && req.query[field].toString().trim()) ||
      '';

    // ── Extract ALL customer fields ──────────────────────────────────────────
    const customerEmail  = get('email');
    const customerName   = get('name') || 'Customer';
    const customerMobile = get('mobile');
    const packageType    = get('packageType') || get('package') || 'single';
    const customerDob    = get('dob');
    const customerGender = get('gender');
    const customerCity   = get('city');
    const pinCode        = get('pinCode');

    // Name Check persons
    const person1Name           = get('person1Name')           || customerName;
    const person1FirstName      = get('person1FirstName');
    const person1MiddleName     = get('person1MiddleName');
    const person1SurName        = get('person1SurName');
    const person1Dob            = get('person1Dob')            || customerDob;
    const person1Gender         = get('person1Gender')         || customerGender;
    const person1MiddleNameType = get('person1MiddleNameType');
    const person2Name           = get('person2Name');
    const person2FirstName      = get('person2FirstName');
    const person2MiddleName     = get('person2MiddleName');
    const person2SurName        = get('person2SurName');
    const person2Dob            = get('person2Dob');
    const person2Gender         = get('person2Gender');
    const person2MiddleNameType = get('person2MiddleNameType');
    const person3Name           = get('person3Name');
    const person3FirstName      = get('person3FirstName');
    const person3MiddleName     = get('person3MiddleName');
    const person3SurName        = get('person3SurName');
    const person3Dob            = get('person3Dob');
    const person3Gender         = get('person3Gender');
    const person3MiddleNameType = get('person3MiddleNameType');

    // Baby / Single / Premium fields
    const fatherFirstName            = get('fatherFirstName');
    const fatherMiddleName           = get('fatherMiddleName');
    const fatherMiddleNameType       = get('fatherMiddleNameType');
    const fatherLastName             = get('fatherLastName');
    const fatherFullName             = get('fatherFullName');
    const childDob                   = get('childDob');
    const childMiddleName            = get('childMiddleName');
    const childLastName              = get('childLastName');
    const fatherFirstNameAsMiddleName = get('fatherFirstNameAsMiddleName');
    const nameOptions                = get('nameOptions');
    const timeOfBirth                = get('timeOfBirth');
    const placeOfBirth               = get('placeOfBirth');

    // ── Generate PDF + send email on SUCCESS ─────────────────────────────────
    let invoicePdfBuffer = null;
    if (paymentStatus === 'SUCCESS' && customerEmail) {
      // Generate PDF (non-fatal)
      try {
        invoicePdfBuffer = await generateInvoicePDF(internalOrderId, {
          customerName,
          customerEmail,
          customerMobile,
          customerCity: customerCity || placeOfBirth,
          pinCode,
          packageType,
          transactionId,
          amount: amountInRupees,
        });
        console.log(`✅ PDF generated for ${internalOrderId} — ${invoicePdfBuffer?.length} bytes`);
      } catch (pdfErr) {
        console.error('❌ PDF generation failed:', pdfErr.message);
      }

      // Send email (non-fatal)
      try {
        const emailResult = await sendPaymentEmail({
          to: customerEmail,
          customerEmail,
          customerName,
          customerMobile,
          customerDob,
          customerGender,
          customerCity,
          person1Name, person1FirstName, person1MiddleName, person1SurName,
          person1Dob, person1Gender, person1MiddleNameType,
          person2Name, person2FirstName, person2MiddleName, person2SurName,
          person2Dob, person2Gender, person2MiddleNameType,
          person3Name, person3FirstName, person3MiddleName, person3SurName,
          person3Dob, person3Gender, person3MiddleNameType,
          fatherFirstName, fatherMiddleName, fatherMiddleNameType, fatherLastName,
          fatherFullName, childDob, childMiddleName, childLastName,
          fatherFirstNameAsMiddleName, nameOptions,
          timeOfBirth, placeOfBirth, pinCode,
          orderId: internalOrderId,
          amount: amountInPaise,
          packageType,
          status: paymentStatus,
          transactionId: transactionId || '',
          invoicePdfBuffer,
        });
        if (!emailResult?.success) {
          console.error('❌ Email failed:', emailResult?.error);
        } else {
          console.log('✅ Emails sent successfully');
        }
      } catch (emailErr) {
        console.error('❌ Email sending error:', emailErr.message);
      }
    }

    // ── Return full data to frontend ─────────────────────────────────────────
    return res.status(200).json({
      success:         true,
      status:          paymentStatus,
      orderId:         internalOrderId,
      transactionId,
      amount:          amountInRupees,
      customerEmail,
      customerName,
      customerMobile,
      customerDob,
      customerGender,
      customerCity,
      packageType,
      // Name Check persons
      person1Name, person1FirstName, person1MiddleName, person1SurName,
      person1Dob, person1Gender, person1MiddleNameType,
      person2Name, person2FirstName, person2MiddleName, person2SurName,
      person2Dob, person2Gender, person2MiddleNameType,
      person3Name, person3FirstName, person3MiddleName, person3SurName,
      person3Dob, person3Gender, person3MiddleNameType,
      // Baby / Single / Premium
      fatherFirstName, fatherMiddleName, fatherMiddleNameType, fatherLastName,
      fatherFullName, childDob, childMiddleName, childLastName,
      fatherFirstNameAsMiddleName, nameOptions, gender: customerGender,
      timeOfBirth, placeOfBirth, pinCode,
    });

  } catch (error) {
    console.error('Payment Status Error:', error.message);
    return res.status(500).json({
      error:   'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}