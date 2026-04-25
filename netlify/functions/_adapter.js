// Adapter: turns a Vercel-style (req, res) handler into a Netlify Function.
// Lets us reuse all existing api/*.js handlers without rewriting them.

function buildReq(event) {
  let body = event.body;
  if (body && event.isBase64Encoded) {
    body = Buffer.from(body, 'base64').toString('utf8');
  }
  // Try to parse JSON bodies
  const contentType = (event.headers?.['content-type'] || event.headers?.['Content-Type'] || '').toLowerCase();
  let parsedBody = body;
  if (body && contentType.includes('application/json')) {
    try { parsedBody = JSON.parse(body); } catch { /* keep raw */ }
  }

  return {
    method: event.httpMethod,
    headers: event.headers || {},
    query: event.queryStringParameters || {},
    body: parsedBody,
    rawBody: body,
    url: event.rawUrl || event.path,
  };
}

function buildRes() {
  const state = {
    statusCode: 200,
    headers: {},
    body: '',
    ended: false,
    headersSent: false,
  };

  const res = {
    get headersSent() { return state.headersSent; },
    status(code) { state.statusCode = code; return res; },
    setHeader(key, value) { state.headers[key] = value; return res; },
    getHeader(key) { return state.headers[key]; },
    removeHeader(key) { delete state.headers[key]; return res; },
    json(payload) {
      state.headers['Content-Type'] = state.headers['Content-Type'] || 'application/json';
      state.body = JSON.stringify(payload);
      state.ended = true;
      state.headersSent = true;
      return res;
    },
    send(payload) {
      if (typeof payload === 'object' && payload !== null && !Buffer.isBuffer(payload)) {
        return res.json(payload);
      }
      state.body = payload == null ? '' : String(payload);
      state.ended = true;
      state.headersSent = true;
      return res;
    },
    end(payload) {
      if (payload != null) state.body = typeof payload === 'string' ? payload : String(payload);
      state.ended = true;
      state.headersSent = true;
      return res;
    },
    redirect(codeOrUrl, maybeUrl) {
      const code = typeof codeOrUrl === 'number' ? codeOrUrl : 302;
      const url = typeof codeOrUrl === 'number' ? maybeUrl : codeOrUrl;
      state.statusCode = code;
      state.headers['Location'] = url;
      state.ended = true;
      state.headersSent = true;
      return res;
    },
  };

  return { res, state };
}

export function toNetlify(handler) {
  return async (event) => {
    const req = buildReq(event);
    const { res, state } = buildRes();

    try {
      await handler(req, res);
    } catch (err) {
      console.error('Handler error:', err);
      if (!state.ended) {
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: false, error: 'Internal Server Error', message: err?.message }),
        };
      }
    }

    return {
      statusCode: state.statusCode,
      headers: state.headers,
      body: state.body,
    };
  };
}
