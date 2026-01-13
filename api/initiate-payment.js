// Use 'import' instead of 'require'
import crypto from 'crypto';

export default async function handler(req, res) {
  // Only allow POST requests.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { amount, mobile, orderId } = req.body;

    // Get your keys from Vercel Environment Variables
    const merchantId = process.env.PHONEPE_MERCHANT_ID;
    const saltKey = process.env.PHONEPE_SALT_KEY;
    const saltIndex = process.env.PHONEPE_SALT_INDEX;

    // Validate environment variables
    if (!merchantId || !saltKey || !saltIndex) {
      console.error("Missing PhonePe credentials:", {
        hasMerchantId: !!merchantId,
        hasSaltKey: !!saltKey,
        hasSaltIndex: !!saltIndex
      });
      return res.status(500).json({ 
        success: false,
        error: "Payment configuration error. Please check PhonePe API keys in environment variables.",
        message: "PHONEPE_MERCHANT_ID, PHONEPE_SALT_KEY, and PHONEPE_SALT_INDEX must be set."
      });
    }

    // 1. Build the Payment Payload
    const payload = {
      merchantId,
      merchantTransactionId: orderId,
      merchantUserId: "U" + mobile,
      amount: amount * 100, // Amount in Paise
      redirectUrl: `https://${req.headers.host}/payment-status`,
      redirectMode: "REDIRECT",
      paymentInstrument: { type: "PAY_PAGE" },
    };

    // 2. Create the Checksum (Digital Signature)
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const stringToHash = base64Payload + "/pg/v1/pay" + saltKey;
    const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
    const checksum = sha256 + "###" + saltIndex;

    // 3. Call PhonePe API
   // const response = await fetch("https://api.phonepe.com/apis/hermes/pg/v1/pay", {
    const response = await fetch("https://api.phonepe.com/apis/hermes/pg/v1/pay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
      body: JSON.stringify({ request: base64Payload }),
    });

    const result = await response.json();
    
    // Send the response back to your React app
    return res.status(200).json(result);

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}
