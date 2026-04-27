// api/_utils/send-whatsapp.js
// Shared WhatsApp notification sender for both payment-webhook and payment-status
// Sends to customer and admin with order details, invoice info, and GST breakdown

/**
 * Send WhatsApp notifications to customer and admin with order details
 * @param {object} params - Notification parameters
 * @returns {Promise<object>} - Result object with customer and admin status
 */
export async function sendWhatsAppNotification({
  customerName,
  customerMobile,
  orderId,
  packageType,
  amount, // in paise
  transactionId,
  status,
  // Optional: GST invoice details
  subtotal,
  cgstAmount,
  sgstAmount,
  igstAmount,
  invoiceNumber,
  totalWithGst,
  pinCode,
}) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const adminNum = process.env.WHATSAPP_ADMIN_NUMBER; // e.g. 919667305577

  if (!token || !phoneId) {
    console.log('⚠️  WhatsApp env not configured — skipping notification');
    return { success: false, error: 'WhatsApp not configured' };
  }

  const amountInRupees = amount && amount > 0 ? (amount / 100).toLocaleString('en-IN') : '0';
  const totalAmount = totalWithGst && totalWithGst > 0 ? totalWithGst.toLocaleString('en-IN') : amountInRupees;
  
  const packageNames = {
    single: 'Perfect Baby Name Report',
    premium: 'Premium Report + Live Session',
    consultation: 'Live Consultation',
    namecheck: 'Name Check Report',
    'namecheck-1': 'Name Check (1 Person)',
    'namecheck-2': 'Name Check (2 Persons)',
    'namecheck-3': 'Name Check (3 Persons)',
    baby_name: 'Baby Name Numerology Report',
  };
  const packageName = packageNames[packageType] || packageType || 'Numerology Report';

  const emoji = status === 'SUCCESS' ? '✅' : '❌';
  const title = status === 'SUCCESS' ? 'Payment Received' : 'Payment Failed';

  // ── Build invoice/GST details if provided ────────────────────────────────
  let invoiceDetails = '';
  if (status === 'SUCCESS' && subtotal) {
    const subtotalStr = (subtotal || 0).toLocaleString('en-IN');
    const cgstStr = (cgstAmount || 0).toLocaleString('en-IN');
    const sgstStr = (sgstAmount || 0).toLocaleString('en-IN');
    const igstStr = (igstAmount || 0).toLocaleString('en-IN');
    const totalStr = (totalAmount || amountInRupees).toLocaleString('en-IN');
    
    const isIntraState = pinCode && parseInt(pinCode, 10) >= 200000 && parseInt(pinCode, 10) <= 289999;
    
    invoiceDetails = 
      `\n\n📋 *Invoice Details:*` +
      (invoiceNumber ? `\n🧾 *Invoice #:* ${invoiceNumber}` : '') +
      `\n💵 *Subtotal:* ₹${subtotalStr}`;
    
    if (isIntraState && (cgstAmount || sgstAmount)) {
      invoiceDetails += 
        `\n🏛️ *CGST (9%):* ₹${cgstStr}` +
        `\n🏛️ *SGST (9%):* ₹${sgstStr}`;
    } else if (igstAmount) {
      invoiceDetails += `\n🏛️ *IGST (18%):* ₹${igstStr}`;
    }
    
    invoiceDetails += `\n💰 *Total (incl. GST):* ₹${totalStr}`;
  }

  // ── Customer message ─────────────────────────────────────────────────────
  const customerMsg = status === 'SUCCESS'
    ? `🙏 *Namaste ${customerName}!*\n\nThank you for ordering from *Ankshaastra*.\n\n📦 *Package:* ${packageName}\n💰 *Amount Paid:* ₹${amountInRupees}\n🔖 *Order ID:* ${orderId}${invoiceDetails}\n\nYour personalized numerology report will be delivered within *24-48 hours* to your registered email/WhatsApp.\n\nFor any queries, call us: *+91-9667305577*\n\n🌟 _Ankshaastra — Empower Your Name_`
    : `Dear ${customerName},\n\nWe could not process your payment for *${packageName}*.\n\n🔖 *Order ID:* ${orderId}\n💰 *Amount:* ₹${amountInRupees}\n\nPlease try again or contact us at *+91-9667305577*.\n\n_Ankshaastra — Empower Your Name_`;

  // ── Admin message ────────────────────────────────────────────────────────
  const adminMsg = `${emoji} *${title}*\n\n👤 *Customer:* ${customerName}\n📱 *Mobile:* ${customerMobile || 'N/A'}\n📦 *Package:* ${packageName}\n💰 *Amount:* ₹${amountInRupees}\n🔖 *Order ID:* ${orderId}\n🧾 *Transaction ID:* ${transactionId || 'N/A'}\n📅 *Time:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;

  // ── Send message function ────────────────────────────────────────────────
  const sendMessage = async (to, text) => {
    if (!to) return false;
    try {
      // Normalize number — strip non-digits, ensure 91 prefix
      const normalized = to.replace(/\D/g, '');
      const withPrefix = normalized.length === 10 ? `91${normalized}` : normalized;
      
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${phoneId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: withPrefix,
            type: 'text',
            text: { body: text },
          }),
        }
      );
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${JSON.stringify(result)}`);
      }
      return true;
    } catch (error) {
      console.error(`❌ WhatsApp send failed for ${to}:`, error.message);
      return false;
    }
  };

  // ── Send to customer and admin ───────────────────────────────────────────
  let customerSuccess = false;
  let adminSuccess = false;

  if (customerMobile) {
    customerSuccess = await sendMessage(customerMobile, customerMsg);
    if (customerSuccess) {
      console.log(`✅ WhatsApp sent to customer: ${customerMobile}`);
    }
  }

  if (adminNum) {
    adminSuccess = await sendMessage(adminNum, adminMsg);
    if (adminSuccess) {
      console.log(`✅ WhatsApp sent to admin: ${adminNum}`);
    }
  }

  return {
    success: customerSuccess || adminSuccess,
    customerSent: customerSuccess,
    adminSent: adminSuccess,
  };
}
