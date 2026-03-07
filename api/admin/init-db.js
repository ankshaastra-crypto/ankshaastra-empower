// Suppress DEP0169 deprecation warning from dependencies
import '../suppress-deprecation.js';

import { getPool, ensureSchemaOnce } from '../db.js';

/**
 * Manual trigger for schema creation (optional - tables auto-create on first DB use).
 * Call: GET /api/admin/init-db?secret=YOUR_INIT_DB_SECRET
 * Set INIT_DB_SECRET in Vercel env vars.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const secret = process.env.INIT_DB_SECRET;
  const providedSecret = req.query.secret;

  if (secret && providedSecret && secret === providedSecret) {
    const p = getPool();
    if (!p) {
      return res.status(500).json({
        error: 'Database not configured',
        message: 'Set DATABASE_URL in environment variables.',
      });
    }
    await ensureSchemaOnce(true);
    return res.status(200).json({
      success: true,
      message: 'Tables verified/created (orders, customer_details, payment).',
    });
  }

  return res.status(403).json({ error: 'Forbidden' });
}
