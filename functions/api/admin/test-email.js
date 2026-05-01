import { sendPaymentEmail } from '../_utils/send-email.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (env && typeof env === 'object') {
    for (const [k, v] of Object.entries(env)) {
      if (typeof v === 'string') process.env[k] = v;
    }
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const email = body?.email || process.env.ADMIN_EMAIL;
    if (!email) {
      return new Response(JSON.stringify({ success: false, error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await sendPaymentEmail({
      customerEmail: email,
      orderId: `TEST-${Date.now()}`,
      customerName: body?.name || 'Test User',
      amount: 100,
      packageType: 'single',
      status: 'SUCCESS',
      transactionId: `test_txn_${Date.now()}`,
    });

    return new Response(JSON.stringify({ success: !!result?.success, result }), {
      status: result?.success ? 200 : 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error?.message || 'Test email failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
