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
    // PhonePe redirects with query parameters - check multiple possible parameter names
    const merchantTransactionId =
      req.query.merchantTransactionId ||
      req.query.txnId ||
      req.query.transactionId ||
      req.query.transaction_id ||
      req.query.orderId;

    // Get PhonePe keys
    const merchantId = process.env.PHONEPE_MERCHANT_ID;
    const saltKey = process.env.PHONEPE_SALT_KEY;
    const saltIndex = process.env.PHONEPE_SALT_INDEX;

    if (!merchantId || !saltKey || !saltIndex) {
      console.error("Missing PhonePe credentials");
      return res.status(500).json({ error: "Server configuration error" });
    }

    if (!merchantTransactionId) {
      console.error("Missing transaction ID");
      return res.status(400).json({
        error: "Missing transaction ID"
      });
    }

    // Check payment status with PhonePe
    const statusUrl = `/pg/v1/status/${merchantId}/${merchantTransactionId}`;
    // PhonePe checksum format: sha256(statusUrl + saltKey) + "###" + saltIndex
    const checksumString = statusUrl + saltKey;
    const sha256 = crypto.createHash('sha256').update(checksumString).digest('hex');
    const checksum = sha256 + "###" + saltIndex;

    // Status API checksum generated

    const statusResponse = await fetch(`https://api.phonepe.com/apis/hermes${statusUrl}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': merchantId,
        'Accept': 'application/json',
      },
    });

    if (!statusResponse.ok) {
      console.error("PhonePe API Error:", statusResponse.status, statusResponse.statusText);
      return res.status(500).json({
        error: "Failed to fetch payment status from PhonePe",
        details: `PhonePe API returned ${statusResponse.status}: ${statusResponse.statusText}`
      });
    }

    const statusResult = await statusResponse.json();

    // Handle both response formats:
    // 1. Old format: response field with base64-encoded data
    // 2. New format: direct JSON response
    let paymentData;

    if (statusResult.response) {
      // Old format: decode base64 response
      try {
        paymentData = JSON.parse(Buffer.from(statusResult.response, 'base64').toString('utf-8'));
      } catch (error) {
        console.error("Error decoding base64 response");
        return res.status(500).json({
          error: "Failed to decode payment status",
          details: error.message
        });
      }
    } else if (statusResult.code || statusResult.data) {
      // New format: direct JSON response
      paymentData = statusResult;
    } else {
      console.error("Invalid PhonePe response structure");
      return res.status(500).json({
        error: "Invalid response from PhonePe",
        details: "Response format not recognized"
      });
    }

    // Validate paymentData structure
    if (!paymentData || typeof paymentData !== 'object') {
      console.error("Invalid paymentData structure");
      return res.status(500).json({
        error: "Invalid payment data structure",
        details: "Payment data is not a valid object"
      });
    }

    // Check multiple possible success indicators from PhonePe
    const isSuccess =
      paymentData.code === 'PAYMENT_SUCCESS' ||
      paymentData.code === 'SUCCESS' ||
      paymentData.success === true ||
      (paymentData.data && paymentData.data.state === 'COMPLETED') ||
      (paymentData.data && paymentData.data.responseCode === 'SUCCESS') ||
      (paymentData.state === 'COMPLETED');

    const paymentStatus = isSuccess ? 'SUCCESS' : 'FAILED';

    // Payment status determined
    const orderId = merchantTransactionId;
    const transactionId = paymentData.data?.transactionId || paymentData.data?.merchantTransactionId || '';
    // PhonePe returns amount in paise (e.g., 199700 = ₹1997)
    // Convert to rupees for API response (user-friendly)
    const amountInPaise = paymentData.data?.amount || 0;
    const amount = amountInPaise > 0 ? amountInPaise / 100 : 0; // Convert paise to rupees for API response

    // Extract metaInfo from PhonePe response (PhonePe returns it as metaInfo at data.data.metaInfo)
    // Based on your response structure: data.data.metaInfo
    let metadata = {};
    const metaInfo = paymentData.data?.data?.metaInfo || paymentData.data?.metaInfo || paymentData.metaInfo;

    if (metaInfo && metaInfo !== null) {
      try {
        // If metaInfo is a string, parse it; if it's already an object, use it directly
        if (typeof metaInfo === 'string') {
          metadata = JSON.parse(metaInfo);
        } else if (typeof metaInfo === 'object' && metaInfo !== null) {
          metadata = metaInfo;
        }
      } catch (error) {
        // If parsing fails, metadata remains empty object
        console.error("Error parsing metaInfo");
      }
    }

    // Also check if PhonePe returns customer data in other fields
    // Some payment gateways return customer info in different locations
    const phonePeCustomerInfo = paymentData.data?.customerInfo || paymentData.customerInfo || {};
    if (phonePeCustomerInfo && Object.keys(phonePeCustomerInfo).length > 0) {
      // Merge PhonePe customer info into metadata as fallback
      metadata = { ...metadata, ...phonePeCustomerInfo };
    }

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
    const person2Name = (decryptedData.person2Name && decryptedData.person2Name.trim()) ||
      getQueryParam('person2Name') ||
      (metadata.person2Name && metadata.person2Name.trim()) ||
      '';
    const person2Dob = (decryptedData.person2Dob && decryptedData.person2Dob.trim()) ||
      getQueryParam('person2Dob') ||
      (metadata.person2Dob && metadata.person2Dob.trim()) ||
      '';
    const person2Gender = (decryptedData.person2Gender && decryptedData.person2Gender.trim()) ||
      getQueryParam('person2Gender') ||
      (metadata.person2Gender && metadata.person2Gender.trim()) ||
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
          person1Dob: person1Dob,
          person1Gender: person1Gender,
          person2Name: person2Name,
          person2Dob: person2Dob,
          person2Gender: person2Gender,
          person3Name: person3Name,
          person3Dob: person3Dob,
          person3Gender: person3Gender,
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

    // Return payment status
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
      packageType: packageType || 'single',
      person1Name,
      person1Dob,
      person1Gender,
      person2Name,
      person2Dob,
      person2Gender,
      person3Name,
      person3Dob,
      person3Gender,
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

