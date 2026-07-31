# Complete Environment Variables Reference

## All Environment Variables Your Project Needs

This is the **complete list** of all environment variables needed for your Ankshaastra project on Cloudflare Pages.

---

## 🔴 CRITICAL (Currently Broken - Must Add First)

### 1. SMTP_HOST
- **Purpose:** Email server hostname
- **Where:** Cloudflare Pages → Add as Variable (Public)
- **Value Examples:**
  - Gmail: `smtp.gmail.com`
  - Outlook: `smtp-mail.outlook.com`
  - SendGrid: `smtp.sendgrid.net`
- **Status:** ❌ **MISSING** - Emails won't send
- **Action:** Get from your email provider

### 2. SMTP_USER
- **Purpose:** Email login username
- **Where:** Cloudflare Pages → Add as Secret (Encrypted)
- **Value Examples:**
  - Gmail: `your-email@gmail.com`
  - SendGrid: `apikey`
  - Custom: `username@yourdomain.com`
- **Status:** ❌ **MISSING** - Emails won't send
- **Action:** Get from your email provider

### 3. SMTP_PASSWORD
- **Purpose:** Email login password/app-password
- **Where:** Cloudflare Pages → Add as Secret (Encrypted) ⚠️
- **Important:**
  - Gmail: Use [App Password](https://support.google.com/accounts/answer/185833) NOT your regular password
  - Other providers: Use the provided app-specific password
- **Status:** ❌ **MISSING** - Emails won't send
- **Action:** Generate app-specific password from your email provider

### 4. DATABASE_URL
- **Purpose:** PostgreSQL connection string for Supabase
- **Where:** Cloudflare Pages → Add as Secret (Encrypted) ⚠️
- **Format:** `postgresql://[user]:[password]@[host]:[port]/[database]`
- **Where to Get:**
  1. Supabase Dashboard → Your Project
  2. Settings → Database
  3. Connection Strings tab → Node.js
  4. Copy the full connection string
- **Status:** ❌ **MISSING** - Data won't store
- **Action:** Copy from Supabase dashboard

---

## 🟡 IMPORTANT (Likely Missing - Verify in Cloudflare)

### 5. RAZORPAY_KEY_SECRET
- **Purpose:** Razorpay private key for API calls
- **Where:** Cloudflare Pages → Add as Secret (Encrypted)
- **Format:** Long random string starting with `rzp_live_` or `rzp_test_`
- **Where to Get:**
  1. Razorpay Dashboard → Settings → API Keys
  2. Copy the **Secret Key** (NOT the Key ID)
- **Status:** ❓ Check Cloudflare - if missing, payments will fail
- **Action:** Verify it exists; if not, add it

### 6. RAZORPAY_WEBHOOK_SECRET
- **Purpose:** Razorpay webhook signature verification
- **Where:** Cloudflare Pages → Add as Secret (Encrypted)
- **Where to Get:**
  1. Razorpay Dashboard → Settings → Webhooks
  2. Find your webhook for this app
  3. Copy the **Secret** value shown
- **Status:** ❓ Check Cloudflare - if missing, webhook verification fails
- **Action:** Verify it exists; if not, add it

---

## ✅ ALREADY CONFIGURED (in wrangler.toml)

### 7. SMTP_PORT
- **Value:** `587`
- **Purpose:** SMTP port (TLS)
- **Status:** ✅ Already configured
- **No action needed**

### 8. SMTP_SECURE
- **Value:** `false`
- **Purpose:** Don't use SSL (use TLS instead on port 587)
- **Status:** ✅ Already configured
- **No action needed**

### 9. FROM_EMAIL
- **Value:** `Ankshaastra <madappscreator@gmail.com>`
- **Purpose:** Email sender name and address
- **Status:** ✅ Already configured
- **Note:** This should match SMTP_USER for Gmail

### 10. ADMIN_EMAIL
- **Value:** `social@ankshaastra.com`
- **Purpose:** Email address for admin notifications
- **Status:** ✅ Already configured
- **No action needed**

### 11. VITE_RAZORPAY_KEY_ID
- **Value:** `rzp_live_SiOfLiV0lwCQ7H`
- **Purpose:** Razorpay public key (safe to be public)
- **Status:** ✅ Already configured
- **No action needed**

### 12. VITE_SUPABASE_URL
- **Value:** `https://hhibpjjozfrtyemivgqz.supabase.co`
- **Purpose:** Supabase project URL (safe to be public)
- **Status:** ✅ Already configured
- **No action needed**

### 13. VITE_SUPABASE_PUBLISHABLE_KEY
- **Value:** `sb_publishable_lUUcU7jfgfV9h2RIH041lA_L3npqtRn`
- **Purpose:** Supabase public key (safe to be public)
- **Status:** ✅ Already configured
- **No action needed**

### 14. WHATSAPP_ADMIN_NUMBER
- **Value:** `919667305577`
- **Purpose:** WhatsApp number for admin notifications
- **Status:** ✅ Already configured
- **No action needed**

---

## 🟢 OPTIONAL (Nice to Have)

### REDIS_URL
- **Purpose:** Redis cache for performance (optional)
- **Current Status:** Not configured (app works without it)
- **Impact:** If missing, some caching features won't work
- **Action:** Can add later for performance optimization

### SUPABASE_SERVICE_ROLE_KEY
- **Purpose:** Supabase server-side operations
- **Current Status:** Might be needed for some operations
- **Where to Get:** Supabase → Settings → API keys → Service Role
- **Action:** Consider adding if PDF storage needed

---

## 📋 Quick Summary Table

| Variable | Type | Status | Where to Add | Priority |
|----------|------|--------|-------------|----------|
| SMTP_HOST | Public | ❌ Missing | Cloudflare | 🔴 CRITICAL |
| SMTP_USER | Secret | ❌ Missing | Cloudflare | 🔴 CRITICAL |
| SMTP_PASSWORD | Secret | ❌ Missing | Cloudflare | 🔴 CRITICAL |
| DATABASE_URL | Secret | ❌ Missing | Cloudflare | 🔴 CRITICAL |
| RAZORPAY_KEY_SECRET | Secret | ❓ Unknown | Cloudflare | 🟡 IMPORTANT |
| RAZORPAY_WEBHOOK_SECRET | Secret | ❓ Unknown | Cloudflare | 🟡 IMPORTANT |
| SMTP_PORT | Public | ✅ Set | wrangler.toml | ✅ Done |
| SMTP_SECURE | Public | ✅ Set | wrangler.toml | ✅ Done |
| FROM_EMAIL | Public | ✅ Set | wrangler.toml | ✅ Done |
| ADMIN_EMAIL | Public | ✅ Set | wrangler.toml | ✅ Done |
| VITE_RAZORPAY_KEY_ID | Public | ✅ Set | wrangler.toml | ✅ Done |
| VITE_SUPABASE_URL | Public | ✅ Set | wrangler.toml | ✅ Done |
| VITE_SUPABASE_PUBLISHABLE_KEY | Public | ✅ Set | wrangler.toml | ✅ Done |
| WHATSAPP_ADMIN_NUMBER | Public | ✅ Set | wrangler.toml | ✅ Done |

---

## Step-by-Step: Add Missing Variables to Cloudflare

### 1. Go to Cloudflare Dashboard

```
https://dash.cloudflare.com/
→ Your Account/Organization
→ Pages
→ ankshaastra-empower
→ Settings
→ Environment variables
```

### 2. Add Each Variable

**For SMTP_HOST (Public variable):**
- Click "Add variable"
- Name: `SMTP_HOST`
- Value: `smtp.gmail.com` (or your provider)
- DO NOT check "Encrypt"
- Click Save

**For SMTP_USER (Secret):**
- Click "Add variable"
- Name: `SMTP_USER`
- Value: `your-email@gmail.com`
- **CHECK "Encrypt"** ⚠️
- Click Save

**For SMTP_PASSWORD (Secret):**
- Click "Add variable"
- Name: `SMTP_PASSWORD`
- Value: Your app password (Gmail) or provider password
- **CHECK "Encrypt"** ⚠️
- Click Save

**For DATABASE_URL (Secret):**
- Click "Add variable"
- Name: `DATABASE_URL`
- Value: Your PostgreSQL connection string from Supabase
- **CHECK "Encrypt"** ⚠️
- Click Save

**For RAZORPAY_KEY_SECRET (Secret):**
- Click "Add variable"
- Name: `RAZORPAY_KEY_SECRET`
- Value: Your Razorpay Secret Key
- **CHECK "Encrypt"** ⚠️
- Click Save

**For RAZORPAY_WEBHOOK_SECRET (Secret):**
- Click "Add variable"
- Name: `RAZORPAY_WEBHOOK_SECRET`
- Value: Your Razorpay Webhook Secret
- **CHECK "Encrypt"** ⚠️
- Click Save

### 3. Trigger Redeploy

```bash
git push origin main
```

Or in Cloudflare Pages → Deployments → Retry Build (on latest commit)

### 4. Verify

After deployment succeeds, make a test payment to verify:
- ✅ Customer receives email
- ✅ Admin receives email
- ✅ Data appears in Supabase
- ✅ Invoice PDF attaches

---

## 🔍 How Environment Variables Are Used

### By email-sending code:
```javascript
// api/_utils/send-email.js
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,        // ❌ MISSING
  port: process.env.SMTP_PORT,        // ✅ Set (587)
  auth: {
    user: process.env.SMTP_USER,       // ❌ MISSING
    pass: process.env.SMTP_PASSWORD,   // ❌ MISSING
  }
});
```

### By database code:
```javascript
// api/_utils/db.js
const pool = new Pool({
  connectionString: process.env.DATABASE_URL  // ❌ MISSING
});
```

### By payment webhook:
```javascript
// api/payment-webhook.js
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;  // ❓ Check
```

### By payment initiation:
```javascript
// api/initiate-payment.js
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;  // ❓ Check
```

---

## ⚠️ Important Security Notes

1. **Never commit secrets to git**
   - `.gitignore` should exclude `.env` files
   - Use Cloudflare's "Encrypt" option for secrets

2. **Use app-specific passwords**
   - Gmail: NEVER use your main password
   - Always use App Passwords from https://myaccount.google.com/apppasswords

3. **Treat DATABASE_URL as secret**
   - It contains the database password
   - Always mark as "Encrypt" in Cloudflare

4. **Razorpay credentials are secrets**
   - Keep RAZORPAY_KEY_SECRET private
   - Keep RAZORPAY_WEBHOOK_SECRET private

---

## 📞 Troubleshooting

### "SMTP configuration is missing"
→ You haven't added SMTP_HOST, SMTP_USER, or SMTP_PASSWORD

### "Missing DATABASE_URL"
→ You haven't added DATABASE_URL

### "Webhook signature mismatch"
→ RAZORPAY_WEBHOOK_SECRET is wrong or not set

### Emails not sending after adding vars?
1. Verify SMTP credentials are correct
2. Check if Gmail SMTP is enabled
3. View Cloudflare function logs for errors

### Data not storing after adding DATABASE_URL?
1. Verify connection string is correct
2. Check Supabase project is not paused
3. View Cloudflare function logs for connection errors

---

**Last Updated:** April 28, 2026

---

## 💰 DYNAMIC PRICING (Added 2026-04 — change without code edits)

All package prices are now read from environment variables. To change a
price, update the variable in **Cloudflare Pages → Settings → Environment
Variables**, then trigger a redeploy. No code changes required.

You must set **two** copies of each price (or accept the defaults):

1. `VITE_PACKAGE_*` — used by the **frontend** (the displayed price). Required
   at build time.
2. `PACKAGE_*` (no `VITE_` prefix) — used by the **Cloudflare Function** to
   validate the order amount on the server before creating the Razorpay
   order. Prevents a tampered client from paying a smaller amount.

**Always set both to the same value.**

| Frontend variable                              | Backend variable                         | Default | Description                              |
| ---------------------------------------------- | ---------------------------------------- | ------- | ---------------------------------------- |
| `VITE_PACKAGE_SINGLE_PRICE`                    | `PACKAGE_SINGLE_PRICE`                   | 2447    | Perfect Baby Name Report                 |
| `VITE_PACKAGE_SINGLE_ORIGINAL_PRICE`           | —                                        | 7500    | Strikethrough "before" price             |
| `VITE_PACKAGE_PREMIUM_PRICE`                   | `PACKAGE_PREMIUM_PRICE`                  | 8927    | Report + Live Video Session              |
| `VITE_PACKAGE_PREMIUM_ORIGINAL_PRICE`          | —                                        | 18218   | Strikethrough "before" price             |
| `VITE_PACKAGE_NAMECHECK_1_PRICE`               | `PACKAGE_NAMECHECK_1_PRICE`              | 293     | Name Check (1 name)                      |
| `VITE_PACKAGE_NAMECHECK_1_ORIGINAL_PRICE`      | —                                        | 293     |                                          |
| `VITE_PACKAGE_NAMECHECK_2_PRICE`               | `PACKAGE_NAMECHECK_2_PRICE`              | 528     | Name Check (2 names)                     |
| `VITE_PACKAGE_NAMECHECK_2_ORIGINAL_PRICE`      | —                                        | 586     |                                          |
| `VITE_PACKAGE_NAMECHECK_3_PRICE`               | `PACKAGE_NAMECHECK_3_PRICE`              | 747     | Name Check (3 names)                     |
| `VITE_PACKAGE_NAMECHECK_3_ORIGINAL_PRICE`      | —                                        | 879     |                                          |
| `VITE_PACKAGE_CONSULTATION_PRICE`              | `PACKAGE_CONSULTATION_PRICE`             | 1       | Live Consultation only                   |
| `VITE_PACKAGE_CONSULTATION_ORIGINAL_PRICE`     | —                                        | 1       |                                          |

### To change a price (example: bump Premium from 8927 → 9999)

1. In Cloudflare Pages → Settings → Environment Variables, set:
   - `VITE_PACKAGE_PREMIUM_PRICE = 9999`
   - `PACKAGE_PREMIUM_PRICE = 9999`
2. Save and trigger a **deploy** (or push any commit). The frontend rebuild
   picks up the new `VITE_*` value; the backend reads `PACKAGE_*` at
   request time.
3. Verify on the live site: pricing card shows ₹9,999 and a checkout for
   ₹8,927 is now rejected with "Price mismatch".

### Server-side validation

The Cloudflare Function `functions/api/initiate-payment.js` calls
`validatePackageAmount(env, packageType, amount)` from
`functions/api/_utils/pricing.js` before creating the Razorpay order.
If the client-supplied amount does not match `PACKAGE_*_PRICE`, the request
is rejected with HTTP 400 and the order is NOT saved.

