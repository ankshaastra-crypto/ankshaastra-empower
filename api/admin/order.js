// Suppress DEP0169 deprecation warning from dependencies
import '../suppress-deprecation.js';

import { getOrders } from '../db.js';
import { rateLimiter } from '../rate-limiter.js';

export default async function handler(req, res) {
  await rateLimiter(req, res, () => {});
  if (res.headersSent) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const orders = await getOrders();
    return res.status(200).json({ orders });
  } catch (error) {
    console.error('Admin orders API error:', error.message);
    return res.status(500).json({
      error: 'Failed to fetch orders',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
