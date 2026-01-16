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
    const merchantTransactionId = 
      req.query.merchantTransactionId || 
      req.query.txnId || 
      req.query.transactionId ||
      req.query.transaction_id ||
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
    const checksumString = statusUrl + saltKey + "###" + saltIndex;
    const sha256 = crypto.createHash('sha256').update(checksumString).digest('hex');
    const checksum = sha256 + "###" + saltIndex;

    const statusResponse = await fetch(`https://api.phonepe.com/apis/hermes${statusUrl}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': merchantId,
        'Accept': 'application/json',
      },
    });

    const statusResult = await statusResponse.json();
    
    // Log raw response for debugging
    console.log("PhonePe Status API Raw Response:", JSON.stringify(statusResult, null, 2));
    
    // Decode the response
    let paymentData;
    try {
      paymentData = JSON.parse(Buffer.from(statusResult.response, 'base64').toString('utf-8'));
      console.log("Decoded Payment Data:", JSON.stringify(paymentData, null, 2));
    } catch (error) {
      console.error("Error decoding status response:", error);
      return res.status(500).json({ error: "Failed to decode payment status" });
    }

    // Check multiple possible success indicators from PhonePe
    const isSuccess = 
      paymentData.code === 'PAYMENT_SUCCESS' ||
      paymentData.code === 'SUCCESS' ||
      paymentData.success === true ||
      (paymentData.data && paymentData.data.state === 'COMPLETED') ||
      (paymentData.state === 'COMPLETED');
    
    const paymentStatus = isSuccess ? 'SUCCESS' : 'FAILED';
    
    console.log("Payment Status Determination:", {
      code: paymentData.code,
      success: paymentData.success,
      state: paymentData.data?.state || paymentData.state,
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
    if (customerEmail) {
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

      if (emailResult.success) {
        console.log("Emails sent successfully:", {
          customerMessageId: emailResult.customerMessageId,
          adminMessageId: emailResult.adminMessageId
        });
      } else {
        console.error("Failed to send emails:", emailResult.error);
        // Log error but don't fail the payment status check
      }
    } else {
      console.warn("Customer email not provided in query params, skipping email notification. Available params:", Object.keys(req.query));
    }

    // Return payment status for frontend
    return res.status(200).json({
      success: true,
      status: paymentStatus,
      orderId,
      transactionId,
      amount,
      data: paymentData,
    });

  } catch (error) {
    console.error("Payment Status Error:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}
