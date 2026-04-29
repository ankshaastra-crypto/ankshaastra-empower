// functions/api/initiate-payment.js — Cloudflare-native payment initiation
// Stores customer form data in D1, creates Razorpay order

import crypto from 'node:crypto';
// import { setEnv } from './_utils/db-unified.js'; // Handled by adapter
import { getD1, d1SaveOrderAndCustomer } from './_utils/d1-db.js';
import { validatePackageAmount } from './_utils/pricing.js';

export async function onRequest(context) {
  const { request, env } = context;

  // Inject env
  if (env && typeof env === 'object') {
    for (const [k, v] of Object.entries(env)) {
      if (typeof v === 'string') process.env[k] = v;
    }
  }
  setEnv(env);

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();

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
      return new Response(JSON.stringify({ success: false, error: 'Invalid amount' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!orderId || !/^[a-zA-Z0-9_-]+$/.test(orderId)) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid order ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!email?.trim()) {
      return new Response(JSON.stringify({ success: false, error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!mobile?.trim()) {
      return new Response(JSON.stringify({ success: false, error: 'Mobile is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!name?.trim()) {
      return new Response(JSON.stringify({ success: false, error: 'Name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid email' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(mobile.trim())) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid mobile' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ── Server-side price validation ────────────────────────────────────────
    // The amount the client sent MUST match the canonical price for the
    // package, as configured via Cloudflare env vars (PACKAGE_*_PRICE).
    // This prevents tampered clients from paying a lower amount.
    const priceCheck = validatePackageAmount(env, packageType || 'single', amount);
    if (!priceCheck.ok) {
      console.warn(
        `⚠️ Price validation failed for ${packageType}: client=${amount}, expected=${priceCheck.expected}`
      );
      return new Response(JSON.stringify({
        success: false,
        error: 'Price mismatch',
        message: 'The package amount does not match server pricing. Please refresh and try again.',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // Use the server-side authoritative amount from here on
    const verifiedAmount = priceCheck.amount;

    // Check Razorpay env vars
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!razorpayKeyId || !razorpayKeySecret) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Payment configuration error',
        message: 'RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set.',
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Prepare customer data
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

    // ── Save to D1 ──────────────────────────────────────────────────────────
    const d1 = getD1(env);
    if (d1) {
      try {
        await d1SaveOrderAndCustomer(d1, orderId, verifiedAmount, packageType || 'single', customerData);
        console.log(`✅ Order saved to D1: ${orderId} (₹${verifiedAmount})`);
      } catch (dbError) {
        console.error('D1 save error:', dbError?.message);
        // Non-fatal: continue with Razorpay order creation
      }
    } else {
      console.warn('⚠️ No D1 available — order not persisted');
    }

    // ── Create Razorpay order ───────────────────────────────────────────────
    const payload = {
      amount: Math.round(verifiedAmount * 100),
      currency: 'INR',
      receipt: orderId,
      payment_capture: 1
    };

    const auth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

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
      return new Response(JSON.stringify({
        success: false,
        error: 'Payment initiation failed',
        razorpayError: errorText
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await response.json();

    // Update D1 with Razorpay order ID mapping
    if (d1 && result.id) {
      try {
        await d1SaveOrderAndCustomer(d1, orderId, verifiedAmount, packageType || 'single', {
          ...customerData,
          razorpayOrderId: result.id,
        });
        console.log(`✅ Razorpay mapping saved: ${orderId} → ${result.id}`);
      } catch (dbError) {
        console.error('D1 update error:', dbError?.message);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      orderId,
      razorpayOrderId: result.id,
      data: result
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (rzpError) {
    console.error('Razorpay fetch error:', rzpError?.message);
    return new Response(JSON.stringify({
      success: false,
      error: 'Payment gateway error',
      message: rzpError?.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
