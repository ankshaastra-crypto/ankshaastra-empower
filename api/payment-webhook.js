// Suppress DEP0169 deprecation warning from dependencies
import './suppress-deprecation.js';

import crypto from 'crypto';
import { sendPaymentEmail } from './send-email.js';
import { rateLimiter } from './rate-limiter.js';

export default async function handler(req, res) {
  // Apply rate limiting
  await rateLimiter(req, res, () => {});
  if (res.headersSent) return; // Rate limit exceeded
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

    // Extract metaInfo from PhonePe response (PhonePe returns it as metaInfo)
    let metadata = {};
    const metaInfo = paymentData.data?.metaInfo || paymentData.metaInfo;
    
    if (metaInfo) {
      try {
        // If metaInfo is a string, parse it; if it's already an object, use it directly
        if (typeof metaInfo === 'string') {
          metadata = JSON.parse(metaInfo);
        } else if (typeof metaInfo === 'object') {
          metadata = metaInfo;
        }
      } catch (error) {
        // If parsing fails, metadata remains empty object
        console.error("Error parsing metaInfo");
      }
    }
    
    // Use metadata if available, otherwise use request body values
    const finalCustomerEmail = (metadata.email && metadata.email.trim()) || customerEmail || '';
    const finalCustomerName = (metadata.name && metadata.name.trim()) || customerName || 'Customer';
    const finalCustomerMobile = (metadata.mobile && metadata.mobile.trim()) || customerMobile || '';
    const finalCustomerDob = (metadata.dob && metadata.dob.trim()) || customerDob || '';
    const finalPackageType = (metadata.packageType && metadata.packageType.trim()) || packageType || 'single';
    const finalPerson1Name = (metadata.person1Name && metadata.person1Name.trim()) || person1Name || finalCustomerName;
    const finalPerson1Dob = (metadata.person1Dob && metadata.person1Dob.trim()) || person1Dob || finalCustomerDob;
    const finalPerson2Name = (metadata.person2Name && metadata.person2Name.trim()) || person2Name || '';
    const finalPerson2Dob = (metadata.person2Dob && metadata.person2Dob.trim()) || person2Dob || '';
    const finalPerson3Name = (metadata.person3Name && metadata.person3Name.trim()) || person3Name || '';
    const finalPerson3Dob = (metadata.person3Dob && metadata.person3Dob.trim()) || person3Dob || '';

    // Validate required fields before sending email
    if (!finalCustomerEmail || !orderId) {
      console.error("Missing required fields for email");
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Send emails
    const emailResult = await sendPaymentEmail({
      to: finalCustomerEmail,
      customerEmail: finalCustomerEmail,
      customerName: finalCustomerName,
      customerMobile: finalCustomerMobile,
      customerDob: finalCustomerDob,
      person1Name: finalPerson1Name,
      person1Dob: finalPerson1Dob,
      person2Name: finalPerson2Name,
      person2Dob: finalPerson2Dob,
      person3Name: finalPerson3Name,
      person3Dob: finalPerson3Dob,
      orderId,
      amount: paymentAmount,
      packageType: finalPackageType,
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
    console.error("Webhook Error");
    return res.status(500).json({ 
      error: "Internal Server Error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
