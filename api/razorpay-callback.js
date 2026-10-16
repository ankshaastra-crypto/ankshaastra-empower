export default async function handler(req, res) {
  // ── Mode 1: status check (frontend polling) — read-only, no side effects ──
  if (req.method === 'GET' && req.query?.check === '1') {
    const rzpOrderId = String(req.query.razorpay_order_id || '');
    if (!/^order_[A-Za-z0-9]+$/.test(rzpOrderId)) {
      return res.status(400).json({ paid: false, error: 'bad order id' });
    }
    try {
      const auth = Buffer.from(
        `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
      ).toString('base64');
      const r = await fetch(`https://api.razorpay.com/v1/orders/${rzpOrderId}`, {
        headers: { Authorization: `Basic ${auth}` },
      });
      if (!r.ok) return res.status(200).json({ paid: false });
      const order = await r.json();
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ paid: order.status === 'paid' });
    } catch {
      return res.status(200).json({ paid: false });
    }
  }

  // ── Mode 2: Razorpay redirect callback → send customer to payment-status ──
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(req.query || {})) {
    if (typeof v === 'string') params.set(k, v);
  }
  const body = (req.body && typeof req.body === 'object') ? req.body : {};
  for (const k of ['razorpay_payment_id', 'razorpay_order_id', 'razorpay_signature']) {
    if (body[k]) params.set(k, body[k]);
  }
  res.writeHead(303, { Location: `/payment-status?${params.toString()}` });
  res.end();
}
