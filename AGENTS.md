# Architecture rules

- All order-form base prices must use `src/lib/packagePricing.ts` helpers, never a local price table, so selection, review, and payment totals cannot diverge from package cards; server validation defaults must match those base prices.