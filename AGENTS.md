# Architecture rules

- All order-form base prices must use `src/lib/packagePricing.ts` helpers, never a local price table, so selection, review, and payment totals cannot diverge from package cards; server validation defaults must match those base prices.
- Mobile checkout wraps the existing order-form content in an accessible modal shell; keep field state and validation in the order form so mobile and desktop cannot diverge.
- Checkout uses the same contact, report-details, and review steps on mobile and desktop; validate each step with the existing field rules to preserve one payment flow.