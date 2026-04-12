// api/payment-status.js - Clean version (no conflicts, static DB import)
// Suppress DEP0169 deprecation warning
import './_utils/suppress-deprecation.js';

import crypto from 'crypto';
import { decryptCustomerData } from './_utils/encryption.js';
import { rateLimiter } from './_utils/rate-limiter.js';
import { savePayment } from './_utils/db.js'; // ✅ Static import - fixes Vercel /var/task/api/db.js error

export default async function handler(req, res) {
  await rateLimiter(req, res, () => {});
  if (res.headersSent) return;

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const internalOrderId = req.query.orderId || req.query.order_id || req.query.merchantTransactionId || req.query.txnId || req.query.transactionId || req.query.transaction_id;
    const razorpayOrderId = req.query.razorpay_order_id || req.query.razorpayOrderId;

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    if (!internalOrderId || !razorpayOrderId) {
      return res.status(400).json({ error: "Missing order ID or Razorpay order ID" });
    }

    // Fast poll Razorpay status (usually instant on redirect)
    const auth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');
    let statusResult;
    let isSuccess = false;
    const maxAttempts = 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const response = await fetch(`https://api.razorpay.com/v1/orders/${razorpayOrderId}`, {
        headers: { 'Authorization': `Basic ${auth}` }
      });

      if (response.ok) {
        statusResult = await response.json();
        isSuccess = statusResult.status === 'paid';
        if (isSuccess) break;
      }

      if (attempt === maxAttempts) break;
      await new Promise(r => setTimeout(r, 500));
    }

    const paymentStatus = isSuccess ? 'SUCCESS' : 'FAILED';
    const transactionId = statusResult?.id;
    const amountInPaise = statusResult?.amount || 0;

    // Save payment (non-blocking)
    try {
      await savePayment(internalOrderId, transactionId, amountInPaise, paymentStatus);
    } catch (dbError) {
      console.error('DB save error:', dbError.message);
      // Webhook retries
    }

    // Decrypt customer data
    const encryptedData = req.query.data || '';
    let customerData = {};
    if (encryptedData) {
      try {
        customerData = decryptCustomerData(encryptedData);
      } catch {}
    }

    // Extract fields (decrypted → query params → defaults)
    const getField = (field) => customerData[field]?.trim() || req.query[field]?.toString().trim() || '';
    const customerEmail = getField('email');
    const customerName = getField('name') || 'Customer';
    const customerMobile = getField('mobile');
    const packageType = getField('packageType') || 'single';
    const customerDob = getField('dob');
    const customerGender = getField('gender');
    const customerCity = getField('city');
    const pinCode = getField('pinCode');

    // Person fields (abbreviated - full list in original)
    const person1Name = getField('person1Name') || customerName;
    const person1Dob = getField('person1Dob') || customerDob;
    // ... (person2, person3, father fields follow same pattern)

    // Webhook handles PDF/email to avoid blocking redirect
    return res.status(200).json({
      success: true,
      status: paymentStatus,
      orderId: internalOrderId,
      transactionId,
      amount: amountInPaise / 100,
      customerEmail,
      customerName,
      customerMobile,
      packageType,
      // All customer fields...
    });

  } catch (error) {
    console.error('Payment Status Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// NOTE: Full customer field extraction preserved in production version
// Static import eliminates dynamic bundling issues in Vercel serverless

