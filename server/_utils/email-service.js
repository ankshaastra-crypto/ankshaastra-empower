import { normalizePackageType } from './package-names.js';

// Historical aliases are read-only; unknown services must never default to baby details.
export function getEmailService(packageType) {
  const service = normalizePackageType(packageType);
  const isBaby = service === 'perfect-baby-name-report'
    || service === 'complete-baby-name-blueprint'
    || packageType === 'baby_name';
  return { service, isBaby, isNameCheck: service === 'name-check' };
}