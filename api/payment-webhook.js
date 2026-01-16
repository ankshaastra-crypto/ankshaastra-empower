import crypto from 'crypto';
import { sendPaymentEmail } from './send-email.js';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { response, customerEmail, customerName, customerMobile, customerDob, packageType, amount, person1Name, person1Dob, person2Name, person2Dob, person3Name, person3Dob } = req.body;

    // Get PhonePe keys for verification
    const saltKey = process.env.PHONEPE_SALT_KEY;
    const saltIndex = process.env.PHONEPE_SALT_INDEX;

    if (!saltKey || !saltIndex) {
      console.error("Missing PhonePe credentials for webhook verification");
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Verify the webhook signature (PhonePe sends X-VERIFY header)
    const xVerify = req.headers['x-verify'];
    if (!xVerify) {
      console.error("Missing X-VERIFY header");
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    // Decode and verify the response
    let decodedResponse;
    try {
      decodedResponse = JSON.parse(Buffer.from(response, 'base64').toString('utf-8'));
    } catch (error) {
      console.error("Error decoding response:", error);
      return res.status(400).json({ error: "Invalid response format" });
    }

    // Verify checksum
    const checksumString = response + "/pg/v1/status/" + saltKey + "###" + saltIndex;
    const sha256 = crypto.createHash('sha256').update(checksumString).digest('hex');
    const expectedChecksum = sha256 + "###" + saltIndex;

    if (xVerify !== expectedChecksum) {
      console.error("Checksum verification failed");
      return res.status(400).json({ error: "Invalid checksum" });
    }

    // Extract payment details
    const paymentData = decodedResponse;
    const orderId = paymentData.data?.merchantTransactionId;
    const transactionId = paymentData.data?.transactionId;
    const status = paymentData.code === 'PAYMENT_SUCCESS' ? 'SUCCESS' : 'FAILED';
    // PhonePe returns amount in paise, use it directly or fallback to request amount
    const paymentAmount = paymentData.data?.amount || amount || 0;

    // Validate required fields before sending email
    if (!customerEmail || !orderId) {
      console.error("Missing required fields for email");
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Send emails
    const emailResult = await sendPaymentEmail({
      to: customerEmail,
      customerEmail,
      customerName: customerName || 'Customer',
      customerMobile: customerMobile || '',
      customerDob: customerDob || '',
      person1Name: person1Name || customerName || '',
      person1Dob: person1Dob || customerDob || '',
      person2Name: person2Name || '',
      person2Dob: person2Dob || '',
      person3Name: person3Name || '',
      person3Dob: person3Dob || '',
      orderId,
      amount: paymentAmount,
      packageType: packageType || 'single',
      status,
      transactionId: transactionId || '',
    });

    if (!emailResult.success) {
      console.error("Failed to send emails:", emailResult.error);
      // Don't fail the webhook if email fails, but log it
    }

    // Return success response to PhonePe
    return res.status(200).json({ 
      success: true,
      message: 'Webhook processed successfully',
      emailSent: emailResult.success 
    });

  } catch (error) {
    console.error("Webhook Error:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}
