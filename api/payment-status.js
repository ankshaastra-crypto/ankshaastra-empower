// Suppress DEP0169 deprecation warning from dependencies
import './suppress-deprecation.js';

import crypto from 'crypto';
import { sendPaymentEmail } from './send-email.js';
import { decryptCustomerData } from './encryption.js';
import { rateLimiter } from './rate-limiter.js';

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
    const orderId =
      req.query.order_id ||
      req.query.orderId ||
      req.query.merchantTransactionId ||
      req.query.txnId ||
      req.query.transactionId ||
      req.query.transaction_id;

    // Get Razorpay keys
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error("Missing Razorpay credentials");
      return res.status(500).json({ error: "Server configuration error" });
    }

    if (!orderId) {
      console.error("Missing order ID");
      return res.status(400).json({
        error: "Missing order ID"
      });
    }

    // Check payment status with Razorpay
    const auth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');

    const statusResponse = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (!statusResponse.ok) {
      console.error("Razorpay API Error:", statusResponse.status, statusResponse.statusText);
      return res.status(500).json({
        error: "Failed to fetch payment status from Razorpay",
        details: `Razorpay API returned ${statusResponse.status}: ${statusResponse.statusText}`
      });
    }

    const statusResult = await statusResponse.json();

    // Check success from Razorpay order status
    const isSuccess = statusResult.status === 'paid';

    const paymentStatus = isSuccess ? 'SUCCESS' : 'FAILED';

    // Payment status determined
    const transactionId = statusResult.id;
    // Razorpay returns amount in paise
    const amountInPaise = statusResult.amount;
    const amount = amountInPaise > 0 ? amountInPaise / 100 : 0; // Convert paise to rupees

    // Razorpay doesn't have metaInfo like PhonePe, so metadata is empty
    let metadata = {};

    // Extract encrypted customer data from query parameters
    const encryptedData = req.query.data || '';
    let decryptedData = {};

    if (encryptedData) {
      try {
        decryptedData = decryptCustomerData(encryptedData);
        // Validate decryption worked - check if we got actual data
        if (!decryptedData || Object.keys(decryptedData).length === 0) {
          console.error("❌ Decryption returned empty data");
        }
      } catch (error) {
        console.error("❌ Error decrypting customer data:", error.message);
      }
    }

    // Helper function to safely extract query params (fallback if decryption fails)
    const getQueryParam = (param) => {
      const value = req.query[param];
      if (!value) return '';
      try {
        const decoded = decodeURIComponent(value.toString()).trim();
        return decoded || '';
      } catch {
        const trimmed = value.toString().trim();
        return trimmed || '';
      }
    };

    // Extract customer info - prefer decrypted data, then query params (backward compatibility), then metadata, then empty defaults
    // Check each source explicitly and log for debugging
    const emailFromDecrypted = decryptedData.email ? decryptedData.email.trim() : '';
    const emailFromQuery = getQueryParam('email');
    const emailFromMetadata = metadata.email ? metadata.email.trim() : '';

    const customerEmail = emailFromDecrypted || emailFromQuery || emailFromMetadata || '';
    const customerName = (decryptedData.name && decryptedData.name.trim()) ||
      getQueryParam('name') ||
      (metadata.name && metadata.name.trim()) ||
      'Customer';
    const customerMobile = (decryptedData.mobile && decryptedData.mobile.trim()) ||
      getQueryParam('mobile') ||
      (metadata.mobile && metadata.mobile.trim()) ||
      '';
    const customerDob = (decryptedData.dob && decryptedData.dob.trim()) ||
      getQueryParam('dob') ||
      (metadata.dob && metadata.dob.trim()) ||
      '';
    const packageType = (decryptedData.packageType && decryptedData.packageType.trim()) ||
      getQueryParam('package') ||
      (metadata.packageType && metadata.packageType.trim()) ||
      'single';
    const customerGender = (decryptedData.gender && decryptedData.gender.trim()) ||
      getQueryParam('gender') ||
      (metadata.gender && metadata.gender.trim()) ||
      '';
    const customerCity = (decryptedData.city && decryptedData.city.trim()) ||
      getQueryParam('city') ||
      (metadata.city && metadata.city.trim()) ||
      '';
    // Extract person details (for namecheck packages with multiple persons or single package)
    const person1Name = (decryptedData.person1Name && decryptedData.person1Name.trim()) ||
      getQueryParam('person1Name') ||
      (metadata.person1Name && metadata.person1Name.trim()) ||
      customerName;
    const person1Dob = (decryptedData.person1Dob && decryptedData.person1Dob.trim()) ||
      getQueryParam('person1Dob') ||
      (metadata.person1Dob && metadata.person1Dob.trim()) ||
      customerDob;
    const person1Gender = (decryptedData.person1Gender && decryptedData.person1Gender.trim()) ||
      getQueryParam('person1Gender') ||
      (metadata.person1Gender && metadata.person1Gender.trim()) ||
      customerGender;
    const person1MiddleNameType = (decryptedData.person1MiddleNameType && decryptedData.person1MiddleNameType.trim()) ||
      getQueryParam('person1MiddleNameType') ||
      (metadata.person1MiddleNameType && metadata.person1MiddleNameType.trim()) ||
      '';
    const person1FirstName = (decryptedData.person1FirstName && decryptedData.person1FirstName.trim()) ||
      getQueryParam('person1FirstName') || (metadata.person1FirstName && metadata.person1FirstName.trim()) || '';
    const person1MiddleName = (decryptedData.person1MiddleName && decryptedData.person1MiddleName.trim()) ||
      getQueryParam('person1MiddleName') || (metadata.person1MiddleName && metadata.person1MiddleName.trim()) || '';
    const person1SurName = (decryptedData.person1SurName && decryptedData.person1SurName.trim()) ||
      getQueryParam('person1SurName') || (metadata.person1SurName && metadata.person1SurName.trim()) || '';
    const person2Name = (decryptedData.person2Name && decryptedData.person2Name.trim()) ||
      getQueryParam('person2Name') ||
      (metadata.person2Name && metadata.person2Name.trim()) ||
      '';
    const person2FirstName = (decryptedData.person2FirstName && decryptedData.person2FirstName.trim()) ||
      getQueryParam('person2FirstName') || (metadata.person2FirstName && metadata.person2FirstName.trim()) || '';
    const person2MiddleName = (decryptedData.person2MiddleName && decryptedData.person2MiddleName.trim()) ||
      getQueryParam('person2MiddleName') || (metadata.person2MiddleName && metadata.person2MiddleName.trim()) || '';
    const person2SurName = (decryptedData.person2SurName && decryptedData.person2SurName.trim()) ||
      getQueryParam('person2SurName') || (metadata.person2SurName && metadata.person2SurName.trim()) || '';
    const person2Dob = (decryptedData.person2Dob && decryptedData.person2Dob.trim()) ||
      getQueryParam('person2Dob') ||
      (metadata.person2Dob && metadata.person2Dob.trim()) ||
      '';
    const person2Gender = (decryptedData.person2Gender && decryptedData.person2Gender.trim()) ||
      getQueryParam('person2Gender') ||
      (metadata.person2Gender && metadata.person2Gender.trim()) ||
      '';
    const person2MiddleNameType = (decryptedData.person2MiddleNameType && decryptedData.person2MiddleNameType.trim()) ||
      getQueryParam('person2MiddleNameType') ||
      (metadata.person2MiddleNameType && metadata.person2MiddleNameType.trim()) ||
      '';
    const person3Name = (decryptedData.person3Name && decryptedData.person3Name.trim()) ||
      getQueryParam('person3Name') ||
      (metadata.person3Name && metadata.person3Name.trim()) ||
      '';
    const person3Dob = (decryptedData.person3Dob && decryptedData.person3Dob.trim()) ||
      getQueryParam('person3Dob') ||
      (metadata.person3Dob && metadata.person3Dob.trim()) ||
      '';
    const person3Gender = (decryptedData.person3Gender && decryptedData.person3Gender.trim()) ||
      getQueryParam('person3Gender') ||
      (metadata.person3Gender && metadata.person3Gender.trim()) ||
      '';
    const person3MiddleNameType = (decryptedData.person3MiddleNameType && decryptedData.person3MiddleNameType.trim()) ||
      getQueryParam('person3MiddleNameType') ||
      (metadata.person3MiddleNameType && metadata.person3MiddleNameType.trim()) ||
      '';
    const person3FirstName = (decryptedData.person3FirstName && decryptedData.person3FirstName.trim()) ||
      getQueryParam('person3FirstName') || (metadata.person3FirstName && metadata.person3FirstName.trim()) || '';
    const person3MiddleName = (decryptedData.person3MiddleName && decryptedData.person3MiddleName.trim()) ||
      getQueryParam('person3MiddleName') || (metadata.person3MiddleName && metadata.person3MiddleName.trim()) || '';
    const person3SurName = (decryptedData.person3SurName && decryptedData.person3SurName.trim()) ||
      getQueryParam('person3SurName') || (metadata.person3SurName && metadata.person3SurName.trim()) || '';

    // Baby report specific fields
    const fatherFirstName = (decryptedData.fatherFirstName && decryptedData.fatherFirstName.trim()) ||
      getQueryParam('fatherFirstName') || (metadata.fatherFirstName && metadata.fatherFirstName.trim()) || '';
    const fatherMiddleName = (decryptedData.fatherMiddleName && decryptedData.fatherMiddleName.trim()) ||
      getQueryParam('fatherMiddleName') || (metadata.fatherMiddleName && metadata.fatherMiddleName.trim()) || '';
    const fatherMiddleNameType = (decryptedData.fatherMiddleNameType && decryptedData.fatherMiddleNameType.trim()) ||
      getQueryParam('fatherMiddleNameType') || (metadata.fatherMiddleNameType && metadata.fatherMiddleNameType.trim()) || '';
    const fatherLastName = (decryptedData.fatherLastName && decryptedData.fatherLastName.trim()) ||
      getQueryParam('fatherLastName') || (metadata.fatherLastName && metadata.fatherLastName.trim()) || '';
    const childDob = (decryptedData.childDob && decryptedData.childDob.trim()) || '';
    const timeOfBirth = (decryptedData.timeOfBirth && decryptedData.timeOfBirth.trim()) || '';
    const placeOfBirth = (decryptedData.placeOfBirth && decryptedData.placeOfBirth.trim()) || '';
    const pinCode = (decryptedData.pinCode && decryptedData.pinCode.trim()) ||
      getQueryParam('pinCode') || (metadata.pinCode && metadata.pinCode.trim()) || '';

    // Persist order + payment (browser redirect flow — do not rely on webhook alone)
    try {
      const { savePayment } = await import('./db.js');
      await savePayment(orderId, transactionId, amountInPaise, paymentStatus);
    } catch (dbError) {
      console.error('DB save order error:', dbError?.message || dbError);
    }

    // Send payment confirmation emails (customer and admin)
    if (customerEmail && customerEmail.trim() !== '') {
      try {
        const emailResult = await sendPaymentEmail({
          to: customerEmail,
          customerEmail,
          customerName: customerName || 'Customer',
          customerMobile: customerMobile,
          customerDob: customerDob,
          customerGender: customerGender,
          customerCity: customerCity,
          person1Name: person1Name,
          person1FirstName: person1FirstName,
          person1MiddleName: person1MiddleName,
          person1SurName: person1SurName,
          person1Dob: person1Dob,
          person1Gender: person1Gender,
          person1MiddleNameType: person1MiddleNameType,
          person2Name: person2Name,
          person2FirstName: person2FirstName,
          person2MiddleName: person2MiddleName,
          person2SurName: person2SurName,
          person2Dob: person2Dob,
          person2Gender: person2Gender,
          person2MiddleNameType: person2MiddleNameType,
          person3Name: person3Name,
          person3FirstName: person3FirstName,
          person3MiddleName: person3MiddleName,
          person3SurName: person3SurName,
          person3Dob: person3Dob,
          person3Gender: person3Gender,
          person3MiddleNameType: person3MiddleNameType,
          fatherFirstName: fatherFirstName,
          fatherMiddleName: fatherMiddleName,
          fatherMiddleNameType: fatherMiddleNameType,
          fatherLastName: fatherLastName,
          childDob: childDob,
          timeOfBirth: timeOfBirth,
          placeOfBirth: placeOfBirth,
          pinCode: pinCode,
          orderId,
          amount: amountInPaise,
          packageType: packageType || 'single',
          status: paymentStatus,
          transactionId: transactionId || '',
        });

        if (!emailResult?.success) {
          console.error(`❌ Email sending failed for ${customerEmail}:`, emailResult?.error || 'Unknown error');
        }
      } catch (emailError) {
        console.error("❌ Email sending error:", emailError.message);
      }
    }

    // Return payment status with all form details
    return res.status(200).json({
      success: true,
      status: paymentStatus,
      orderId,
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
      childDob,
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

