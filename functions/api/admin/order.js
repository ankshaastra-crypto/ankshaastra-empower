// functions/api/admin/order.js — Cloudflare-native admin order queries
// Uses D1 for order data retrieval

import { setEnv } from '../_utils/db-unified.js';
import { getD1, d1GetOrders } from '../_utils/d1-db.js';

export async function onRequest(context) {
  const { request, env } = context;

  // Inject env
  if (env && typeof env === 'object') {
    for (const [k, v] of Object.entries(env)) {
      if (typeof v === 'string') process.env[k] = v;
    }
  }
  setEnv(env);

  const d1 = getD1(env);

  // GET /api/admin/order — list all orders
  if (request.method === 'GET') {
    try {
      if (d1) {
        const orders = await d1GetOrders(d1);
        return new Response(JSON.stringify({ success: true, orders }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Fallback to pg
      try {
        const { getOrders } = await import('../_utils/db.js');
        const orders = await getOrders();
        return new Response(JSON.stringify({ success: true, orders }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (pgErr) {
        return new Response(JSON.stringify({
          success: false,
          error: pgErr.message,
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
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
