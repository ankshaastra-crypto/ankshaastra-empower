# Cloudflare D1 Migration Guide

## What Was Changed

Your Cloudflare Pages deployment now uses **Cloudflare D1 SQLite** instead of Supabase PostgreSQL. This eliminates connection issues because D1 is native to Workers and uses HTTP (no persistent TCP connections).

## Files Created

1. **`functions/api/_utils/d1-db.js`** — D1 SQLite adapter with all database operations
2. **`functions/api/_utils/db-unified.js`** — Auto-selects D1 (Cloudflare) or pg (fallback)

## Files Updated

1. **`functions/_adapter.js`** — Injects D1 env into unified DB layer
2. **`functions/api/health.js`** — Standalone health check with D1 support
3. **`functions/api/initiate-payment.js`** — Stores customer data in D1
4. **`functions/api/payment-webhook.js`** — Saves payment, generates PDF, sends emails
5. **`functions/api/admin/order.js`** — Reads orders from D1
6. **`wrangler.toml`** — Removed invalid D1 config (Pages uses dashboard binding only)

---

## ⚠️ IMPORTANT: D1 Binding is Dashboard-Only

**Do NOT add `[[d1_databases]]` to `wrangler.toml`** — Cloudflare Pages ignores it and throws:
```
Error 8000022: Invalid database UUID
```

For **Cloudflare Pages**, D1 must be bound via the **Dashboard** or **Wrangler CLI**.

---

## Step-by-Step Setup

### 1. Install Wrangler CLI
```bash
npm install -g wrangler
```

### 2. Login to Cloudflare
```bash
wrangler login
```

### 3. Create D1 Database
```bash
wrangler d1 create ankshaastra-db
```

You will see output like:
```
✅ Successfully created DB 'ankshaastra-db' in region WEUR
   database_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

### 4. Bind D1 to Your Pages Project (CRITICAL STEP)

**Option A: Via Cloudflare Dashboard (Recommended)**
1. Go to https://dash.cloudflare.com/
2. Pages → **ankshaastra-empower** → **Settings** → **Functions**
3. **D1 Database Bindings** → **Add binding**
4. Variable name: `DB`
5. Database: Select `ankshaastra-db` from dropdown
6. Click **Save**

**Option B: Via Wrangler CLI**
```bash
wrangler pages project bind d1 ankshaastra-db --project-name=ankshaastra-empower
```

### 5. Set Environment Variables

Go to Cloudflare Pages Dashboard → **ankshaastra-empower** → **Settings** → **Environment Variables**

**Required Secrets (click "Encrypt"):**

| Variable | Description |
|----------|-------------|
| `SMTP_HOST` | e.g., `smtp.gmail.com` |
| `SMTP_USER` | e.g., `your-email@gmail.com` |
| `SMTP_PASSWORD` | Gmail App Password (create at https://myaccount.google.com/apppasswords) |
| `RAZORPAY_KEY_SECRET` | From Razorpay Dashboard |
| `RAZORPAY_WEBHOOK_SECRET` | From Razorpay Dashboard |
| `ENCRYPTION_KEY` | Any long random string |

**Optional (for Supabase fallback):**
| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

**Already in wrangler.toml (no need to add):**
- `SMTP_PORT = 587`
- `SMTP_SECURE = false`
- `FROM_EMAIL`
- `ADMIN_EMAIL`
- `VITE_RAZORPAY_KEY_ID`
- `WHATSAPP_ADMIN_NUMBER`

### 6. Verify Binding Before Deploy

Check that D1 binding appears in dashboard:
- Pages → ankshaastra-empower → Settings → Functions → D1 Database Bindings
- Should show: `DB` → `ankshaastra-db`

### 7. Deploy
```bash
git add .
git commit -m "Migrate to Cloudflare D1 SQLite"
git push origin main
```

---

## Verification

### Test 1: Health Check
Visit: `https://empower.ankshaastra.com/api/health`

Expected response:
```json
{
  "time": "2026-04-28T...",
  "platform": "cloudflare-pages",
  "dbConnected": true,
  "dbType": "d1",
  "dbNow": "...",
  "modules": {
    "d1-db": { "ok": true },
    "db-unified": { "ok": true },
    "send-email": { "ok": true }
  }
}
```

### Test 2: Make a Payment
1. Fill the form and make a test payment
2. Check `/api/health` → should show data in D1
3. Check email inbox for:
   - Customer confirmation email with PDF invoice
   - Admin notification email with PDF invoice

### Test 3: Admin Dashboard
1. Go to admin dashboard
2. Orders should appear from D1

---

## Troubleshooting

### "Error 8000022: Invalid database UUID"
**Cause:** `[[d1_databases]]` in wrangler.toml (Pages ignores this).  
**Fix:** Removed from wrangler.toml. Bind D1 via Dashboard instead.

### "D1 not available" or "dbConnected": false
**Cause:** D1 binding not set (env.DB is undefined).  
**Fix:** Go to Dashboard → Pages → ankshaastra-empower → Settings → Functions → D1 Database Bindings → Add `DB` → Select `ankshaastra-db`

### "No such module" errors
**Cause:** Dynamic imports failing.  
**Fix:** Already fixed — all function handlers now use static imports.

### Emails not sending
**Cause:** SMTP env vars missing.  
**Fix:** Add SMTP_HOST, SMTP_USER, SMTP_PASSWORD as secrets in dashboard.

### "database_id mismatch"
**Cause:** D1 database not created or wrong ID.  
**Fix:** Run `wrangler d1 list` to see your databases, verify binding in dashboard.

---

## Architecture

```
Payment Flow:
1. Customer fills form → initiate-payment.js saves to D1
2. Razorpay processes payment → sends webhook
3. payment-webhook.js reads from D1 → generates invoice PDF → sends email to customer + admin
4. Both emails include GST invoice PDF attachment
```

## Benefits of D1

✅ **No connection issues** — HTTP-based, no TCP pools  
✅ **Native to Cloudflare** — Same infra as Pages/Workers  
✅ **SQLite syntax** — Simple, well-understood  
✅ **Free tier** — 5M rows/day, 500MB storage  
✅ **No separate service** — Integrated billing  

## Rollback

If you need to rollback to Supabase PostgreSQL:
1. Set `DATABASE_URL` environment variable
2. The unified DB layer will auto-fallback to pg when D1 is not bound
