// Suppress DEP0169 deprecation warning from dependencies
import '../_utils/suppress-deprecation.js';

import { getPool, ensureSchemaOnce } from '../_utils/db.js';

/** Success text returned by HTTP API and echoed by CLI */
export const INIT_DB_MESSAGE =
  'Schema ankshaastra verified/created (orders, customer_details, payment, emailDelivery).';

/**
 * Create / verify DB schema (idempotent). Shared by:
 * - GET /api/admin/init-db?secret=...
 * - `npm run db:setup` (CLI passes closePool: true)
 *
 * @param {{ closePool?: boolean }} options - use closePool: true only in CLI so the process can exit
 * @returns {Promise<{ ok: true } | { ok: false, error: string, message: string }>}
 */
export async function initDatabaseSchema(options = {}) {
  const { closePool = false } = options;
  const pool = getPool();
  if (!pool) {
    return {
      ok: false,
      error: 'no_database',
      message: 'Set DATABASE_URL in environment variables.',
    };
  }
  await ensureSchemaOnce(true);
  if (closePool) await pool.end();
  return { ok: true };
}

/**
 * Vercel serverless: GET /api/admin/init-db?secret=YOUR_INIT_DB_SECRET
 * Set INIT_DB_SECRET in environment variables.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const secret = process.env.INIT_DB_SECRET;
  const providedSecret = req.query.secret;

  if (!secret || !providedSecret || secret !== providedSecret) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const result = await initDatabaseSchema({ closePool: false });
  if (!result.ok) {
    return res.status(500).json({
      error: 'Database not configured',
      message: result.message,
    });
  }

  return res.status(200).json({
    success: true,
    message: INIT_DB_MESSAGE,
  });
}
