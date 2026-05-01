// functions/api/_utils/pricing.js
// Server-side authoritative pricing. Reads from deployment env vars and
// validates that the amount the client sent matches what we expect for the
// package. This prevents a tampered client from paying a lower amount.
//
// Deployment provider → Project → Settings → Environment Variables (Production):
//   PACKAGE_SINGLE_PRICE
//   PACKAGE_PREMIUM_PRICE
//   PACKAGE_CONSULTATION_PRICE
//   PACKAGE_NAMECHECK_1_PRICE
//   PACKAGE_NAMECHECK_2_PRICE
//   PACKAGE_NAMECHECK_3_PRICE
//
// All prices are in INR (rupees, GST inclusive). Set the same numbers as the
// VITE_PACKAGE_*_PRICE values used by the frontend.

const DEFAULTS = {
  single: 2447,
  premium: 8927,
  consultation: 1,
  'namecheck-1': 293,
  'namecheck-2': 528,
  'namecheck-3': 747,
};

function envNumber(env, key, fallback) {
  const raw = env?.[key] ?? (typeof process !== 'undefined' ? process.env?.[key] : undefined);
  if (raw === undefined || raw === null || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Resolve the canonical server-side price (in INR rupees) for a package type.
 * Returns null if the package is unknown.
 */
export function getServerPackagePrice(env, packageType) {
  if (!packageType) return null;
  const key = String(packageType).toLowerCase().trim();

  switch (key) {
    case 'single':
    case 'perfect':
    case 'perfect_baby_name':
    case 'baby_name':
      return envNumber(env, 'PACKAGE_SINGLE_PRICE', DEFAULTS.single);

    case 'premium':
    case 'live':
    case 'live_video':
      return envNumber(env, 'PACKAGE_PREMIUM_PRICE', DEFAULTS.premium);

    case 'consultation':
      return envNumber(env, 'PACKAGE_CONSULTATION_PRICE', DEFAULTS.consultation);

    case 'namecheck':
    case 'namecheck-1':
    case 'name_check':
      return envNumber(env, 'PACKAGE_NAMECHECK_1_PRICE', DEFAULTS['namecheck-1']);

    case 'namecheck-2':
      return envNumber(env, 'PACKAGE_NAMECHECK_2_PRICE', DEFAULTS['namecheck-2']);

    case 'namecheck-3':
      return envNumber(env, 'PACKAGE_NAMECHECK_3_PRICE', DEFAULTS['namecheck-3']);

    default:
      return null;
  }
}

/**
 * Validate the client-supplied amount (in rupees) against the server-side price.
 * Returns { ok: true, amount } if valid, or { ok: false, error, expected } otherwise.
 *
 * `tolerancePaise` allows tiny rounding mismatches (defaults to 0 — strict).
 */
export function validatePackageAmount(env, packageType, clientAmountRupees, tolerancePaise = 0) {
  const expected = getServerPackagePrice(env, packageType);
  if (expected == null) {
    return { ok: false, error: `Unknown package type: ${packageType}`, expected: null };
  }
  const client = Number(clientAmountRupees);
  if (!Number.isFinite(client) || client <= 0) {
    return { ok: false, error: 'Invalid amount', expected };
  }
  const diffPaise = Math.abs(Math.round(client * 100) - Math.round(expected * 100));
  if (diffPaise > tolerancePaise) {
    return { ok: false, error: 'Amount mismatch', expected, received: client };
  }
  return { ok: true, amount: expected };
}
