import '../../_utils/suppress-deprecation.js';
import { sendPaymentEmail } from '../../_utils/send-email.js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const configuredSecret = process.env.EMAIL_TEST_SECRET || process.env.INIT_DB_SECRET;
  const providedSecret =
    req.query?.secret ||
    req.headers?.['x-admin-secret'] ||
    req.body?.secret;

  if (configuredSecret && providedSecret !== configuredSecret) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (!configuredSecret) {
    return res.status(400).json({
      success: false,
      error: 'Set EMAIL_TEST_SECRET or INIT_DB_SECRET before using this endpoint.',
    });
  }

  const to =
    req.query?.to ||
    req.body?.to ||
    process.env.ADMIN_EMAIL ||
    process.env.SMTP_USER;

  if (!to) {
    return res.status(400).json({
      success: false,
      error: 'No recipient provided. Pass ?to=email@example.com or set ADMIN_EMAIL.',
    });
  }

  const orderId = `EMAIL_TEST_${Date.now()}`;
  const result = await sendPaymentEmail({
    customerEmail: to,
    customerName: 'Email Test',
    customerMobile: '9999999999',
    customerCity: 'Test City',
    orderId,
    amount: 100,
    packageType: 'consultation',
    status: 'SUCCESS',
    transactionId: 'TEST_TRANSACTION',
  });

  return res.status(result.success ? 200 : 500).json({
    success: result.success,
    orderId,
    recipient: to,
    result,
    smtp: {
      host: !!process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || '587',
      user: !!process.env.SMTP_USER,
      password: !!process.env.SMTP_PASSWORD,
      from: process.env.FROM_EMAIL || null,
      admin: process.env.ADMIN_EMAIL || null,
    },
  });
}
