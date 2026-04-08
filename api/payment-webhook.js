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
    // For Razorpay webhooks, the body is direct JSON
    const event = req.body.event;
    const paymentEntity = req.body.data?.payment || req.body.data?.order;

    if (!paymentEntity) {
      console.error("Invalid Razorpay webhook payload");
      return res.status(400).json({ error: "Invalid payload" });
    }

    // Get Razorpay webhook secret for verification
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("Missing Razorpay webhook secret");
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Verify the webhook signature (Razorpay sends X-Razorpay-Signature header)
    const xRazorpaySignature = req.headers['x-razorpay-signature'];
    if (!xRazorpaySignature) {
      console.error("Missing X-Razorpay-Signature header");
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    // Get raw body for signature verification
    const rawBody = JSON.stringify(req.body);

    // Verify signature
    const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

    if (xRazorpaySignature !== expectedSignature) {
      console.error("Invalid webhook signature");
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    // Extract payment details
    const orderId = paymentEntity.order_id || paymentEntity.id;
    const transactionId = paymentEntity.id;
    const status = (event === 'payment.captured' || paymentEntity.status === 'paid') ? 'SUCCESS' : 'FAILED';
    const paymentAmount = paymentEntity.amount || 0;

    // Razorpay doesn't have metaInfo, so fetch from Redis
    let metadata = {};
    if (orderId) {
      try {
        const { getRedisCache } = await import('./redis-cache.js');
        const cache = getRedisCache();
        const storedOrder = await cache.get(`order:${orderId}`);
        if (storedOrder && typeof storedOrder === 'object') {
          metadata = storedOrder;
        }
      } catch {
        // Non-fatal: fall back to empty
      }
    }
    
    // Use metadata for customer data
    const finalCustomerEmail = (metadata.email && metadata.email.trim()) || '';
    const finalCustomerName = (metadata.name && metadata.name.trim()) || 'Customer';
    const finalCustomerMobile = (metadata.mobile && metadata.mobile.trim()) || '';
    const finalCustomerDob = (metadata.dob && metadata.dob.trim()) || '';
    const finalCustomerGender = (metadata.gender && metadata.gender.trim()) || '';
    const finalCustomerCity = (metadata.city && metadata.city.trim()) || customerCity || '';
    const finalPackageType = (metadata.packageType && metadata.packageType.trim()) || packageType || 'single';
    const finalPerson1Name = (metadata.person1Name && metadata.person1Name.trim()) || person1Name || finalCustomerName;
    const finalPerson1FirstName = (metadata.person1FirstName && metadata.person1FirstName.trim()) || (person1FirstName && person1FirstName.trim()) || '';
    const finalPerson1MiddleName = (metadata.person1MiddleName && metadata.person1MiddleName.trim()) || (person1MiddleName && person1MiddleName.trim()) || '';
    const finalPerson1SurName = (metadata.person1SurName && metadata.person1SurName.trim()) || (person1SurName && person1SurName.trim()) || '';
    const finalPerson1Dob = (metadata.person1Dob && metadata.person1Dob.trim()) || person1Dob || finalCustomerDob;
    const finalPerson1Gender = (metadata.person1Gender && metadata.person1Gender.trim()) || person1Gender || finalCustomerGender;
    const finalPerson2Name = (metadata.person2Name && metadata.person2Name.trim()) || person2Name || '';
    const finalPerson2FirstName = (metadata.person2FirstName && metadata.person2FirstName.trim()) || (person2FirstName && person2FirstName.trim()) || '';
    const finalPerson2MiddleName = (metadata.person2MiddleName && metadata.person2MiddleName.trim()) || (person2MiddleName && person2MiddleName.trim()) || '';
    const finalPerson2SurName = (metadata.person2SurName && metadata.person2SurName.trim()) || (person2SurName && person2SurName.trim()) || '';
    const finalPerson2Dob = (metadata.person2Dob && metadata.person2Dob.trim()) || person2Dob || '';
    const finalPerson2Gender = (metadata.person2Gender && metadata.person2Gender.trim()) || person2Gender || '';
    const finalPerson3Name = (metadata.person3Name && metadata.person3Name.trim()) || person3Name || '';
    const finalPerson3FirstName = (metadata.person3FirstName && metadata.person3FirstName.trim()) || (person3FirstName && person3FirstName.trim()) || '';
    const finalPerson3MiddleName = (metadata.person3MiddleName && metadata.person3MiddleName.trim()) || (person3MiddleName && person3MiddleName.trim()) || '';
    const finalPerson3SurName = (metadata.person3SurName && metadata.person3SurName.trim()) || (person3SurName && person3SurName.trim()) || '';
    const finalPerson3Dob = (metadata.person3Dob && metadata.person3Dob.trim()) || person3Dob || '';
    const finalPerson3Gender = (metadata.person3Gender && metadata.person3Gender.trim()) || person3Gender || '';

    // Validate required fields before sending email
    if (!finalCustomerEmail || !orderId) {
      console.error("Missing required fields for email");
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Save payment to PostgreSQL
    try {
      const { savePayment } = await import('./db.js');
      await savePayment(orderId, transactionId, paymentAmount, status);
    } catch (dbError) {
      console.error('DB save payment error:', dbError?.message || dbError);
      // Non-fatal: continue with email flow
    }

    // Send payment confirmation emails (customer and admin)
    const emailResult = await sendPaymentEmail({
      to: finalCustomerEmail,
      customerEmail: finalCustomerEmail,
      customerName: finalCustomerName,
      customerMobile: finalCustomerMobile,
      customerDob: finalCustomerDob,
      customerGender: finalCustomerGender,
      customerCity: finalCustomerCity,
      person1Name: finalPerson1Name,
      person1FirstName: finalPerson1FirstName,
      person1MiddleName: finalPerson1MiddleName,
      person1SurName: finalPerson1SurName,
      person1Dob: finalPerson1Dob,
      person1Gender: finalPerson1Gender,
      person1MiddleNameType: (metadata.person1MiddleNameType && metadata.person1MiddleNameType.trim()) || person1MiddleNameType || '',
      person2Name: finalPerson2Name,
      person2FirstName: finalPerson2FirstName,
      person2MiddleName: finalPerson2MiddleName,
      person2SurName: finalPerson2SurName,
      person2Dob: finalPerson2Dob,
      person2Gender: finalPerson2Gender,
      person2MiddleNameType: (metadata.person2MiddleNameType && metadata.person2MiddleNameType.trim()) || person2MiddleNameType || '',
      person3Name: finalPerson3Name,
      person3FirstName: finalPerson3FirstName,
      person3MiddleName: finalPerson3MiddleName,
      person3SurName: finalPerson3SurName,
      person3Dob: finalPerson3Dob,
      person3Gender: finalPerson3Gender,
      person3MiddleNameType: (metadata.person3MiddleNameType && metadata.person3MiddleNameType.trim()) || person3MiddleNameType || '',
      fatherFirstName: (metadata.fatherFirstName && metadata.fatherFirstName.trim()) || fatherFirstName || '',
      fatherMiddleName: (metadata.fatherMiddleName && metadata.fatherMiddleName.trim()) || fatherMiddleName || '',
      fatherMiddleNameType: (metadata.fatherMiddleNameType && metadata.fatherMiddleNameType.trim()) || fatherMiddleNameType || '',
      fatherLastName: (metadata.fatherLastName && metadata.fatherLastName.trim()) || fatherLastName || '',
      childDob: (metadata.childDob && metadata.childDob.trim()) || childDob || '',
      timeOfBirth: (metadata.timeOfBirth && metadata.timeOfBirth.trim()) || timeOfBirth || '',
      placeOfBirth: (metadata.placeOfBirth && metadata.placeOfBirth.trim()) || placeOfBirth || '',
      pinCode: (metadata.pinCode && metadata.pinCode.trim()) || pinCode || '',
      orderId,
      amount: paymentAmount,
      packageType: finalPackageType,
      status,
      transactionId: transactionId || '',
    });

    if (!emailResult.success) {
      console.error("Failed to send confirmation emails:", emailResult.error);
    }

    // Return success response to Razorpay
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
