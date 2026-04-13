# Fix Duplicate Invoice Emails

## Status: 🔄 In Progress

### Plan Steps:
- [x] 1. Analyze email sending flow (files read)
- [ ] 2. Identify duplicate triggers  
- [ ] 3. Add deduplication logic (emailDelivery table + constraints)
- [ ] 4. Single source: webhook only sends emails
- [ ] 5. Test: exactly 2 emails (admin + customer)
- [x] 6. Razorpay ✅ Fixed separately

### Current Understanding:
- Webhook (`verify-payment.js`) likely sends emails
- Frontend (`PaymentStatus.tsx`) may also trigger  
- Need deduplication regardless

**Next**: Implement DB constraint + check before send"

