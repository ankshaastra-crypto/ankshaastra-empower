// functions/_adapter.js
// Converts Vercel-style (req, res) handlers → Cloudflare Pages onRequest format.
// Reuses all existing api/*.js handlers without rewriting them.

function buildReq(cfRequest, params = {}) {
  const url = new URL(cfRequest.url);

  // Parse query string into plain object
  const query = {};
  url.searchParams.forEach((v, k) => { query[k] = v; });

  // Merge URL path params (e.g. from [[path]].js) into query
  Object.assign(query, params);

  // Parse headers
  const headers = {};
  cfRequest.headers.forEach((v, k) => { headers[k] = v; });

  return {
    method: cfRequest.method,
    url: cfRequest.url,
    headers,
    query,
    // body is populated async below
    body: null,
    rawBody: null,
    _cfRequest: cfRequest,
  };
}

async function parseBody(req) {
  const ct = (req.headers['content-type'] || '').toLowerCase();
  try {
    const raw = await req._cfRequest.text();
    req.rawBody = raw;
    if (raw && ct.includes('application/json')) {
      try { req.body = JSON.parse(raw); } catch { req.body = raw; }
    } else {
      req.body = raw;
    }
  } catch {
    req.body = null;
    req.rawBody = null;
  }
}

function buildRes() {
  const state = {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: '',
    ended: false,
    headersSent: false,
  };

  const res = {
    get headersSent() { return state.headersSent; },
    status(code) { state.statusCode = code; return res; },
    setHeader(k, v) { state.headers[k] = v; return res; },
    getHeader(k) { return state.headers[k]; },
    removeHeader(k) { delete state.headers[k]; return res; },
    json(payload) {
      state.headers['Content-Type'] = 'application/json';
      state.body = JSON.stringify(payload);
      state.ended = true;
      state.headersSent = true;
      return res;
    },
    send(payload) {
      if (payload && typeof payload === 'object' && !Buffer.isBuffer(payload)) {
        return res.json(payload);
      }
      state.body = payload == null ? '' : String(payload);
      state.ended = true;
      state.headersSent = true;
      return res;
    },
    end(payload) {
      if (payload != null) state.body = String(payload);
      state.ended = true;
      state.headersSent = true;
      return res;
    },
    redirect(codeOrUrl, maybeUrl) {
      const code = typeof codeOrUrl === 'number' ? codeOrUrl : 302;
      const url  = typeof codeOrUrl === 'number' ? maybeUrl : codeOrUrl;
      state.statusCode = code;
      state.headers['Location'] = url;
      state.ended = true;
      state.headersSent = true;
      return res;
    },
  };

  return { res, state };
}

// Wraps a Vercel handler → Cloudflare onRequest
export function toCF(handler) {
  return async (context) => {
    const { request, env, params } = context;

    // Inject env vars into process.env so existing code works unchanged
    if (env && typeof env === 'object') {
      for (const [k, v] of Object.entries(env)) {
        if (typeof v === 'string') process.env[k] = v;
      }
    }

    // Inject D1 env into unified DB layer
    try {
      const { setEnv } = await import('./api/_utils/db-unified.js');
      setEnv(env);
    } catch (e) {
      // db-unified not available (should not happen)
    }

    const req = buildReq(request, params);
    await parseBody(req);

    const { res, state } = buildRes();

    try {
      await handler(req, res);
    } catch (err) {
      console.error('Handler error:', err);
      if (!state.ended) {
        return new Response(
          JSON.stringify({ success: false, error: 'Internal Server Error', message: err?.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(state.body, {
      status: state.statusCode,
      headers: state.headers,
    });
  };
}
