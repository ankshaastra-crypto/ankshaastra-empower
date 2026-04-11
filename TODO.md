# Payment System Enhancements TODO

## Approved Plan Steps (Sequential)

### Phase 1: Core Backend (PDF + Email) ✅
- [x] 1.1 Add `getOrderFull(orderId)` to api/_utils/db.js (join orders/customer_details → Edge format)
- [x] 1.2 Add `generateInvoicePDF(orderId)` to api/_utils/supabase-server.js (Edge invoke → signed URL → Buffer)
- [x] 1.3 Update api/_utils/send-email.js (adminEmail='social@ankshaastra.com')
- [x] 1.4 Update api/payment-webhook.js (SUCCESS: PDF buffer → email + log)
- [x] 1.5 Update api/payment-status.js (same)

### Phase 2: WhatsApp
- [ ] 2.1 Create api/_utils/send-whatsapp.js (WhatsApp Business Cloud API)
- [ ] 2.2 Call from webhook/status on SUCCESS

### Phase 3: Frontend Polish
- [ ] 3.1 Enhance src/lib/invoiceService.ts (server-side PDF URL fn)
- [ ] 3.2 Update src/pages/PaymentStatus.tsx (fetch real PDF, download link)

### Phase 4: Test/Deploy
- [ ] 4.1 Supabase: Create `invoices` bucket + policies
- [ ] 4.2 Add env vars (Supabase creds, WhatsApp)
- [ ] 4.3 Test full flow
- [ ] 4.4 Deploy Vercel

**Current Progress:** Phase 1 ✅ - PDF/Email ready (creds needed). Phase 2 next.
- [ ] 2.1 Create api/_utils/send-whatsapp.js (WhatsApp Business Cloud API)
- [ ] 2.2 Call from webhook/status on SUCCESS

### Phase 3: Frontend Polish
- [ ] 3.1 Enhance src/lib/invoiceService.ts (server-side PDF URL fn)
- [ ] 3.2 Update src/pages/PaymentStatus.tsx (fetch real PDF, download link)

### Phase 4: Test/Deploy
- [ ] 4.1 Supabase: Create `invoices` bucket + policies
- [ ] 4.2 Add env vars (Supabase creds, WhatsApp)
- [ ] 4.3 Test full flow
- [ ] 4.4 Deploy Vercel

**Current Progress:** Ready for Phase 1.1
