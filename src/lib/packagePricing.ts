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
}

export interface PackagePricing {
  namecheck: PackageTier; // default = 1-name tier (kept for back-compat)
  nameCheckTiers: NameCheckTiers;
  single: PackageTier;
  premium: PackageTier;
}

const DEFAULTS = {
  single: { price: 3437, originalPrice: 7500 },
  premium: { price: 5957, originalPrice: 15051 },
  namecheck: {
    1: { price: 473, originalPrice: 1100 },
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
  const nc1 = readTier(
    env.VITE_PACKAGE_NAMECHECK_1_PRICE,
    env.VITE_PACKAGE_NAMECHECK_1_ORIGINAL_PRICE,
    DEFAULTS.namecheck[1],
  );
  if (import.meta.env.DEV) {
    console.log("📦 Package Pricing:", { single, premium, namecheck: nc1 });
  }

  return {
    namecheck: nc1,
    nameCheckTiers: { 1: nc1 },
    single,
    premium,
  };
}

export type PackageType =
  | "name-check"
  | "perfect-baby-name-report"
  | "complete-baby-name-blueprint";

export function getPackagePrice(packageType: PackageType): number {
  const p = getPackagePricing();
  if (packageType === "name-check") return p.nameCheckTiers[1].price;
  if (packageType === "perfect-baby-name-report") return p.single.price;
  return p.premium.price;
}

export function getPackageOriginalPrice(packageType: PackageType): number {
  const p = getPackagePricing();
  if (packageType === "name-check") return p.nameCheckTiers[1].originalPrice;
  if (packageType === "perfect-baby-name-report") return p.single.originalPrice;
  return p.premium.originalPrice;
}

export function formatPrice(price: number): string {
  return `₹\u2009${price.toLocaleString("en-IN")}`;
}
