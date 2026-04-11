// api/payment-webhook.js
import './suppress-deprecation.js';

import crypto from 'crypto';
import { sendPaymentEmail } from './_utils/send-email.js';
import { getOrderFull } from './_utils/db.js';
import { generateInvoicePDF } from './_utils/supabase-server.js';
import { rateLimiter } from './_utils/rate-limiter.js';

export default async function handler(req, res) {
  // Apply rate limiting
  await rateLimiter(req, res, () => {});
  if (res.headersSent) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const event = req.body.event;
    const paymentEntity = req.body.data?.payment || req.body.data?.order;

    if (!paymentEntity) {
      console.error('Invalid Razorpay webhook payload');
      return res.status(400).json({ error: 'Invalid payload' });
    }

    // Verify webhook secret
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('Missing Razorpay webhook secret');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const xRazorpaySignature = req.headers['x-razorpay-signature'];
    if (!xRazorpaySignature) {
      console.error('Missing X-Razorpay-Signature header');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const rawBody = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (xRazorpaySignature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    // Extract payment details
    const orderId = paymentEntity.order_id || paymentEntity.id;
    const transactionId = paymentEntity.id;
    const status =
      event === 'payment.captured' || paymentEntity.status === 'paid'
        ? 'SUCCESS'
        : 'FAILED';
    const paymentAmount = paymentEntity.amount || 0;

    // Fetch customer metadata from Redis cache
    let metadata = {};
    if (orderId) {
      try {
        const { getRedisCache } = await import('./_utils/redis-cache.js');
        const cache = getRedisCache();
        const storedOrder = await cache.get(`order:${orderId}`);
        if (storedOrder && typeof storedOrder === 'object') {
          metadata = storedOrder;
        }
      } catch {
        console.warn('Redis cache miss for order:', orderId);
      }
    }

    // Resolve all customer fields from metadata (safe .trim() helper)
    const str = (v) => (v && v.toString().trim()) || '';

    const finalCustomerEmail   = str(metadata.email);
    const finalCustomerName    = str(metadata.name) || 'Customer';
    const finalCustomerMobile  = str(metadata.mobile);
    const finalCustomerDob     = str(metadata.dob);
    const finalCustomerGender  = str(metadata.gender);
    const finalCustomerCity    = str(metadata.city);
    const finalPackageType     = str(metadata.packageType) || 'single';
    const finalPinCode         = str(metadata.pinCode);

    // Person fields
    const finalPerson1Name           = str(metadata.person1Name) || finalCustomerName;
    const finalPerson1FirstName      = str(metadata.person1FirstName);
    const finalPerson1MiddleName     = str(metadata.person1MiddleName);
    const finalPerson1SurName        = str(metadata.person1SurName);
    const finalPerson1Dob            = str(metadata.person1Dob) || finalCustomerDob;
    const finalPerson1Gender         = str(metadata.person1Gender) || finalCustomerGender;
    const finalPerson1MiddleNameType = str(metadata.person1MiddleNameType);

    const finalPerson2Name           = str(metadata.person2Name);
    const finalPerson2FirstName      = str(metadata.person2FirstName);
    const finalPerson2MiddleName     = str(metadata.person2MiddleName);
    const finalPerson2SurName        = str(metadata.person2SurName);
    const finalPerson2Dob            = str(metadata.person2Dob);
    const finalPerson2Gender         = str(metadata.person2Gender);
    const finalPerson2MiddleNameType = str(metadata.person2MiddleNameType);

    const finalPerson3Name           = str(metadata.person3Name);
    const finalPerson3FirstName      = str(metadata.person3FirstName);
    const finalPerson3MiddleName     = str(metadata.person3MiddleName);
    const finalPerson3SurName        = str(metadata.person3SurName);
    const finalPerson3Dob            = str(metadata.person3Dob);
    const finalPerson3Gender         = str(metadata.person3Gender);
    const finalPerson3MiddleNameType = str(metadata.person3MiddleNameType);

    // Baby name fields
    const finalFatherFirstName            = str(metadata.fatherFirstName);
    const finalFatherMiddleName           = str(metadata.fatherMiddleName);
    const finalFatherMiddleNameType       = str(metadata.fatherMiddleNameType);
    const finalFatherLastName             = str(metadata.fatherLastName);
    const finalFatherFullName             = str(metadata.fatherFullName);
    const finalChildMiddleName            = str(metadata.childMiddleName);
    const finalChildLastName              = str(metadata.childLastName);
    const finalFatherFirstNameAsMiddleName = str(metadata.fatherFirstNameAsMiddleName);
    const finalNameOptions                = str(metadata.nameOptions);
    const finalChildDob                   = str(metadata.childDob);
    const finalTimeOfBirth                = str(metadata.timeOfBirth);
    const finalPlaceOfBirth               = str(metadata.placeOfBirth);

    // Validate required fields
    if (!finalCustomerEmail || !orderId) {
      console.error('Missing required fields for email — email:', finalCustomerEmail, 'orderId:', orderId);
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Save payment to PostgreSQL
    try {
      const { savePayment } = await import('./_utils/db.js');
      await savePayment(orderId, transactionId, paymentAmount, status);
      console.log(`✅ Payment saved to DB — order: ${orderId}, status: ${status}`);
    } catch (dbError) {
      console.error('DB save payment error:', dbError?.message || dbError);
      // Non-fatal: continue with email flow
    }

    // Generate PDF (SUCCESS only) — store on Supabase, attach to email
    let invoicePdfBuffer = null;
    if (status === 'SUCCESS') {
      try {
        // Ensure order exists in DB before generating invoice
        const orderData = await getOrderFull(orderId);
        if (orderData) {
          console.log(`📄 Generating invoice PDF for order: ${orderId}`);
          invoicePdfBuffer = await generateInvoicePDF(orderId);
          console.log(`✅ Invoice PDF generated — ${invoicePdfBuffer?.length} bytes`);
        } else {
          console.warn(`⚠️  Order ${orderId} not found in DB — skipping PDF generation`);
        }
      } catch (pdfError) {
        console.error(`❌ PDF generation failed for ${orderId}:`, pdfError.message);
        // Non-fatal: emails still send, just without attachment
      }
    }

    // Send confirmation emails (customer + admin)
    console.log(`📧 Sending emails for order ${orderId} — status: ${status}, customer: ${finalCustomerEmail}`);
    const emailResult = await sendPaymentEmail({
      to: finalCustomerEmail,
      customerEmail:   finalCustomerEmail,
      customerName:    finalCustomerName,
      customerMobile:  finalCustomerMobile,
      customerDob:     finalCustomerDob,
      customerGender:  finalCustomerGender,
      customerCity:    finalCustomerCity,
      person1Name:           finalPerson1Name,
      person1FirstName:      finalPerson1FirstName,
      person1MiddleName:     finalPerson1MiddleName,
      person1SurName:        finalPerson1SurName,
      person1Dob:            finalPerson1Dob,
      person1Gender:         finalPerson1Gender,
      person1MiddleNameType: finalPerson1MiddleNameType,
      person2Name:           finalPerson2Name,
      person2FirstName:      finalPerson2FirstName,
      person2MiddleName:     finalPerson2MiddleName,
      person2SurName:        finalPerson2SurName,
      person2Dob:            finalPerson2Dob,
      person2Gender:         finalPerson2Gender,
      person2MiddleNameType: finalPerson2MiddleNameType,
      person3Name:           finalPerson3Name,
      person3FirstName:      finalPerson3FirstName,
      person3MiddleName:     finalPerson3MiddleName,
      person3SurName:        finalPerson3SurName,
      person3Dob:            finalPerson3Dob,
      person3Gender:         finalPerson3Gender,
      person3MiddleNameType: finalPerson3MiddleNameType,
      fatherFirstName:            finalFatherFirstName,
      fatherMiddleName:           finalFatherMiddleName,
      fatherMiddleNameType:       finalFatherMiddleNameType,
      fatherLastName:             finalFatherLastName,
      fatherFullName:             finalFatherFullName,
      childMiddleName:            finalChildMiddleName,
      childLastName:              finalChildLastName,
      fatherFirstNameAsMiddleName: finalFatherFirstNameAsMiddleName,
      nameOptions:                finalNameOptions,
      childDob:                   finalChildDob,
      timeOfBirth:                finalTimeOfBirth,
      placeOfBirth:               finalPlaceOfBirth,
      pinCode:                    finalPinCode,
      orderId,
      amount:        paymentAmount,
      packageType:   finalPackageType,
      status,
      transactionId: transactionId || '',
      invoicePdfBuffer,
    });

    // Also send WhatsApp notification
    try {
      await sendWhatsAppNotification({
        customerName:   finalCustomerName,
        customerMobile: finalCustomerMobile,
        orderId,
        packageType:    finalPackageType,
        amount:         paymentAmount,
        transactionId:  transactionId || '',
        status,
      });
    } catch (waError) {
      console.error('❌ WhatsApp notification failed:', waError.message);
      // Non-fatal
    }

    if (!emailResult.success) {
      console.error('Failed to send confirmation emails:', emailResult.error);
    }

    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      emailSent: emailResult.success,
    });
  } catch (error) {
    console.error('Webhook Error:', error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

// ─── WhatsApp Notification via WhatsApp Business Cloud API ───────────────────

async function sendWhatsAppNotification({ customerName, customerMobile, orderId, packageType, amount, transactionId, status }) {
  const token     = process.env.WHATSAPP_TOKEN;
  const phoneId   = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const adminNum  = process.env.WHATSAPP_ADMIN_NUMBER; // e.g. 919667305577

  if (!token || !phoneId) {
    console.log('WhatsApp env not configured — skipping notification');
    return;
  }

  const amountInRupees = amount && amount > 0 ? (amount / 100).toLocaleString('en-IN') : '0';
  const packageNames = {
    single:    'Single Name Report',
    premium:   'Premium Report',
    namecheck: 'Name Check',
    namecheck1: 'Name Check (1 Person)',
    namecheck2: 'Name Check (2 Persons)',
    namecheck3: 'Name Check (3 Persons)',
    baby_name: 'Baby Name Report',
  };
  const packageName = packageNames[packageType] || packageType || 'Numerology Report';

  const emoji  = status === 'SUCCESS' ? '✅' : '❌';
  const title  = status === 'SUCCESS' ? 'Payment Received' : 'Payment Failed';

  // Build the message text
  const customerMsg = status === 'SUCCESS'
    ? `🙏 *Namaste ${customerName}!*\n\nThank you for ordering from *Ankshaastra*.\n\n📦 *Package:* ${packageName}\n💰 *Amount Paid:* ₹${amountInRupees}\n🔖 *Order ID:* ${orderId}\n\nYour personalized numerology report will be delivered within *24-48 hours* to your registered email/WhatsApp.\n\nFor any queries, call us: *+91-9667305577*\n\n🌟 _Ankshaastra — Empower Your Name_`
    : `Dear ${customerName},\n\nWe could not process your payment for *${packageName}*.\n\n🔖 *Order ID:* ${orderId}\n\nPlease try again or contact us at *+91-9667305577*.\n\n_Ankshaastra — Empower Your Name_`;

  const adminMsg = `${emoji} *${title}*\n\n👤 *Customer:* ${customerName}\n📱 *Mobile:* ${customerMobile || 'N/A'}\n📦 *Package:* ${packageName}\n💰 *Amount:* ₹${amountInRupees}\n🔖 *Order ID:* ${orderId}\n🧾 *Transaction ID:* ${transactionId || 'N/A'}\n📅 *Time:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;

  const sendMessage = async (to, text) => {
    if (!to) return;
    // Normalize number — strip leading + or spaces
    const normalized = to.replace(/\D/g, '');
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${phoneId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: normalized,
          type: 'text',
          text: { body: text },
        }),
      }
    );
    const result = await response.json();
    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${JSON.stringify(result)}`);
    }
    return result;
  };

  // Send to customer (if mobile provided)
  if (customerMobile) {
    try {
      await sendMessage(customerMobile, customerMsg);
      console.log(`✅ WhatsApp sent to customer: ${customerMobile}`);
    } catch (e) {
      console.error('WhatsApp customer send failed:', e.message);
    }
  }

  // Send to admin
  if (adminNum) {
    try {
      await sendMessage(adminNum, adminMsg);
      console.log(`✅ WhatsApp sent to admin: ${adminNum}`);
    } catch (e) {
      console.error('WhatsApp admin send failed:', e.message);
    }
  }
}