// api/_utils/pricing.js — Server-side price validation

// Default prices (should match VITE_PACKAGE_* in frontend)
const DEFAULT_PRICES = {
  'name-check': 473,
  'perfect-baby-name-report': 3437,
  'complete-baby-name-blueprint': 5957,
};

export function validatePackageAmount(env, packageType, clientAmount) {
  const key = packageType || 'name-check';
  const envKey = `PACKAGE_${key.toUpperCase().replace(/-/g, '_')}_PRICE`;
  
  // Try to get from env first, fall back to defaults
  let expectedAmount = DEFAULT_PRICES[key];
  if (!expectedAmount) {
    return { ok: false, expected: null, received: parseInt(clientAmount, 10) };
  }
  
  if (env && env[envKey]) {
    expectedAmount = parseInt(env[envKey], 10);
  }

  const clientParsed = parseInt(clientAmount, 10);
  
  if (clientParsed !== expectedAmount) {
    return {
      ok: false,
      expected: expectedAmount,
      received: clientParsed,
    };
  }

  return {
    ok: true,
    amount: expectedAmount,
  };
}

export function getPackagePrice(packageType) {
  const key = packageType || 'name-check';
  return DEFAULT_PRICES[key] || null;
}
