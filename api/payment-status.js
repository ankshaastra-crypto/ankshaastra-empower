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
    const merchantTransactionId = req.query.merchantTransactionId || req.query.txnId || req.query.transactionId;
    
    // Get PhonePe keys
    const merchantId = process.env.PHONEPE_MERCHANT_ID;
    const saltKey = process.env.PHONEPE_SALT_KEY;
    const saltIndex = process.env.PHONEPE_SALT_INDEX;

    if (!merchantId || !saltKey || !saltIndex) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    if (!merchantTransactionId) {
      return res.status(400).json({ error: "Missing transaction ID" });
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
    
    // Decode the response
    let paymentData;
    try {
      paymentData = JSON.parse(Buffer.from(statusResult.response, 'base64').toString('utf-8'));
    } catch (error) {
      console.error("Error decoding status response:", error);
      return res.status(500).json({ error: "Failed to decode payment status" });
    }

    const paymentStatus = paymentData.code === 'PAYMENT_SUCCESS' ? 'SUCCESS' : 'FAILED';
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
