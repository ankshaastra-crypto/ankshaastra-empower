# Plan: Switch to Vercel Postgres + Local Invoice + Email

## Goal
Use Vercel's built-in Postgres database instead of Supabase, keep invoice generation local, and send emails to customer and admin.

---

## Step 1: Set Up Vercel Postgres

1. Go to **Vercel Dashboard** → **Storage** → **Create Database**
2. Select **Vercel Postgres** (not PostgreSQL)
3. Choose region closest to your users (e.g., Singapore if your site is for India)
4. Copy the **Connection String** - it will look like:
   ```
   postgres://defaultUser:somePassword@postgresql-vercel-project-id.region.pooler.supabase.com:6543/verceldb
   ```

---

## Step 2: Update Environment Variables in Vercel

Delete these old variables (if they exist):
- ❌ DATABASE_URL (pointing to Supabase)
- ❌ SUPABASE_URL
- ❌ SUPABASE_SERVICE_ROLE_KEY

Add these new variables:
| Variable | Value |
|----------|-------|
| DATABASE_URL | [Paste Vercel Postgres connection string] |
| SMTP_HOST | smtp.gmail.com |
| SMTP_PORT | 587 |
| SMTP_USER | your-email@gmail.com |
| SMTP_PASSWORD | Your Gmail App Password |
| FROM_EMAIL | Ankshaastra <your-email@gmail.com> |
| ADMIN_EMAIL | social@ankshaastra.com |
| RAZORPAY_KEY_ID | rzp_live_xxx |
| RAZORPAY_KEY_SECRET | Your Razorpay secret |
| RAZORPAY_WEBHOOK_SECRET | Your webhook secret |

---

## Step 3: Code Changes Required

### 3.1 Update `api/_utils/db.js`
Change the schema name from `ankshaastra` to use Vercel's default schema:

```javascript
// Change this:
export const DB_SCHEMA = 'ankshaastra';

// To this:
export const DB_SCHEMA = 'public';  // Vercel Postgres default schema
```

### 3.2 Update `api/_utils/supabase-server.js`
Remove Supabase Storage references (PDF will be generated locally only):

```javascript
// Remove or comment out upload to Supabase Storage
// Keep local PDF generation which already works
```

### 3.3 Update Database Tables (Simplified Schema)
Vercel Postgres uses simpler setup. No schema creation needed - just use tables directly.

---

## Step 4: Verify Everything Works

After deployment, visit `/api/health` to verify:
- ✅ DATABASE_URL: true
- ✅ SMTP_HOST: true
- ✅ SMTP_USER: true
- ✅ All _utils modules: true

Make a test payment and verify:
- ✅ Data stored in Vercel Postgres
- ✅ PDF generated locally
- ✅ Customer email received with PDF
- ✅ Admin email received with PDF

---

## Files That Need Changes

1. `api/_utils/db.js` - Change DB_SCHEMA to 'public'
2. `api/_utils/supabase-server.js` - Remove Supabase Storage upload

## Files That Stay The Same (Already Working)

1. `api/_utils/send-email.js` - Email sending (needs SMTP vars)
2. `api/_utils/generate-invoice-pdf.js` - PDF generation (local)
3. `api/initiate-payment.js` - Payment flow
4. `api/payment-status.js` - Status check

---

## Summary

| Feature | Solution |
|---------|----------|
| Database | Vercel Postgres (not Supabase) |
| Invoice PDF | Local pdf-lib (already works) |
| Email to Customer | Local SMTP (Gmail) |
| Email to Admin | Local SMTP (Gmail) |
| Storage Upload | Removed (PDF stays in email) |

This eliminates the Supabase dependency entirely.
