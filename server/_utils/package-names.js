// Shared package display names — keep in sync with OrderFormSection / PricingSection

const PACKAGE_NAMES = {
  'name-check': 'Name Check',
  'perfect-baby-name-report': 'Perfect Baby Name Report',
  'complete-baby-name-blueprint': 'Complete Baby Name Blueprint',
  // Read-only aliases keep historical orders understandable.
  namecheck: 'Name Check',
  'namecheck-1': 'Name Check',
  single: 'Perfect Baby Name Report',
  premium: 'Complete Baby Name Blueprint',
};

export function getPackageDisplayName(packageType) {
  if (!packageType) return 'Name Check';
  if (PACKAGE_NAMES[packageType]) return PACKAGE_NAMES[packageType];
  return packageType;
}

export function normalizePackageType(packageType) {
  const key = String(packageType || '').trim().toLowerCase();
  if (key === 'name-check' || key === 'namecheck' || key === 'namecheck-1') return 'name-check';
  if (key === 'perfect-baby-name-report' || key === 'single') return 'perfect-baby-name-report';
  if (key === 'complete-baby-name-blueprint' || key === 'premium') return 'complete-baby-name-blueprint';
  return null;
}

export { PACKAGE_NAMES };
