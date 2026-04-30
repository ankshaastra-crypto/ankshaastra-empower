// functions/api/payment-status.js — Payment verification endpoint
// Returns SUCCESS if Razorpay confirms payment via redirect parameters
// Also sends emails and WhatsApp for redundancy

import { getD1, d1Query, d1Run } from './_utils/d1-db.js';
import { sendPaymentEmail } from './_utils/send-email.js';
import { sendWhatsAppNotification } from './_utils/send-whatsapp.js';

export const onRequest = async (context) => {
  const { request, env } = context;
  
  try {
    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId');
    const razorpayOrderId = url.searchParams.get('razorpay_order_id');
    const razorpayPaymentId = url.searchParams.get('razorpay_payment_id');
    
    // Try various parameter names
    const finalOrderId = orderId || 
      url.searchParams.get('order_id') || 
      url.searchParams.get('merchantTransactionId') ||
      url.searchParams.get('txnId') ||
      url.searchParams.get('transactionId') ||
      url.searchParams.get('transaction_id');
    
    if (!finalOrderId && !razorpayOrderId) {
      return new Response(JSON.stringify({
        success: false,
        status: 'FAILED',
        error: 'No order ID provided'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get customer details from URL params
    const customerName = url.searchParams.get('name') || 'Customer';
    const customerEmail = url.searchParams.get('email') || '';
    const customerMobile = url.searchParams.get('mobile') || '';
    const packageType = url.searchParams.get('package') || 'single';
    const customerDob = url.searchParams.get('dob') || '';
    const customerGender = url.searchParams.get('gender') || '';
    const customerCity = url.searchParams.get('city') || '';
    const pinCode = url.searchParams.get('pinCode') || '';
    const fatherFullName = url.searchParams.get('fatherFullName') || '';
    const childDob = url.searchParams.get('childDob') || '';
    const timeOfBirth = url.searchParams.get('timeOfBirth') || '';
    const placeOfBirth = url.searchParams.get('placeOfBirth') || '';
    const childLastName = url.searchParams.get('childLastName') || '';
    const fatherFirstNameAsMiddleName = url.searchParams.get('fatherFirstNameAsMiddleName') || '';
    const nameOptions = url.searchParams.get('nameOptions') || '';
    const amountFromUrl = parseFloat(url.searchParams.get('amount') || '0');
    
    // If razorpay_payment_id is present, payment is confirmed successful
    const razorpayConfirmedSuccess = !!razorpayPaymentId;
    
    if (razorpayConfirmedSuccess) {
      console.log('Payment confirmed via Razorpay redirect:', {
        orderId: finalOrderId,
        razorpayOrderId,
        razorpayPaymentId
      });
      
      const d1 = getD1(env);
      let orderAmount = amountFromUrl || 0;
      let existingOrder = null;
      
      // Try to find existing order by our orderId OR razorpay_order_id
      if (d1) {
        try {
          // First check by our orderId
          let orderResult = await d1Query(d1, `
            SELECT order_id, amount, package_type, status FROM orders WHERE order_id = ?1
          `, [finalOrderId]);
          
          // If not found, try by razorpay_order_id
          if (orderResult.rows.length === 0 && razorpayOrderId) {
            orderResult = await d1Query(d1, `
              SELECT order_id, amount, package_type, status FROM orders WHERE razorpay_order_id = ?1
            `, [razorpayOrderId]);
          }
          
          if (orderResult.rows.length > 0) {
            existingOrder = orderResult.rows[0];
            orderAmount = existingOrder.amount || 0;
            console.log('Found existing order:', existingOrder.order_id, 'amount:', orderAmount);
          }
        } catch (dbErr) {
          console.warn('Order lookup error:', dbErr?.message);
        }
      }
      
      // If order exists, update it. If not, create new
      if (existingOrder) {
        // Update status to SUCCESS
        if (d1) {
          try {
            await d1Run(d1, `
              UPDATE orders SET status = 'SUCCESS' WHERE order_id = ?1
            `, [existingOrder.order_id]);
          } catch (e) {
            console.warn('Status update error:', e?.message);
          }
        }
      } else if (d1) {
        // Create order if doesn't exist - get amount from pricing lookup
        try {
          await d1Run(d1, `
            INSERT INTO orders (order_id, amount, package_type, razorpay_order_id, status)
            VALUES (?1, ?2, ?3, ?4, 'SUCCESS')
          `, [finalOrderId || razorpayOrderId, orderAmount, packageType, razorpayOrderId]);
        } catch (e) {
          console.warn('Order create error:', e?.message);
        }
      }
      
      // Record payment
      if (d1 && finalOrderId) {
        try {
          await d1Run(d1, `
            INSERT INTO payment (order_id, transaction_id, amount_paise, status)
            VALUES (?1, ?2, ?3, 'SUCCESS')
          `, [finalOrderId, razorpayPaymentId, Math.round(orderAmount * 100)]);
          console.log('Payment recorded:', finalOrderId, '₹', orderAmount);
        } catch (e) {
          console.warn('Payment insert error:', e?.message);
        }
      }
      
      // Send emails and WhatsApp for redundancy
      if (customerEmail) {
        try {
          const amountInPaise = Math.round(orderAmount * 100);
          const emailResult = await sendPaymentEmail({
            customerEmail,
            orderId: finalOrderId || razorpayOrderId,
            customerName,
            customerMobile,
            customerDob,
            customerGender,
            customerCity,
            person1Name: customerName,
            person1Dob: customerDob,
            person1Gender: customerGender,
            fatherFullName,
            childDob,
            timeOfBirth,
            placeOfBirth,
            pinCode,
            childLastName,
            fatherFirstNameAsMiddleName,
            nameOptions,
            amount: amountInPaise,
            packageType,
            status: 'SUCCESS',
            transactionId: razorpayPaymentId,
            invoicePdfBuffer: null,
          });
          if (emailResult?.success) {
            console.log('✅ Email sent to:', customerEmail);
          } else {
            console.warn('⚠️ Email send failed:', emailResult?.error || 'Unknown email error');
            if (emailResult?.customerError || emailResult?.adminError) {
              console.warn('Email send details:', {
                customerError: emailResult.customerError || null,
                adminError: emailResult.adminError || null,
              });
            }
          }
        } catch (emailError) {
          console.warn('Email error:', emailError?.message);
        }
      }
      
// Send WhatsApp
      try {
        const amountInRupees = orderAmount;
        const amountInPaise = Math.round(orderAmount * 100);
        const pin = parseInt(pinCode || '0', 10);
        const isIntraState = pin >= 200000 && pin <= 289999;
        const subtotal = +(amountInRupees / 1.18).toFixed(2);
        const cgstAmount = isIntraState ? +(subtotal * 0.09).toFixed(2) : 0;
        const sgstAmount = isIntraState ? +(subtotal * 0.09).toFixed(2) : 0;
        const igstAmount = isIntraState ? 0 : +(subtotal * 0.18).toFixed(2);
        
        await sendWhatsAppNotification({
          customerName,
          customerMobile,
          orderId: finalOrderId || razorpayOrderId,
          packageType,
          amount: amountInPaise,
          transactionId: razorpayPaymentId,
          status: 'SUCCESS',
          subtotal,
          cgstAmount,
          sgstAmount,
          igstAmount,
          totalWithGst: amountInRupees,
          pinCode,
        });
        console.log('WhatsApp sent for:', finalOrderId);
      } catch (waError) {
        console.warn('WhatsApp error:', waError?.message);
      }
      
      // Return success response
      return new Response(JSON.stringify({
        success: true,
        status: 'SUCCESS',
        orderId: finalOrderId || razorpayOrderId,
        transactionId: razorpayPaymentId,
        customerName,
        customerEmail,
        customerMobile,
        packageType,
        razorpayOrderId,
        amount: orderAmount
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // No razorpay_payment_id - check DB for payment status
    const d1 = getD1(env);
    
    if (!d1) {
      return new Response(JSON.stringify({
        success: false,
        status: 'FAILED',
        error: 'No payment confirmation'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check order status
    try {
      let orderResult = await d1Query(d1, `
        SELECT o.order_id, o.amount, o.package_type, o.status AS order_status,
               c.name, c.email, c.mobile
        FROM orders o
        LEFT JOIN customer_details c ON o.order_id = c.order_id
        WHERE o.order_id = ?1
        LIMIT 1
      `, [finalOrderId]);
      
      // Try by razorpay_order_id
      if (orderResult.rows.length === 0 && razorpayOrderId) {
        orderResult = await d1Query(d1, `
          SELECT o.order_id, o.amount, o.package_type, o.status AS order_status,
                 c.name, c.email, c.mobile
          FROM orders o
          LEFT JOIN customer_details c ON o.order_id = c.order_id
          WHERE o.razorpay_order_id = ?1
          LIMIT 1
        `, [razorpayOrderId]);
      }
      
      if (orderResult.rows.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          status: 'FAILED',
          error: 'Order not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const orderRow = orderResult.rows[0];
      
      // Check payment table
      const paymentResult = await d1Query(d1, `
        SELECT transaction_id, amount_paise, status, created_at
        FROM payment
        WHERE order_id = ?1
        ORDER BY created_at DESC
        LIMIT 1
      `, [orderRow.order_id]);
      
      let paymentStatus = orderRow.order_status;
      if (paymentResult.rows.length > 0) {
        paymentStatus = paymentResult.rows[0].status;
      }
      
      const isSuccess = paymentStatus === 'SUCCESS';
      
      return new Response(JSON.stringify({
        success: isSuccess,
        status: isSuccess ? 'SUCCESS' : 'FAILED',
        orderId: orderRow.order_id,
        transactionId: paymentResult.rows[0]?.transaction_id || null,
        amount: orderRow.amount || 0,
        customerName: orderRow.name || 'Customer',
        customerEmail: orderRow.email || '',
        customerMobile: orderRow.mobile || '',
        packageType: orderRow.package_type || 'single'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (dbError) {
      console.error('DB query error:', dbError?.message);
      return new Response(JSON.stringify({
        success: false,
        status: 'FAILED',
        error: 'Database error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    console.error('Payment status error:', error);
    return new Response(JSON.stringify({
      success: false,
      status: 'FAILED',
      error: error.message || 'Internal error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
