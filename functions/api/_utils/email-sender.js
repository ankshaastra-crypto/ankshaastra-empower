// functions/api/_utils/email-sender.js — Unified email sender
// Uses Resend API on Cloudflare Workers, nodemailer elsewhere

import { isEmailSent, recordEmailDelivery } from './db-unified.js';
import { sendResendEmail } from './resend-email.js';

let nodemailerTransporter = null;

// Get nodemailer transporter (only used when NOT on Cloudflare)
function getNodemailerTransporter() {
  if (nodemailerTransporter) return nodemailerTransporter;
  
  const nodemailer = require('nodemailer');
  
  nodemailerTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
   tls: { rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false' },
    pool: true,
  });
  
  return nodemailerTransporter;
}

/**
 * Check if running on Cloudflare Workers (no TCP/SMTP support)
 */
function isCloudflareWorkers() {
  // Cloudflare Workers don't support net.connect
  return typeof process.env.__CF_WORKERS__ !== 'undefined' || 
    process.env.RESEND_API_KEY && !process.env.SMTP_HOST;
}

/**
 * Unified email sender - auto-selects Resend (CF) or nodemailer (other)
 */
export async function sendUnifiedEmail({ to, subject, html, from, orderId }) {
  const adminEmail = process.env.ADMIN_EMAIL || 'social@ankshaastra.com';
  const senderEmail = from || process.env.FROM_EMAIL || 'Ankshaastra <noreply@ankshaastra.com>';
  
  // Check deduplication
  let alreadySent = false;
  if (orderId) {
    try {
      alreadySent = await isEmailSent(to, orderId);
    } catch {}
  }
  
  if (alreadySent) {
    console.log(`⏭️ Email already sent for order ${orderId} → ${to}`);
    return { success: true, skipped: true };
  }
  
  // Try Resend API first (works on Cloudflare)
  if (process.env.RESEND_API_KEY) {
    console.log(`📧 Using Resend API for ${to}`);
    const result = await sendResendEmail({
      to,
      subject,
      html,
      from: senderEmail,
    });
    
    if (result.success) {
      if (orderId) await recordEmailDelivery(to, orderId, 'sent');
      return { success: true, method: 'resend', messageId: result.messageId };
    }
    
    // Resend failed, try nodemailer as fallback (will fail on CF but may work elsewhere)
    console.warn(`⚠️ Resend failed: ${result.error}, trying nodemailer...`);
  }
  
  // Fallback: nodemailer (won't work on Cloudflare but works on Vercel/Heroku)
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    return { success: false, error: 'No email method configured' };
  }
  
  try {
    const transporter = getNodemailerTransporter();
    await transporter.verify();
    
    const info = await transporter.sendMail({
      from: senderEmail,
      to,
      subject,
      html,
    });
    
    if (info.messageId) {
      if (orderId) await recordEmailDelivery(to, orderId, 'sent');
      return { success: true, method: 'nodemailer', messageId: info.messageId };
    }
  } catch (smtpError) {
    console.error('SMTP error:', smtpError.message);
    return { success: false, error: smtpError.message };
  }
  
  return { success: false, error: 'All email methods failed' };
}
