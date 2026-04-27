/**
 * Package Pricing Configuration
 * Reads prices from environment variables for easy management
 */

export interface PackageTier {
  price: number;
  originalPrice: number;
}

export interface PackagePricing {
  namecheck: PackageTier;
  single: PackageTier;
  premium: PackageTier;
  consultation: PackageTier;
}

const DEFAULT_PACKAGE_PRICING: PackagePricing = {
  namecheck: {
    price: 293,
    originalPrice: 293,
  },
  single: {
    price: 2447,
    originalPrice: 7500,
  },
  premium: {
    price: 8927,
    originalPrice: 18218,
  },
  consultation: {
    price: 1,
    originalPrice: 1,
  },
};

/**
 * Get package pricing from environment variables
 * Falls back to default values if env vars are not set
 *
 * IMPORTANT: After changing environment variables:
 * 1. Restart the Vite dev server (Ctrl+C then npm run dev)
 * 2. Or rebuild the project (npm run build)
 *
 * In production (Vercel), environment variables are loaded at build time.
 */
export function getPackagePricing(): PackagePricing {
  // Helper function to safely parse env var with fallback
  const getEnvNumber = (
    envVar: string | undefined,
    fallback: number,
  ): number => {
    if (envVar === undefined || envVar === "") {
      return fallback;
    }
    const parsed = Number(envVar);
    return isNaN(parsed) ? fallback : parsed;
  };

  // Debug logging (only in development)
  if (import.meta.env.DEV) {
    console.log("📦 Package Pricing Environment Variables:", {
      namecheck: import.meta.env.VITE_PACKAGE_NAMECHECK_PRICE,
      single: import.meta.env.VITE_PACKAGE_SINGLE_PRICE,
    });
  }

  return {
    namecheck: {
      price: getEnvNumber(
        import.meta.env.VITE_PACKAGE_NAMECHECK_PRICE,
        DEFAULT_PACKAGE_PRICING.namecheck.price,
      ),
      originalPrice: getEnvNumber(
        import.meta.env.VITE_PACKAGE_NAMECHECK_ORIGINAL_PRICE,
        DEFAULT_PACKAGE_PRICING.namecheck.originalPrice,
      ),
    },
    single: {
      price: DEFAULT_PACKAGE_PRICING.single.price,
      originalPrice: DEFAULT_PACKAGE_PRICING.single.originalPrice,
    },
    premium: {
      price: DEFAULT_PACKAGE_PRICING.premium.price,
      originalPrice: DEFAULT_PACKAGE_PRICING.premium.originalPrice,
    },
    consultation: {
      price: DEFAULT_PACKAGE_PRICING.consultation.price,
      originalPrice: DEFAULT_PACKAGE_PRICING.consultation.originalPrice,
    },
  };
}

/**
 * Get price for a specific package type
 */
export function getPackagePrice(packageType: "namecheck" | "single" | "premium" | "consultation"): number {
  const pricing = getPackagePricing();
  return pricing[packageType].price;
}

/**
 * Get original price for a specific package type
 */
export function getPackageOriginalPrice(
  packageType: "namecheck" | "single" | "premium" | "consultation",
): number {
  const pricing = getPackagePricing();
  return pricing[packageType].originalPrice;
}

/**
 * Format price as currency string (₹X,XXX)
 */
export function formatPrice(price: number): string {
  return `₹\u2009${price.toLocaleString("en-IN")}`;
}
