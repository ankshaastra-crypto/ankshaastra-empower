import { Buffer } from 'node:buffer';

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function buildHeaders(req) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers || {})) {
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, String(item));
    } else if (value != null) {
      headers.set(key, String(value));
    }
  }
  return headers;
}

function getBaseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host || 'localhost';
  return `${proto}://${host}`;
}

function sendFetchResponseToVercel(fetchResponse, res) {
  res.status(fetchResponse.status);
  fetchResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      const prev = res.getHeader('set-cookie');
      if (!prev) {
        res.setHeader('set-cookie', [value]);
      } else if (Array.isArray(prev)) {
        res.setHeader('set-cookie', [...prev, value]);
      } else {
        res.setHeader('set-cookie', [String(prev), value]);
      }
      return;
    }
    res.setHeader(key, value);
  });

  return fetchResponse.arrayBuffer().then((body) => {
    res.send(Buffer.from(body));
  });
}

const handlers = {
  'initiate-payment': () => import('../functions/api/initiate-payment.js'),
  'payment-status': () => import('../functions/api/payment-status.js'),
  'payment-webhook': () => import('../functions/api/payment-webhook.js'),
  'verify-payment': () => import('../functions/api/verify-payment.js'),
  'health': () => import('../functions/api/health.js'),
  'send-email': () => import('../functions/api/send-email.js'),
  'encryption': () => import('../functions/api/encryption.js'),
  'whatsapp-webhook': () => import('../functions/api/whatsapp-webhook.js'),
  'admin/init-db': () => import('../functions/api/admin/init-db.js'),
  'admin/order': () => import('../functions/api/admin/order.js'),
  'admin/test-email': () => import('../functions/api/admin/test-email.js'),
  'admin/verify-order': () => import('../functions/api/admin/verify-order.js'),
};

export default async function handler(req, res) {
  try {
    const routeParts = req.query?.route;
    const routePath = Array.isArray(routeParts) ? routeParts.join('/') : String(routeParts || '');
    const loader = handlers[routePath];

    if (!loader) {
      res.status(404).json({ success: false, error: 'API route not found' });
      return;
    }

    const { onRequest } = await loader();
    if (typeof onRequest !== 'function') {
      res.status(500).json({ success: false, error: 'Invalid route handler export' });
      return;
    }

    const rawBody = ['GET', 'HEAD'].includes(req.method) ? null : await readRawBody(req);
    const url = new URL(req.url || '/', getBaseUrl(req));
    const request = new Request(url.toString(), {
      method: req.method,
      headers: buildHeaders(req),
      body: rawBody && rawBody.length > 0 ? rawBody : undefined,
    });

    const response = await onRequest({
      request,
      env: process.env,
      params: {},
      waitUntil: () => {},
      next: async () => new Response('Not found', { status: 404 }),
      data: {},
    });

    await sendFetchResponseToVercel(response, res);
  } catch (error) {
    console.error('Vercel adapter error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error',
    });
  }
}
