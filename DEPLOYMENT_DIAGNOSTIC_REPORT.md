# Ankshaastra Email & Database Issues - Diagnostic Report

**Generated:** April 28, 2026  
**Status:** 🔴 CRITICAL ISSUES FOUND

---

## Executive Summary

Your Cloudflare deployment has **3 critical issues** preventing:
1. ❌ Email sending to customers (with invoice PDF)
2. ❌ Email sending to admin (with invoice PDF)
3. ❌ Customer data storage in Supabase database

All three issues are **environment variable configuration problems** in your Cloudflare Pages Dashboard.

---

## Issue #1: Emails Not Sending to Customers & Admin

### Root Cause
**Missing SMTP environment variables in Cloudflare Pages Dashboard**

When a payment is successful, your code tries to send emails:
- **Customer email** with invoice PDF
- **Admin email** with invoice PDF + form details

But the SMTP transporter fails because critical env vars are missing:

```javascript
// From api/_utils/send-email.js (line 12-13)
if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
  throw new Error('SMTP configuration is missing...');
}
```

### Required SMTP Environment Variables

You need to add these to **Cloudflare Pages Dashboard** → Settings → Variables & Secrets:

| Variable | Status | Value | Example |
|----------|--------|-------|---------|
| `SMTP_HOST` | ❌ **MISSING** | Your SMTP server | `smtp.gmail.com` or mail server |
| `SMTP_USER` | ❌ **MISSING** | SMTP username | `your-email@gmail.com` |
| `SMTP_PASSWORD` | ❌ **MISSING** | SMTP password/app-password | Your app-specific password |
| `SMTP_PORT` | ✅ Configured | `587` | Already in wrangler.toml |
| `SMTP_SECURE` | ✅ Configured | `false` | Already in wrangler.toml |
| `FROM_EMAIL` | ✅ Configured | `Ankshaastra <madappscreator@gmail.com>` | Already in wrangler.toml |
| `ADMIN_EMAIL` | ✅ Configured | `social@ankshaastra.com` | Already in wrangler.toml |

### Action Required

**STEP 1: Identify SMTP Server**

If using Gmail:
- **Host:** `smtp.gmail.com`
- **Port:** `587` (already configured)
- **User:** `your-email@gmail.com`
- **Password:** Generate an [App Password](https://support.google.com/accounts/answer/185833)

If using another provider:
- Get SMTP details from your email hosting provider

**STEP 2: Add to Cloudflare Pages**

1. Go to: **Cloudflare Pages** → Your Project → **Settings** → **Environment Variables**
2. Click **Add Variable**
3. Add these **Secrets** (use "Encrypt" option):
   - `SMTP_HOST`: Your SMTP server
   - `SMTP_USER`: Your email username
   - `SMTP_PASSWORD`: Your app password (MUST be secret)

**STEP 3: Redeploy**

After adding env vars, your next deployment will pick them up automatically.

### Verification

After deployment, the email flow will:
1. ✅ Receive payment webhook from Razorpay
2. ✅ Save payment to database (if DATABASE_URL is set)
3. ✅ Generate invoice PDF
4. ✅ Send customer email with PDF
5. ✅ Send admin email with PDF + form data

---

## Issue #2: Customer Data Not Stored in Supabase Database

### Root Cause
**Missing DATABASE_URL environment variable in Cloudflare Pages**

Your code tries to save customer orders after initiating payment:

```javascript
// From api/initiate-payment.js
await utils.saveOrderAndCustomer(orderId, amount, packageType, customerData);
```

But this silently fails because:

```javascript
// From api/_utils/db.js (line 278)
export function getPool() {
  if (!pool) {
    let connectionString = process.env.DATABASE_URL;
    if (!connectionString) return null;  // ❌ Returns null if DATABASE_URL missing
    // ...
  }
}
```

When `getPool()` returns `null`, all database operations fail silently:

```javascript
export async function saveOrderAndCustomer(orderId, amount, packageType, customerData) {
  const p = getPool();
  if (!p) return false;  // ❌ Silently returns false if no pool
  // ...
}
```

### Database Tables That Should Store Data

| Table | Purpose | Status |
|-------|---------|--------|
| `ankshaastra.orders` | Order amounts, package types, status | ❌ Not storing |
| `ankshaastra.customer_details` | Customer form data (name, email, DOB, etc.) | ❌ Not storing |
| `ankshaastra.payment` | Payment transactions | ❌ Not storing |
| `ankshaastra.invoices` | Generated invoice records | ❌ Not storing |
| `ankshaastra.emailDelivery` | Email tracking (sent/failed) | ❌ Not storing |

### Action Required

**STEP 1: Get Your Supabase Connection String**

1. Go to your Supabase project: https://supabase.com/dashboard
2. Click **Project Settings** → **Database**
3. Copy the **Connection String** for Node.js
   - Format: `postgresql://[user]:[password]@[host]:[port]/[database]`

**STEP 2: Add to Cloudflare Pages**

1. Go to: **Cloudflare Pages** → Your Project → **Settings** → **Environment Variables**
2. Click **Add Secret** (use "Encrypt" option)
3. **Name:** `DATABASE_URL`
4. **Value:** Paste your Supabase connection string

**⚠️ IMPORTANT:** Supabase connection strings contain passwords. Mark this as a **Secret** (not Public).

**STEP 3: Verify Connection**

Your project includes a setup script that initializes the database:

```bash
npm run db:setup
```

This will:
1. Connect to your database
2. Create schema `ankshaastra`
3. Create all required tables
4. Initialize invoice sequence

### Database Schema

The schema is auto-initialized on first payment webhook. Tables created:

```sql
-- Core tables
ankshaastra.orders              -- Orders with package type & amount
ankshaastra.customer_details    -- All form data (41 fields)
ankshaastra.payment             -- Payment transactions

-- Supporting tables
ankshaastra.emailDelivery       -- Email deduplication & tracking
ankshaastra.invoices            -- Invoice records with numbers
ankshaastra.invoice_sequence    -- Sequential invoice numbering (GST compliant)
```

---

## Issue #3: Invoice PDFs Not Generating/Attaching

### Root Cause
**Depends on Issues #1 & #2**

Invoice PDF generation requires:
1. ✅ Order exists in database (requires `DATABASE_URL` - Issue #2)
2. ✅ SMTP configured to attach PDFs to emails (requires SMTP vars - Issue #1)

Your code flow:
```
Payment Success → Get Order from DB → Generate PDF (pdf-lib) → Attach to Email → Send
                  ↑ FAILS if DB not connected
```

### Files Involved

| File | Purpose |
|------|---------|
| `api/_utils/generate-invoice-pdf.js` | PDF generation using pdf-lib |
| `api/_utils/supabase-server.js` | Wrapper for PDF generation + Supabase storage |
| `api/payment-webhook.js` | Calls PDF generation after payment |

### Action Required

After fixing Issues #1 & #2, PDFs will automatically:
1. ✅ Generate with tax invoice format
2. ✅ Include customer details
3. ✅ Attach to customer email
4. ✅ Attach to admin email

---

## Environment Variables Checklist

### ✅ Already Configured (in wrangler.toml)
```
SMTP_PORT = "587"
SMTP_SECURE = "false"
FROM_EMAIL = "Ankshaastra <madappscreator@gmail.com>"
ADMIN_EMAIL = "social@ankshaastra.com"
VITE_SUPABASE_URL = "https://hhibpjjozfrtyemivgqz.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_lUUcU7jfgfV9h2RIH041lA_L3npqtRn"
VITE_RAZORPAY_KEY_ID = "rzp_live_SiOfLiV0lwCQ7H"
WHATSAPP_ADMIN_NUMBER = "919667305577"
```

### ❌ Missing in Cloudflare Pages (Add as Secrets)
```
SMTP_HOST                    [CRITICAL]
SMTP_USER                    [CRITICAL]
SMTP_PASSWORD                [CRITICAL - USE SECRET ENCRYPTION]
DATABASE_URL                 [CRITICAL - USE SECRET ENCRYPTION]
RAZORPAY_KEY_SECRET          [Already needed - verify it exists]
RAZORPAY_WEBHOOK_SECRET      [Already needed - verify it exists]
```

---

## Step-by-Step Fix Process

### Phase 1: Add SMTP Configuration (Fix Email Issue)

1. **Get SMTP Credentials:**
   - If using Gmail: Create [App Password](https://support.google.com/accounts/answer/185833)
   - If using other provider: Get from your hosting control panel

2. **Add to Cloudflare Pages Dashboard:**
   ```
   Settings → Environment Variables → Add Secret
   
   SMTP_HOST = smtp.gmail.com (or your provider)
   SMTP_USER = your-email@gmail.com
   SMTP_PASSWORD = [app-password]  ← Mark as "Encrypt"
   ```

3. **Trigger Redeploy:**
   ```
   git push origin main
   ```

4. **Test:** Make a test payment to verify customer email receives confirmation

### Phase 2: Add Database Configuration (Fix Data Storage Issue)

1. **Get Supabase Connection String:**
   - Supabase Project → Settings → Database → Connection String (Node.js)

2. **Add to Cloudflare Pages Dashboard:**
   ```
   Settings → Environment Variables → Add Secret
   
   DATABASE_URL = [your-connection-string]  ← Mark as "Encrypt"
   ```

3. **Trigger Redeploy:**
   ```
   git push origin main
   ```

4. **Initialize Database:**
   - Local: Run `npm run db:setup`
   - Or: Database initializes automatically on first webhook

5. **Test:** Check Supabase dashboard to verify orders are being created

### Phase 3: Verify Invoice PDFs

1. **Make Test Payment** to verify:
   - ✅ Customer receives email with PDF
   - ✅ Admin receives email with PDF + form data
   - ✅ Data appears in Supabase database

2. **Check Logs:**
   - Cloudflare Pages → Functions → Logs
   - Look for: `✅ Customer email sent successfully`

---

## Troubleshooting

### Email Still Not Sending After Fix?

**Check Logs:**
```
Cloudflare Pages → Your Project → Functions → Logs
Search for: "SMTP", "email", "transporter"
```

**Common Issues:**
- Gmail App Password incorrect → Create new one
- SMTP credentials not actually added to dashboard → Verify in Settings
- Deployment didn't pick up new vars → Try manual redeploy

### Database Still Not Storing Data After Fix?

**Check Logs:**
```
Cloudflare Pages → Your Project → Functions → Logs
Search for: "DATABASE", "pool", "connection"
```

**Common Issues:**
- Connection string invalid → Copy again from Supabase
- Database already exists with different schema → Run migrations
- Supabase project paused → Activate in Supabase dashboard

### How to View Logs

1. Go to **Cloudflare Pages**
2. Select your **ankshaastra-empower** project
3. Click **Functions** tab
4. Click **payment-webhook** → **Logs**
5. Filter by recent timestamps

---

## Files That Need Environment Variables

| File | Env Vars Used |
|------|---------------|
| `api/_utils/send-email.js` | SMTP_HOST, SMTP_USER, SMTP_PASSWORD, SMTP_PORT, SMTP_SECURE, FROM_EMAIL, ADMIN_EMAIL |
| `api/_utils/db.js` | DATABASE_URL |
| `api/_utils/redis-cache.js` | REDIS_URL (optional) |
| `api/payment-webhook.js` | RAZORPAY_WEBHOOK_SECRET, DATABASE_URL |
| `api/payment-status.js` | RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET |
| `api/initiate-payment.js` | RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, DATABASE_URL |

---

## Next Steps

1. ✅ **Immediately Add SMTP Variables** to Cloudflare Pages (Fix #1)
2. ✅ **Add DATABASE_URL** to Cloudflare Pages (Fix #2)
3. ✅ **Verify with Test Payment** (Fix #3)
4. ✅ **Check Logs** if any issues remain

---

## Support

If emails still don't send after these fixes:
- Check SMTP credentials are correct
- Check Cloudflare deployment logs
- Verify no rate limiting is blocking outbound email

If database still doesn't store data:
- Verify DATABASE_URL connection string
- Check Supabase project is not paused
- View Cloudflare function logs for connection errors

---

**Last Updated:** April 28, 2026
