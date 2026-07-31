// server/_utils/sync-hub-customer.js
// Creates/updates the customer in the shared Ankshaastra CRM (`customers`
// table) and records the order in the shared `orders` table, so Empower
// shows up in the admin panel's CRM module — same pattern already used by
// Miracle Baby's api/verify-payment.ts.
//
// This is intentionally best-effort and non-blocking: if the hub Supabase
// is unreachable or misconfigured, it logs and returns, and never throws —
// so it can never break Empower's own payment/email/WhatsApp/invoice flow.

import { supabaseHub } from './supabase-hub.js';

const SOURCE_WEBSITE = 'empower.ankshaastra.com';

/**
 * @param {object} params
 * @param {string} params.name           - customer full name
 * @param {string} params.email
 * @param {string} params.mobile
 * @param {string} params.packageTitle   - e.g. "Perfect Baby Name — Single"
 * @param {number} params.amount         - order amount in rupees (not paise)
 * @param {string} params.transactionId  - Razorpay payment id
 * @param {string} params.razorpayOrderId
 * @param {object} [params.metadata]     - full booking/form snapshot, stored as-is
 * @returns {Promise<{ customerId: string|null, orderId: string|null }>}
 */
export async function syncOrderToHubCrm({
  name,
  email,
  mobile,
  packageTitle,
  amount,
  transactionId,
  razorpayOrderId,
  metadata = {},
}) {
  if (!supabaseHub) {
    return { customerId: null, orderId: null };
  }

  const customerEmail = (email || '').trim() || null;
  const customerPhone = (mobile || '').trim() || null;

  if (!customerEmail && !customerPhone) {
    console.warn('[sync-hub-customer] No email or phone — skipping CRM sync');
    return { customerId: null, orderId: null };
  }

  // Webhook retry guard: if this payment was already synced, don't insert a
  // second order row. Razorpay (and most gateways) can call a success
  // webhook more than once for the same payment, so this check has to run
  // before we touch the orders table at all.
  if (transactionId) {
    try {
      const { data: existingOrder, error: existingOrderError } = await supabaseHub
        .from('orders')
        .select('id, customer_id')
        .eq('razorpay_payment_id', transactionId)
        .maybeSingle();

      if (existingOrderError) {
        console.error('[sync-hub-customer] duplicate-order check failed:', existingOrderError);
      } else if (existingOrder?.id) {
        console.log('[sync-hub-customer] Order already synced, skipping duplicate:', existingOrder.id);
        return { customerId: existingOrder.customer_id, orderId: existingOrder.id };
      }
    } catch (err) {
      console.error('[sync-hub-customer] unexpected error checking for duplicate order:', err);
    }
  }

  let customerId = null;

  try {
    // Match on email first, then phone — same order as Miracle Baby's logic,
    // so a repeat customer is updated instead of duplicated.
    let existingCustomer = null;

    if (customerEmail) {
      const { data } = await supabaseHub
        .from('customers')
        .select('id')
        .eq('email', customerEmail)
        .maybeSingle();
      existingCustomer = data;
    }

    if (!existingCustomer && customerPhone) {
      const { data } = await supabaseHub
        .from('customers')
        .select('id')
        .eq('phone', customerPhone)
        .maybeSingle();
      existingCustomer = data;
    }

    if (existingCustomer) {
      customerId = existingCustomer.id;

      // Refresh source_website (so a customer who orders from Empower after
      // being created via another site shows up as active on Empower too),
      // plus any newly-provided name/email/phone. lifecycle_stage is always
      // bumped to Completed since this only runs on a successful payment.
      const updatePayload = {
        lifecycle_stage: 'Completed',
        source_website: SOURCE_WEBSITE,
      };
      if (name) updatePayload.full_name = name;
      if (customerEmail) updatePayload.email = customerEmail;
      if (customerPhone) {
        updatePayload.phone = customerPhone;
        updatePayload.whatsapp = customerPhone;
      }

      const { error: updateError } = await supabaseHub
        .from('customers')
        .update(updatePayload)
        .eq('id', customerId);

      if (updateError) {
        console.error('[sync-hub-customer] customer update failed:', updateError);
      }
    } else {
      const { data: newCustomer, error: insertError } = await supabaseHub
        .from('customers')
        .insert({
          full_name: name || 'Customer',
          email: customerEmail,
          phone: customerPhone,
          whatsapp: customerPhone,
          source_website: SOURCE_WEBSITE,
          lifecycle_stage: 'Completed',
          metadata,
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('[sync-hub-customer] customer insert failed:', insertError);
      } else {
        customerId = newCustomer.id;
      }
    }
  } catch (err) {
    console.error('[sync-hub-customer] unexpected error resolving customer:', err);
    return { customerId: null, orderId: null };
  }

  let orderId = null;

  try {
    const { data: order, error: orderError } = await supabaseHub
      .from('orders')
      .insert({
        source_website: SOURCE_WEBSITE,
        customer_id: customerId,
        customer_name: name || '',
        customer_email: customerEmail || '',
        customer_phone: customerPhone || '',
        service_title: packageTitle || 'Empower Service',
        amount: amount || 0,
        total_amount: amount || 0,
        currency: 'INR',
        status: 'paid',
        order_type: 'service',
        workflow_stage: 'payment_received',
        metadata,
        razorpay_order_id: razorpayOrderId || null,
        razorpay_payment_id: transactionId || null,
      })
      .select('id')
      .single();

    if (orderError) {
      console.error('[sync-hub-customer] order insert failed:', orderError);
    } else {
      orderId = order.id;
      console.log('[sync-hub-customer] Order synced to hub CRM:', orderId);
    }
  } catch (err) {
    console.error('[sync-hub-customer] unexpected error inserting order:', err);
  }

  return { customerId, orderId };
}