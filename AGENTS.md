# Architecture rules

- Email detail sections use the shared email service classifier for current and historical package keys, so Name Check cannot receive a baby-only summary.
- Payment initiation persists the complete order once with its gateway ID and only uses configured optional caching; await persistence and log durations only to avoid duplicate row contention without detaching durable writes.

- Prefetch checkout when the pricing section approaches the viewport, not on a fixed startup timer, so mobile initial loading prioritizes visible content.

- General package browsing uses `packageNavigation.ts` so popup and sticky buttons reset the mobile package switch and tolerate lazy section loading.
- Pass the first selected service into the lazy order form as a prop; do not replay selection on a timer, which can fire before its listener mounts.

- All order-form base prices must use `src/lib/packagePricing.ts` helpers, never a local price table, so selection, review, and payment totals cannot diverge from package cards; server validation defaults must match those base prices.
- Mobile checkout wraps the existing order-form content in an accessible modal shell; keep field state and validation in the order form so mobile and desktop cannot diverge.
- Checkout step definitions and per-step validation live in the order form and drive both desktop progress and the mobile shell; separate baby-name and Name Check flows to preserve service-specific fields without duplicate payment logic.