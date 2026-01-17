import crypto from 'crypto';
import { sendPaymentEmail } from './send-email.js';
import { decryptCustomerData } from './encryption.js';
import { rateLimiter } from './rate-limiter.js';

export default async function handler(req, res) {
  // Apply rate limiting
  await rateLimiter(req, res, () => {});
  if (res.headersSent) return; // Rate limit exceeded
  // Handle both GET (redirect) and POST requests
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // PhonePe redirects with query parameters
    // Note: PhonePe may redirect with different parameter names
    // PhonePe might append its own params, so check all possible parameter names
    // Also check for orderId which we include in our redirect URL
    const merchantTransactionId = 
      req.query.merchantTransactionId || 
      req.query.txnId || 
      req.query.transactionId ||
      req.query.transaction_id ||
      req.query.orderId || // Use orderId as fallback since we include it in redirect URL
      req.query.merchantTransactionId;
    
    // Query parameters received (customer data not logged for privacy)
    
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
    // Extract person details for family package
    const person1Name = (decryptedData.person1Name && decryptedData.person1Name.trim()) || 
                       getQueryParam('person1Name') || 
                       (metadata.person1Name && metadata.person1Name.trim()) || 
                       customerName;
    const person1Dob = (decryptedData.person1Dob && decryptedData.person1Dob.trim()) || 
                      getQueryParam('person1Dob') || 
                      (metadata.person1Dob && metadata.person1Dob.trim()) || 
                      customerDob;
    const person2Name = (decryptedData.person2Name && decryptedData.person2Name.trim()) || 
                       getQueryParam('person2Name') || 
                       (metadata.person2Name && metadata.person2Name.trim()) || 
                       '';
    const person2Dob = (decryptedData.person2Dob && decryptedData.person2Dob.trim()) || 
                      getQueryParam('person2Dob') || 
                      (metadata.person2Dob && metadata.person2Dob.trim()) || 
                      '';
    const person3Name = (decryptedData.person3Name && decryptedData.person3Name.trim()) || 
                       getQueryParam('person3Name') || 
                       (metadata.person3Name && metadata.person3Name.trim()) || 
                       '';
    const person3Dob = (decryptedData.person3Dob && decryptedData.person3Dob.trim()) || 
                      getQueryParam('person3Dob') || 
                      (metadata.person3Dob && metadata.person3Dob.trim()) || 
                      '';

    // Validate customer email is present (required field)
    if (!customerEmail || customerEmail.trim() === '') {
      console.error("❌ Customer email is missing - cannot send email notifications");
      console.error("  - Order ID:", orderId);
      
      // Payment succeeded but email data was lost (PhonePe stripped query params)
      // The webhook should handle email sending, so we'll return success with a note
      return res.status(200).json({
        success: true, // Payment was successful
        status: paymentStatus,
        orderId,
        transactionId,
        amount,
        emailStatus: {
          success: false,
          error: "Customer email not available in redirect",
          message: "Payment was successful! Email notifications will be sent via webhook. If you don't receive an email within a few minutes, please contact support.",
          details: {
            hasEncryptedData: !!encryptedData,
            hasDecryptedData: Object.keys(decryptedData).length > 0,
            hasMetadata: Object.keys(metadata).length > 0,
            note: "PhonePe may have stripped query parameters. Email will be sent via webhook."
          }
        }
      });
    }

    // Send emails if customer email is provided
    let emailStatus = null;
    if (customerEmail && customerEmail.trim() !== '') {
      try {
        const emailResult = await sendPaymentEmail({
          to: customerEmail,
          customerEmail,
          customerName: customerName || 'Customer',
          customerMobile: customerMobile,
          customerDob: customerDob,
          person1Name: person1Name,
          person1Dob: person1Dob,
          person2Name: person2Name,
          person2Dob: person2Dob,
          person3Name: person3Name,
          person3Dob: person3Dob,
          orderId,
          amount: amountInPaise, // send-email.js expects amount in paise
          packageType: packageType || 'single',
          status: paymentStatus,
          transactionId: transactionId || '',
        });

        // Strict validation: only mark as success if we have explicit success flag AND messageIds
        const hasSuccessFlag = emailResult && emailResult.success === true;
        const hasCustomerMessageId = emailResult && emailResult.customerMessageId;
        const hasAdminMessageId = emailResult && emailResult.adminMessageId;
        
        if (hasSuccessFlag && hasCustomerMessageId && hasAdminMessageId) {
          emailStatus = {
            success: true,
            message: "Emails sent successfully",
            customerMessageId: emailResult.customerMessageId,
            adminMessageId: emailResult.adminMessageId
          };
        } else {
          // If success flag is false, missing, or messageIds are missing, mark as failed
          const errorMsg = emailResult?.error || 
            (!hasSuccessFlag ? "Email sending failed - no success confirmation" : 
             !hasCustomerMessageId ? "Customer email failed - no message ID" :
             !hasAdminMessageId ? "Admin email failed - no message ID" : 
             "Unknown error sending emails");
          
          console.error("❌ Failed to send emails");
          
          emailStatus = {
            success: false,
            message: errorMsg,
            error: errorMsg,
            details: emailResult?.details || {},
            customerError: emailResult?.customerError,
            adminError: emailResult?.adminError,
            validation: {
              hasSuccessFlag,
              hasCustomerMessageId,
              hasAdminMessageId
            }
          };
        }
      } catch (emailError) {
        console.error("❌ Exception in email sending function");
        emailStatus = {
          success: false,
          message: emailError.message || "Error sending email",
          error: emailError.message
        };
      }
    } else {
      emailStatus = {
        success: false,
        message: "Email not provided - customer email is required for notifications"
      };
    }

    // Return payment status for frontend
    return res.status(200).json({
      success: true,
      status: paymentStatus,
      orderId,
      transactionId,
      amount,
      emailStatus
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
