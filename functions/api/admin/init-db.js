import { ensureSchemaOnce } from '../_utils/db-unified.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (env && typeof env === 'object') {
    for (const [k, v] of Object.entries(env)) {
      if (typeof v === 'string') process.env[k] = v;
    }
  }

  if (request.method !== 'GET' && request.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await ensureSchemaOnce(true);
    return new Response(JSON.stringify({ success: true, message: 'Database schema initialized' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error?.message || 'Init failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
