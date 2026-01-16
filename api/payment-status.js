import crypto from 'crypto';
import { sendPaymentEmail } from './send-email.js';

export default async function handler(req, res) {
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
      console.error("Missing transaction ID. Available query params:", Object.keys(req.query));
      return res.status(400).json({ 
        error: "Missing transaction ID",
        availableParams: Object.keys(req.query),
        query: req.query
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
      const errorText = await statusResponse.text();
      console.error("PhonePe API Error:", {
        status: statusResponse.status,
        statusText: statusResponse.statusText,
        body: errorText
      });
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
      console.error("Invalid PhonePe response structure:", statusResult);
      return res.status(500).json({ 
        error: "Invalid response from PhonePe",
        details: "Response format not recognized",
        received: statusResult
      });
    }

    // Validate paymentData structure
    if (!paymentData || typeof paymentData !== 'object') {
      console.error("Invalid paymentData structure:", paymentData);
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
    // PhonePe returns amount in paise, use it directly (send-email.js will divide by 100)
    const amount = paymentData.data?.amount || 0;

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
    
    // Helper function to safely extract and decode query params (fallback if metadata missing)
    const getQueryParam = (param) => {
      const value = req.query[param];
      if (!value) return '';
      try {
        // Decode URL-encoded values
        return decodeURIComponent(value.toString()).trim();
      } catch {
        return value.toString().trim();
      }
    };

    // Extract customer info - prefer metadata (from PhonePe response), fallback to query params
    const customerEmail = (metadata.email && metadata.email.trim()) || getQueryParam('email') || '';
    const customerName = (metadata.name && metadata.name.trim()) || getQueryParam('name') || 'Customer';
    const customerMobile = (metadata.mobile && metadata.mobile.trim()) || getQueryParam('mobile') || '';
    const customerDob = (metadata.dob && metadata.dob.trim()) || getQueryParam('dob') || '';
    const packageType = (metadata.packageType && metadata.packageType.trim()) || getQueryParam('package') || 'single';
    // Extract person details for family package
    const person1Name = (metadata.person1Name && metadata.person1Name.trim()) || getQueryParam('person1Name') || customerName;
    const person1Dob = (metadata.person1Dob && metadata.person1Dob.trim()) || getQueryParam('person1Dob') || customerDob;
    const person2Name = (metadata.person2Name && metadata.person2Name.trim()) || getQueryParam('person2Name') || '';
    const person2Dob = (metadata.person2Dob && metadata.person2Dob.trim()) || getQueryParam('person2Dob') || '';
    const person3Name = (metadata.person3Name && metadata.person3Name.trim()) || getQueryParam('person3Name') || '';
    const person3Dob = (metadata.person3Dob && metadata.person3Dob.trim()) || getQueryParam('person3Dob') || '';

    // Send emails if customer email is provided
    let emailStatus = null;
    if (customerEmail) {
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
          amount: amount,
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
          console.error("Email error details:", emailResult?.details || {});
          
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
      console.warn("⚠️ Customer email not provided in query params, skipping email notification");
      emailStatus = {
        success: false,
        message: "Email not provided"
      };
    }

    // Return payment status for frontend
    return res.status(200).json({
      success: true,
      status: paymentStatus,
      orderId,
      transactionId,
      amount,
      emailStatus,
      data: paymentData,
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
