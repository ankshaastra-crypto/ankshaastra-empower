// api/whatsapp-webhook.js
// WhatsApp Business Cloud API webhook
// - GET  → verify webhook with Facebook challenge
// - POST → receive incoming messages from customers

import '../_utils/suppress-deprecation.js';
import { rateLimiter } from '../_utils/rate-limiter.js';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'ankshaastra_webhook_verify';
const WA_TOKEN    = process.env.WHATSAPP_TOKEN;
const PHONE_ID    = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ADMIN_NUM   = process.env.WHATSAPP_ADMIN_NUMBER; // e.g. 919667305577

export default async function handler(req, res) {
  // ── GET: Facebook webhook verification ───────────────────────────────────
  if (req.method === 'GET') {
    const mode      = req.query['hub.mode'];
    const token     = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ WhatsApp webhook verified');
      return res.status(200).send(challenge);
    }
    return res.status(403).json({ error: 'Forbidden — verify token mismatch' });
  }

  // ── POST: Incoming messages ───────────────────────────────────────────────
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  await rateLimiter(req, res, () => {});
  if (res.headersSent) return;

  try {
    const body = req.body;

    // Always respond 200 immediately so Meta doesn't retry
    res.status(200).json({ status: 'ok' });

    // Validate basic structure
    if (body.object !== 'whatsapp_business_account') return;

    const entry   = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value   = changes?.value;

    if (!value?.messages?.length) return; // status updates, not messages

    const message = value.messages[0];
    const from    = message.from; // sender's WhatsApp number (e.g. 919876543210)
    const contact = value.contacts?.[0];
    const senderName = contact?.profile?.name || 'Customer';

    console.log(`📱 Incoming WhatsApp from ${from} (${senderName}):`, message.type);

    // Handle text messages
    if (message.type === 'text') {
      const text = message.text?.body?.trim() || '';
      await handleIncomingText({ from, senderName, text });
    }

    // Forward all messages to admin for visibility
    if (ADMIN_NUM && from !== ADMIN_NUM.replace(/\D/g, '')) {
      const adminAlert = `📱 *New WhatsApp Message*\n\n👤 *From:* ${senderName} (+${from})\n💬 *Message:* ${message.text?.body || `[${message.type}]`}\n🕐 *Time:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;
      await sendWhatsApp(ADMIN_NUM, adminAlert).catch(() => {});
    }
  } catch (err) {
    console.error('WhatsApp webhook error:', err.message);
    // Response already sent — just log
  }
}

// ─── Handle incoming text messages ───────────────────────────────────────────

async function handleIncomingText({ from, senderName, text }) {
  const lower = text.toLowerCase();

  // Auto-reply for common queries
  if (lower.includes('report') || lower.includes('status') || lower.includes('order')) {
    await sendWhatsApp(
      from,
      `🙏 *Namaste ${senderName}!*\n\nThank you for reaching out to *Ankshaastra*.\n\nFor your numerology report status, please share your *Order ID* or the *email* you used while ordering.\n\nOur team will get back to you shortly. 🌟\n\n📞 You can also call us at: *+91-9667305577*\n\n_Ankshaastra — Empower Your Name_`
    );
    return;
  }

  if (lower.includes('price') || lower.includes('cost') || lower.includes('rate')) {
    await sendWhatsApp(
      from,
      `🌟 *Ankshaastra Pricing*\n\n📦 *Baby Name Report* — ₹999\n📦 *Single Name Report* — ₹499\n📦 *Name Check (1 Person)* — ₹299\n📦 *Name Check (2 Persons)* — ₹499\n📦 *Name Check (3 Persons)* — ₹699\n\nAll prices include GST.\n\n🔗 Order now: https://ankshaastra.com\n📞 Call: *+91-9667305577*`
    );
    return;
  }

  if (lower.includes('refund') || lower.includes('cancel')) {
    await sendWhatsApp(
      from,
      `ℹ️ *Refund Policy*\n\nDue to the nature of personalized numerology reports, orders are non-refundable once confirmed.\n\nIf you have a concern, please email us at *perfectbabyname@ankshaastra.in* or call *+91-9667305577* and we'll be happy to help.\n\n_Ankshaastra — Empower Your Name_`
    );
    return;
  }

  // Default auto-reply
  await sendWhatsApp(
    from,
    `🙏 *Namaste ${senderName}!*\n\nThank you for contacting *Ankshaastra*!\n\nOur team has received your message and will respond shortly.\n\n📞 For urgent queries: *+91-9667305577*\n📧 Email: *perfectbabyname@ankshaastra.in*\n\n_Ankshaastra — Empower Your Name_`
  );
}

// ─── Send WhatsApp text message ───────────────────────────────────────────────

async function sendWhatsApp(to, text) {
  if (!WA_TOKEN || !PHONE_ID) {
    console.warn('WhatsApp credentials not configured');
    return;
  }

  const normalized = to.toString().replace(/\D/g, '');
  const response = await fetch(
    `https://graph.facebook.com/v19.0/${PHONE_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WA_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: normalized,
        type: 'text',
        text: { body: text },
      }),
    }
  );

  const result = await response.json();
  if (!response.ok) {
    throw new Error(`WhatsApp API error (${response.status}): ${JSON.stringify(result)}`);
  }
  return result;
}
