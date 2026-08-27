/**
 * Package Pricing Configuration
 *
 * All prices are read from Vite environment variables so they can be changed
 * via Cloudflare Pages env vars (rebuild required) without touching source code.
 *
 * Set these in Cloudflare Pages → Project → Settings → Environment variables
 * (Production + Preview), then trigger a redeploy:
 *
 *   VITE_PACKAGE_SINGLE_PRICE / VITE_PACKAGE_SINGLE_ORIGINAL_PRICE
 *   VITE_PACKAGE_PREMIUM_PRICE / VITE_PACKAGE_PREMIUM_ORIGINAL_PRICE
 *   VITE_PACKAGE_NAMECHECK_1_PRICE / VITE_PACKAGE_NAMECHECK_1_ORIGINAL_PRICE
 *   VITE_PACKAGE_NAMECHECK_2_PRICE / VITE_PACKAGE_NAMECHECK_2_ORIGINAL_PRICE
 *   VITE_PACKAGE_NAMECHECK_3_PRICE / VITE_PACKAGE_NAMECHECK_3_ORIGINAL_PRICE
 *   VITE_PACKAGE_CONSULTATION_PRICE / VITE_PACKAGE_CONSULTATION_ORIGINAL_PRICE
 *
 * IMPORTANT: also mirror these on the Cloudflare Function side
 * (without the VITE_ prefix) so the backend can validate the order amount.
 * See `functions/api/_utils/pricing.js`.
 */

export interface PackageTier {
  price: number;
  originalPrice: number;
}

export interface NameCheckTiers {
  1: PackageTier;
  2: PackageTier;
  3: PackageTier;
}

export interface PackagePricing {
  namecheck: PackageTier; // default = 1-name tier (kept for back-compat)
  nameCheckTiers: NameCheckTiers;
  single: PackageTier;
  premium: PackageTier;
  consultation: PackageTier;
}

const DEFAULTS = {
  single: { price: 3437, originalPrice: 7500 },
  premium: { price: 5957, originalPrice: 15051 },
  consultation: { price: 1, originalPrice: 1 },
  namecheck: {
    1: { price: 473, originalPrice: 473 },
    2: { price: 837, originalPrice: 946 },
    3: { price: 837, originalPrice: 946 },
  },
} as const;

function envNumber(value: unknown, fallback: number): number {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function readTier(
  priceEnv: string | undefined,
  originalEnv: string | undefined,
  fallback: { price: number; originalPrice: number },
): PackageTier {
  return {
    price: envNumber(priceEnv, fallback.price),
    originalPrice: envNumber(originalEnv, fallback.originalPrice),
  };
}

export function getPackagePricing(): PackagePricing {
  const env = import.meta.env;

  const single = readTier(
    env.VITE_PACKAGE_SINGLE_PRICE,
    env.VITE_PACKAGE_SINGLE_ORIGINAL_PRICE,
    DEFAULTS.single,
  );
  const premium = readTier(
    env.VITE_PACKAGE_PREMIUM_PRICE,
    env.VITE_PACKAGE_PREMIUM_ORIGINAL_PRICE,
    DEFAULTS.premium,
  );
  const consultation = readTier(
    env.VITE_PACKAGE_CONSULTATION_PRICE,
    env.VITE_PACKAGE_CONSULTATION_ORIGINAL_PRICE,
    DEFAULTS.consultation,
  );
  const nc1 = readTier(
    env.VITE_PACKAGE_NAMECHECK_1_PRICE,
    env.VITE_PACKAGE_NAMECHECK_1_ORIGINAL_PRICE,
    DEFAULTS.namecheck[1],
  );
  const nc2 = readTier(
    env.VITE_PACKAGE_NAMECHECK_2_PRICE,
    env.VITE_PACKAGE_NAMECHECK_2_ORIGINAL_PRICE,
    DEFAULTS.namecheck[2],
  );
  const nc3 = readTier(
    env.VITE_PACKAGE_NAMECHECK_3_PRICE,
    env.VITE_PACKAGE_NAMECHECK_3_ORIGINAL_PRICE,
    DEFAULTS.namecheck[3],
  );

  if (import.meta.env.DEV) {
    console.log("📦 Package Pricing:", { single, premium, namecheck: { 1: nc1, 2: nc2, 3: nc3 } });
  }

  return {
    namecheck: nc1,
    nameCheckTiers: { 1: nc1, 2: nc2, 3: nc3 },
    single,
    premium,
    consultation,
  };
}

export type PackageType =
  | "single"
  | "premium"
  | "consultation"
  | "namecheck"
  | "namecheck-1"
  | "namecheck-2"
  | "namecheck-3";

export function getPackagePrice(packageType: PackageType): number {
  const p = getPackagePricing();
  if (packageType === "namecheck" || packageType === "namecheck-1") return p.nameCheckTiers[1].price;
  if (packageType === "namecheck-2") return p.nameCheckTiers[2].price;
  if (packageType === "namecheck-3") return p.nameCheckTiers[3].price;
  return p[packageType].price;
}

export function getPackageOriginalPrice(packageType: PackageType): number {
  const p = getPackagePricing();
  if (packageType === "namecheck" || packageType === "namecheck-1") return p.nameCheckTiers[1].originalPrice;
  if (packageType === "namecheck-2") return p.nameCheckTiers[2].originalPrice;
  if (packageType === "namecheck-3") return p.nameCheckTiers[3].originalPrice;
  return p[packageType].originalPrice;
}

export function formatPrice(price: number): string {
  return `₹\u2009${price.toLocaleString("en-IN")}`;
}
