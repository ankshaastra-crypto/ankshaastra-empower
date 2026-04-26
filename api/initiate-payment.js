// api/initiate-payment.js — Defensive version with lazy imports and step-by-step diagnostics
import crypto from 'crypto';

// Lazy-load all utilities so import failures are caught and reported
async function loadUtils() {
  const results = {};
  const errors = {};

  try {
    const mod = await import('./_utils/suppress-deprecation.js');
    results.suppressDeprecation = true;
  } catch (e) {
    errors.suppressDeprecation = e.message;
  }

  try {
    const { encryptCustomerData } = await import('./_utils/encryption.js');
    results.encryptCustomerData = encryptCustomerData;
  } catch (e) {
    errors.encryption = e.message;
  }

  try {
    const { rateLimiter } = await import('./_utils/rate-limiter.js');
    results.rateLimiter = rateLimiter;
  } catch (e) {
    errors.rateLimiter = e.message;
  }

  try {
    const { saveOrderAndCustomer } = await import('./_utils/db.js');
    results.saveOrderAndCustomer = saveOrderAndCustomer;
  } catch (e) {
    errors.db = e.message;
  }

  try {
    const { getRedisCache } = await import('./_utils/redis-cache.js');
    results.getRedisCache = getRedisCache;
  } catch (e) {
    errors.redis = e.message;
  }

  return { results, errors };
}

export default async function handler(req, res) {
  // ─── Step 0: Load utilities lazily ─────────────────────────────────────────
  const { results: utils, errors: loadErrors } = await loadUtils();

  if (Object.keys(loadErrors).length > 0) {
    console.error('Module load errors:', loadErrors);
    // Still try to continue if non-critical modules failed
  }

  // ─── Step 1: Rate limiting ─────────────────────────────────────────────────
  if (utils.rateLimiter) {
    try {
      await utils.rateLimiter(req, res, () => {});
      if (res.headersSent) return;
    } catch (rlErr) {
      console.error('Rate limiter error:', rlErr.message);
      // Continue without rate limiting
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ─── Step 2: Parse and validate body ───────────────────────────────────────
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch {
      return res.status(400).json({ success: false, error: 'Invalid JSON body' });
    }
  }

  const {
    amount, mobile, orderId, email, name, dob, gender, packageType, city,
    person1Name, person1FirstName, person1MiddleName, person1SurName,
    person1Dob, person1Gender, person2Name, person2FirstName,
    person2MiddleName, person2SurName, person2Dob, person2Gender,
    person3Name, person3FirstName, person3MiddleName, person3SurName,
    person3Dob, person3Gender, person1MiddleNameType, person2MiddleNameType,
    person3MiddleNameType, fatherFirstName, fatherMiddleName,
    fatherMiddleNameType, fatherLastName, childDob, timeOfBirth,
    placeOfBirth, pinCode, fatherFullName, childLastName,
    fatherFirstNameAsMiddleName, childMiddleName, nameOptions
  } = body || {};

  // Validation
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid amount' });
  }
  if (!orderId || !/^[a-zA-Z0-9_-]+$/.test(orderId)) {
    return res.status(400).json({ success: false, error: 'Invalid order ID' });
  }
  if (!email?.trim()) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }
  if (!mobile?.trim()) {
    return res.status(400).json({ success: false, error: 'Mobile is required' });
  }
  if (!name?.trim()) {
    return res.status(400).json({ success: false, error: 'Name is required' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ success: false, error: 'Invalid email' });
  }
  const mobileRegex = /^\d{10}$/;
  if (!mobileRegex.test(mobile.trim())) {
    return res.status(400).json({ success: false, error: 'Invalid mobile' });
  }

  // ─── Step 3: Check Razorpay env vars ───────────────────────────────────────
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!razorpayKeyId || !razorpayKeySecret) {
    return res.status(500).json({
      success: false,
      error: 'Payment configuration error',
      message: 'RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set.',
      diagnostics: { loadErrors }
    });
  }

  // ─── Step 4: Prepare customer data ─────────────────────────────────────────
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

  // ─── Step 5: Save to DB (non-blocking) ─────────────────────────────────────
  if (utils.saveOrderAndCustomer) {
    try {
      await utils.saveOrderAndCustomer(orderId, amount, packageType || 'single', customerData);
    } catch (dbError) {
      console.error('DB save error:', dbError?.message || dbError);
    }
  }

  // ─── Step 6: Redis cache (non-blocking) ────────────────────────────────────
  if (utils.getRedisCache) {
    try {
      const cache = utils.getRedisCache();
      await cache.set(`order:${orderId}`, customerData, 3600);
    } catch (redisError) {
      console.error('Redis cache error:', redisError?.message || redisError);
    }
  }

  // ─── Step 7: Encrypt customer data ─────────────────────────────────────────
  let encryptedData = '';
  if (utils.encryptCustomerData) {
    try {
      encryptedData = utils.encryptCustomerData(customerData);
    } catch (encError) {
      console.error('Encryption error:', encError?.message || encError);
    }
  }
  if (!encryptedData?.trim()) {
    return res.status(500).json({
      success: false,
      error: 'Encryption failed',
      diagnostics: { loadErrors, encryptionAvailable: !!utils.encryptCustomerData }
    });
  }

  // ─── Step 8: Create Razorpay order ─────────────────────────────────────────
  try {
    const amountValue = typeof amount === 'string' ? Number(amount) : amount;
    const payload = {
      amount: Math.round(amountValue * 100),
      currency: 'INR',
      receipt: orderId,
      payment_capture: 1
    };

    const auth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(payload)
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Razorpay API Error:', errorText);
      return res.status(500).json({
        success: false,
        error: 'Payment initiation failed',
        razorpayError: errorText
      });
    }

    const result = await response.json();
    return res.status(200).json({
      success: true,
      orderId,
      razorpayOrderId: result.id,
      encryptedData,
      data: result
    });

  } catch (rzpError) {
    console.error('Razorpay fetch error:', rzpError?.message || rzpError);
    return res.status(500).json({
      success: false,
      error: 'Payment gateway error',
      message: rzpError?.message,
      diagnostics: { loadErrors }
    });
  }
}

