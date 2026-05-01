import { getOrderFull } from '../_utils/db-unified.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (env && typeof env === 'object') {
    for (const [k, v] of Object.entries(env)) {
      if (typeof v === 'string') process.env[k] = v;
    }
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ success: false, error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const orderId = url.searchParams.get('orderId');
  if (!orderId) {
    return new Response(JSON.stringify({ success: false, error: 'orderId is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const order = await getOrderFull(orderId);
    return new Response(JSON.stringify({ success: !!order, order }), {
      status: order ? 200 : 404,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error?.message || 'Verify failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
