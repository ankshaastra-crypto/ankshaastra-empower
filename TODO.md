# Fix Razorpay Webhook Payload Issue

## Status: 🔄 In Progress

### Step 1: [✅] Analysis Complete
- Identified root cause: Wrong payload path `req.body.data?.payment` → should be `req.body.payload?.payment`
- Plan reviewed and approved

### Step 2: [✅] Create TODO.md
- Track progress

### Step 3: [✅] Fix api/payment-webhook.js
- Updated payload extraction to `req.body.payload?.payment`
- Added debug logging (payload structure, keys)
- Improved status logic (`captured`/`paid`)
- Enhanced error diagnostics

### Step 4: [⏳] Deploy & Verify Production Logs
- Deploy to Vercel 
- Monitor for "Invalid payload" resolution
- Check next webhook call logs

### Step 5: [⏳] Test End-to-End
- Live payment → webhook → DB/email/PDF/WhatsApp

