// functions/api/payment-status.js — Payment verification endpoint
// Returns SUCCESS if Razorpay confirms payment via redirect parameters

import { getD1, d1Query, d1Run } from './_utils/d1-db.js';

export const onRequest = async (context) => {
  const { request, env } = context;
  
  try {
    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId');
    const razorpayOrderId = url.searchParams.get('razorpay_order_id');
    const razorpayPaymentId = url.searchParams.get('razorpay_payment_id');
    
    // Try various parameter names that might contain the order ID
    const finalOrderId = orderId || 
      url.searchParams.get('order_id') || 
      url.searchParams.get('merchantTransactionId') ||
      url.searchParams.get('txnId') ||
      url.searchParams.get('transactionId') ||
      url.searchParams.get('transaction_id');
    
    if (!finalOrderId) {
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
    const amount = parseFloat(url.searchParams.get('amount') || '0');
    
    // If razorpay_payment_id is present, payment is confirmed successful
    const razorpayConfirmedSuccess = !!razorpayPaymentId;
    
    if (razorpayConfirmedSuccess) {
      console.log('Payment confirmed via Razorpay redirect:', {
        orderId: finalOrderId,
        razorpayOrderId,
        razorpayPaymentId
      });
      
      // Get D1 database
      const d1 = getD1(env);
      
      if (d1) {
        try {
          // First check if order exists in orders table
          const orderCheck = await d1Query(d1, `
            SELECT order_id, amount FROM orders WHERE order_id = ?1
          `, [finalOrderId]);
          
          if (orderCheck.rows.length === 0) {
            // Order doesn't exist - create it with SUCCESS status
            // Parse amount from URL or use default
            const orderAmount = amount || 0;
            
            await d1Run(d1, `
              INSERT INTO orders (order_id, amount, package_type, razorpay_order_id, status)
              VALUES (?1, ?2, ?3, ?4, 'SUCCESS')
            `, [finalOrderId, orderAmount, packageType, razorpayOrderId]);
            
            console.log('Created order in DB:', finalOrderId);
          } else {
            // Order exists - just update status
            await d1Run(d1, `
              UPDATE orders SET status = 'SUCCESS' WHERE order_id = ?1
            `, [finalOrderId]);
          }
          
          // Now insert payment record
          await d1Run(d1, `
            INSERT INTO payment (order_id, transaction_id, amount_paise, status)
            VALUES (?1, ?2, ?3, 'SUCCESS')
          `, [finalOrderId, razorpayPaymentId, Math.round((amount || 0) * 100)]);
          
          console.log('Payment recorded in D1:', finalOrderId, razorpayPaymentId);
          
        } catch (dbError) {
          // Log error but don't fail the request since payment is confirmed
          console.error('DB recording error:', dbError?.message);
        }
      }
      
      // Return success response
      return new Response(JSON.stringify({
        success: true,
        status: 'SUCCESS',
        orderId: finalOrderId,
        transactionId: razorpayPaymentId,
        customerName,
        customerEmail,
        customerMobile,
        packageType,
        razorpayOrderId,
        amount: amount || 0
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // No razorpay_payment_id - need to check DB
    const d1 = getD1(env);
    
    if (!d1) {
      return new Response(JSON.stringify({
        success: false,
        status: 'FAILED',
        error: 'No payment confirmation and database not available'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check order status in D1
    try {
      const orderResult = await d1Query(d1, `
        SELECT o.order_id, o.amount, o.package_type, o.status AS order_status,
               c.name, c.email, c.mobile
        FROM orders o
        LEFT JOIN customer_details c ON o.order_id = c.order_id
        WHERE o.order_id = ?1
        LIMIT 1
      `, [finalOrderId]);
      
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
      
      const order = orderResult.rows[0];
      
      // Check payment table
      const paymentResult = await d1Query(d1, `
        SELECT transaction_id, amount_paise, status, created_at
        FROM payment
        WHERE order_id = ?1
        ORDER BY created_at DESC
        LIMIT 1
      `, [finalOrderId]);
      
      let paymentStatus = order.order_status;
      if (paymentResult.rows.length > 0) {
        paymentStatus = paymentResult.rows[0].status;
      }
      
      const isSuccess = paymentStatus === 'SUCCESS';
      
      return new Response(JSON.stringify({
        success: isSuccess,
        status: isSuccess ? 'SUCCESS' : 'FAILED',
        orderId: finalOrderId,
        transactionId: paymentResult.rows[0]?.transaction_id || null,
        amount: order.amount || 0,
        customerName: order.name || 'Customer',
        customerEmail: order.email || '',
        customerMobile: order.mobile || '',
        packageType: order.package_type || 'single'
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
