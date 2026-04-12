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
    const { amount, mobile, orderId, email, name, dob, gender, packageType, city, person1Name, person1FirstName, person1MiddleName, person1SurName, person1Dob, person1Gender, person2Name, person2FirstName, person2MiddleName, person2SurName, person2Dob, person2Gender, person3Name, person3FirstName, person3MiddleName, person3SurName, person3Dob, person3Gender, person1MiddleNameType, person2MiddleNameType, person3MiddleNameType, fatherFirstName, fatherMiddleName, fatherMiddleNameType, fatherLastName, childDob, timeOfBirth, placeOfBirth, pinCode, fatherFullName, childLastName, fatherFirstNameAsMiddleName, childMiddleName, nameOptions } = req.body;

    // Validation code (unchanged from original)
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid amount",
        message: "Amount must be a positive number"
      });
    }
    if (!orderId || !/^[a-zA-Z0-9_-]+$/.test(orderId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid order ID",
        message: "Order ID must contain only alphanumeric characters, dashes, and underscores"
      });
    }
    if (!email?.trim()) {
      return res.status(400).json({ success: false, error: "Email is required" });
    }
    if (!mobile?.trim()) {
      return res.status(400).json({ success: false, error: "Mobile number is required" });
    }
    if (!name?.trim()) {
      return res.status(400).json({ success: false, error: "Customer name is required" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, error: "Invalid email format" });
    }
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(mobile.trim())) {
      return res.status(400).json({ success: false, error: "Invalid mobile number" });
    }

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!razorpayKeyId || !razorpayKeySecret) {
      return res.status(500).json({ 
        success: false,
        error: "Payment configuration error",
        message: "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set."
      });
    }

    // Prepare customer data (full object from original)
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
      fatherFullName: (fatherFullName && fatherFullName.trim()) || '',
      childLastName: (childLastName && childLastName.trim()) || '',
      fatherFirstNameAsMiddleName: (fatherFirstNameAsMiddleName && fatherFirstNameAsMiddleName.trim()) || '',
      childMiddleName: (childMiddleName && childMiddleName.trim()) || '',
      nameOptions: (nameOptions && nameOptions.trim()) || '',
    };

    // Static DB save ✅
    try {
      await saveOrderAndCustomer(orderId, amount, packageType || 'single', customerData);
    } catch (dbError) {
      console.error('DB save order error:', dbError?.message || dbError);
    }

    // Redis cache for webhook
    try {
      const { getRedisCache } = await import('./_utils/redis-cache.js');
      const cache = getRedisCache();
      await cache.set(`order:${orderId}`, customerData, 3600);
    } catch {}

    // Encrypt customer data
    let encryptedData = '';
    try {
      encryptedData = encryptCustomerData(customerData);
      if (!encryptedData?.trim()) {
        return res.status(500).json({ success: false, error: "Encryption failed" });
      }
    } catch (encryptionError) {
      return res.status(500).json({ success: false, error: "Encryption error", message: encryptionError.message });
    }

    // Razorpay order creation (unchanged)
    const amountValue = typeof amount === 'string' ? Number(amount) : amount;
    const payload = {
      amount: Math.round(amountValue * 100),
      currency: "INR",
      receipt: orderId,
      payment_capture: 1
    };

    const auth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Razorpay API Error:", errorText);
      return res.status(500).json({ success: false, error: "Payment initiation failed" });
    }

    const result = await response.json();
    return res.status(200).json({ 
      success: true,
      orderId,
      razorpayOrderId: result.id,
      encryptedData,
      data: result
    });

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ 
      success: false,
      error: "Internal Server Error",
      message: error.message 
    });
  }
}

