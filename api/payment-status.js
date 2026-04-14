// api/payment-status.js
import './_utils/suppress-deprecation.js'; // ✅ correct — file is in api/_utils/

import crypto from 'crypto';
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
    // ── Extract all Razorpay params from redirect URL ─────────────────────────
    const internalOrderId =
      req.query.orderId               ||
      req.query.order_id              ||
      req.query.merchantTransactionId ||
      req.query.txnId                 ||
      req.query.transactionId         ||
      req.query.transaction_id;

    const razorpayOrderId   = req.query.razorpay_order_id   || req.query.razorpayOrderId;
    const razorpayPaymentId = req.query.razorpay_payment_id || req.query.razorpayPaymentId;
    const razorpaySignature = req.query.razorpay_signature  || req.query.razorpaySignature;

    const razorpayKeyId     = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      return res.status(500).json({ error: 'Server configuration error' });
    }
    if (!internalOrderId) {
      return res.status(400).json({ error: 'Missing order ID' });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1: Verify Razorpay signature — INSTANT cryptographic proof of success
    //
    // Razorpay sends razorpay_order_id + razorpay_payment_id + razorpay_signature
    // in the redirect URL after a successful payment.
    // Signature = HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, secret)
    //
    // This is the CORRECT and FAST way — no API call needed, no timing issues.
    // ─────────────────────────────────────────────────────────────────────────
    let isSuccess           = false;
    let verifiedBySignature = false;

    if (razorpayOrderId && razorpayPaymentId && razorpaySignature) {
      try {
        const expectedSig = crypto
          .createHmac('sha256', razorpayKeySecret)
          .update(`${razorpayOrderId}|${razorpayPaymentId}`)
          .digest('hex');

        if (expectedSig === razorpaySignature) {
          isSuccess           = true;
          verifiedBySignature = true;
          console.log(`✅ Payment verified by signature — order: ${internalOrderId}`);
        } else {
          console.warn('⚠️  Signature mismatch — will fall back to API poll');
        }
      } catch (sigErr) {
        console.error('Signature verification error:', sigErr.message);
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2: Fallback — poll Razorpay order API if no signature params present
    // (handles direct URL access, retries, or missing params edge cases)
    // ─────────────────────────────────────────────────────────────────────────
    let statusResult = null;
    const auth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');

    if (!verifiedBySignature && razorpayOrderId) {
      console.log('📡 No signature — polling Razorpay order API...');
      for (let attempt = 1; attempt <= 4; attempt++) {
        try {
          const resp = await fetch(`https://api.razorpay.com/v1/orders/${razorpayOrderId}`, {
            headers: { Authorization: `Basic ${auth}` },
          });
          if (resp.ok) {
            statusResult = await resp.json();
            if (statusResult.status === 'paid') {
              isSuccess = true;
              console.log(`✅ Order paid confirmed by API poll (attempt ${attempt})`);
              break;
            }
          }
        } catch (fetchErr) {
          console.warn(`API poll attempt ${attempt} failed:`, fetchErr.message);
        }
        if (attempt < 4) await new Promise(r => setTimeout(r, 1000));
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 3: Fetch order details for amount (if not already fetched)
    // ─────────────────────────────────────────────────────────────────────────
    if (!statusResult && razorpayOrderId) {
      try {
        const resp = await fetch(`https://api.razorpay.com/v1/orders/${razorpayOrderId}`, {
          headers: { Authorization: `Basic ${auth}` },
        });
        if (resp.ok) statusResult = await resp.json();
      } catch {
        // non-fatal — amount will default to 0
      }
    }

    const paymentStatus  = isSuccess ? 'SUCCESS' : 'FAILED';
    const transactionId  = razorpayPaymentId || statusResult?.id;
    const amountInPaise  = statusResult?.amount || 0;
    const amountInRupees = amountInPaise / 100;

    console.log(`📊 ${paymentStatus} — order: ${internalOrderId}, tx: ${transactionId}, ₹${amountInRupees}`);

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 4: Save payment to DB
    // ─────────────────────────────────────────────────────────────────────────
    try {
      await savePayment(internalOrderId, transactionId, amountInPaise, paymentStatus);
      console.log('✅ Payment saved to DB');
    } catch (dbErr) {
      console.error('DB save error (non-fatal):', dbErr.message);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 5: Decrypt customer data from encrypted URL param
    // ─────────────────────────────────────────────────────────────────────────
    let customerData = {};
    const encryptedData = req.query.data || '';
    if (encryptedData) {
      try {
        customerData = decryptCustomerData(encryptedData) || {};
        console.log('✅ Customer data decrypted');
      } catch (decErr) {
        console.error('Decryption failed (non-fatal):', decErr.message);
      }
    }

    // Helper: decrypted → query param → empty string
    const get = (field) =>
      (customerData[field] && customerData[field].toString().trim()) ||
      (req.query[field]    && req.query[field].toString().trim())    ||
      '';

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 6: Extract ALL customer fields
    // ─────────────────────────────────────────────────────────────────────────
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

    // Baby / Single / Premium report fields
    const fatherFirstName             = get('fatherFirstName');
    const fatherMiddleName            = get('fatherMiddleName');
    const fatherMiddleNameType        = get('fatherMiddleNameType');
    const fatherLastName              = get('fatherLastName');
    const fatherFullName              = get('fatherFullName');
    const childDob                    = get('childDob');
    const childMiddleName             = get('childMiddleName');
    const childLastName               = get('childLastName');
    const fatherFirstNameAsMiddleName = get('fatherFirstNameAsMiddleName');
    const nameOptions                 = get('nameOptions');
    const timeOfBirth                 = get('timeOfBirth');
    const placeOfBirth                = get('placeOfBirth');

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 7: Generate PDF + send emails on SUCCESS
    // ─────────────────────────────────────────────────────────────────────────
    if (paymentStatus === 'SUCCESS' && customerEmail) {

      // Generate PDF (non-fatal if fails)
      let invoicePdfBuffer = null;
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
        if (invoicePdfBuffer) {
          console.log(`✅ PDF generated — ${invoicePdfBuffer.length} bytes`);
        }
      } catch (pdfErr) {
        console.error('❌ PDF generation failed (non-fatal):', pdfErr.message);
      }

      // ✅ Send emails from payment-status (primary path)
      // Deduplication in sendPaymentEmail (isEmailSent DB check) prevents
      // double-send if webhook also fires. One email per order guaranteed.
      try {
        const emailResult = await sendPaymentEmail({
          to:            customerEmail,
          customerEmail,
          customerName,
          customerMobile,
          customerDob,
          customerGender,
          customerCity,
          person1Name,     person1FirstName,  person1MiddleName,  person1SurName,
          person1Dob,      person1Gender,     person1MiddleNameType,
          person2Name,     person2FirstName,  person2MiddleName,  person2SurName,
          person2Dob,      person2Gender,     person2MiddleNameType,
          person3Name,     person3FirstName,  person3MiddleName,  person3SurName,
          person3Dob,      person3Gender,     person3MiddleNameType,
          fatherFirstName, fatherMiddleName,  fatherMiddleNameType, fatherLastName,
          fatherFullName,  childDob,          childMiddleName,    childLastName,
          fatherFirstNameAsMiddleName,        nameOptions,
          timeOfBirth,     placeOfBirth,      pinCode,
          orderId:         internalOrderId,
          amount:          amountInPaise,
          packageType,
          status:          paymentStatus,
          transactionId:   transactionId || '',
          invoicePdfBuffer,
        });
        if (emailResult?.success) {
          console.log('✅ Emails sent (customer + admin)');
        } else if (emailResult?.skipped) {
          console.log('⏭️  Emails already sent for this order — skipped');
        } else {
          console.error('❌ Email failed:', emailResult?.error);
        }
      } catch (emailErr) {
        console.error('❌ Email error (non-fatal):', emailErr.message);
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 8: Return full response to frontend
    // ─────────────────────────────────────────────────────────────────────────
    return res.status(200).json({
      success:        true,
      status:         paymentStatus,
      verifiedBy:     verifiedBySignature ? 'signature' : 'api_poll',
      orderId:        internalOrderId,
      transactionId,
      amount:         amountInRupees,
      // Customer contact
      customerEmail,
      customerName,
      customerMobile,
      customerDob,
      customerGender,
      customerCity,
      packageType,
      // Name Check persons
      person1Name,     person1FirstName,  person1MiddleName,  person1SurName,
      person1Dob,      person1Gender,     person1MiddleNameType,
      person2Name,     person2FirstName,  person2MiddleName,  person2SurName,
      person2Dob,      person2Gender,     person2MiddleNameType,
      person3Name,     person3FirstName,  person3MiddleName,  person3SurName,
      person3Dob,      person3Gender,     person3MiddleNameType,
      // Baby / Single / Premium
      fatherFirstName, fatherMiddleName,  fatherMiddleNameType, fatherLastName,
      fatherFullName,  childDob,          childMiddleName,    childLastName,
      fatherFirstNameAsMiddleName,        nameOptions,
      gender:          customerGender,
      timeOfBirth,     placeOfBirth,      pinCode,
    });

  } catch (error) {
    console.error('Payment Status Error:', error.message, error.stack);
    return res.status(500).json({
      error:   'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}