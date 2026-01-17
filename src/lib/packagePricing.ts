/**
 * Package Pricing Configuration
 * Reads prices from environment variables for easy management
 */

export interface PackagePricing {
  namecheck: {
    price: number;
    originalPrice: number;
  };
  single: {
    price: number;
    originalPrice: number;
  };
  family: {
    price: number;
    originalPrice: number;
  };
}

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
    fallback: number
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
      family: import.meta.env.VITE_PACKAGE_FAMILY_PRICE,
    });
  }

  return {
    namecheck: {
      price: getEnvNumber(import.meta.env.VITE_PACKAGE_NAMECHECK_PRICE, 199),
      originalPrice: getEnvNumber(
        import.meta.env.VITE_PACKAGE_NAMECHECK_ORIGINAL_PRICE,
        199
      ),
    },
    single: {
      price: getEnvNumber(import.meta.env.VITE_PACKAGE_SINGLE_PRICE, 1997),
      originalPrice: getEnvNumber(
        import.meta.env.VITE_PACKAGE_SINGLE_ORIGINAL_PRICE,
        5100
      ),
    },
    family: {
      price: getEnvNumber(import.meta.env.VITE_PACKAGE_FAMILY_PRICE, 3994),
      originalPrice: getEnvNumber(
        import.meta.env.VITE_PACKAGE_FAMILY_ORIGINAL_PRICE,
        10200
      ),
    },
  };
}

/**
 * Get price for a specific package type
 */
export function getPackagePrice(
  packageType: "namecheck" | "single" | "family"
): number {
  const pricing = getPackagePricing();
  return pricing[packageType].price;
}

/**
 * Get original price for a specific package type
 */
export function getPackageOriginalPrice(
  packageType: "namecheck" | "single" | "family"
): number {
  const pricing = getPackagePricing();
  return pricing[packageType].originalPrice;
}

/**
 * Format price as currency string (₹X,XXX)
 */
export function formatPrice(price: number): string {
  return `₹${price.toLocaleString("en-IN")}`;
}
