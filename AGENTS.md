# Architecture rules

- General package browsing uses `packageNavigation.ts` so popup and sticky buttons reset the mobile package switch and tolerate lazy section loading.

- All order-form base prices must use `src/lib/packagePricing.ts` helpers, never a local price table, so selection, review, and payment totals cannot diverge from package cards; server validation defaults must match those base prices.
- Mobile checkout wraps the existing order-form content in an accessible modal shell; keep field state and validation in the order form so mobile and desktop cannot diverge.
- Checkout step definitions and per-step validation live in the order form and drive both desktop progress and the mobile shell; separate baby-name and Name Check flows to preserve service-specific fields without duplicate payment logic.