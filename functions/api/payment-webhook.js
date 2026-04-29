// functions/api/payment-webhook.js — Cloudflare-native payment webhook
// Uses unified DB (D1 on Cloudflare) for data persistence
// Sends confirmation email with GST invoice PDF to customer + admin

import crypto from 'node:crypto';
// import { setEnv } from './_utils/db-unified.js'; // Handled by adapter
import {
  getD1, d1SavePayment, d1GetCustomerMetadata, d1GetOrderFull,
  d1GetNextInvoiceNumber, d1SaveInvoiceRecord, d1GetExistingInvoiceNumber,
} from './_utils/d1-db.js';
import { generateInvoicePDFLocal } from './_utils/generate-invoice-pdf.js';
import { sendPaymentEmail } from './_utils/send-email.js';
import { sendWhatsAppNotification } from './_utils/send-whatsapp.js';

export async function onRequest(context) {
  const { request, env } = context;

  // Inject env
  if (env && typeof env === 'object') {
    for (const [k, v] of Object.entries(env)) {
      if (typeof v === 'string') process.env[k] = v;
    }
  }
  setEnv(env);

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Read raw body
    const rawBody = await request.text();

    if (!rawBody) {
      console.error('Missing webhook raw body');
      return new Response(JSON.stringify({ error: 'Missing webhook payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      console.error('Invalid JSON in webhook body');
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ── Verify Razorpay signature ───────────────────────────────────────────
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('Missing RAZORPAY_WEBHOOK_SECRET');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const xRazorpaySignature = request.headers.get('x-razorpay-signature');
    if (!xRazorpaySignature) {
      console.error('Missing X-Razorpay-Signature header');
      return new Response(JSON.stringify({ error: 'Missing webhook signature' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (xRazorpaySignature !== expectedSignature) {
      console.error('❌ Webhook signature mismatch');
      return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Webhook signature verified');

    // ── Extract event + payment entity ──────────────────────────────────────
    const event = body.event;
    const paymentEntity = body.payload?.payment?.entity || body.payload?.order?.entity || body.data?.payment || body.data?.order;

    if (!paymentEntity) {
      console.error('No payment entity in webhook payload');
      return new Response(JSON.stringify({ error: 'No payment entity in payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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

    // Resolve internal order ID from D1 if needed
    const d1 = getD1(env);
    if (!internalOrderId && razorpayOrderId && d1) {
      try {
        const { d1Query } = await import('./_utils/d1-db.js');
        const mapping = await d1Query(d1,
          'SELECT order_id FROM orders WHERE razorpay_order_id = ?1 LIMIT 1',
          [razorpayOrderId]
        );
        if (mapping.rows.length > 0) {
          internalOrderId = mapping.rows[0].order_id;
          orderId = internalOrderId;
          console.log(`✅ Resolved internal order ID from Razorpay mapping: ${orderId}`);
        }
      } catch (mappingError) {
        console.warn('Could not resolve internal order ID:', mappingError.message);
      }
    }

    const status =
      (event === 'payment.captured' || event === 'order.paid' ||
       paymentEntity.status === 'captured' || paymentEntity.status === 'paid')
        ? 'SUCCESS'
        : 'FAILED';

    console.log(`📊 Webhook: ${status} | event: ${event} | order: ${orderId} | tx: ${transactionId}`);
    const paymentAmount = paymentEntity.amount || 0;

    // ── Fetch customer metadata ─────────────────────────────────────────────
    let metadata = {};
    if (orderId && d1) {
      try {
        metadata = await d1GetCustomerMetadata(d1, orderId, razorpayOrderId) || {};
        if (metadata.email) {
          console.log(`✅ Metadata from D1 for order: ${orderId} — email: ${metadata.email}`);
        }
      } catch (dbErr) {
        console.warn('D1 metadata fetch failed:', dbErr.message);
      }
    }

    // ── Resolve all customer fields ─────────────────────────────────────────
    const str = (v) => (v && v.toString().trim()) || '';

    const finalCustomerEmail   = str(metadata.email);
    const finalCustomerName    = str(metadata.name) || 'Customer';
    const finalCustomerMobile  = str(metadata.mobile);
    const finalCustomerDob     = str(metadata.dob);
    const finalCustomerGender  = str(metadata.gender);
    const finalCustomerCity    = str(metadata.city);
    const finalPackageType     = str(metadata.packageType) || 'single';
    const finalPinCode         = str(metadata.pinCode);

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

    if (!finalCustomerEmail) {
      console.warn(`⚠️ No customer email found for order ${orderId} — emails will be skipped`);
    }
    if (!orderId) {
      console.error('No orderId in webhook payload');
      return new Response(JSON.stringify({ error: 'Missing orderId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ── Save payment to D1 ──────────────────────────────────────────────────
    if (d1) {
      try {
        await d1SavePayment(d1, orderId, transactionId, paymentAmount, status);
        console.log(`✅ Payment saved to D1 — order: ${orderId}, status: ${status}`);
      } catch (dbError) {
        console.error('D1 save payment error:', dbError?.message);
      }
    }

    // ── Generate PDF (SUCCESS only) ─────────────────────────────────────────
    let invoicePdfBuffer = null;
    if (status === 'SUCCESS' && d1) {
      try {
        const orderData = await d1GetOrderFull(d1, orderId);
        if (orderData) {
          console.log(`📄 Generating invoice PDF for order: ${orderId}`);

          // Get next invoice number
          const now = new Date();
          const month = now.getMonth();
          const year = now.getFullYear();
          const fy = month >= 3
            ? `${String(year).slice(2)}-${String(year + 1).slice(2)}`
            : `${String(year - 1).slice(2)}-${String(year).slice(2)}`;

          let invoiceNumber = await d1GetExistingInvoiceNumber(d1, orderId);
          if (!invoiceNumber) {
            invoiceNumber = await d1GetNextInvoiceNumber(d1, fy);
            await d1SaveInvoiceRecord(d1, {
              orderId,
              invoiceNumber,
              financialYear: fy,
              customerName: finalCustomerName,
              customerEmail: finalCustomerEmail,
              amount: paymentAmount / 100,
              packageType: finalPackageType,
              transactionId: transactionId || '',
            });
            console.log(`📄 New invoice number: ${invoiceNumber}`);
          } else {
            console.log(`ℹ️ Invoice already exists: ${invoiceNumber}`);
          }

          const invoiceDate = now.toLocaleDateString('en-IN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
          });

          invoicePdfBuffer = await generateInvoicePDFLocal({
            orderId,
            invoiceNumber,
            invoiceDate,
            customerName: finalCustomerName,
            customerEmail: finalCustomerEmail,
            customerMobile: finalCustomerMobile,
            customerCity: finalCustomerCity,
            pinCode: finalPinCode,
            packageType: finalPackageType,
            transactionId: transactionId || '',
            amount: paymentAmount / 100,
          });
          console.log(`✅ Invoice PDF generated — ${invoicePdfBuffer?.length} bytes`);
        }
      } catch (pdfError) {
        console.error('❌ PDF generation failed:', pdfError.message);
      }
    }

    // ── Send confirmation emails ────────────────────────────────────────────
    let emailResult = { success: true, skipped: true };
    if (finalCustomerEmail && status === 'SUCCESS') {
      console.log(`📧 Sending emails for order ${orderId}`);
      try {
        emailResult = await sendPaymentEmail({
          customerEmail: finalCustomerEmail,
          orderId,
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
          person1MiddleNameType: finalPerson1MiddleNameType,
          person2Name: finalPerson2Name,
          person2FirstName: finalPerson2FirstName,
          person2MiddleName: finalPerson2MiddleName,
          person2SurName: finalPerson2SurName,
          person2Dob: finalPerson2Dob,
          person2Gender: finalPerson2Gender,
          person2MiddleNameType: finalPerson2MiddleNameType,
          person3Name: finalPerson3Name,
          person3FirstName: finalPerson3FirstName,
          person3MiddleName: finalPerson3MiddleName,
          person3SurName: finalPerson3SurName,
          person3Dob: finalPerson3Dob,
          person3Gender: finalPerson3Gender,
          person3MiddleNameType: finalPerson3MiddleNameType,
          fatherFirstName: finalFatherFirstName,
          fatherMiddleName: finalFatherMiddleName,
          fatherMiddleNameType: finalFatherMiddleNameType,
          fatherLastName: finalFatherLastName,
          fatherFullName: finalFatherFullName,
          childMiddleName: finalChildMiddleName,
          childLastName: finalChildLastName,
          fatherFirstNameAsMiddleName: finalFatherFirstNameAsMiddleName,
          nameOptions: finalNameOptions,
          childDob: finalChildDob,
          timeOfBirth: finalTimeOfBirth,
          placeOfBirth: finalPlaceOfBirth,
          pinCode: finalPinCode,
          amount: paymentAmount,
          packageType: finalPackageType,
          status,
          transactionId: transactionId || '',
          invoicePdfBuffer,
        });
      } catch (emailError) {
        console.error('Email sending error:', emailError.message);
        emailResult = { success: false, error: emailError.message };
      }
    }

    // ── Send WhatsApp notification ──────────────────────────────────────────
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
          customerName: finalCustomerName,
          customerMobile: finalCustomerMobile,
          orderId,
          packageType: finalPackageType,
          amount: paymentAmount,
          transactionId: transactionId || '',
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
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Webhook processed',
      emailSent: emailResult.success,
      email: emailResult,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook Error:', error.message);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
