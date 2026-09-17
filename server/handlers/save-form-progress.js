// server/handlers/save-form-progress.js
//
// Called from OrderFormSection.tsx when the customer clicks "Review Order"
// (Step 1 -> Step 2), BEFORE Razorpay checkout ever opens. Best-effort only:
// a failure here must never block the customer from proceeding to review —
// the real, required save still happens later at final payment (initiate-payment.js).

import '../_utils/suppress-deprecation.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { saveFormProgress } = await import('../_utils/db.js');
    const body = req.body || {};

    if (!body.orderId) {
      return res.status(200).json({ ok: false, skipped: 'no orderId' });
    }

    const ok = await saveFormProgress(body.orderId, body.packageType, body);
    return res.status(200).json({ ok });
  } catch (e) {
    // Never surface this as a hard failure to the browser — it's a
    // best-effort background save, not part of the critical payment path.
    console.error('[save-form-progress] error:', e?.message || e);
    return res.status(200).json({ ok: false, error: e?.message || 'unknown error' });
  }
}
