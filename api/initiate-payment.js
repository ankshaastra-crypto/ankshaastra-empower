// Suppress DEP0169 deprecation warning from dependencies
import './suppress-deprecation.js';

// Use 'import' instead of 'require'
import crypto from 'crypto';
import { encryptCustomerData } from './encryption.js';
import { rateLimiter } from './rate-limiter.js';

export default async function handler(req, res) {
  // Apply rate limiting
  await rateLimiter(req, res, () => {});
  if (res.headersSent) return; // Rate limit exceeded
  // Only allow POST requests.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { amount, mobile, orderId, email, name, dob, gender, packageType, city, person1Name, person1FirstName, person1MiddleName, person1SurName, person1Dob, person1Gender, person2Name, person2FirstName, person2MiddleName, person2SurName, person2Dob, person2Gender, person3Name, person3FirstName, person3MiddleName, person3SurName, person3Dob, person3Gender, person1MiddleNameType, person2MiddleNameType, person3MiddleNameType, fatherFirstName, fatherMiddleName, fatherMiddleNameType, fatherLastName, childDob, timeOfBirth, placeOfBirth, pinCode } = req.body;

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
    
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: "Customer name is required",
        message: "Customer name is mandatory for payment processing"
      });
    }

    // For namecheck packages, person1Name and person1Dob are required
    // For baby name report, they are optional (derived from other fields)
    const isNameCheck = packageType === 'namecheck' || (!packageType && person1Name);
    if (isNameCheck) {
      if (!person1Name || !person1Name.trim()) {
        return res.status(400).json({
          success: false,
          error: "Name is required",
          message: "At least one name is required for Name Check"
        });
      }
      if (!person1Dob || !person1Dob.trim()) {
        return res.status(400).json({
          success: false,
          error: "Date of birth is required",
          message: "Date of birth is required for Name Check"
        });
      }
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
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    // Validate environment variables
    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error("Missing Razorpay credentials:", {
        hasKeyId: !!razorpayKeyId,
        hasKeySecret: !!razorpayKeySecret
      });
      return res.status(500).json({ 
        success: false,
        error: "Payment configuration error. Please check Razorpay API keys in environment variables.",
        message: "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set."
      });
    }

    // Prepare customer data object for encryption (all fields are validated above)
    const customerData = {
      email: email.trim(),
      name: name.trim(),
      mobile: mobile.trim(),
      dob: (dob && dob.trim()) || '',
      gender: (gender && gender.trim()) || '',
      city: (city && city.trim()) || '',
      packageType: (packageType && packageType.trim()) || 'single',
      person1Name: (person1Name && person1Name.trim()) || name.trim(),
      person1FirstName: (person1FirstName && person1FirstName.trim()) || '',
      person1MiddleName: (person1MiddleName && person1MiddleName.trim()) || '',
      person1SurName: (person1SurName && person1SurName.trim()) || '',
      person1Dob: (person1Dob && person1Dob.trim()) || (dob && dob.trim()) || '',
      person1Gender: (person1Gender && person1Gender.trim()) || (gender && gender.trim()) || '',
      person1MiddleNameType: (person1MiddleNameType && person1MiddleNameType.trim()) || '',
      person2Name: (person2Name && person2Name.trim()) || '',
      person2FirstName: (person2FirstName && person2FirstName.trim()) || '',
      person2MiddleName: (person2MiddleName && person2MiddleName.trim()) || '',
      person2SurName: (person2SurName && person2SurName.trim()) || '',
      person2Dob: (person2Dob && person2Dob.trim()) || '',
      person2Gender: (person2Gender && person2Gender.trim()) || '',
      person2MiddleNameType: (person2MiddleNameType && person2MiddleNameType.trim()) || '',
      person3Name: (person3Name && person3Name.trim()) || '',
      person3FirstName: (person3FirstName && person3FirstName.trim()) || '',
      person3MiddleName: (person3MiddleName && person3MiddleName.trim()) || '',
      person3SurName: (person3SurName && person3SurName.trim()) || '',
      person3Dob: (person3Dob && person3Dob.trim()) || '',
      person3Gender: (person3Gender && person3Gender.trim()) || '',
      person3MiddleNameType: (person3MiddleNameType && person3MiddleNameType.trim()) || '',
      fatherFirstName: (fatherFirstName && fatherFirstName.trim()) || '',
      fatherMiddleName: (fatherMiddleName && fatherMiddleName.trim()) || '',
      fatherMiddleNameType: (fatherMiddleNameType && fatherMiddleNameType.trim()) || '',
      fatherLastName: (fatherLastName && fatherLastName.trim()) || '',
      childDob: (childDob && childDob.trim()) || '',
      timeOfBirth: (timeOfBirth && timeOfBirth.trim()) || '',
      placeOfBirth: (placeOfBirth && placeOfBirth.trim()) || '',
      pinCode: (pinCode && pinCode.trim()) || '',
    };

    // Store order and customer details in PostgreSQL
    try {
      const { saveOrderAndCustomer } = await import('./db.js');
      await saveOrderAndCustomer(orderId, amount, packageType || 'single', customerData);
    } catch (dbError) {
      console.error('DB save order error:', dbError?.message || dbError);
      // Non-fatal: continue with payment flow
    }

    // Store order data in Redis for webhook (webhook doesn't receive our custom data from PhonePe)
    try {
      const { getRedisCache } = await import('./redis-cache.js');
      const cache = getRedisCache();
      await cache.set(`order:${orderId}`, customerData, 3600); // 1 hour TTL
    } catch {
      // Non-fatal: webhook may fall back to empty metadata
    }

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

    // 1. Build the Payment Payload (Razorpay order creation)
    const payload = {
      amount: amount * 100, // Amount in Paise
      currency: "INR",
      receipt: orderId,
      payment_capture: 1, // Auto capture
    };
    
    // Send the response back to your React app
    return res.status(200).json(result);

  } catch (error) {
    console.error("API Error");
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
