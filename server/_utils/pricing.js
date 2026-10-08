// // api/_utils/pricing.js — Server-side price validation

// // Default prices (should match VITE_PACKAGE_* in frontend)
// const DEFAULT_PRICES = {
//   'name-check': 473,
//   'perfect-baby-name-report': 3437,
//   'complete-baby-name-blueprint': 5957,
// };

// export function validatePackageAmount(env, packageType, clientAmount) {
//   const key = packageType || 'name-check';
//   const envKey = `PACKAGE_${key.toUpperCase().replace(/-/g, '_')}_PRICE`;
  
//   // Try to get from env first, fall back to defaults
//   let expectedAmount = DEFAULT_PRICES[key];
//   if (!expectedAmount) {
//     return { ok: false, expected: null, received: parseInt(clientAmount, 10) };
//   }
  
//   if (env && env[envKey]) {
//     expectedAmount = parseInt(env[envKey], 10);
//   }

//   const clientParsed = parseInt(clientAmount, 10);
  
//   if (clientParsed !== expectedAmount) {
//     return {
//       ok: false,
//       expected: expectedAmount,
//       received: clientParsed,
//     };
//   }

//   return {
//     ok: true,
//     amount: expectedAmount,
//   };
// }

// export function getPackagePrice(packageType) {
//   const key = packageType || 'name-check';
//   return DEFAULT_PRICES[key] || null;
// }


// api/_utils/pricing.js — Server-side price validation

// Default prices (used only if no env variable is set)
const DEFAULT_PRICES = {
  'name-check': 473,
  'perfect-baby-name-report': 3437,
  'complete-baby-name-blueprint': 5957,
};

// Env variable names checked in order. First one that is set wins.
// Includes the VITE_ names, so the price shown on the website and the
// price the server expects always come from the same variable.
const ENV_KEYS = {
  'name-check': [
    'PACKAGE_NAME_CHECK_PRICE',
    'PACKAGE_NAMECHECK_1_PRICE',
    'VITE_PACKAGE_NAMECHECK_1_PRICE',
  ],
  'perfect-baby-name-report': [
    'PACKAGE_PERFECT_BABY_NAME_REPORT_PRICE',
    'PACKAGE_SINGLE_PRICE',
    'VITE_PACKAGE_SINGLE_PRICE',
  ],
  'complete-baby-name-blueprint': [
    'PACKAGE_COMPLETE_BABY_NAME_BLUEPRINT_PRICE',
    'PACKAGE_PREMIUM_PRICE',
    'VITE_PACKAGE_PREMIUM_PRICE',
  ],
};

// Add-on prices — MUST match ADDON_*_PRICE in src/components/sections/OrderFormSection.tsx
const ADDON_PRICES = {
  extraNames: 1367,
  nickname: 1367,
};

export function validatePackageAmount(env, packageType, clientAmount, addons = {}) {
  const key = packageType || 'name-check';

  let expectedAmount = DEFAULT_PRICES[key];
  if (!expectedAmount) {
    return { ok: false, expected: null, received: parseInt(clientAmount, 10) };
  }

  // Override from env (first variable that is set to a valid number)
  for (const name of ENV_KEYS[key] || []) {
    const parsed = parseInt(env?.[name], 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      expectedAmount = parsed;
      break;
    }
  }

  // Add-ons only apply to the baby-name packages (not name-check)
  if (key !== 'name-check') {
    if (addons?.extraNames === true) expectedAmount += ADDON_PRICES.extraNames;
    if (addons?.nickname === true) expectedAmount += ADDON_PRICES.nickname;
  }

  const clientParsed = parseInt(clientAmount, 10);

  if (clientParsed !== expectedAmount) {
    return { ok: false, expected: expectedAmount, received: clientParsed };
  }

  return { ok: true, amount: expectedAmount };
}

export function getPackagePrice(packageType) {
  const key = packageType || 'name-check';
  return DEFAULT_PRICES[key] || null;
}
