// Fixed version with static import
import './_utils/suppress-deprecation.js';
import crypto from 'crypto';
import { encryptCustomerData } from './_utils/encryption.js';
import { rateLimiter } from './_utils/rate-limiter.js';
import { saveOrderAndCustomer } from './_utils/db.js'; // Static - fixes bundling

export default async function handler(req, res) {
  await rateLimiter(req, res, () => {});
  if (res.headersSent) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { amount, mobile, orderId, email, name, dob, gender, packageType, city /* all fields */ } = req.body;

    // Validation code unchanged...

    const customerData = {
      email: email.trim(),
      name: name.trim(),
      mobile: mobile.trim(),
      // ... all fields unchanged
    };

    // Static DB save
    try {
      await saveOrderAndCustomer(orderId, amount, packageType || 'single', customerData);
    } catch (dbError) {
      console.error('DB save order error:', dbError);
    }

    // Redis cache (unchanged)
    // Encryption (unchanged)
    // Razorpay order creation (unchanged)

    return res.status(200).json({ 
      success: true,
      orderId,
      razorpayOrderId: result.id,
      encryptedData,
      data: result,
    });

  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
