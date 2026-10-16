export default function handler(req, res) {
  const params = new URLSearchParams();

  // callback_url me jo orderId, email, etc. bheje the
  for (const [k, v] of Object.entries(req.query || {})) {
    if (typeof v === 'string') params.set(k, v);
  }

  // Razorpay ka POST data
  const body = (req.body && typeof req.body === 'object') ? req.body : {};
  for (const k of ['razorpay_payment_id', 'razorpay_order_id', 'razorpay_signature']) {
    if (body[k]) params.set(k, body[k]);
  }

  res.writeHead(303, { Location: `/payment-status?${params.toString()}` });
  res.end();
}
