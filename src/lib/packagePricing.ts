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
 */
export function getPackagePricing(): PackagePricing {
  return {
    namecheck: {
      price: Number(import.meta.env.VITE_PACKAGE_NAMECHECK_PRICE) || 199,
      originalPrice: Number(import.meta.env.VITE_PACKAGE_NAMECHECK_ORIGINAL_PRICE) || 199,
    },
    single: {
      price: Number(import.meta.env.VITE_PACKAGE_SINGLE_PRICE) || 1997,
      originalPrice: Number(import.meta.env.VITE_PACKAGE_SINGLE_ORIGINAL_PRICE) || 5100,
    },
    family: {
      price: Number(import.meta.env.VITE_PACKAGE_FAMILY_PRICE) || 3994,
      originalPrice: Number(import.meta.env.VITE_PACKAGE_FAMILY_ORIGINAL_PRICE) || 10200,
    },
  };
}

/**
 * Get price for a specific package type
 */
export function getPackagePrice(packageType: 'namecheck' | 'single' | 'family'): number {
  const pricing = getPackagePricing();
  return pricing[packageType].price;
}

/**
 * Get original price for a specific package type
 */
export function getPackageOriginalPrice(packageType: 'namecheck' | 'single' | 'family'): number {
  const pricing = getPackagePricing();
  return pricing[packageType].originalPrice;
}

/**
 * Format price as currency string (₹X,XXX)
 */
export function formatPrice(price: number): string {
  return `₹${price.toLocaleString('en-IN')}`;
}
