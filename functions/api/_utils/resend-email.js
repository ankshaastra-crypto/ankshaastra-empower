// functions/api/_utils/resend-email.js — Resend API for Cloudflare Workers
// Free email API (3000 emails/month) - Works via HTTP unlike nodemailer

import { d1IsEmailSent, d1RecordEmailDelivery } from './d1-db.js';

/**
 * Send email using Resend API (works on Cloudflare Workers via HTTP)
 * 
 * Required env: RESEND_API_KEY
 * 
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML body
 * @param {string} options.from - Sender email (optional, uses default)
 * @returns {Object} - { success: boolean, error?: string, messageId?: string }
 */
export async function sendResendEmail({ to, subject, html, from }) {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }
  
  if (!to || !subject || !html) {
    return { success: false, error: 'Missing required parameters: to, subject, html' };
  }
  
  const senderEmail = from || process.env.FROM_EMAIL || 'Ankshaastra <noreply@ankshaastra.com>';
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: senderEmail,
        to: [to],
        subject: subject,
        html: html,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Resend API error:', data);
      return { success: false, error: data.message || 'Resend API failed' };
    }
    
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Resend request error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Check if email already sent for deduplication
 */
export async function checkEmailSent(email, orderId) {
  try {
    return d1IsEmailSent(null, email, orderId);
  } catch {
    return false;
  }
}

/**
 * Record email delivery status
 */
export async function recordDelivery(email, orderId, status = 'sent') {
  try {
    return d1RecordEmailDelivery(null, email, orderId, status);
  } catch {
    return false;
  }
}
