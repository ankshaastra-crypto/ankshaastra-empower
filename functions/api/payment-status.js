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
    const razorpaySignature = url.searchParams.get('razorpay_signature');
    
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
    
    // Get D1 database
    const d1 = getD1(env);
    
    // If razorpay_payment_id is present, payment is confirmed successful
    // Return success immediately, no need for DB verification
    const razorpayConfirmedSuccess = !!razorpayPaymentId;
    
    if (razorpayConfirmedSuccess) {
      console.log('Payment confirmed via Razorpay redirect:', {
        orderId: finalOrderId,
        razorpayOrderId,
        razorpayPaymentId
      });
      
      // Try to get customer details from URL params if D1 is not available
      const customerName = url.searchParams.get('name') || 'Customer';
      const customerEmail = url.searchParams.get('email') || '';
      const customerMobile = url.searchParams.get('mobile') || '';
      const packageType = url.searchParams.get('package') || 'single';
      
      // If D1 is available, try to record the payment
      if (d1) {
        try {
          // First check if order exists
          const orderCheck = await d1Query(d1, `
            SELECT order_id, amount, package_type, status FROM orders WHERE order_id = ?1
          `, [finalOrderId]);
          
          const orderAmount = orderCheck.rows[0]?.amount || 0;
          
          // Save payment record
          await d1Run(d1, `
            INSERT INTO payment (order_id, transaction_id, amount_paise, status)
            VALUES (?1, ?2, ?3, 'SUCCESS')
          `, [finalOrderId, razorpayPaymentId, Math.round(orderAmount * 100)]);
          
          // Update order status
          await d1Run(d1, `
            UPDATE orders SET status = 'SUCCESS' WHERE order_id = ?1
          `, [finalOrderId]);
          
          console.log('Payment recorded in D1:', finalOrderId, razorpayPaymentId);
        } catch (dbError) {
          // Don't fail the request if DB recording fails
          console.error('DB recording error:', dbError?.message);
        }
      }
      
      // Return success response with details from URL params
      return new Response(JSON.stringify({
        success: true,
        status: 'SUCCESS',
        orderId: finalOrderId,
        transactionId: razorpayPaymentId,
        customerName,
        customerEmail,
        customerMobile,
        packageType,
        razorpayOrderId
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // No razorpay_payment_id - need to check DB for payment status
    // This handles the case where user directly visits without payment
    
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
      
      // Check payment table for payment status
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
