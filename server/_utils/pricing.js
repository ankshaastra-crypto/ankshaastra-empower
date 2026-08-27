// api/_utils/pricing.js — Server-side price validation

// Default prices (should match VITE_PACKAGE_* in frontend)
const DEFAULT_PRICES = {
  single: 3437,
  premium: 5957,
  'namecheck-1': 473,
  'namecheck-2': 837,
  'namecheck-3': 837,
};

export function validatePackageAmount(env, packageType, clientAmount) {
  const key = packageType || 'single';
  const envKey = `PACKAGE_${key.toUpperCase().replace(/-/g, '_')}_PRICE`;
  
  // Try to get from env first, fall back to defaults
  let expectedAmount = DEFAULT_PRICES[key] || DEFAULT_PRICES.single;
  
  if (env && env[envKey]) {
    expectedAmount = parseInt(env[envKey], 10);
  } else if (env && env.PACKAGE_SINGLE_PRICE) {
    expectedAmount = parseInt(env.PACKAGE_SINGLE_PRICE, 10);
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
  const key = packageType || 'single';
  return DEFAULT_PRICES[key] || DEFAULT_PRICES.single;
}
