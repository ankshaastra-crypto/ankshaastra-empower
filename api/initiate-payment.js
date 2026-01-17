// Use 'import' instead of 'require'
import crypto from 'crypto';
import { encryptCustomerData } from './encryption.js';

export default async function handler(req, res) {
  // Only allow POST requests.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { amount, mobile, orderId, email, name, dob, packageType, person1Name, person1Dob, person2Name, person2Dob, person3Name, person3Dob } = req.body;

    // Validate amount
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid amount",
        message: "Amount must be a positive number"
      });
    }

    // Validate orderId format (alphanumeric, dashes, underscores only)
    if (!orderId || !/^[a-zA-Z0-9_-]+$/.test(orderId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid order ID",
        message: "Order ID must contain only alphanumeric characters, dashes, and underscores"
      });
    }

    // Validate required fields
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
        message: "Customer email address is mandatory for payment processing"
      });
    }
    
    if (!mobile || !mobile.trim()) {
      return res.status(400).json({
        success: false,
        error: "Mobile number is required",
        message: "Customer mobile number is mandatory for payment processing"
      });
    }
    
    if (!name || !name.trim() || !person1Name || !person1Name.trim()) {
      return res.status(400).json({
        success: false,
        error: "Customer name is required",
        message: "Customer name is mandatory for payment processing"
      });
    }
    
    if (!dob || !dob.trim() || !person1Dob || !person1Dob.trim()) {
      return res.status(400).json({
        success: false,
        error: "Date of birth is required",
        message: "Customer date of birth is mandatory for payment processing"
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
        message: "Please provide a valid email address"
      });
    }

    // Validate mobile format (10 digits)
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(mobile.trim())) {
      return res.status(400).json({
        success: false,
        error: "Invalid mobile number",
        message: "Mobile number must be exactly 10 digits"
      });
    }

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

    // Prepare customer data object for encryption (all fields are validated above)
    const customerData = {
      email: email.trim(),
      name: name.trim(),
      mobile: mobile.trim(),
      dob: dob.trim(),
      packageType: (packageType && packageType.trim()) || 'single',
      person1Name: (person1Name && person1Name.trim()) || name.trim(),
      person1Dob: (person1Dob && person1Dob.trim()) || dob.trim(),
      person2Name: (person2Name && person2Name.trim()) || '',
      person2Dob: (person2Dob && person2Dob.trim()) || '',
      person3Name: (person3Name && person3Name.trim()) || '',
      person3Dob: (person3Dob && person3Dob.trim()) || '',
    };

    // Encrypt customer data for secure transmission in URL
    let encryptedData = '';
    try {
      encryptedData = encryptCustomerData(customerData);
      
      // Validate encryption succeeded
      if (!encryptedData || encryptedData.trim() === '') {
        return res.status(500).json({
          success: false,
          error: "Encryption failed",
          message: "Failed to encrypt customer data. Please check ENCRYPTION_KEY environment variable is set in Vercel."
        });
      }
    } catch (encryptionError) {
      return res.status(500).json({
        success: false,
        error: "Encryption error",
        message: encryptionError.message || "Failed to encrypt customer data. Please check ENCRYPTION_KEY environment variable."
      });
    }

    // Build redirect URL with encrypted customer data
    // We include orderId unencrypted because we need it to check payment status
    // Note: PhonePe may strip or modify query parameters, so we rely on webhook as backup
    const redirectParams = new URLSearchParams();
    redirectParams.append('orderId', orderId); // Include orderId so we can check payment status
    if (encryptedData) {
      // URLSearchParams automatically encodes the value, but ensure it's properly encoded
      redirectParams.append('data', encryptedData); // Encrypted customer data
    }
    
    // Ensure the redirect URL is properly formatted
    // Validate host header to prevent host header injection
    const host = req.headers.host || req.headers['x-forwarded-host'] || '';
    if (!host || !/^[a-zA-Z0-9.-]+(:[0-9]+)?$/.test(host)) {
      return res.status(400).json({
        success: false,
        error: "Invalid host header",
        message: "Invalid request"
      });
    }
    const redirectUrl = `https://${host}/payment-status${redirectParams.toString() ? '?' + redirectParams.toString() : ''}`;

    // 1. Build the Payment Payload (PhonePe standard fields only)
    // Note: PhonePe doesn't accept metadata/metaInfo in payment payload
    // Customer data is passed via redirect URL query parameters instead
    const payload = {
      merchantId,
      merchantTransactionId: orderId,
      merchantUserId: "U" + mobile,
      amount: amount * 100, // Amount in Paise
      redirectUrl: redirectUrl,
      redirectMode: "REDIRECT",
      paymentInstrument: { type: "PAY_PAGE" },
    };

    // 2. Create the Checksum (Digital Signature)
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const stringToHash = base64Payload + "/pg/v1/pay" + saltKey;
    const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
    const checksum = sha256 + "###" + saltIndex;

    // 3. Call PhonePe API
    const response = await fetch("https://api.phonepe.com/apis/hermes/pg/v1/pay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
      body: JSON.stringify({ request: base64Payload }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("PhonePe API Error:", response.status, response.statusText);
      return res.status(500).json({
        success: false,
        error: "Payment initiation failed",
        message: "Unable to initiate payment. Please try again later."
      });
    }

    const result = await response.json();
    
    // Send the response back to your React app
    return res.status(200).json(result);

  } catch (error) {
    console.error("API Error");
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
