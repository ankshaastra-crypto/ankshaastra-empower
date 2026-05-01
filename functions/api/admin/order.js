// functions/api/admin/order.js — Admin order queries (DB-unified)
import { getOrders } from '../_utils/db-unified.js';

export async function onRequest(context) {
  const { request, env } = context;

  // Inject env
  if (env && typeof env === 'object') {
    for (const [k, v] of Object.entries(env)) {
      if (typeof v === 'string') process.env[k] = v;
    }
  }
  // GET /api/admin/order — list all orders
  if (request.method === 'GET') {
    try {
      const orders = await getOrders();
      return new Response(JSON.stringify({ success: true, orders }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('Admin order error:', err.message);
      return new Response(JSON.stringify({ success: false, error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}
