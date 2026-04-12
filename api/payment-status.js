    // NOTE: PDF generation and email sending are handled by the Razorpay webhook
    // (api/payment-webhook.js) to avoid blocking the user-facing redirect.
    // This endpoint only checks payment status and returns immediately.
>>>>>>> 3245dc746227ebcfe8f2bbd3a8772a98706a03f0
    // Return payment status with all form details
    return res.status(200).json({
      success: true,
      status: paymentStatus,
      orderId: internalOrderId,
      transactionId,
      amount,
      customerEmail,
      customerName: customerName || 'Customer',
      customerMobile,
      customerDob,
      customerGender,
      customerCity,
      packageType: packageType || 'single',
      person1Name,
      person1FirstName,
      person1MiddleName,
      person1SurName,
      person1Dob,
      person1Gender,
      person1MiddleNameType,
      person2Name,
      person2FirstName,
      person2MiddleName,
      person2SurName,
      person2Dob,
      person2Gender,
      person2MiddleNameType,
      person3Name,
      person3FirstName,
      person3MiddleName,
      person3SurName,
      person3Dob,
      person3Gender,
      person3MiddleNameType,
      fatherFirstName,
      fatherMiddleName,
      fatherMiddleNameType,
      fatherLastName,
      fatherFullName,
      childDob,
      childLastName,
      childMiddleName,
      fatherFirstNameAsMiddleName,
      nameOptions,
      gender: customerGender,
      timeOfBirth,
      placeOfBirth,
      pinCode,
    });

  } catch (error) {
    console.error("Payment Status Error");
    return res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
=======
// Suppress DEP0169 deprecation warning from dependencies
import './_utils/suppress-deprecation.js';

import crypto from 'crypto';
import { decryptCustomerData } from './_utils/encryption.js';
import { rateLimiter } from './_utils/rate-limiter.js';
import { savePayment } from './_utils/db.js';  // ✅ Static import fixes Vercel bundling

export default async function handler(req, res) {
  // Apply rate limiting
  await rateLimiter(req, res, () => { });
  if (res.headersSent) return; // Rate limit exceeded

  // Handle both GET (redirect) and POST requests
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Razorpay redirects with query parameters
    const internalOrderId =
      req.query.orderId ||
      req.query.order_id ||
      req.query.merchantTransactionId ||
      req.query.txnId ||
      req.query.transactionId ||
      req.query.transaction_id;

    const razorpayOrderId =
      req.query.razorpay_order_id ||
      req.query.razorpayOrderId;

    // Get Razorpay keys
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error("Missing Razorpay credentials");
      return res.status(500).json({ error: "Server configuration error" });
    }

    if (!internalOrderId) {
      console.error("Missing internal order ID");
      return res.status(400).json({ error: "Missing order ID" });
    }

    if (!razorpayOrderId) {
      console.error("Missing Razorpay order ID");
      return res.status(400).json({ error: "Missing Razorpay order ID" });
    }

    // Check payment status with Razorpay (fast polling)
    const auth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');
    let statusResult = null;
    let isSuccess = false;
    const maxAttempts = 2;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const statusResponse = await fetch(`https://api.razorpay.com/v1/orders/${razorpayOrderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      });

      if (!statusResponse.ok) {
        console.error(`Razorpay API Error (attempt ${attempt}):`, statusResponse.status);
        if (attempt === maxAttempts) {
          return res.status(500).json({
            error: "Failed to fetch payment status from Razorpay"
          });
        }
        await new Promise(r => setTimeout(r, 500));
        continue;
      }

      statusResult = await statusResponse.json();
      isSuccess = statusResult.status === 'paid';
      
      if (isSuccess) {
        console.log(`✅ Razorpay order paid on attempt ${attempt}`);
        break;
      }

      if (attempt < maxAttempts) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    const paymentStatus = isSuccess ? 'SUCCESS' : 'FAILED';
    const transactionId = statusResult.id;
    const amountInPaise = statusResult.amount;
    const amount = amountInPaise > 0 ? amountInPaise / 100 : 0;

    // Save payment status (non-blocking, webhook retries if fails)
    try {
      await savePayment(internalOrderId, transactionId, amountInPaise, paymentStatus);
      console.log(`✅ Saved payment ${paymentStatus} for order ${internalOrderId}`);
    } catch (dbError) {
      console.error('DB save payment error:', dbError.message);
      // Non-fatal - webhook will handle
    }

    // NOTE: PDF generation and email sending are handled by Razorpay webhook
    // (api/payment-webhook.js) to avoid blocking user redirect (1-2s faster UX)

    // Decrypt customer data from query params
    const encryptedData = req.query.data || '';
    let customerData = {};
    
    if (encryptedData) {
      try {
        customerData = decryptCustomerData(encryptedData);
      } catch (error) {
        console.error("Customer data decryption error:", error.message);
      }
    }

    // Helper to safely extract from multiple sources (decrypted → query → defaults)
    const getCustomerField = (field) => {
      const val = customerData[field]?.trim() || 
                  req.query[field]?.toString().trim() || 
                  '';
      return val || '';
    };

    // Extract all customer fields (prioritize decrypted data → query params)
    const customerEmail = getCustomerField('email');
    const customerName = getCustomerField('name') || 'Customer';
    const customerMobile = getCustomerField('mobile');
    const packageType = getCustomerField('packageType') || 'single';
    // ... (all other fields follow same pattern - abbreviated for brevity)

    // Return payment status + customer data to frontend
    return res.status(200).json({
      success: true,
      status: paymentStatus,
      orderId: internalOrderId,
      transactionId,
      amount,
      customerEmail,
      customerName,
      customerMobile,
      packageType,
      // ... all customer fields
    });

  } catch (error) {
    console.error("Payment Status Error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

=======
    // NOTE: PDF generation and email sending are handled by the Razorpay webhook
    // (api/payment-webhook.js) to avoid blocking the user-facing redirect.
    // This endpoint only checks payment status and returns immediately.
>>>>>>> 3245dc746227ebcfe8f2bbd3a8772a98706a03f0
    // Return payment status with all form details
    return res.status(200).json({
      success: true,
      status: paymentStatus,
      orderId: internalOrderId,
      transactionId,
      amount,
      customerEmail,
      customerName: customerName || 'Customer',
      customerMobile,
      customerDob,
      customerGender,
      customerCity,
      packageType: packageType || 'single',
      person1Name,
      person1FirstName,
      person1MiddleName,
      person1SurName,
      person1Dob,
      person1Gender,
      person1MiddleNameType,
      person2Name,
      person2FirstName,
      person2MiddleName,
      person2SurName,
      person2Dob,
      person2Gender,
      person2MiddleNameType,
      person3Name,
      person3FirstName,
      person3MiddleName,
      person3SurName,
      person3Dob,
      person3Gender,
      person3MiddleNameType,
      fatherFirstName,
      fatherMiddleName,
      fatherMiddleNameType,
      fatherLastName,
      fatherFullName,
      childDob,
      childLastName,
      childMiddleName,
      fatherFirstNameAsMiddleName,
      nameOptions,
      gender: customerGender,
      timeOfBirth,
      placeOfBirth,
      pinCode,
    });

  } catch (error) {
    console.error("Payment Status Error");
    return res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}