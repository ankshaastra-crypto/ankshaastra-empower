// Shared package display names — keep in sync with OrderFormSection / PricingSection

const PACKAGE_NAMES = {
  single: 'Perfect Baby Name Report',
  premium: 'Complete Baby Name Blueprint',
  consultation: 'Website Testing',
  namecheck: 'Name Check Report',
  'namecheck-1': 'Name Check (1 Person)',
  'namecheck-2': 'Name Check (2 Persons)',
  'namecheck-3': 'Name Check (3 Persons)',
  baby_name: 'Baby Name Numerology Report',
};

export function getPackageDisplayName(packageType) {
  if (!packageType) return 'Numerology Report';
  if (PACKAGE_NAMES[packageType]) return PACKAGE_NAMES[packageType];
  if (packageType.startsWith('namecheck-')) {
    const count = packageType.split('-')[1] || '1';
    return `Name Check (${count} Person${count !== '1' ? 's' : ''})`;
  }
  return packageType;
}

export { PACKAGE_NAMES };
