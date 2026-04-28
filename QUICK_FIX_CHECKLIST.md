# Cloudflare Pages Environment Variables - Quick Fix Checklist

## ⚡ IMMEDIATE ACTION REQUIRED

### What's Broken Right Now
- ❌ Emails NOT sending to customers
- ❌ Emails NOT sending to admin
- ❌ Customer data NOT stored in Supabase
- ❌ Invoice PDFs NOT attached to emails

**Cause:** Missing 4 environment variables in Cloudflare Pages Dashboard

---

## 🎯 Action Plan (5 minutes)

### Step 1: Gather Your Credentials (2 min)

#### Option A: Using Gmail
1. Go to: https://myaccount.google.com/security
2. Enable 2-Factor Authentication (if not already)
3. Go to: https://myaccount.google.com/apppasswords
4. Select: Mail + Windows Computer
5. Copy the 16-character App Password

**Fill in:**
```
SMTP_HOST = smtp.gmail.com
SMTP_USER = [your-gmail@gmail.com]
SMTP_PASSWORD = [16-char app password]
```

#### Option B: Using Another Email Provider
Get from your provider's control panel:
```
SMTP_HOST = [your.mail.server.com]
SMTP_USER = [username]
SMTP_PASSWORD = [password]
```

#### Supabase Connection String
1. Go to: https://supabase.com/dashboard
2. Click your project
3. Settings → Database
4. Copy the connection string (Node.js tab)

**Fill in:**
```
DATABASE_URL = postgresql://[full-connection-string]
```

---

### Step 2: Add to Cloudflare Pages (2 min)

1. Go to: https://dash.cloudflare.com/
2. Select your account
3. Pages → ankshaastra-empower project
4. Settings tab
5. Environment variables → Add Variable

**Add these 4 as SECRETS (click "Encrypt" checkbox):**

| Name | Value |
|------|-------|
| `SMTP_HOST` | `smtp.gmail.com` (or your provider) |
| `SMTP_USER` | `your-email@gmail.com` |
| `SMTP_PASSWORD` | Your 16-char app password |
| `DATABASE_URL` | Your PostgreSQL connection string |

---

### Step 3: Deploy (1 min)

```bash
git push origin main
```

Or trigger manually in Cloudflare Pages → Your Project → Deployments

---

## ✅ Verification Checklist

After deployment, verify each:

- [ ] **Test Email Sending**
  - Make a test payment
  - Check if customer email received (with PDF)
  - Check if admin email received (with PDF)
  - Logs: Look for `✅ Customer email sent successfully`

- [ ] **Test Database Storage**
  - Make a test payment
  - Go to Supabase dashboard
  - Check: `ankshaastra.orders` table has new row
  - Check: `ankshaastra.customer_details` has form data
  - Logs: Look for `✅ Metadata from DB for order`

- [ ] **Test Invoice PDF**
  - Email should have PDF attachment
  - PDF filename: `Invoice_[orderId].pdf`
  - PDF should show customer details and tax breakdown

---

## 📋 Environment Variables Already Configured

These are already in `wrangler.toml` (no action needed):

```
✅ SMTP_PORT = 587
✅ SMTP_SECURE = false
✅ FROM_EMAIL = Ankshaastra <madappscreator@gmail.com>
✅ ADMIN_EMAIL = social@ankshaastra.com
✅ VITE_RAZORPAY_KEY_ID = rzp_live_SiOfLiV0lwCQ7H
✅ WHATSAPP_ADMIN_NUMBER = 919667305577
```

**Still needed (verify these exist as secrets):**
- [ ] `RAZORPAY_KEY_SECRET` (secret)
- [ ] `RAZORPAY_WEBHOOK_SECRET` (secret)

If missing, add them too!

---

## 🐛 If Issues Persist

### Emails Still Not Sending?

**Check Logs:**
```
Cloudflare Pages → ankshaastra-empower → Functions → Logs
Filter: "payment-webhook"
Search for: "email", "SMTP", "Error"
```

**Fix:**
- Verify SMTP credentials are correct
- Try creating a new App Password (Gmail)
- Check email provider isn't blocking

### Database Still Empty?

**Check Logs:**
```
Same as above, search for: "DATABASE", "pool", "order"
```

**Fix:**
- Verify DATABASE_URL is correct
- Try copying connection string again from Supabase
- Ensure Supabase project is not paused

---

## 📞 Error Messages & Solutions

### "SMTP configuration is missing"
→ Add SMTP_HOST, SMTP_USER, SMTP_PASSWORD to Cloudflare

### "Missing DATABASE_URL"
→ Add DATABASE_URL to Cloudflare

### "Authentication failed"
→ Check SMTP password is correct (Gmail: create new App Password)

### "Connection refused" (Database)
→ Check DATABASE_URL connection string format
→ Verify Supabase project is running

---

## 🔒 Security Notes

- ✅ Always use **"Encrypt"** checkbox for secrets
- ✅ Never commit real passwords to git
- ✅ App passwords are safe for this purpose (can revoke anytime)
- ✅ DATABASE_URL includes password - MUST be encrypted

---

**Time to Fix: ~5 minutes**

**Result After Fix:**
- ✅ Customers receive email confirmations
- ✅ Admin receives order notifications
- ✅ Invoice PDFs attach automatically
- ✅ All customer data stored safely in Supabase

