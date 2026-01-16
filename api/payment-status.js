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
    
    // Log all query parameters for debugging
    console.log("All Query Parameters:", JSON.stringify(req.query, null, 2));
    
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
    
    console.log("Status API Checksum Debug:", {
      statusUrl,
      checksumString,
      checksumHash: sha256,
      checksum
    });

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
    
    // Log raw response for debugging
    console.log("PhonePe Status API Raw Response:", JSON.stringify(statusResult, null, 2));
    
    // Handle both response formats:
    // 1. Old format: response field with base64-encoded data
    // 2. New format: direct JSON response
    let paymentData;
    
    if (statusResult.response) {
      // Old format: decode base64 response
      try {
        paymentData = JSON.parse(Buffer.from(statusResult.response, 'base64').toString('utf-8'));
        console.log("Decoded Payment Data (base64 format):", JSON.stringify(paymentData, null, 2));
      } catch (error) {
        console.error("Error decoding base64 response:", error);
        console.error("Raw response string:", statusResult.response);
        return res.status(500).json({ 
          error: "Failed to decode payment status",
          details: error.message
        });
      }
    } else if (statusResult.code || statusResult.data) {
      // New format: direct JSON response
      paymentData = statusResult;
      console.log("Using direct JSON response format:", JSON.stringify(paymentData, null, 2));
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
    
    console.log("Payment Status Determination:", {
      code: paymentData.code,
      success: paymentData.success,
      state: paymentData.data?.state || paymentData.state,
      responseCode: paymentData.data?.responseCode,
      isSuccess,
      paymentStatus
    });
    const orderId = merchantTransactionId;
    const transactionId = paymentData.data?.transactionId || paymentData.data?.merchantTransactionId || '';
    // PhonePe returns amount in paise, use it directly (send-email.js will divide by 100)
    const amount = paymentData.data?.amount || 0;

    // Extract customer info from query params (passed from redirect URL)
    const customerEmail = req.query.email || '';
    const customerName = req.query.name || 'Customer';
    const packageType = req.query.package || 'single';

    // Log query parameters for debugging
    console.log("Payment Status - Query Params:", {
      merchantTransactionId,
      email: customerEmail,
      name: customerName,
      package: packageType,
      paymentStatus
    });

    // Send emails if customer email is provided
    let emailStatus = null;
    if (customerEmail) {
      try {
        console.log("Attempting to send emails for order:", orderId);
        const emailResult = await sendPaymentEmail({
          to: customerEmail,
          customerEmail,
          customerName: customerName || 'Customer',
          orderId,
          amount: amount,
          packageType: packageType || 'single',
          status: paymentStatus,
          transactionId: transactionId || '',
        });

        if (emailResult && emailResult.success) {
          console.log("Emails sent successfully:", {
            customerMessageId: emailResult.customerMessageId,
            adminMessageId: emailResult.adminMessageId
          });
          emailStatus = {
            success: true,
            message: "Email sent successfully"
          };
        } else {
          console.error("Failed to send emails:", emailResult?.error || "Unknown error");
          emailStatus = {
            success: false,
            message: emailResult?.error || "Failed to send email"
          };
        }
      } catch (emailError) {
        console.error("Error in email sending function:", emailError);
        console.error("Email error stack:", emailError.stack);
        emailStatus = {
          success: false,
          message: emailError.message || "Error sending email"
        };
      }
    } else {
      console.warn("Customer email not provided in query params, skipping email notification. Available params:", Object.keys(req.query));
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
    console.error("Payment Status Error:", error);
    console.error("Error Stack:", error.stack);
    return res.status(500).json({ 
      error: "Internal Server Error", 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
