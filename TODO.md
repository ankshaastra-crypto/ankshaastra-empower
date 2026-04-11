# Invoice Email Debug & Fix TODO

## Current Status
- Code sends HTML invoice + PDF to customer
- PDF (not HTML) to admin social@ankshaastra.com
- User reports: Not received → SMTP config or PDF fail likely

## Debug Steps (1-3)
1. [ ] Check Vercel env vars: SMTP_HOST, SMTP_USER, SMTP_PASSWORD, FROM_EMAIL set?
2. [ ] Test local: `bun run dev` → simulate webhook
3. [ ] Check Vercel Function logs for errors

## Fix Steps (4-6)
4. [x] Update send-email.js: Add HTML invoice to admin email + better logging
5. [x] Update payment-webhook.js: More logs
6. [ ] Deploy & test live payment

**Progress: Code updated. Next: Set SMTP env vars in Vercel, test payment.**
