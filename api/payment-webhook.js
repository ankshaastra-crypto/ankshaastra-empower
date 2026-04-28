// api/payment-webhook.js
import './_utils/suppress-deprecation.js';

import crypto from 'node:crypto';
import { sendPaymentEmail } from './_utils/send-email.js';
import { getOrderFull } from './_utils/db.js';
import { generateInvoicePDF } from './_utils/supabase-server.js';
import { rateLimiter } from './_utils/rate-limiter.js';
import { sendWhatsAppNotification } from './_utils/send-whatsapp.js';

export default async function handler(req, res) {
  // Apply rate limiting
  await rateLimiter(req, res, () => {});
  if (res.headersSent) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Read raw body before parsing. Cloudflare Pages exposes req.rawBody from
    // functions/_adapter.js; Vercel exposes the original Node request stream.
    let rawBody = '';
    if (typeof req.rawBody === 'string') {
      rawBody = req.rawBody;
    } else if (typeof req.body === 'string') {
      rawBody = req.body;
    } else if (req.body && typeof req.body === 'object') {
      rawBody = JSON.stringify(req.body);
    } else if (typeof req.on === 'function') {
      rawBody = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => { data += chunk; });
        req.on('end', () => resolve(data));
        req.on('error', reject);
      });
    }

    if (!rawBody) {
      console.error('Missing webhook raw body');
      return res.status(400).json({ error: 'Missing webhook payload' });
    }

    // Parse JSON from raw string
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      console.error('Invalid JSON in webhook body');
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }

    // ── Verify Razorpay signature using EXACT raw bytes ───────────────────────
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('Missing RAZORPAY_WEBHOOK_SECRET env var');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const xRazorpaySignature = req.headers['x-razorpay-signature'];
    if (!xRazorpaySignature) {
      console.error('Missing X-Razorpay-Signature header');
      return res.status(400).json({ error: 'Missing webhook signature' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)   // Use RAW string — not JSON.stringify(body)
      .digest('hex');

    if (xRazorpaySignature !== expectedSignature) {
      console.error('❌ Webhook signature mismatch — check RAZORPAY_WEBHOOK_SECRET matches Razorpay dashboard');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    console.log('✅ Webhook signature verified');

    // ── Extract event + payment entity ────────────────────────────────────────
    const event = body.event;
    const paymentEntity = body.payload?.payment?.entity || body.payload?.order?.entity || body.data?.payment || body.data?.order;

    if (!paymentEntity) {
      console.error('No payment entity in webhook payload — event:', event, 'keys:', Object.keys(body));
      return res.status(400).json({ error: 'No payment entity in payload' });
    }

    // Determine Razorpay order ID and optional internal receipt/order mapping
    const razorpayOrderId =
      body.payload?.payment?.entity?.order_id ||
      body.payload?.order?.entity?.id ||
      body.data?.payment?.order_id ||
      body.data?.order?.id ||
      paymentEntity.order_id ||
      paymentEntity.id;

    let internalOrderId = body.payload?.order?.entity?.receipt || body.data?.order?.receipt || null;
    const transactionId = paymentEntity.id;
    let orderId = internalOrderId || razorpayOrderId;

    if (!internalOrderId && razorpayOrderId) {
      try {
        const { getPool, DB_SCHEMA } = await import('./_utils/db.js');
        const p = getPool();
        if (p) {
          const mapping = await p.query(
            `SELECT order_id FROM ${DB_SCHEMA}.orders WHERE razorpay_order_id = $1 LIMIT 1`,
            [razorpayOrderId]
          );
          if (mapping.rows.length > 0) {
            internalOrderId = mapping.rows[0].order_id;
            orderId = internalOrderId;
            console.log(`✅ Resolved internal order ID from Razorpay mapping: ${orderId}`);
          }
        }
      } catch (mappingError) {
        console.warn('Could not resolve internal order ID from Razorpay order mapping:', mappingError.message);
      }
    }

    const status =
      (event === 'payment.captured' || event === 'order.paid' ||
       paymentEntity.status === 'captured' || paymentEntity.status === 'paid')
        ? 'SUCCESS'
        : 'FAILED';

    console.log(`📊 Webhook: ${status} | event: ${event} | order: ${orderId} | tx: ${transactionId}`);
    const paymentAmount = paymentEntity.amount || 0;

    // Fetch customer metadata — Redis first, then DB fallback
    let metadata = {};
    if (orderId) {
      // Try Redis cache first (fastest)
      try {
        const { getRedisCache } = await import('./_utils/redis-cache.js');
        const cache = getRedisCache();
        let storedOrder = await cache.get(`order:${orderId}`);
        if (!storedOrder && razorpayOrderId) {
          storedOrder = await cache.get(`razorpayOrder:${razorpayOrderId}`);
        }
        if (storedOrder && typeof storedOrder === 'object') {
          metadata = storedOrder;
          console.log(`✅ Metadata from Redis for order lookup: ${orderId || razorpayOrderId}`);
        }
      } catch {
        console.warn('Redis cache miss — will try DB fallback');
      }

      // DB fallback: if Redis had no data, query customer_details table
      if (!metadata.email) {
        try {
          const { getPool, DB_SCHEMA } = await import('./_utils/db.js');
          const p = getPool();
          if (p) {
            const result = await p.query(
              `SELECT c.email, c.name, c.mobile, c.dob, c.gender, c.city, c.pin_code,
                      c.person1_name, c.person1_first_name, c.person1_middle_name,
                      c.person1_sur_name, c.person1_dob, c.person1_gender,
                      c.person1_middle_name_type,
                      c.person2_name, c.person2_first_name, c.person2_middle_name,
                      c.person2_sur_name, c.person2_dob, c.person2_gender,
                      c.person2_middle_name_type,
                      c.person3_name, c.person3_first_name, c.person3_middle_name,
                      c.person3_sur_name, c.person3_dob, c.person3_gender,
                      c.person3_middle_name_type,
                      c.father_first_name, c.father_middle_name, c.father_middle_name_type,
                      c.father_last_name, c.father_full_name,
                      c.child_dob, c.child_middle_name, c.child_last_name,
                      c.father_first_as_middle, c.name_options,
                      c.time_of_birth, c.place_of_birth, c.pin_code as pin_code2,
                      o.package_type, o.amount
               FROM ${DB_SCHEMA}.customer_details c
               JOIN ${DB_SCHEMA}.orders o ON o.order_id = c.order_id
               WHERE c.order_id = $1 OR o.razorpay_order_id = $2`,
              [orderId, razorpayOrderId]
            );
            if (result.rows.length > 0) {
              const r = result.rows[0];
              metadata = {
                email:  r.email,
                name:   r.name,
                mobile: r.mobile,
                dob:    r.dob,
                gender: r.gender,
                city:   r.city,
                pinCode: r.pin_code,
                packageType: r.package_type,
                person1Name:           r.person1_name,
                person1FirstName:      r.person1_first_name,
                person1MiddleName:     r.person1_middle_name,
                person1SurName:        r.person1_sur_name,
                person1Dob:            r.person1_dob,
                person1Gender:         r.person1_gender,
                person1MiddleNameType: r.person1_middle_name_type,
                person2Name:           r.person2_name,
                person2FirstName:      r.person2_first_name,
                person2MiddleName:     r.person2_middle_name,
                person2SurName:        r.person2_sur_name,
                person2Dob:            r.person2_dob,
                person2Gender:         r.person2_gender,
                person2MiddleNameType: r.person2_middle_name_type,
                person3Name:           r.person3_name,
                person3FirstName:      r.person3_first_name,
                person3MiddleName:     r.person3_middle_name,
                person3SurName:        r.person3_sur_name,
                person3Dob:            r.person3_dob,
                person3Gender:         r.person3_gender,
                person3MiddleNameType: r.person3_middle_name_type,
                fatherFirstName:             r.father_first_name,
                fatherMiddleName:            r.father_middle_name,
                fatherMiddleNameType:        r.father_middle_name_type,
                fatherLastName:              r.father_last_name,
                fatherFullName:              r.father_full_name,
                childDob:                    r.child_dob,
                childMiddleName:             r.child_middle_name,
                childLastName:               r.child_last_name,
                fatherFirstNameAsMiddleName: r.father_first_as_middle,
                nameOptions:                 r.name_options,
                timeOfBirth:                 r.time_of_birth,
                placeOfBirth:                r.place_of_birth,
              };
              console.log(`✅ Metadata from DB for order: ${orderId} — email: ${metadata.email}`);
            }
          }
        } catch (dbFallbackErr) {
          console.warn('DB fallback for metadata failed:', dbFallbackErr.message);
        }
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

    // Log warning if email missing but don't block — webhook must return 200 to Razorpay
    if (!finalCustomerEmail) {
      console.warn(`⚠️  No customer email found for order ${orderId} — emails will be skipped`);
    }
    if (!orderId) {
      console.error('No orderId in webhook payload');
      return res.status(400).json({ error: 'Missing orderId' });
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
          invoicePdfBuffer = await generateInvoicePDF(orderId, {
            customerName: finalCustomerName,
            customerEmail: finalCustomerEmail,
            customerMobile: finalCustomerMobile,
            customerCity: finalCustomerCity,
            pinCode: finalPinCode,
            packageType: finalPackageType,
            transactionId,
            amount: paymentAmount / 100,
          });
          console.log(`✅ Invoice PDF generated — ${invoicePdfBuffer?.length} bytes`);
        } else {
          console.warn(`⚠️  Order ${orderId} not found in DB — skipping PDF generation`);
        }
      } catch (pdfError) {
        console.error(`❌ PDF generation failed for ${orderId}:`, pdfError.message);
        // Non-fatal: emails still send, just without attachment
      }
    }

    // Send confirmation emails (customer + admin) — only if email available
    // Dedup check inside sendPaymentEmail prevents double-send with payment-status
    let emailResult = { success: true, skipped: true };
    if (finalCustomerEmail && status === 'SUCCESS') {
      console.log(`📧 Webhook sending emails for order ${orderId} — customer: ${finalCustomerEmail}`);
      emailResult = await sendPaymentEmail({
        customerEmail:   finalCustomerEmail,
        orderId,
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
        amount:        paymentAmount,
        packageType:   finalPackageType,
        status,
        transactionId: transactionId || '',
        invoicePdfBuffer,
      });
    }

    // Always send WhatsApp notifications when payment succeeds, even if email metadata is incomplete
    if (status === 'SUCCESS') {
      try {
        const amountInRupees = paymentAmount / 100;
        const pin = parseInt(finalPinCode || '0', 10);
        const isIntraState = pin >= 200000 && pin <= 289999;
        const subtotal = +(amountInRupees / 1.18).toFixed(2);
        const cgstAmount = isIntraState ? +(subtotal * 0.09).toFixed(2) : 0;
        const sgstAmount = isIntraState ? +(subtotal * 0.09).toFixed(2) : 0;
        const igstAmount = isIntraState ? 0 : +(subtotal * 0.18).toFixed(2);

        await sendWhatsAppNotification({
          customerName:   finalCustomerName,
          customerMobile: finalCustomerMobile,
          orderId,
          packageType:    finalPackageType,
          amount:         paymentAmount,
          transactionId:  transactionId || '',
          status,
          subtotal,
          cgstAmount,
          sgstAmount,
          igstAmount,
          totalWithGst: amountInRupees,
          pinCode: finalPinCode,
        });
      } catch (waError) {
        console.error('❌ WhatsApp notification failed:', waError.message);
        // Non-fatal
      }
    }

    if (!emailResult.success && !emailResult.skipped) {
      console.error('Failed to send confirmation emails:', emailResult.error);
    } else if (emailResult.skipped) {
      console.log('⏭️  Emails already sent for this order (sent by payment-status) — skipped');
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



// ── Vercel config: disable body parser so we receive the raw request body ────
// Required for Razorpay webhook signature verification.
// Without this, Vercel parses + re-serializes the body, breaking the HMAC check.
export const config = {
  api: {
    bodyParser: false,
  },
};
