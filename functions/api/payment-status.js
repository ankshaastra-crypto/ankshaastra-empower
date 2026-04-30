import { getD1, ensureD1Schema, d1Query, d1Run } from './_utils/d1-db.js';
import { getCustomerMetadata } from './_utils/db-unified.js';

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
    
    // If we have razorpay_payment_id, payment was definitely successful at Razorpay side
    // Even if webhook hasn't been processed yet, we can consider it success
    const razorpayConfirmedSuccess = !!razorpayPaymentId;
    
    if (razorpayConfirmedSuccess) {
      console.log('Payment confirmed via Razorpay redirect:', {
        orderId: finalOrderId,
        razorpayOrderId,
        razorpayPaymentId
      });
    }
    
    // Use D1 if available
    if (d1) {
      await ensureD1Schema(d1);
      
      // First get customer details
      const customerResult = await d1Query(d1, `
        SELECT 
          c.name, c.email, c.mobile, c.dob, c.gender, c.city, c.pin_code,
          c.person1_name, c.person1_first_name, c.person1_middle_name, c.person1_sur_name, c.person1_dob, c.person1_gender,
          c.person2_name, c.person2_first_name, c.person2_middle_name, c.person2_sur_name, c.person2_dob, c.person2_gender,
          c.person3_name, c.person3_first_name, c.person3_middle_name, c.person3_sur_name, c.person3_dob, c.person3_gender,
          c.father_first_name, c.father_middle_name, c.father_last_name, c.father_full_name,
          c.child_dob, c.time_of_birth, c.place_of_birth, c.child_last_name, c.child_middle_name,
          c.father_first_as_middle, c.name_options,
          o.package_type, o.amount, o.status AS order_status
        FROM customer_details c
        JOIN orders o ON o.order_id = c.order_id
        WHERE c.order_id = ?1 OR o.razorpay_order_id = ?2
        LIMIT 1
      `, [finalOrderId, razorpayOrderId]);
      
      if (customerResult.rows.length === 0) {
        // Order not found in DB - could be a duplicate browser refresh
        // If Razorpay confirms success, still return success
        if (razorpayConfirmedSuccess) {
          return new Response(JSON.stringify({
            success: true,
            status: 'SUCCESS',
            orderId: finalOrderId,
            transactionId: razorpayPaymentId,
            warning: 'Order details not found in database but payment confirmed by Razorpay'
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        return new Response(JSON.stringify({
          success: false,
          status: 'FAILED',
          error: 'Order not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const customer = customerResult.rows[0];
      
      // Get payment status from payment table
      const paymentResult = await d1Query(d1, `
        SELECT transaction_id, amount_paise, status, created_at
        FROM payment
        WHERE order_id = ?1
        ORDER BY created_at DESC
        LIMIT 1
      `, [finalOrderId]);
      
      // Determine payment status
      let paymentStatus = customer.order_status || 'PENDING';
      
      // If we have payment record in DB, use that status
      if (paymentResult.rows.length > 0) {
        paymentStatus = paymentResult.rows[0].status;
      }
      
      // If Razorpay confirms success (has payment ID), override DB status
      // This handles the case where webhook hasn't processed yet
      const finalStatus = razorpayConfirmedSuccess ? 'SUCCESS' : paymentStatus;
      
      // If payment is successful at Razorpay but not recorded in DB yet,
      // save the payment record now (for reliability)
      if (razorpayConfirmedSuccess && paymentStatus !== 'SUCCESS' && d1) {
        try {
          await d1Run(d1, `
            INSERT INTO payment (order_id, transaction_id, amount_paise, status)
            VALUES (?1, ?2, ?3, 'SUCCESS')
          `, [finalOrderId, razorpayPaymentId, Math.round((customer.amount || 0) * 100)]);
          
          // Also update order status
          await d1Run(d1, `
            UPDATE orders SET status = 'SUCCESS' WHERE order_id = ?1
          `, [finalOrderId]);
          
          console.log('Payment recorded from redirect:', finalOrderId, razorpayPaymentId);
        } catch (saveError) {
          console.error('Error saving payment from redirect:', saveError);
        }
      }
      
      // Build response
      const response = {
        success: finalStatus === 'SUCCESS',
        status: finalStatus === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
        orderId: finalOrderId,
        transactionId: paymentResult.rows[0]?.transaction_id || razorpayPaymentId || null,
        amount: customer.amount || 0,
        customerName: customer.name || 'Customer',
        customerEmail: customer.email || '',
        customerMobile: customer.mobile || '',
        customerCity: customer.city || '',
        customerDob: customer.dob || null,
        customerGender: customer.gender || null,
        packageType: customer.package_type || 'single',
        person1Name: customer.person1_name || null,
        person1FirstName: customer.person1_first_name || null,
        person1MiddleName: customer.person1_middle_name || null,
        person1SurName: customer.person1_sur_name || null,
        person1Dob: customer.person1_dob || null,
        person1Gender: customer.person1_gender || null,
        person2Name: customer.person2_name || null,
        person2FirstName: customer.person2_first_name || null,
        person2MiddleName: customer.person2_middle_name || null,
        person2SurName: customer.person2_sur_name || null,
        person2Dob: customer.person2_dob || null,
        person2Gender: customer.person2_gender || null,
        person3Name: customer.person3_name || null,
        person3FirstName: customer.person3_first_name || null,
        person3MiddleName: customer.person3_middle_name || null,
        person3SurName: customer.person3_sur_name || null,
        person3Dob: customer.person3_dob || null,
        person3Gender: customer.person3_gender || null,
        fatherFullName: customer.father_full_name || null,
        childDob: customer.child_dob || null,
        timeOfBirth: customer.time_of_birth || null,
        placeOfBirth: customer.place_of_birth || null,
        pinCode: customer.pin_code || null,
        childLastName: customer.child_last_name || null,
        childMiddleName: customer.child_middle_name || null,
        fatherFirstNameAsMiddleName: customer.father_first_as_middle || null,
        nameOptions: customer.name_options || null
      };
      
      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // No D1 available - try using getCustomerMetadata fallback
    try {
      const metadata = await getCustomerMetadata(finalOrderId, razorpayOrderId);
      
      if (!metadata) {
        // If Razorpay confirms success, return success
        if (razorpayConfirmedSuccess) {
          return new Response(JSON.stringify({
            success: true,
            status: 'SUCCESS',
            orderId: finalOrderId,
            transactionId: razorpayPaymentId,
            warning: 'Order details not found but payment confirmed by Razorpay'
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        return new Response(JSON.stringify({
          success: false,
          status: 'FAILED',
          error: 'Order not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // If Razorpay confirms success, return success
      if (razorpayConfirmedSuccess) {
        return new Response(JSON.stringify({
          success: true,
          status: 'SUCCESS',
          orderId: finalOrderId,
          transactionId: razorpayPaymentId,
          customerName: metadata.name || 'Customer',
          customerEmail: metadata.email || '',
          customerMobile: metadata.mobile || '',
          amount: metadata.amount || 0,
          packageType: metadata.packageType || 'single'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Otherwise check if order exists - consider it success if metadata is present
      // This is a fallback for non-DB environments
      return new Response(JSON.stringify({
        success: true,
        status: 'SUCCESS',
        orderId: finalOrderId,
        transactionId: razorpayPaymentId,
        customerName: metadata.name || 'Customer',
        customerEmail: metadata.email || '',
        customerMobile: metadata.mobile || '',
        amount: metadata.amount || 0,
        packageType: metadata.packageType || 'single'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (metaError) {
      console.error('Error getting metadata:', metaError);
      
      // If Razorpay confirms success, return success despite errors
      if (razorpayConfirmedSuccess) {
        return new Response(JSON.stringify({
          success: true,
          status: 'SUCCESS',
          orderId: finalOrderId,
          transactionId: razorpayPaymentId,
          warning: 'Payment confirmed by Razorpay despite DB error'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({
        success: false,
        status: 'FAILED',
        error: 'Unable to verify order'
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
